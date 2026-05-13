import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowRightLeft, Info, TrendingUp } from 'lucide-react';
import { EXCHANGE_RATES } from '../constants';

interface BRLtoUSDCalculatorProps {
  bcvRate: string;
  rates?: any;
}

export default function BRLtoUSDCalculator({ bcvRate, rates: propRates }: BRLtoUSDCalculatorProps) {
  const [targetUsd, setTargetUsd] = useState<string | number>(100);
  const [brlNeeded, setBrlNeeded] = useState<string | number>('');
  const [vesEquivalent, setVesEquivalent] = useState<number>(0);
  
  const activeRates = propRates || EXCHANGE_RATES;
  const brlVesRate = activeRates.VES?.sell || 0;
  
  // Parse the BCV rate string (e.g., "36,45" -> 36.45)
  const numericBcvRate = parseFloat(bcvRate.replace('.', '').replace(',', '.'));

  useEffect(() => {
    const usd = Number(targetUsd);
    if (isNaN(usd) || usd <= 0 || brlVesRate === 0 || numericBcvRate === 0) {
      setBrlNeeded('');
      setVesEquivalent(0);
      return;
    }

    // 1. Calculate how many Bolivares are needed for the target USD
    const vesNeeded = usd * numericBcvRate;
    setVesEquivalent(vesNeeded);

    // 2. Calculate how many Reais are needed to get those Bolivares
    const brl = vesNeeded / brlVesRate;
    setBrlNeeded(brl.toFixed(2));
  }, [targetUsd, brlVesRate, numericBcvRate]);

  return (
    <div className="bg-white rounded-[25px] shadow-lg p-3 md:p-10 w-full max-w-2xl mx-auto border border-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      
      <div className="text-center mb-3 relative z-10">
        <h2 className="text-lg md:text-3xl font-black text-brand-blue mb-0.5">
          ¿Cuánto necesito mandar?
        </h2>
        <p className="text-[10px] md:text-sm text-slate-500 font-medium leading-tight">
          Calcula Reais necesarios para recibir Dólares.
        </p>
      </div>

      <div className="space-y-3 relative z-10">
        {/* Target USD Input */}
        <div className="relative group">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <img 
                src="https://flagcdn.com/w40/us.png" 
                alt="USD" 
                className="w-4 h-2.5 object-cover rounded-sm"
                referrerPolicy="no-referrer"
              />
              <span className="font-black text-slate-400 text-base">$</span>
            </div>
            <input
              type="number"
              value={targetUsd}
              onChange={(e) => setTargetUsd(e.target.value)}
              className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-[15px] focus:border-brand-green focus:bg-white outline-none transition-all text-lg font-black text-brand-blue"
              placeholder="USD"
            />
          </div>
        </div>

        {/* Conversion Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Equivale en Bs.</p>
            <p className="text-[10px] md:text-sm font-black text-brand-blue truncate">
              Bs. {vesEquivalent.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Tasa BRL/VES</p>
            <p className="text-[10px] md:text-sm font-black text-brand-blue">
              {brlVesRate.toLocaleString('de-DE')} 
            </p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 col-span-2 md:col-span-1">
            <p className="text-[7px] font-black text-brand-green uppercase mb-0.5">BCV Referencia</p>
            <p className="text-[10px] md:text-sm font-black text-brand-blue">
              Bs. {bcvRate}
            </p>
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-brand-blue p-3 rounded-[20px] border border-brand-blue-light shadow-md relative overflow-hidden">
          <div className="flex flex-col items-center text-center relative z-10">
            <p className="text-slate-300 font-bold uppercase tracking-[0.1em] text-[8px] mb-1">Debes enviar aproximadamente</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-brand-green">R$</span>
              <p className="text-2xl md:text-5xl font-black text-white tracking-tighter">
                {brlNeeded ? Number(brlNeeded).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
          </div>
        </div>

        <a 
          href="https://wa.me/5541987940065" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-black py-2.5 rounded-[15px] transition-all shadow-md flex items-center justify-center gap-2 text-sm group"
        >
          Enviar ahora
          <ArrowRightLeft size={16} className="group-hover:rotate-180 transition-transform duration-500" />
        </a>
      </div>
    </div>


  );
}
