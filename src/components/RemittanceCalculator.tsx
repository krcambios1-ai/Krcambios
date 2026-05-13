import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRightLeft, Info } from 'lucide-react';
import { EXCHANGE_RATES } from '../constants';

interface RemittanceCalculatorProps {
  bcvRate: string;
  rates?: any;
  onCalculate?: (data: { reais: number; ves: number; usd: number; brlVesRate: number }) => void;
}

export default function RemittanceCalculator({ bcvRate, rates: propRates, onCalculate }: RemittanceCalculatorProps) {
  const [reais, setReais] = useState<string | number>(1000);
  const [vesAtDestination, setVesAtDestination] = useState<string | number>('');
  const [usdEquivalent, setUsdEquivalent] = useState<number>(0);
  const [lastEdited, setLastEdited] = useState<'brl' | 'ves'>('brl');
  
  const activeRates = propRates || EXCHANGE_RATES;
  
  // Usar la tasa BRL/VES de la calculadora principal (VES.sell es el multiplicador)
  const brlVesRate = activeRates.VES?.sell || 0;
  
  // Parse the BCV rate string (e.g., "36,45" -> 36.45)
  const numericBcvRate = parseFloat(bcvRate.replace('.', '').replace(',', '.'));

  useEffect(() => {
    if (lastEdited === 'brl') {
      const numReais = Number(reais);
      if (isNaN(numReais) || numReais <= 0) {
        setVesAtDestination('');
        setUsdEquivalent(0);
        onCalculate?.({ reais: 0, ves: 0, usd: 0, brlVesRate });
        return;
      }
      const bolivares = numReais * brlVesRate;
      setVesAtDestination(bolivares.toFixed(2));
      const dollars = bolivares / numericBcvRate;
      setUsdEquivalent(dollars);
      onCalculate?.({ reais: numReais, ves: bolivares, usd: dollars, brlVesRate });
    }
  }, [reais, brlVesRate, numericBcvRate, lastEdited]);

  useEffect(() => {
    if (lastEdited === 'ves') {
      const numVes = Number(vesAtDestination);
      if (isNaN(numVes) || numVes <= 0) {
        setReais('');
        setUsdEquivalent(0);
        onCalculate?.({ reais: 0, ves: 0, usd: 0, brlVesRate });
        return;
      }
      const numReais = numVes / brlVesRate;
      setReais(numReais.toFixed(2));
      const dollars = numVes / numericBcvRate;
      setUsdEquivalent(dollars);
      onCalculate?.({ reais: numReais, ves: numVes, usd: dollars, brlVesRate });
    }
  }, [vesAtDestination, brlVesRate, numericBcvRate, lastEdited]);

  const handleBrlChange = (val: string) => {
    setLastEdited('brl');
    setReais(val);
  };

  const handleVesChange = (val: string) => {
    setLastEdited('ves');
    setVesAtDestination(val);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md mx-auto border border-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-black text-brand-blue leading-tight">
            Si mando, ¿cuánto llega?
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Calculadora de Remesas</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-green shadow-sm">
          <TrendingUp size={24} />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 gap-4">
          {/* Reais Input */}
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Monto en Reais (BRL)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <img 
                  src="https://flagcdn.com/w40/br.png" 
                  alt="BRL" 
                  className="w-6 h-4 object-cover rounded-sm shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold text-slate-400">R$</span>
              </div>
              <input
                type="number"
                value={reais}
                onChange={(e) => handleBrlChange(e.target.value)}
                className="w-full pl-20 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-green focus:bg-white outline-none transition-all text-xl font-black text-brand-blue"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Conversion Flow */}
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-[2px] bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Resultado Final</span>
            <div className="flex-1 h-[2px] bg-slate-100"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Reciben en Bolívares</p>
                <span className="text-[9px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full font-bold">Tasa: {brlVesRate.toLocaleString('de-DE')}</span>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-brand-blue text-2xl">Bs.</div>
                <input
                  type="number"
                  value={vesAtDestination}
                  onChange={(e) => handleVesChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 bg-transparent border-none outline-none text-2xl font-black text-brand-blue"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="bg-brand-blue p-6 rounded-2xl border border-brand-blue-light shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
              <p className="text-[10px] font-bold text-slate-300 uppercase mb-2 relative z-10">Equivale en Dólares (Tasa BCV)</p>
              <div className="flex items-baseline gap-2 relative z-10">
                <p className="text-4xl font-black text-brand-green">
                  ${usdEquivalent.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-brand-green/60 font-bold text-sm">USD</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Tasa BCV utilizada</span>
                <span className="text-[10px] text-white font-black">{bcvRate} VES/USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex gap-3">
          <Info className="text-brand-green shrink-0" size={18} />
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Esta calculadora utiliza automáticamente la tasa del día de nuestra calculadora principal para determinar cuántos <strong>Dólares</strong> representan los Bolívares recibidos.
          </p>
        </div>

        <a 
          href="https://wa.me/5541987940065" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-3 text-lg group"
        >
          Enviar ahora
          <ArrowRightLeft size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </a>
      </div>
    </div>
  );
}
