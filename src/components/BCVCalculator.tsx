import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRightLeft, Info } from 'lucide-react';

interface BCVCalculatorProps {
  rate: string;
}

export default function BCVCalculator({ rate }: BCVCalculatorProps) {
  const [usd, setUsd] = useState<string | number>(1);
  const [ves, setVes] = useState<string | number>('');
  
  // Parse the rate string (e.g., "36,45" -> 36.45)
  const numericRate = parseFloat(rate.replace('.', '').replace(',', '.'));

  useEffect(() => {
    if (usd === '') {
      setVes('');
      return;
    }
    const result = Number(usd) * numericRate;
    setVes(result.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [usd, numericRate]);

  const handleUsdChange = (val: string) => {
    setUsd(val);
  };

  const handleVesChange = (val: string) => {
    setVes(val);
    const numericVes = parseFloat(val.replace('.', '').replace(',', '.'));
    if (!isNaN(numericVes)) {
      setUsd((numericVes / numericRate).toFixed(2));
    } else if (val === '') {
      setUsd('');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md mx-auto border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-brand-blue flex items-center gap-2">
          <TrendingUp className="text-brand-green" size={24} />
          Calculadora BCV
        </h3>
        <div className="px-3 py-1 bg-emerald-50 text-brand-green text-xs font-bold rounded-full border border-emerald-100">
          Tasa Oficial
        </div>
      </div>

      <div className="space-y-6">
        {/* USD Input */}
        <div className="relative group">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Dólares (USD)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <img 
                src="https://flagcdn.com/w40/us.png" 
                alt="USD" 
                className="w-6 h-4 object-cover rounded-sm shadow-sm"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-slate-400">$</span>
            </div>
            <input
              type="number"
              value={usd}
              onChange={(e) => handleUsdChange(e.target.value)}
              className="w-full pl-16 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-green focus:bg-white outline-none transition-all text-2xl font-black text-brand-blue"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center -my-3 relative z-10">
          <div className="bg-white p-2 rounded-full shadow-md border border-slate-100 text-brand-green">
            <ArrowRightLeft size={20} className="rotate-90" />
          </div>
        </div>

        {/* VES Input */}
        <div className="relative group">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Bolívares (VES)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <img 
                src="https://flagcdn.com/w40/ve.png" 
                alt="VES" 
                className="w-6 h-4 object-cover rounded-sm shadow-sm"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-slate-400">Bs.</span>
            </div>
            <input
              type="text"
              value={ves}
              onChange={(e) => handleVesChange(e.target.value)}
              className="w-full pl-20 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-green focus:bg-white outline-none transition-all text-2xl font-black text-brand-blue"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Rate Info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Info size={14} /> Tasa utilizada:
            </span>
            <span className="font-bold text-brand-blue">1 USD = {rate} VES</span>
          </div>
        </div>

        <a 
          href="https://wa.me/5541987940065" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-2 text-lg"
        >
          Contactar por WhatsApp
        </a>
        
        <p className="text-[10px] text-slate-400 text-center uppercase tracking-tighter">
          *Calculadora referencial basada en la tasa oficial del BCV
        </p>
      </div>
    </div>
  );
}
