import React, { useRef } from 'react';
import { Share2, Download, Camera } from 'lucide-react';
import { toPng } from 'html-to-image';

const LOGO_URL = "/logo.png";

interface BCVShareCardProps {
  rate: string;
}

export default function BCVShareCard({ rate }: BCVShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    
    try {
      // Delay to ensure images are rendered perfectly
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement('a');
      link.download = `tasa-bcv-kr-cambios-${new Date().toLocaleDateString()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  const handleShare = async () => {
    if (cardRef.current === null) return;

    try {
      // Delay to ensure images are rendered perfectly
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'tasa-bcv.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Tasa BCV - KR Cambios',
          text: `La tasa oficial del BCV hoy es Bs. ${rate}. ¡Cambia con nosotros!`,
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

  return (
    <div className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-blue mb-4">Comparte la Tasa Oficial</h2>
          <p className="text-slate-600">Genera una imagen personalizada con la tasa del día para compartir con tus contactos.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Preview Card */}
          <div className="relative group">
            <div 
              ref={cardRef}
              className="w-[350px] h-[450px] bg-brand-blue rounded-3xl overflow-hidden shadow-2xl relative flex flex-col p-8 text-white border-4 border-brand-green/20"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <img 
                  src={LOGO_URL} 
                  alt="KR Cambios Logo" 
                  className="w-28 h-28 object-contain" 
                  crossOrigin="anonymous"
                />
                <div className="flex flex-col items-start">
                  <span className="font-bold text-xl leading-none">KR CAMBIOS</span>
                  <span className="text-[8px] font-bold tracking-[0.2em] mt-0.5 text-brand-green">RAPIDEZ Y CONFIANZA</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10 py-2">
                <div className="mb-2">
                  <img 
                    src="https://flagcdn.com/w80/ve.png" 
                    alt="VE" 
                    className="w-12 h-8 object-cover rounded-md shadow-lg mx-auto mb-2" 
                    referrerPolicy="no-referrer" 
                    crossOrigin="anonymous"
                  />
                  <span className="text-brand-green font-bold tracking-widest uppercase text-xs">Tasa Oficial BCV</span>
                </div>
                
                <div className="text-5xl font-black mb-1 text-white">
                  Bs. {rate}
                </div>
                
                <div className="text-slate-400 text-xs font-medium">
                  {new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-white/10 text-center relative z-10">
                <div className="bg-white/5 py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                  <p className="text-brand-green font-bold text-base mb-1">www.krcambios.com.br</p>
                  <p className="text-white font-bold text-sm">Instagram: @krcambios1</p>
                </div>
                <p className="text-slate-400 text-[9px] uppercase tracking-[0.2em] mt-3">Seguridad y rapidez en cada envío</p>
              </div>
            </div>
            
            {/* Overlay Hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl backdrop-blur-sm pointer-events-none">
              <div className="flex items-center gap-2 text-white font-bold">
                <Camera size={24} />
                Vista Previa
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-brand-green/20"
            >
              <Share2 size={20} />
              Compartir en Redes
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-brand-blue border border-slate-200 font-bold py-4 px-8 rounded-2xl transition-all shadow-sm"
            >
              <Download size={20} />
              Descargar Imagen
            </button>
            <p className="text-xs text-slate-400 text-center mt-2 italic">
              *La imagen se generará con la tasa actual y el diseño de tu marca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
