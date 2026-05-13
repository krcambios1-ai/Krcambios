import React, { useRef } from 'react';
import { Share2, Download, Camera, Globe, ArrowRight } from 'lucide-react';
import { toPng } from 'html-to-image';

const LOGO_URL = typeof window !== 'undefined' ? window.location.origin + "/logo.png" : "/logo.png";

interface BrazilRatesShareCardProps {
  rates: any;
  lastUpdated: Date | null;
}

export default function BrazilRatesShareCard({ rates, lastUpdated }: BrazilRatesShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    
    try {
      // Delay to ensure all sub-images (flags) are perfectly rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `tasas-brasil-kr-cambios-${new Date().toLocaleDateString()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  const handleShare = async () => {
    if (cardRef.current === null) return;

    try {
      // Delay to ensure all sub-images (flags) are perfectly rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'tasas-brasil.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Tasas Brasil - KR Cambios',
          text: `Nuestras tasas de remesas desde Brasil para hoy.`,
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
    <div className="py-12 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-brand-blue mb-4 uppercase tracking-tight">Comparte las Tasas de Brasil</h2>
          <p className="text-slate-500 font-medium">Genera una imagen profesional con nuestras cotizaciones internacionales.</p>
        </div>

        <div className="flex flex-col xl:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Card Preview */}
          <div className="relative group shrink-0">
            <div 
              ref={cardRef}
              className="w-[280px] md:w-[320px] min-h-[460px] md:min-h-[500px] bg-white rounded-[40px] overflow-hidden shadow-2xl relative flex flex-col p-4 md:p-6 text-brand-blue border-[4px] md:border-6 border-slate-50"
            >
              {/* Header bg */}
              <div className="absolute top-0 left-0 w-full h-28 md:h-32 bg-brand-green"></div>
              <div className="absolute top-20 md:top-24 left-0 w-full h-12 bg-white rounded-t-[40px]"></div>
              
              {/* Logo & Branding */}
              <div className="relative z-10 flex flex-col items-center mb-4 md:mb-6">
                <div className="bg-white p-2 md:p-3 rounded-2xl md:rounded-3xl shadow-xl mb-2 md:mb-3">
                  <img src={LOGO_URL} alt="KR Cambios" className="w-16 h-16 md:w-20 md:h-20 object-contain" crossOrigin="anonymous" />
                </div>
                <h1 className="text-xl md:text-2xl font-black text-brand-blue tracking-tight">KR CAMBIOS</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-0.5 md:h-1 w-6 md:w-8 bg-brand-blue rounded-full"></span>
                  <span className="text-[8px] md:text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">Tasas del Día</span>
                  <span className="h-0.5 md:h-1 w-6 md:w-8 bg-brand-blue rounded-full"></span>
                </div>
              </div>

              {/* Date */}
              <div className="relative z-10 text-center mb-4 md:mb-6 bg-slate-50 py-2 rounded-2xl border border-slate-100">
                <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Actualizado el</p>
                <p className="text-brand-blue font-black text-xs md:text-sm">{today} - {time}</p>
              </div>

              {/* Rates List */}
              <div className="relative z-10 flex-1">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {Object.entries(rates).map(([key, data]: [string, any]) => {
                    const isVes = key === 'VES';
                    return (
                      <div 
                        key={key} 
                        className={`${isVes ? 'col-span-2 bg-brand-blue border-brand-blue-light text-white' : 'bg-slate-50 border-slate-100 text-brand-blue'} rounded-xl p-2 md:p-3 border flex items-center gap-2 md:gap-3`}
                      >
                        <img 
                          src={key === 'EUR' ? 'https://purecatamphetamine.github.io/country-flag-icons/3x2/EU.svg' : `https://flagcdn.com/w80/${data.flag?.toLowerCase()}.png?v=5`} 
                          alt={key} 
                          className="w-6 md:w-8 h-4 md:h-5 object-cover rounded shadow-sm shrink-0" 
                          crossOrigin="anonymous" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className={`text-[7px] md:text-[8px] font-black uppercase truncate ${isVes ? 'text-slate-300' : 'text-slate-400'}`}>
                            {isVes ? 'VENEZUELA' : key}
                          </p>
                          <p className={`font-black truncate ${isVes ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'}`}>
                            {key === 'COP' || key === 'CLP' || key === 'ARS' 
                              ? data.sell.toLocaleString('de-DE', { minimumFractionDigits: 0 }) 
                              : data.sell.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            <span className="text-[7px] ml-0.5 opacity-60 font-medium">/R$</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100 text-center">
                <p className="text-brand-blue font-black text-[10px] md:text-xs">www.krcambios.com.br</p>
                <div className="flex justify-center gap-3 md:gap-4 mt-1">
                  <p className="text-brand-green font-bold text-[8px] md:text-[9px]">@krcambios1</p>
                  <p className="text-brand-green font-bold text-[8px] md:text-[9px]">+55 41 98794-0065</p>
                </div>
              </div>
            </div>
            {/* Overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[40px] pointer-events-none backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Camera size={24} />
                    Vista Previa
                </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs shrink-0">
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-hover text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-brand-green/20"
            >
              <Share2 size={20} />
              Compartir Tasas Brasil
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-brand-blue border-2 border-slate-200 font-black py-4 px-8 rounded-2xl transition-all shadow-sm"
            >
              <Download size={20} />
              Descargar Imagen
            </button>
            <div className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10">
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed text-center uppercase">
                Esta imagen está diseñada para captar la atención en Instagram Stories y WhatsApp Status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
