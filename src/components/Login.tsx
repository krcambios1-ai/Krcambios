import React, { useState, useEffect } from 'react';
import { Lock, Mail, LogIn, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebview, setIsWebview] = useState(false);

  useEffect(() => {
    // Detect if we are likely in a webview
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const inWebview = isMobile && (
      (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1) || // Facebook
      (ua.indexOf('Instagram') > -1) || // Instagram
      (ua.indexOf('WhatsApp') > -1) || // WhatsApp
      (ua.indexOf('wv') > -1) // Generic Android webview
    );
    setIsWebview(inWebview);

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Logged in via redirect successfully");
        }
      } catch (err: any) {
        console.error("Redirect login error:", err);
        if (err.code === 'auth/disallowed-useragent') {
          setError("Tu navegador actual no permite el inicio de sesión con Google. Por favor, pulsa el botón de los tres puntos y selecciona 'Abrir en Chrome' o 'Abrir en Safari'.");
        } else {
          setError("Error al procesar el inicio de sesión. Por favor, intenta de nuevo.");
        }
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      
      // Use Redirect on mobile as it's generally more compatible with restricted mobile environments
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/disallowed-useragent') {
        setError("Navegador no compatible. Por favor, usa Chrome o Safari.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes o usa un navegador diferente.");
      } else {
        setError("Error al iniciar sesión. Asegúrate de usar una cuenta autorizada.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-white/10">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
              <Lock size={40} className="text-brand-blue" />
            </div>
            <h1 className="text-3xl font-black text-brand-blue mb-2">Acceso Privado</h1>
            <p className="text-slate-500 font-medium">Solo personal autorizado de KR Cambios</p>
          </div>

          {isWebview && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 p-4 rounded-2xl mb-8 flex items-start gap-3">
              <ExternalLink size={20} className="shrink-0 mt-1" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight mb-1">Navegador Limitado Detectado</p>
                <p className="text-xs leading-relaxed">
                  Estás abriendo el sitio desde una aplicación (como WhatsApp o Instagram). Google bloquea el inicio de sesión aquí por seguridad.
                  <br /><br />
                  <strong>Para entrar:</strong> Pulsa los 3 puntos en la esquina o arriba y selecciona <strong>"Abrir en el navegador"</strong> o <strong>"Abrir en Chrome"</strong>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-brand-blue border-2 border-slate-100 font-black py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <RefreshCw size={24} className="animate-spin text-brand-green" />
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                  Entrar con Google
                </>
              )}
            </button>
            
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold mt-8">
              Seguridad Protegida por KR Cambios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
