import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft, DollarSign, Euro, TrendingUp, ChevronDown } from 'lucide-react';

import { EXCHANGE_RATES as rates, BRL_DATA } from '../constants';

interface CurrencyDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: any[];
  align?: 'left' | 'right';
}

function CurrencyDropdown({ value, onChange, label, options, align = 'left' }: CurrencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.code === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      <label className="block text-[10px] md:text-sm font-medium text-slate-600 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 md:px-3 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-brand-green transition-all outline-none"
      >
        <div className="flex items-center gap-1.5 md:gap-2">
          <img 
            src={`https://flagcdn.com/w40/${selectedOption?.flag}.png`} 
            alt={selectedOption?.code}
            className="w-5 md:w-6 h-3.5 md:h-4 object-cover rounded-sm shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-brand-blue text-xs md:text-base">{selectedOption?.code}</span>
        </div>
        <ChevronDown size={16} md:size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-60 md:w-64 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 max-h-64 overflow-y-auto ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                onChange(opt.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${value === opt.code ? 'bg-emerald-50 text-brand-green' : 'text-slate-700'}`}
            >
              <img 
                src={`https://flagcdn.com/w40/${opt.flag}.png`} 
                alt={opt.code}
                className="w-5 md:w-6 h-3.5 md:h-4 object-cover rounded-sm shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">{opt.code}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px] md:max-w-[150px]">{opt.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Calculator({ rates: propRates }: { rates?: any }) {
  const [amount, setAmount] = useState<number | string>(1000);
  const [fromCurrency, setFromCurrency] = useState('BRL');
  const [toCurrency, setToCurrency] = useState('VES');
  const [result, setResult] = useState<number>(0);

  const activeRates = propRates || rates;

  const allOptions = [
    { code: 'BRL', ...BRL_DATA },
    ...Object.entries(activeRates).map(([code, data]) => ({ code, ...data as any }))
  ];

  // Logic: At least one currency must be BRL
  useEffect(() => {
    if (fromCurrency !== 'BRL' && toCurrency !== 'BRL') {
      setToCurrency('BRL');
    }
  }, [fromCurrency]);

  useEffect(() => {
    if (toCurrency !== 'BRL' && fromCurrency !== 'BRL') {
      setFromCurrency('BRL');
    }
  }, [toCurrency]);

  const fromOptions = allOptions;
  const toOptions = fromCurrency === 'BRL' 
    ? allOptions.filter(opt => opt.code !== 'BRL')
    : allOptions.filter(opt => opt.code === 'BRL');

  useEffect(() => {
    calculate();
  }, [amount, fromCurrency, toCurrency, activeRates]);

  const calculate = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setResult(0);
      return;
    }

    if (fromCurrency === 'BRL') {
      // BRL to Foreign: Always multiply (Rate is Units per BRL)
      const rate = activeRates[toCurrency as keyof typeof activeRates]?.sell || 0;
      setResult(numAmount * rate);
    } else if (toCurrency === 'BRL') {
      // Foreign to BRL:
      const rate = activeRates[fromCurrency as keyof typeof activeRates]?.buy || 1;
      if (fromCurrency === 'VES') {
        // Only VES to BRL is division (Rate is VES per BRL)
        setResult(numAmount / rate);
      } else {
        // Others to BRL is multiplication (Rate is BRL per Unit)
        setResult(numAmount * rate);
      }
    } else {
      // Cross currency (e.g., USD to EUR) - simplified via BRL
      const fromRate = activeRates[fromCurrency as keyof typeof activeRates]?.buy || 1;
      const amountInBrl = fromCurrency === 'VES' ? numAmount / fromRate : numAmount * fromRate;

      const toRate = activeRates[toCurrency as keyof typeof activeRates]?.sell || 0;
      const finalResult = amountInBrl * toRate;
      
      setResult(finalResult);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 w-full max-w-md mx-auto border border-slate-100">
      <h3 className="text-xl md:text-2xl font-bold text-brand-blue mb-4 md:mb-6 flex items-center gap-2">
        <TrendingUp className="text-brand-green" size={20} />
        Calculadoras en Vivo
      </h3>
      
      <div className="space-y-3 md:space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-[10px] md:text-sm font-medium text-slate-600 mb-1">Monto a enviar</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all text-base md:text-lg font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <CurrencyDropdown 
            label="Tengo" 
            value={fromCurrency} 
            onChange={setFromCurrency} 
            options={fromOptions}
            align="left"
          />

          {/* Swap Button */}
          <div className="pt-5 md:pt-6">
            <button
              onClick={handleSwap}
              className="p-2 md:p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-brand-blue transition-colors"
              aria-label="Invertir monedas"
            >
              <ArrowRightLeft size={18} md:size={20} />
            </button>
          </div>

          <CurrencyDropdown 
            label="Quiero" 
            value={toCurrency} 
            onChange={setToCurrency} 
            options={toOptions}
            align="right"
          />
        </div>

        {/* Result */}
        <div className="mt-4 md:mt-6 p-4 bg-brand-blue-light rounded-xl text-white">
          <p className="text-[10px] md:text-sm text-slate-300 mb-0.5 md:mb-1">Recibirás aproximadamente:</p>
          <div className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span className="text-brand-green">
              {toCurrency === 'BRL' ? 'R$' : activeRates[toCurrency as keyof typeof activeRates]?.symbol}
            </span>
            {result.toLocaleString('de-DE', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2,
              useGrouping: true 
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 md:mt-2">
            *Tasas estimadas. Sujeto a variaciones del mercado.
          </p>
        </div>

        <a 
          href="https://wa.me/5541987940065" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full mt-3 md:mt-4 bg-brand-green hover:bg-brand-green-hover text-white font-semibold py-3 md:py-4 rounded-xl transition-colors shadow-lg shadow-brand-green/30 flex items-center justify-center gap-2 text-sm md:text-base"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}
