import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowRightLeft, TrendingUp } from 'lucide-react';

export default function ManualCalculator() {
  const [targetUsd, setTargetUsd] = useState<string | number>(100);
  const [customBcv, setCustomBcv] = useState<string>('40.00');
  const [customBrl, setCustomBrl] = useState<string>('115.00');
  const [brlNeeded, setBrlNeeded] = useState<string | number>('');
  const [vesEquivalent, setVesEquivalent] = useState<number>(0);

  useEffect(() => {
    const usd = Number(targetUsd);
    const bcv = parseFloat(customBcv.replace(',', '.'));
    const brlRate = parseFloat(customBrl.replace(',', '.'));

    if (isNaN(usd) || usd <= 0 || isNaN(bcv) || bcv <= 0 || isNaN(brlRate) || brlRate <= 0) {
      setBrlNeeded('');
      setVesEquivalent(0);
      return;
    }

    const ves = usd * bcv;
    setVesEquivalent(ves);
    const brl = ves / brlRate;
    setBrlNeeded(brl.toFixed(2));
  }, [targetUsd, customBcv, customBrl]);

  return (
    <div className="bg-white rounded-[25px] shadow-lg p-3 w-full max-w-2xl mx-auto border border-slate-100 overflow-hidden relative mt-4">
      <div className="text-center mb-3 relative z-10">
        <h2 className="text-lg font-black text-brand-blue mb-0.5">
          Calculadora Libre (Manual)
        </h2>
        <p className="text-[10px] text-slate-500 font-medium leading-tight">
          Usa tus propias tasas para calcular.
        </p>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5 ml-1">Coloca tu tasa de Dolar</label>
            <input
              type="text"
              value={customBcv}
              onChange={(e) => setCustomBcv(e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-brand-blue outline-none focus:border-brand-blue"
            />
          </div>
          <div className="relative">
            <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5 ml-1">Tu tasa del dia</label>
            <input
              type="text"
              value={customBrl}
              onChange={(e) => setCustomBrl(e.target.value)}
              className="w-full px-2 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-brand-blue outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5 ml-1">Monto en Dólares</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="font-black text-slate-400 text-base">$</span>
            </div>
            <input
              type="number"
              value={targetUsd}
              onChange={(e) => setTargetUsd(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-[15px] focus:border-brand-green outline-none text-lg font-black text-brand-blue"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Equivale en Bs.</p>
            <p className="text-xs font-black text-brand-blue">
              Bs. {vesEquivalent.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-brand-blue p-2 rounded-lg border border-brand-blue-light shadow-sm">
            <p className="text-slate-300 font-bold uppercase text-[7px] mb-0.5">Debes enviar</p>
            <p className="text-sm font-black text-white">
              R$ {brlNeeded ? Number(brlNeeded).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
            </p>
          </div>
        </div>

        <a 
          href="https://wa.me/5541987940065" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-brand-green text-white font-black py-2.5 rounded-[15px] flex items-center justify-center gap-2 text-sm"
        >
          Enviar ahora
          <ArrowRightLeft size={16} />
        </a>
      </div>
    </div>
  );
}
