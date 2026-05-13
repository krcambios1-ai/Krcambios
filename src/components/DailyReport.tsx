import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShieldAlert, Clock, Globe, Share2, ArrowRight } from 'lucide-react';
import DailyReportShareCard from './DailyReportShareCard';
import BrazilRatesShareCard from './BrazilRatesShareCard';

interface DailyReportProps {
  bcvRate: string;
  parallelRate: string;
  promedioRate: string;
  indicatorRates: {
    euroBcv: string;
  };
  rates: any;
  lastUpdated: Date | null;
  fetchRates?: (force?: boolean) => Promise<void>;
  isUpdating?: boolean;
  onViewChange?: (view: any) => void;
}

export default function DailyReport({ bcvRate, parallelRate, promedioRate, indicatorRates, rates, lastUpdated, fetchRates, isUpdating, onViewChange }: DailyReportProps) {
  const navigate = useNavigate();
  const displayDate = lastUpdated || new Date();
  
  // Venezuela time adjustment for display
  const today = displayDate.toLocaleDateString('es-VE', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'America/Caracas'
  });

  const time = displayDate.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Caracas'
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-32 md:pt-40 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-blue/5 text-brand-blue px-4 py-2 rounded-full mb-4">
            <Clock size={16} className="text-brand-green" />
            <span className="text-xs font-black uppercase tracking-widest">Reporte en Vivo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-blue mb-4 tracking-tight">
            Tasas del día
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Monitoreo en tiempo real de los principales indicadores económicos de Venezuela.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button 
              onClick={() => navigate('/calculadora-bcv')}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-brand-blue font-black text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              Calculadora BCV
            </button>
            <button 
              onClick={() => navigate('/si-mando')}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-brand-blue font-black text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              Si mando, ¿cuánto llega?
            </button>
          </div>
        </div>

        {/* Main Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {/* EnParaleloVzla Card */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-green/10 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-blue rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                <TrendingUp size={20} md:size={28} />
              </div>
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Variación</p>
                <span className="inline-flex items-center gap-1 text-emerald-500 font-black text-xs md:text-sm">
                  <TrendingUp size={12} md:size={14} /> +0.45%
                </span>
              </div>
            </div>

            <h3 className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2">Dólar Paralelo</h3>
            <div className="flex items-baseline gap-2 mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl font-black text-brand-blue">Bs. {parallelRate}</span>
              <span className="text-slate-300 font-bold text-xs md:text-sm">VES</span>
            </div>
            
            <div className="pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Promedio General</span>
              <div className="flex items-center gap-1 text-brand-green font-bold text-[10px] md:text-xs">
                <Globe size={10} md:size={12} />
                Monitor Venezuela
              </div>
            </div>
          </div>

          {/* BCV Card */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-blue/10 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-green rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-green/20">
                <ShieldAlert size={20} md:size={28} />
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actualizar</p>
                <button 
                  onClick={() => fetchRates?.(true)} 
                  disabled={isUpdating}
                  className={`p-1.5 md:p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all ${isUpdating ? 'animate-spin' : 'hover:scale-110'}`}
                >
                  <Clock size={16} md:size={18} className={isUpdating ? 'text-brand-green' : 'text-slate-400'} />
                </button>
              </div>
            </div>

            <h3 className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2">Tasa Oficial BCV</h3>
            <div className="flex items-baseline gap-2 mb-3 md:mb-4">
              <span className={`text-2xl md:text-3xl font-black text-brand-blue transition-all ${isUpdating ? 'text-brand-green' : ''}`}>Bs. {bcvRate}</span>
              <span className="text-slate-300 font-bold text-xs md:text-sm">VES</span>
            </div>
            
            <div className="pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Banco Central</span>
              <div className="flex items-center gap-1 text-brand-blue font-bold text-[10px] md:text-xs">
                <Globe size={10} md:size={12} />
                BCV Oficial
              </div>
            </div>
          </div>

          {/* Promedio Card */}
          <div className="bg-brand-blue rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl shadow-brand-blue/20 border border-brand-blue-light relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center text-brand-green shadow-lg">
                <TrendingUp size={20} md:size={28} />
              </div>
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Promedio</p>
                <span className="inline-flex items-center gap-1 text-brand-green font-black text-xs md:text-sm">
                  Día
                </span>
              </div>
            </div>

            <h3 className="text-slate-300 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2">Tasa Promedio</h3>
            <div className="flex items-baseline gap-2 mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl font-black text-white">Bs. {promedioRate}</span>
              <span className="text-slate-400 font-bold text-xs md:text-sm">VES</span>
            </div>
            
            <div className="pt-3 md:pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase">Cálculo KR</span>
              <div className="flex items-center gap-1 text-brand-green font-bold text-[10px] md:text-xs">
                <Globe size={10} md:size={12} />
                Global
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Indicators */}
        <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-brand-blue">Otros Indicadores</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corte: {time}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="p-8 rounded-[32px] bg-brand-blue/5 border-2 border-brand-blue/10 group hover:border-brand-green transition-all max-w-md mx-auto w-full text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img 
                  src="https://purecatamphetamine.github.io/country-flag-icons/3x2/EU.svg" 
                  alt="EUR" 
                  className="w-10 h-7 object-cover rounded shadow-md"
                  crossOrigin="anonymous" 
                  referrerPolicy="no-referrer"
                />
                <p className="text-xs font-black text-brand-blue uppercase tracking-widest">Tasa Euro BCV</p>
              </div>
              <p className="text-4xl font-black text-brand-blue mb-2">Bs. {indicatorRates.euroBcv}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase">Oficial Banco Central</span>
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Remittance Rates Section */}
        <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-brand-blue">Tasas de Remesas (Brasil)</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Desde R$</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(rates).map(([key, data]: [string, any]) => {
              if (key === 'VES') return null;
              return (
                <div key={key} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <img 
                    src={`https://flagcdn.com/w40/${data.flag}.png`} 
                    alt={key} 
                    className="w-8 h-5 object-cover rounded-sm mb-2 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{key}</p>
                  <p className="text-sm font-black text-brand-blue">
                    {key === 'COP' || key === 'CLP' || key === 'ARS' 
                      ? data.sell.toLocaleString('de-DE', { minimumFractionDigits: 0 }) 
                      : data.sell.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    <span className="text-[10px] ml-1 text-slate-400">{data.symbol}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share Section - Dollar */}
        <div className="mb-12">
          <DailyReportShareCard 
            bcvRate={bcvRate} 
            parallelRate={parallelRate} 
            promedioRate={promedioRate} 
            indicatorRates={indicatorRates}
            rates={rates} 
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Share Section - Brazil/Regional */}
        <div className="mb-12">
          <BrazilRatesShareCard 
            rates={rates} 
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-brand-blue rounded-[40px] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-4">¿Necesitas calcular tu envío?</h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto font-medium">
              Usa nuestras calculadoras en vivo para saber exactamente cuánto recibirás en Venezuela.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-hover text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-brand-green/20 group"
              >
                Ve directo a nuestras Calculadoras
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="https://wa.me/5541987940065" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-black py-4 px-10 rounded-2xl transition-all border border-white/10"
              >
                Hablar con un Agente
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
