import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy for Exchange Rates to avoid CORS/Network issues
  app.get("/api/rates", async (req, res) => {
    // Set response headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const fetchOptions = {
      headers: { 
        'Pragma': 'no-cache', 
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    try {
      // Reordered and updated providers for better reliability
      const providers = [
        { name: 'PyDolarVE Primary', url: `https://pydolarve.org/api/v1/dollar?monitor=all&t=${Date.now()}` },
        { name: 'PyDolarVE Mirror', url: `https://pydolarve.com/api/v1/dollar?monitor=all&t=${Date.now()}` },
        { name: 'DolarAPI VE', url: `https://ve.dolarapi.com/v1/dolares?t=${Date.now()}` },
        { name: 'Venebit API', url: `https://api.venebit.app/ve/tasa/dolar?t=${Date.now()}` },
        { name: 'Exchangemonitor', url: `https://exchangemonitor.net/api/ve/dolar?t=${Date.now()}` }
      ];

      // Fetch from all providers in parallel to speed up response
      const results = await Promise.allSettled(providers.map(async (provider) => {
        const headers: any = { ...fetchOptions.headers };

        const resp = await fetch(provider.url, { 
          headers
        });
        
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        
        const data = await resp.json();
        return { provider, data };
      }));

      let bcvCandidates: any[] = [];
      let parCandidates: any[] = [];
      let otherIndicators: any[] = [];

      for (const result of results) {
        if (result.status === 'rejected') {
          // Silent failure for individual providers - common in redundant systems
          continue;
        }

        const { provider, data } = result.value;
        let normalized: any[] = [];
        
        // Normalize based on provider format
        if (provider.name.includes('PyDolarVE') && data.monitors) {
          normalized = Object.entries(data.monitors).map(([key, val]: [string, any]) => ({
            id: key,
            nombre: val.title || key,
            promedio: val.price,
            fecha: val.last_update,
            fuente: (key === 'bcv' || (val.title && val.title.toLowerCase().includes('bcv'))) ? 'oficial' : 'paralelo'
          }));
        } else if (provider.name === 'Venebit API' && data.rates) {
          normalized = Object.entries(data.rates).map(([key, val]: [string, any]) => ({
            id: key,
            nombre: key.toUpperCase(),
            promedio: typeof val === 'number' ? val : parseFloat(String(val)),
            fecha: data.updatedAt || new Date().toISOString(),
            fuente: key === 'bcv' ? 'oficial' : 'paralelo'
          }));
        } else if (provider.name === 'DolarAPI VE') {
          normalized = (Array.isArray(data) ? data : [data]).map(item => ({
            id: item.fuente || item.id,
            nombre: item.nombre,
            promedio: item.promedio,
            fecha: item.fechaActualizacion || item.fecha,
            fuente: item.fuente === 'oficial' ? 'oficial' : 'paralelo'
          }));
        } else if (provider.name === 'Exchangemonitor' && data.monitors) {
           normalized = Object.entries(data.monitors).map(([key, val]: [string, any]) => ({
            id: key,
            nombre: val.title || key,
            promedio: val.price,
            fecha: val.last_update,
            fuente: key === 'bcv' ? 'oficial' : 'paralelo'
          }));
        }

        normalized.forEach(rate => {
          if (!rate || typeof rate.promedio !== 'number' || rate.promedio <= 0) return;

          const id = rate.id?.toLowerCase() || '';
          const bcvKeywords = ['oficial', 'bcv', 'cencoex', 'central'];
          const parKeywords = ['paralelo', 'enparalelovzla', 'promedio', 'enparalelo'];

          const isBcv = bcvKeywords.includes(id) || rate.fuente === 'oficial';
          const isPar = parKeywords.includes(id) || rate.fuente === 'paralelo';

          const rateWithMeta = { ...rate, _provider: provider.name };

          if (isBcv) bcvCandidates.push(rateWithMeta);
          else if (isPar) parCandidates.push(rateWithMeta);
          else otherIndicators.push(rateWithMeta);
        });
      }

      // Selection Logic: Pick the most recent and realistic rates
      const parseDateSafe = (dateStr: any): number => {
        if (!dateStr) return 0;
        try {
          // Handle DD/MM/YYYY HH:MM formats commonly used in VZ APIs
          if (typeof dateStr === 'string' && dateStr.includes('/') && dateStr.includes(':')) {
            const parts = dateStr.split(/[\/\s,:]+/);
            if (parts.length >= 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
              const hour = parts.length >= 4 ? parseInt(parts[3]) + (dateStr.toLowerCase().includes('pm') && parseInt(parts[3]) < 12 ? 12 : 0) : 0;
              const min = parts.length >= 5 ? parseInt(parts[4]) : 0;
              return new Date(year, month, day, hour, min).getTime();
            }
          }
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        } catch (e) {
          return 0;
        }
      };

      const sortByDate = (a: any, b: any) => {
        const timeA = parseDateSafe(a.fecha);
        const timeB = parseDateSafe(b.fecha);
        
        // If times are different, pick newest
        if (timeB !== timeA) return timeB - timeA;
        
        // If times are same (or both 0), pick the one with the higher value 
        // (usually newer rates are higher in VZ inflation context)
        return b.promedio - a.promedio;
      };

      bcvCandidates.sort(sortByDate);
      parCandidates.sort(sortByDate);

      const finalRates: any[] = [];
      
      // Heuristic: If we have multiple, pick the one that is definitely NOT 36.29 
      // if others exist and are higher.
      const getBestCandidate = (candidates: any[]) => {
        if (candidates.length === 0) return null;
        
        // Filter out extreme outliers if we have consensus
        const filtered = candidates.filter(c => c.promedio > 36.3); // 36.29 is a known "stale" barrier
        if (filtered.length > 0) {
          // Sort the filtered ones by date
          return filtered.sort(sortByDate)[0];
        }
        
        return candidates[0];
      };

      const bestBcv = getBestCandidate(bcvCandidates);
      if (bestBcv) finalRates.push(bestBcv);

      const bestPar = getBestCandidate(parCandidates);
      if (bestPar) finalRates.push(bestPar);

      // Add other unique indicators
      otherIndicators.forEach(rate => {
        if (!finalRates.some(r => r.id?.toLowerCase() === rate.id?.toLowerCase())) {
          finalRates.push(rate);
        }
      });

      if (finalRates.length > 0) {
        // Log consensus for debugging
        console.log(`Aggregated: BCV=${bestBcv?.promedio} (${bestBcv?._provider}), PAR=${bestPar?.promedio} (${bestPar?._provider})`);
        return res.json(finalRates);
      }
      
      throw new Error("No rates could be aggregated from any active source");
    } catch (error) {
      console.error("Aggregation failed:", error);
      // Fallback: try just the official one as last resort
      try {
        const fallback = await fetch(`https://ve.dolarapi.com/v1/dolares/oficial?t=${Date.now()}`, fetchOptions);
        if (fallback.ok) {
          const data = await fallback.json();
          return res.json(Array.isArray(data) ? data : [data]);
        }
      } catch (e) {}
      
      return res.status(500).json({ error: 'Failed to aggregate rates from sources' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
