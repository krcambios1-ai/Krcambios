import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, DollarSign, Repeat, Info, Share2, Download, Check, MapPin, Phone } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface FastConversionTableProps {
  rates: any;
  bcvRate: number;
}

export default function FastConversionTable({ rates, bcvRate }: FastConversionTableProps) {
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const usdAmounts = [5, 10, 20, 30, 40, 50, 100];
  
  // Rate to send BRL and receive VES (The rate from Brazil to Venezuela)
  const vesRate = rates.VES?.sell || 6.50; 
  
  const calculateVES = (usd: number) => (usd * bcvRate).toFixed(2);
  const calculateBRL = (usd: number) => {
    const targetBolivares = usd * bcvRate;
    return (targetBolivares / vesRate).toFixed(2);
  };

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;
    setIsGenerating(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(tableRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = 'conversiones-kr-cambios.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Hubo un error al generar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pt-32 md:pt-40 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Inicio
          </button>

          <button 
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-light text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isGenerating ? 'Generando...' : 'Descargar Imagen'}
          </button>
        </div>

        {/* Capture Area */}
        <div ref={tableRef} data-capture-area className="bg-[#ffffff] rounded-[32px] border border-[#f1f5f9] overflow-hidden" style={{ backgroundColor: '#ffffff', color: '#0A192F' }}>
          {/* Brand Header */}
          <div className="p-6 md:p-8 text-[#ffffff] relative overflow-hidden" style={{ backgroundColor: '#0A192F' }}>
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Zap size={100} />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black mb-1 flex items-center gap-2" style={{ color: '#ffffff' }}>
                  KR CAMBIOS <Zap size={18} style={{ color: '#10B981', fill: '#10B981' }} />
                </h2>
                <p className="font-black text-[10px] tracking-widest uppercase" style={{ color: '#10B981' }}>
                  Confianza y Rapidez
                </p>
                <h1 className="text-lg font-medium mt-4" style={{ color: '#cbd5e1' }}>Tablas de Conversión Rápida</h1>
              </div>
              <div className="text-right">
                <div className="backdrop-blur-md px-4 py-3 rounded-2xl border border-[#ffffff1a] inline-block" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <p className="text-[9px] font-black uppercase tracking-tighter mb-1" style={{ color: '#cbd5e1' }}>Fecha de Consulta</p>
                  <p className="text-sm font-bold text-[#ffffff]">{new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rates Info */}
          <div className="grid grid-cols-2 divide-x divide-[#f1f5f9] border-b border-[#f1f5f9]" style={{ backgroundColor: '#f8fafc' }}>
            <div className="px-6 py-4">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Tasa Envío (VES)</p>
              <p className="text-xl font-black" style={{ color: '#0A192F' }}>Bs. {vesRate}</p>
            </div>
            <div className="px-6 py-4 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Tasa Oficial (BCV)</p>
              <p className="text-xl font-black" style={{ color: '#0A192F' }}>Bs. {bcvRate}</p>
            </div>
          </div>

          {/* Table */}
          <div className="p-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-[#f8fafc]">
                  <th className="py-4 px-4 font-black text-[9px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>Si envías (U$)</th>
                  <th className="py-4 px-4 font-black text-[9px] uppercase tracking-widest text-center" style={{ color: '#94a3b8' }}>Deposito (R$)</th>
                  <th className="py-4 px-4 font-black text-[9px] uppercase tracking-widest text-right" style={{ color: '#94a3b8' }}>Reciben (Bs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {usdAmounts.map((usd) => (
                  <tr key={usd}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#f0f9ff', color: '#0A192F' }}>
                          $
                        </div>
                        <span className="text-xl font-black" style={{ color: '#0A192F' }}>{usd}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-lg font-bold" style={{ color: '#334155' }}>R$ {calculateBRL(usd)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black" style={{ color: '#0A192F' }}>Bs. {parseFloat(calculateVES(usd)).toLocaleString('de-DE')}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-[#f1f5f9] flex items-center justify-between" style={{ backgroundColor: '#f8fafc' }}>
            <div className="flex items-center gap-2 font-bold text-[10px] uppercase" style={{ color: '#94a3b8' }}>
              <MapPin size={12} /> Curitiba, Brasil
            </div>
            <div className="flex items-center gap-2 font-black text-[10px] uppercase" style={{ color: '#0A192F' }}>
              <Phone size={12} /> +55 41 98794-0065
            </div>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="mt-8 text-center px-6 py-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 mb-4 font-medium italic">"Los montos pueden cambiar según la fluctuación del mercado al momento de realizar la operación."</p>
          <button 
            onClick={() => window.open('https://wa.me/5541987940065', '_blank')}
            className="inline-flex items-center gap-2 bg-brand-green text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-brand-green/20 hover:scale-105 transition-transform"
          >
            Enviar ahora por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
