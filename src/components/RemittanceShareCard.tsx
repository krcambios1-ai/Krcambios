import React, { useRef } from 'react';
import { Share2, Download, Camera, ArrowRightLeft } from 'lucide-react';
import { toPng } from 'html-to-image';

const LOGO_URL = "/logo.png";

interface RemittanceShareCardProps {
  reais: number;
  ves: number;
  usd: number;
  brlVesRate: number;
  bcvRate: string;
}

export default function RemittanceShareCard({ reais, ves, usd, brlVesRate, bcvRate }: RemittanceShareCardProps) {
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
      link.download = `remesa-kr-cambios-${new Date().toLocaleDateString()}.png`;
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
      const file = new File([blob], 'remesa.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cotización de Remesa - KR Cambios',
          text: `Si mandas R$ ${reais}, reciben Bs. ${ves.toLocaleString('de-DE')}. ¡Envia con nosotros!`,
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
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-blue mb-4">Comparte tu Cotización</h2>
          <p className="text-slate-600">Genera un comprobante de cotización para enviar a tus familiares o amigos.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Preview Card */}
          <div className="relative group">
            <div 
              ref={cardRef}
              className="w-[350px] h-[480px] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col p-6 text-brand-blue border-4 border-slate-100"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <img 
                  src={LOGO_URL} 
                  alt="KR Cambios Logo" 
                  className="w-20 h-20 object-contain" 
                  crossOrigin="anonymous"
                />
                <div className="flex flex-col items-start">
                  <span className="font-bold text-lg leading-none text-brand-blue">KR CAMBIOS</span>
                  <span className="text-[7px] font-bold tracking-[0.2em] mt-0.5 text-brand-green uppercase">Rapidez y Confianza</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-3 relative z-10">
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cotización de Envío</span>
                  <div className="h-0.5 w-10 bg-brand-green mx-auto mt-1 rounded-full"></div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Monto Enviado (Brasil)</p>
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://flagcdn.com/w40/br.png" 
                        alt="BR" 
                        className="w-5 h-3 object-cover rounded-sm" 
                        referrerPolicy="no-referrer" 
                        crossOrigin="anonymous"
                      />
                      <p className="text-lg font-black text-brand-blue">R$ {reais.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="flex justify-center -my-2 relative z-20">
                    <div className="bg-brand-green text-white p-1.5 rounded-full shadow-lg">
                      <ArrowRightLeft size={14} />
                    </div>
                  </div>

                  <div className="bg-brand-blue p-4 rounded-2xl border border-brand-blue-light shadow-lg text-white">
                    <p className="text-[9px] font-bold text-slate-300 uppercase mb-1">Reciben en Venezuela</p>
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://flagcdn.com/w40/ve.png" 
                        alt="VE" 
                        className="w-5 h-3 object-cover rounded-sm" 
                        referrerPolicy="no-referrer" 
                        crossOrigin="anonymous"
                      />
                      <p className="text-xl font-black text-brand-green">Bs. {ves.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">Equivale a:</span>
                      <span className="text-xs font-black text-brand-green">${usd.toLocaleString('de-DE', { minimumFractionDigits: 2 })} USD</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[7px] font-bold text-slate-400 uppercase">Tasa BRL/VES</p>
                    <p className="text-[10px] font-black text-brand-blue">{brlVesRate.toLocaleString('de-DE')}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[7px] font-bold text-slate-400 uppercase">Tasa BCV</p>
                    <p className="text-[10px] font-black text-brand-blue">{bcvRate}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-slate-100 text-center relative z-10">
                <p className="text-brand-blue font-black text-xs">www.krcambios.com.br</p>
                <p className="text-brand-green font-bold text-[9px]">Instagram: @krcambios1</p>
                <p className="text-slate-400 text-[7px] uppercase tracking-[0.1em] mt-1">Válido por hoy: {new Date().toLocaleDateString()}</p>
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
              Compartir Cotización
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-brand-blue border border-slate-200 font-bold py-4 px-8 rounded-2xl transition-all shadow-sm"
            >
              <Download size={20} />
              Descargar Imagen
            </button>
            <p className="text-xs text-slate-400 text-center mt-2 italic">
              *La imagen incluirá todos los detalles de la conversión y tu marca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
