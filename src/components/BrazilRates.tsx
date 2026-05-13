import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, TrendingUp, ShieldCheck, Clock, ArrowLeft } from 'lucide-react';
import BrazilRatesShareCard from './BrazilRatesShareCard';

interface BrazilRatesProps {
  rates: any;
  lastUpdated?: Date | null;
}

export default function BrazilRates({ rates, lastUpdated }: BrazilRatesProps) {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const time = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="pt-32 md:pt-36 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Inicio
        </button>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green/10 text-brand-green font-black text-[10px] uppercase tracking-widest mb-3">
            <TrendingUp size={12} />
            Tasas desde Brasil Hoy
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-brand-blue mb-2">
            Reporte de Cambio <span className="text-brand-green">Brasil</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm capitalize">
            {today} • {time}
          </p>
        </div>

        {/* Main Rates Grid */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-brand-blue">1 Real (R$) equivale a:</h3>
            <div className="flex items-center gap-2 text-brand-green bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              <ShieldCheck size={12} />
              Verificado
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(rates).map(([key, data]: [string, any]) => (
              <div 
                key={key} 
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-green transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-slate-100">
                    <img 
                      src={`https://flagcdn.com/w80/${data.flag}.png`} 
                      alt={key} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-brand-blue text-sm leading-none">{data.name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{key}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-lg font-black text-brand-blue">
                      {key === 'COP' || key === 'CLP' || key === 'ARS' 
                        ? data.sell.toLocaleString('de-DE', { minimumFractionDigits: 0 }) 
                        : data.sell.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-brand-green font-black text-[10px]">{data.symbol}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share Section */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-brand-blue mb-2">Comparte con tus clientes</h3>
            <p className="text-slate-500 font-medium">Genera una imagen profesional con nuestras tasas del día.</p>
          </div>
          <BrazilRatesShareCard rates={rates} lastUpdated={lastUpdated || null} />
        </div>

        {/* Info Box */}
        <div className="bg-brand-blue rounded-[32px] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-2">¿Quieres asegurar tu tasa?</h2>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto font-medium text-sm">
              Nuestras tasas son competitivas y seguras. Contáctanos por WhatsApp para realizar tu envío ahora mismo.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
              <div className="text-white font-bold text-sm">
                <span className="text-brand-green">Sitio:</span> www.krcambios.com.br
              </div>
              <div className="text-white font-bold text-sm">
                <span className="text-brand-green">Instagram:</span> @krcambios1
              </div>
            </div>
            <a 
              href="https://wa.me/5541987940065" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-brand-green hover:bg-brand-green-hover text-white font-black py-3 px-8 rounded-xl transition-all shadow-xl shadow-brand-green/20 group text-sm"
            >
              Contactar por WhatsApp
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
