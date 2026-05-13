import React, { useRef } from 'react';
import { Share2, Download, Camera, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { toPng } from 'html-to-image';

const LOGO_URL = window.location.origin + "/logo.png";

interface DailyReportShareCardProps {
  bcvRate: string;
  parallelRate: string;
  promedioRate: string;
  indicatorRates: {
    euroBcv: string;
  };
  rates: any;
  lastUpdated: Date | null;
}

export default function DailyReportShareCard({ bcvRate, parallelRate, promedioRate, indicatorRates, rates, lastUpdated }: DailyReportShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    
    try {
      // Delay to ensure images/fonts are perfectly rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `tasas-del-dia-kr-cambios-${new Date().toLocaleDateString()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  const handleShare = async () => {
    if (cardRef.current === null) return;

    try {
      // Delay to ensure images/fonts are perfectly rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'reporte-diario.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Tasas del día - KR Cambios',
          text: `Tasas del día en Venezuela. BCV: ${bcvRate}, Paralelo: ${parallelRate}, Promedio: ${promedioRate}.`,
        });
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        handleDownload();
      }
    }
  };

  const displayDate = lastUpdated || new Date();

  const today = displayDate.toLocaleDateString('es-VE', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const time = displayDate.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-blue mb-4">Comparte las Tasas del día</h2>
          <p className="text-slate-600">Genera una imagen profesional con todas las tasas del día para tus redes sociales.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Preview Card */}
          <div className="w-full overflow-x-auto pb-6 flex justify-center">
            <div className="relative group shrink-0">
              <div 
                ref={cardRef}
                className="w-[280px] md:w-[320px] min-h-[460px] md:min-h-[500px] bg-white rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl relative flex flex-col p-4 md:p-6 text-brand-blue border-[4px] md:border-6 border-slate-50"
              >
              {/* Header Decoration */}
              <div className="absolute top-0 left-0 w-full h-32 bg-brand-blue"></div>
              <div className="absolute top-24 left-0 w-full h-12 bg-white rounded-t-[40px]"></div>
              
              {/* Logo & Brand */}
              <div className="relative z-10 flex flex-col items-center mb-4 md:mb-6">
                <div className="bg-white p-2 md:p-3 rounded-2xl md:rounded-3xl shadow-xl mb-2 md:mb-3">
                  <img 
                    src={LOGO_URL} 
                    alt="KR Cambios Logo" 
                    className="w-16 h-16 md:w-20 md:h-20 object-contain" 
                    crossOrigin="anonymous"
                  />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-brand-blue tracking-tight">KR CAMBIOS</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-0.5 md:h-1 w-6 md:w-8 bg-brand-green rounded-full"></span>
                  <span className="text-[8px] md:text-[10px] font-black text-brand-green uppercase tracking-[0.3em]">Tasas del día</span>
                  <span className="h-0.5 md:h-1 w-6 md:w-8 bg-brand-green rounded-full"></span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="relative z-10 text-center mb-4 md:mb-6">
                <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Actualizado el</p>
                <p className="text-brand-blue font-black text-xs md:text-sm">{today} - {time}</p>
              </div>

              {/* Rates Grid */}
              <div className="relative z-10 flex-1 space-y-2">
                {/* Main Rates */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-blue rounded-lg flex items-center justify-center text-white shrink-0">
                      <TrendingUp size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[6px] font-black text-slate-400 uppercase truncate">Paralelo</p>
                      <p className="text-[10px] font-black text-brand-blue truncate">Bs. {parallelRate}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-green rounded-lg flex items-center justify-center text-white shrink-0">
                      <ShieldAlert size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[6px] font-black text-slate-400 uppercase truncate">BCV</p>
                      <p className="text-[10px] font-black text-brand-blue truncate">Bs. {bcvRate}</p>
                    </div>
                  </div>

                  <div className="col-span-2 bg-brand-blue rounded-xl p-2.5 border border-brand-blue-light flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-brand-green">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <p className="text-[7px] font-black text-slate-300 uppercase leading-none mb-0.5">Tasa Promedio</p>
                        <p className="text-sm font-black text-white leading-none">Bs. {promedioRate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Indicators */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://purecatamphetamine.github.io/country-flag-icons/3x2/EU.svg" 
                        alt="EUR" 
                        className="w-5 h-3.5 object-cover rounded shadow-sm" 
                        crossOrigin="anonymous" 
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[7px] font-black text-slate-400 uppercase leading-none">Euro BCV</p>
                    </div>
                    <p className="text-[10px] font-black text-brand-blue">Bs. {indicatorRates.euroBcv}</p>
                  </div>
                </div>
              </div>

            {/* Footer */}
            <div className="relative z-10 mt-3 md:mt-6 pt-3 md:pt-4 border-t border-slate-100 text-center">
              <p className="text-brand-blue font-black text-[9px] md:text-xs">www.krcambios.com.br</p>
              <div className="flex justify-center gap-3 md:gap-4 mt-1">
                <p className="text-brand-green font-bold text-[7px] md:text-[9px]">@krcambios1</p>
                <p className="text-brand-green font-bold text-[7px] md:text-[9px]">+55 41 98794-0065</p>
              </div>
            </div>
            </div>
            
            {/* Overlay Hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[32px] md:rounded-[40px] backdrop-blur-sm pointer-events-none">
              <div className="flex items-center gap-2 text-white font-bold">
                <Camera size={24} />
                Vista Previa
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full max-w-xs shrink-0">
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-brand-green/20"
          >
            <Share2 size={20} />
            Compartir Reporte
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-brand-blue border border-slate-200 font-bold py-4 px-8 rounded-2xl transition-all shadow-sm"
          >
            <Download size={20} />
            Descargar Imagen
          </button>
          <p className="text-xs text-slate-400 text-center mt-2 italic">
            *El reporte incluye el diseño oficial de KR Cambios y las tasas actualizadas.
          </p>
        </div>
      </div>
    </div>
  </div>
);
}
