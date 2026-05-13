import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Phone, Mail, ArrowRight, Star, ShieldAlert, TrendingUp, Clock, Zap } from 'lucide-react';
import Calculator from './components/Calculator';
import BCVCalculator from './components/BCVCalculator';
import BRLtoUSDCalculator from './components/BRLtoUSDCalculator';
import ManualCalculator from './components/ManualCalculator';
import RemittanceCalculator from './components/RemittanceCalculator';
import RemittanceShareCard from './components/RemittanceShareCard';
import DailyReport from './components/DailyReport';
import FastConversionTable from './components/FastConversionTable';
import Features from './components/Features';
import Services from './components/Services';
import FAQ from './components/FAQ';
import WhatsAppButton from './components/WhatsAppButton';
import ScamDirectory from './components/ScamDirectory';
import BCVShareCard from './components/BCVShareCard';
import BrazilRates from './components/BrazilRates';

import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, Timestamp } from 'firebase/firestore';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { EXCHANGE_RATES as defaultRates } from './constants';

const LOGO_URL = "/logo.png";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Mapping paths to views for backward compatibility where needed, 
  // but we'll mostly use the router now.
  const getActiveView = (): 'home' | 'scams' | 'admin' | 'brl-to-usd' | 'si-mando' | 'fast-conversions' | 'brl-to-usd' | 'bcv-calculator' | 'daily-report' | 'brazil-rates' => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/tasas-del-dia') return 'daily-report';
    if (path === '/tasas-brasil') return 'brazil-rates';
    if (path === '/si-mando') return 'si-mando';
    if (path === '/conversiones-rapidas') return 'fast-conversions';
    if (path === '/calculadora-dolar') return 'brl-to-usd';
    if (path === '/calculadora-bcv') return 'bcv-calculator';
    if (path === '/directorio-estafas') return 'scams';
    if (path === '/admin') return 'admin';
    return 'home';
  };

  const currentView = getActiveView();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rates, setRates] = useState<any>(defaultRates);
  const [bcvRate, setBcvRate] = useState<string>('36,29');
  const [parallelRate, setParallelRate] = useState<string>('39,50');
  const [promedioRate, setPromedioRate] = useState<string>('37,90');
  const [indicatorRates, setIndicatorRates] = useState<any>({
    euroBcv: '40,00'
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [remittanceData, setRemittanceData] = useState({
    reais: 1000,
    ves: 0,
    usd: 0,
    brlVesRate: 116
  });

  const handleRemittanceCalculate = useCallback((data: { reais: number; ves: number; usd: number; brlVesRate: number }) => {
    setRemittanceData(prev => {
      if (
        prev.reais === data.reais && 
        prev.ves === data.ves && 
        prev.usd === data.usd && 
        prev.brlVesRate === data.brlVesRate
      ) {
        return prev;
      }
      return { ...prev, ...data };
    });
  }, []);

  const [lastUpdateSource, setLastUpdateSource] = useState<'api' | 'firestore' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const fetchRates = useCallback(async (force = false) => {
    // If autoSync is disabled and we are not forcing (manual button), skip
    if (!autoSyncEnabled && !force) {
      console.log('Skipping auto-fetch as sync is disabled');
      return;
    }

    setIsUpdating(true);
    try {
      // Use local proxy to avoid CORS/Network issues
      const response = await fetch(`/api/rates?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Robust mapping for different possible IDs from the API
        const oficial = data.find(d => ['oficial', 'bcv', 'cencoex', 'central'].includes(d.id?.toLowerCase()));
        const paralelo = data.find(d => ['paralelo', 'enparalelovzla', 'promedio'].includes(d.id?.toLowerCase()));
        const euroBcv = data.find(d => d.id?.toLowerCase().includes('euro') && (d.title?.toLowerCase().includes('bcv') || d.id?.toLowerCase().includes('bcv')));
        
        let newestBcv = bcvRate;
        let newestParalelo = parallelRate;

        if (oficial && oficial.promedio) {
          newestBcv = oficial.promedio.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          setBcvRate(newestBcv);
        }
        if (paralelo && paralelo.promedio) {
          newestParalelo = paralelo.promedio.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          setParallelRate(newestParalelo);
        }
        
        if (oficial && paralelo && oficial.promedio && paralelo.promedio) {
          const avg = (oficial.promedio + paralelo.promedio) / 2;
          setPromedioRate(avg.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }

        setIndicatorRates({
          euroBcv: euroBcv?.promedio?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '42,50',
        });

        setLastUpdateSource('api');
        
        // Use the date from the API if available, otherwise use now
        const apiDateStr = oficial?.fecha || paralelo?.fecha;
        const apiDate = apiDateStr ? new Date(apiDateStr) : new Date();
        setLastUpdated(apiDate);
        console.log('Rates updated from API:', { 
          bcv: newestBcv, 
          paralelo: newestParalelo, 
          date: apiDate,
          providers: data.map((d: any) => d._provider).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
        });
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      // Minimum delay for visual feedback
      setTimeout(() => setIsUpdating(false), 800);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000); // Check every 5 mins for even more freshness
    return () => clearInterval(interval);
  }, [fetchRates]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (view: 'home' | 'scams' | 'admin' | 'brl-to-usd' | 'si-mando' | 'bcv-calculator' | 'daily-report' | 'brazil-rates' | 'fast-conversions') => {
    const viewToPath: Record<string, string> = {
      'home': '/',
      'daily-report': '/tasas-del-dia',
      'brazil-rates': '/tasas-brasil',
      'si-mando': '/si-mando',
      'fast-conversions': '/conversiones-rapidas',
      'brl-to-usd': '/calculadora-dolar',
      'bcv-calculator': '/calculadora-bcv',
      'scams': '/directorio-estafas',
      'admin': '/admin'
    };
    navigate(viewToPath[view] || '/');
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is admin (by email or role)
        const adminEmail = "krcambios1@gmail.com";
        setIsAdmin(currentUser.email === adminEmail);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [currentView]);

  // Real-time Rates Listener
  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedAt = data.updatedAt?.toDate();
        const isToday = updatedAt && new Date().toDateString() === updatedAt.toDateString();

        // Sync local autoSync state
        if (typeof data.autoSync === 'boolean') {
          setAutoSyncEnabled(data.autoSync);
        }

        if (data && data.rates) {
          setRates({ ...defaultRates, ...data.rates });
        }
        
        // If autoSync is DISabled, the Firestore values ALWAYS win
        if (!data.autoSync) {
          if (data.bcvRate) setBcvRate(data.bcvRate);
          if (data.parallelRate) setParallelRate(data.parallelRate);
          if (data.promedioRate) setPromedioRate(data.promedioRate);
          if (data.indicatorRates) setIndicatorRates(data.indicatorRates);
          setLastUpdateSource('firestore');
          setLastUpdated(updatedAt || new Date());
        } else if (isToday) {
          // If autoSync is ON, we only let Firestore win if the update is VERY recent 
          // (manual emergency adjustment)
          const now = new Date();
          const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
          
          if (diffMinutes < 2) {
            if (data.bcvRate) setBcvRate(data.bcvRate);
            if (data.parallelRate) setParallelRate(data.parallelRate);
            if (data.promedioRate) setPromedioRate(data.promedioRate);
            if (data.indicatorRates) setIndicatorRates(data.indicatorRates);
            setLastUpdateSource('firestore');
            setLastUpdated(updatedAt);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
    return () => unsubscribe();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, message } = contactForm;
    
    try {
      // Save to Firestore
      await addDoc(collection(db, 'messages'), {
        name,
        email,
        message,
        createdAt: Timestamp.now(),
        status: 'new'
      });
      
      const whatsappMessage = `Hola KR Cambios! Mi nombre es ${name} (${email}). Mi mensaje: ${message}`;
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const link = document.createElement('a');
      link.href = `https://wa.me/5541987940065?text=${encodedMessage}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-green selection:text-white">
      {/* Header & Ticker Container */}
      <div className="fixed top-0 w-full z-50">
        {/* Navigation */}
        <nav className={`w-full transition-all duration-300 ${isScrolled || currentView !== 'home' ? 'bg-white shadow-lg py-2 md:py-3' : 'bg-brand-blue py-3 md:py-5'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-10 md:h-16">
              <button onClick={() => navigateTo('home')} className="flex items-center gap-2 md:gap-4 group shrink-0">
                <img src={LOGO_URL} alt="KR Cambios Logo" className={`transition-all duration-300 ${isScrolled || currentView !== 'home' ? 'w-10 h-10 md:w-16 md:h-16' : 'w-12 h-12 md:w-24 md:h-24'} object-contain group-hover:rotate-6`} />
                <div className="flex flex-col items-start">
                  <span className={`font-black text-xs md:text-2xl tracking-tighter leading-none ${isScrolled || currentView !== 'home' ? 'text-brand-blue' : 'text-white'}`}>
                    KR CAMBIOS
                  </span>
                  <span className={`text-[5px] md:text-[8px] font-black tracking-[0.1em] md:tracking-[0.3em] mt-0.5 md:mt-1 leading-none ${isScrolled || currentView !== 'home' ? 'text-brand-green' : 'text-brand-green'} uppercase`}>
                    Rapidez y Confianza
                  </span>
                </div>
              </button>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => navigateTo('home')} className={`font-medium hover:text-brand-green transition-colors ${isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300'}`}>Inicio</button>
                <button onClick={() => navigateTo('daily-report')} className={`font-medium hover:text-brand-green transition-colors ${currentView === 'daily-report' ? 'text-brand-green' : (isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300')}`}>Tasas del día</button>
                <button onClick={() => navigateTo('brazil-rates')} className={`font-medium hover:text-brand-green transition-colors ${currentView === 'brazil-rates' ? 'text-brand-green' : (isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300')}`}>Tasas Brasil</button>
                <button onClick={() => navigateTo('fast-conversions')} className={`font-medium hover:text-brand-green transition-colors ${currentView === 'fast-conversions' ? 'text-brand-green' : (isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300')}`}>Tablas Rápidas</button>
                <button onClick={() => navigateTo('si-mando')} className={`font-medium hover:text-brand-green transition-colors ${currentView === 'si-mando' ? 'text-brand-green' : (isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300')}`}>Si mando, ¿cuánto llega?</button>
                <button onClick={() => navigateTo('brl-to-usd')} className={`font-medium hover:text-brand-green transition-colors ${currentView === 'brl-to-usd' ? 'text-brand-green' : (isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300')}`}>Calculadora Real a Dólar</button>
                <button onClick={() => navigateTo('bcv-calculator')} className={`font-medium hover:text-brand-green transition-colors ${currentView === 'bcv-calculator' ? 'text-brand-green' : (isScrolled || currentView !== 'home' ? 'text-slate-600' : 'text-slate-300')}`}>Calculadora BCV</button>
                <button onClick={() => navigateTo('scams')} className={`font-medium flex items-center gap-1 hover:text-red-500 transition-colors ${isScrolled || currentView !== 'home' ? (currentView === 'scams' ? 'text-red-600' : 'text-slate-600') : 'text-slate-300'}`}>
                  <ShieldAlert size={18} /> Directorio Estafas
                </button>
                <button onClick={() => navigateTo('admin')} className="bg-brand-green text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-green-hover transition-all shadow-lg shadow-brand-green/20">
                  {isAdmin ? 'Panel Admin' : 'Acceso Admin'}
                </button>
                <a href="https://wa.me/5541987940065" target="_blank" rel="noopener noreferrer" className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2.5 rounded-full font-semibold transition-colors">
                  Contactar por WhatsApp
                </a>
              </div>

              {/* Mobile Menu Button */}
              <button 
                className={`md:hidden p-2 ${isScrolled || currentView !== 'home' ? 'text-brand-blue' : 'text-white'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Ticker Section */}
        <div className="bg-brand-blue-light border-b border-slate-800 h-[32px] md:h-[44px] flex items-center overflow-hidden">
          <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
            {/* Duplicated for seamless loop */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-6 md:space-x-10 pr-6 md:pr-10">
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/ve.png" alt="VES" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">BCV</span> 
                  <span className={`transition-all ${isUpdating ? 'text-brand-green scale-110' : ''}`}>Bs. {bcvRate}</span>
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/ve.png" alt="VES" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">PARALELO</span> 
                  <span className={`transition-all ${isUpdating ? 'text-brand-green scale-110' : ''}`}>Bs. {parallelRate}</span>
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img 
                    src="https://purecatamphetamine.github.io/country-flag-icons/3x2/EU.svg" 
                    alt="EUR" 
                    className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" 
                    crossOrigin="anonymous" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-bold text-slate-400">EURO BCV</span> 
                  <span className={`transition-all ${isUpdating ? 'text-brand-green scale-110' : ''}`}>Bs. {indicatorRates.euroBcv}</span>
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/ve.png" alt="VES" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">VES</span> 
                  <span className="text-[9px] text-slate-500">C:</span> {rates.VES?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} 
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.VES?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/us.png" alt="USD" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">USD</span> 
                  <span className="text-[9px] text-slate-500">C:</span> R$ {rates.USD?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.USD?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} $
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img 
                    src="https://purecatamphetamine.github.io/country-flag-icons/3x2/EU.svg" 
                    alt="EUR" 
                    className="w-4 h-3 md:w-5 md:h-3.5 object-cover rounded shadow-sm" 
                    crossOrigin="anonymous" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-black text-slate-400">EUR</span> 
                  <span className="text-[9px] text-slate-500">C:</span> R$ {rates.EUR?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.EUR?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/co.png" alt="COP" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">COP</span> 
                  <span className="text-[9px] text-slate-500">C:</span> R$ {rates.COP?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 4 })}
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.COP?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 0 })} $
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/pe.png" alt="PEN" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">PEN</span> 
                  <span className="text-[9px] text-slate-500">C:</span> R$ {rates.PEN?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.PEN?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} S/
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/cl.png" alt="CLP" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">CLP</span> 
                  <span className="text-[9px] text-slate-500">C:</span> R$ {rates.CLP?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 4 })}
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.CLP?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 0 })} $
                </div>
                <div className="flex items-center gap-2 text-white text-[10px] md:text-sm">
                  <img src="https://flagcdn.com/w20/ar.png" alt="ARS" className="w-3.5 h-2.5 md:w-4 md:h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                  <span className="font-bold text-slate-400">ARS</span> 
                  <span className="text-[9px] text-slate-500">C:</span> R$ {rates.ARS?.buy?.toLocaleString('de-DE', { minimumFractionDigits: 4 })}
                  <span className="text-[9px] text-slate-500 ml-1">V:</span> {rates.ARS?.sell?.toLocaleString('de-DE', { minimumFractionDigits: 0 })} $
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white pt-28 pb-8 px-6 overflow-y-auto">
            <div className="flex flex-col space-y-4 text-center">
              <button onClick={() => navigateTo('home')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50">Inicio</button>
              <button onClick={() => navigateTo('daily-report')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50">Tasas del día</button>
              <button onClick={() => navigateTo('brazil-rates')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50">Tasas Brasil</button>
              <button onClick={() => navigateTo('fast-conversions')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50 flex items-center justify-center gap-2">
                <Zap size={18} className="text-brand-green" /> Tablas Rápidas
              </button>
              <button onClick={() => navigateTo('si-mando')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50">Si mando, ¿cuánto llega?</button>
              <button onClick={() => navigateTo('brl-to-usd')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50">Calculadora Real a Dólar</button>
              <button onClick={() => navigateTo('bcv-calculator')} className="py-2 text-lg font-bold text-brand-blue border-b border-slate-50">Calculadora BCV</button>
              <button onClick={() => navigateTo('scams')} className="py-2 text-lg font-bold text-red-600 border-b border-slate-50 flex items-center justify-center gap-2">
                <ShieldAlert size={20} /> Directorio Estafas
              </button>
              
              <div className="pt-4 space-y-4">
                <button 
                  onClick={() => navigateTo('admin')} 
                  className="w-full bg-slate-100 text-brand-blue py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
                >
                  {isAdmin ? 'Panel Administrador' : 'Acceso Personal'}
                </button>
                <a href="https://wa.me/5541987940065" target="_blank" rel="noopener noreferrer" className="bg-brand-green text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest inline-block w-full shadow-lg shadow-brand-green/20">
                  WhatsApp Directo
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with Routing */}
        <Routes>
          {/* Home Route */}
          <Route path="/" element={
            <>
              {/* Hero Section */}
              <section id="inicio" className="relative pt-44 pb-16 md:pt-56 md:pb-20 lg:pt-64 lg:pb-32 bg-brand-blue overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                      <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-light border border-slate-700 text-brand-green font-medium text-sm">
                          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                          Tasas actualizadas en tiempo real
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white font-medium text-sm backdrop-blur-sm">
                          <img src="https://flagcdn.com/w20/ve.png" alt="VE" className="w-4 h-3 object-cover rounded-sm" referrerPolicy="no-referrer" />
                          <span className="text-slate-300">Tasa BCV:</span>
                          <span className="font-bold">Bs. {bcvRate}</span>
                          <button 
                            onClick={() => fetchRates(true)} 
                            disabled={isUpdating}
                            className={`ml-1 p-1 hover:bg-white/10 rounded-full transition-all ${isUpdating ? 'animate-spin opacity-50' : 'hover:scale-110 active:scale-95'}`}
                            title="Refrescar tasas"
                          >
                            <Clock size={14} className={isUpdating ? 'text-brand-green' : 'text-slate-400'} />
                          </button>
                        </div>
                      </div>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                        Envío de Remesas <span className="text-brand-green">rápido, seguro</span> y al mejor precio
                      </h1>
                      <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                        Tu aliado en Brasil. Trabajamos con envíos de Remesas a más de 4 años, operando con transparencia y agilidad.
                      </p>
                      <p className="text-brand-green font-black mb-4 uppercase tracking-[0.2em] text-sm">Usa nuestras calculadoras en vivo</p>
                      <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                        <button onClick={() => navigateTo('si-mando')} className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20 hover:-translate-y-0.5">
                          Si mando, ¿cuánto llega?
                        </button>
                        <button onClick={() => navigateTo('brl-to-usd')} className="bg-brand-blue-light hover:bg-slate-700 text-white border border-slate-700 px-5 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                          ¿Cuántos Reais mando para que lleguen tantos Dólares?
                        </button>
                        <button onClick={() => navigateTo('daily-report')} className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 backdrop-blur-sm hover:-translate-y-0.5">
                          Tasas del día <TrendingUp size={18} />
                        </button>
                        <button onClick={() => navigateTo('fast-conversions')} className="bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/30 px-5 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 backdrop-blur-sm hover:-translate-y-0.5">
                          Tablas Rápidas <Zap size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="lg:ml-auto w-full">
                      <Calculator rates={rates} />
                    </div>
                  </div>
                </div>
              </section>

              {/* About Section */}
              <section id="nosotros" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      <img 
                        src="https://images.unsplash.com/photo-1580519542036-c47de6196ba5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                        alt="Envío de Remesas KR Cambios" 
                        className="rounded-3xl shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-6">
                        Sobre Nosotros
                      </h2>
                      <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                        En KR Cambios, trabajamos con envíos de Remesas a más de 4 años, facilitando las operaciones financieras de residentes y turistas. Nuestra misión es ofrecer un servicio que destaque por su <strong className="text-brand-blue">transparencia, rapidez y estricto cumplimiento legal</strong>.
                      </p>
                      <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        Entendemos que detrás de cada transacción hay un viaje, un negocio o un sueño. Por eso, nuestro equipo de profesionales está capacitado para brindarte asesoría personalizada y garantizar que obtengas siempre las mejores condiciones del mercado.
                      </p>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="border-l-4 border-brand-green pl-4">
                          <div className="text-3xl font-bold text-brand-blue mb-1">+1000</div>
                          <div className="text-slate-500 text-sm">Clientes satisfechos</div>
                        </div>
                        <div className="border-l-4 border-brand-green pl-4">
                          <div className="text-3xl font-bold text-brand-blue mb-1">100%</div>
                          <div className="text-slate-500 text-sm">Regulados y seguros</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Services />
              <Features />

              {/* Testimonials */}
              <section className="py-20 bg-brand-blue text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
                    <p className="text-slate-300 text-lg">La confianza se construye con hechos y buenas experiencias.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      { name: "Carlos M.", text: "Excelente atención y la mejor tasa que encontré para comprar dólares. Muy recomendado." },
                      { name: "Ana P.", text: "Hice una transferencia internacional para mi empresa y todo fue muy rápido y transparente. Sin costos ocultos." },
                      { name: "Roberto S.", text: "Cotizo siempre por WhatsApp antes de ir. Tienen todo listo cuando llego, no pierdo nada de tiempo." }
                    ].map((testimonial, i) => (
                      <div key={i} className="bg-brand-blue-light p-8 rounded-2xl border border-slate-700">
                        <div className="flex text-brand-green mb-4">
                          {[...Array(5)].map((_, j) => <Star key={j} size={20} fill="currentColor" />)}
                        </div>
                        <p className="text-slate-300 mb-6 italic">"{testimonial.text}"</p>
                        <div className="font-semibold">{testimonial.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <FAQ />

              {/* Contact Section */}
              <section id="contacto" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid lg:grid-cols-2 gap-16">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-6">
                        Ponte en contacto
                      </h2>
                      <p className="text-lg text-slate-600 mb-10">
                        ¿Tienes dudas o quieres asegurar tu tasa de cambio? Escríbenos o visítanos en nuestra sucursal.
                      </p>
                      
                      <div className="space-y-8">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="text-brand-green" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-brand-blue text-lg">Visítanos</h4>
                            <p className="text-slate-600 mt-1">travessa Porto 113 bairro Nações,<br/>Fazenda Rio Grande - PR</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Phone className="text-brand-green" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-brand-blue text-lg">Llámanos o WhatsApp</h4>
                            <p className="text-slate-600 mt-1">+55 41 98794-0065</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Mail className="text-brand-green" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-brand-blue text-lg">Email</h4>
                            <p className="text-slate-600 mt-1">Krcambios1@gmail.com</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                      <h3 className="text-2xl font-bold text-brand-blue mb-6">Envíanos un mensaje</h3>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                          <input 
                            type="text" 
                            required
                            value={contactForm.name || ''}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all" 
                            placeholder="Tu nombre" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                            type="email" 
                            required
                            value={contactForm.email || ''}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all" 
                            placeholder="tu@email.com" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
                          <textarea 
                            rows={4} 
                            required
                            value={contactForm.message || ''}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all resize-none" 
                            placeholder="¿En qué podemos ayudarte?"
                          ></textarea>
                        </div>
                        <button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-semibold py-4 rounded-xl transition-colors">
                          Enviar Mensaje
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>
            </>
          } />

          <Route path="/tasas-del-dia" element={
            <div className="pt-32 md:pt-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                  onClick={() => navigate('/')}
                  className="mb-4 flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
                >
                  <Clock size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Volver al Inicio
                </button>
              </div>
              <DailyReport 
                bcvRate={bcvRate} 
                parallelRate={parallelRate} 
                promedioRate={promedioRate}
                indicatorRates={indicatorRates}
                rates={rates} 
                lastUpdated={lastUpdated}
                fetchRates={fetchRates}
                isUpdating={isUpdating}
                onViewChange={navigateTo}
              />
            </div>
          } />

          <Route path="/tasas-brasil" element={
            <div className="pt-44 md:pt-48 pb-10 bg-slate-50 min-h-[80vh]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <BrazilRates rates={rates} lastUpdated={lastUpdated} />
              </div>
            </div>
          } />

          <Route path="/si-mando" element={
            <div className="pt-44 md:pt-48 pb-10 bg-slate-50 min-h-[80vh]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                  onClick={() => navigate('/')}
                  className="mb-8 flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Volver al Inicio
                </button>
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div className="order-2 lg:order-1">
                    <RemittanceCalculator 
                      bcvRate={bcvRate} 
                      rates={rates}
                      onCalculate={handleRemittanceCalculate}
                    />
                  </div>
                  <div className="order-1 lg:order-2">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-6">
                      ¿Cuánto recibe mi familiar en Venezuela?
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      Nuestra calculadora especializada <strong>"Si mando, ¿cuánto llega?"</strong> te permite saber exactamente cuántos Bolívares llegarán al destino final. 
                    </p>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-green shrink-0">
                          <span className="font-black text-xl">1</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-blue text-lg">Ingresa tus Reais</h4>
                          <p className="text-slate-500">Coloca el monto que tienes en Brasil para enviar.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-green shrink-0">
                          <span className="font-black text-xl">2</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-blue text-lg">Conversión a Dólares</h4>
                          <p className="text-slate-500">Calculamos el equivalente en dólares con nuestra tasa preferencial.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-green shrink-0">
                          <span className="font-black text-xl">3</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-blue text-lg">Resultado en Bolívares</h4>
                          <p className="text-slate-500">Obtén el monto final en VES usando la tasa oficial del BCV.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-12">
                  <RemittanceShareCard 
                    reais={remittanceData.reais}
                    ves={remittanceData.ves}
                    usd={remittanceData.usd}
                    brlVesRate={rates.VES?.sell || 0}
                    bcvRate={bcvRate}
                  />
                </div>
              </div>
            </div>
          } />

          <Route path="/calculadora-dolar" element={
            <div className="pt-44 md:pt-48 pb-10 bg-slate-50 min-h-[80vh]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                  onClick={() => navigate('/')}
                  className="mb-8 flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Volver al Inicio
                </button>
                <BRLtoUSDCalculator bcvRate={bcvRate} rates={rates} />
                <ManualCalculator />
              </div>
            </div>
          } />

          <Route path="/calculadora-bcv" element={
            <div className="pt-36 md:pt-40 pb-10 bg-slate-50 min-h-[80vh]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                  onClick={() => navigate('/')}
                  className="mb-8 flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Volver al Inicio
                </button>
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-6">
                      Calculadora de Tasa Oficial BCV
                    </h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      Utiliza nuestra herramienta de conversión rápida basada en la tasa oficial del Banco Central de Venezuela. Ideal para calcular tus envíos de remesas con total precisión y transparencia.
                    </p>
                    <ul className="space-y-4">
                      {[
                        "Conversión instantánea USD a VES",
                        "Basado en la tasa oficial del día",
                        "Sin comisiones ocultas",
                        "Fácil de usar desde cualquier dispositivo"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                          <div className="w-6 h-6 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
                            <Star size={14} fill="currentColor" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-full">
                    <BCVCalculator rate={bcvRate} />
                  </div>
                </div>
                <div className="mt-12">
                  <BCVShareCard rate={bcvRate} />
                </div>
              </div>
            </div>
          } />

          <Route path="/conversiones-rapidas" element={
            <FastConversionTable 
              rates={rates} 
              bcvRate={parseFloat(bcvRate.replace(',', '.')) || 36.29} 
            />
          } />

          <Route path="/directorio-estafas" element={
            <div className="pt-36 md:pt-44 pb-20 bg-slate-50 min-h-[80vh]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                  onClick={() => navigate('/')}
                  className="mb-8 flex items-center gap-2 text-slate-400 hover:text-brand-blue font-black text-[10px] uppercase tracking-widest transition-colors group"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Volver al Inicio
                </button>
                <ScamDirectory />
              </div>
            </div>
          } />

          <Route path="/admin" element={
            <div className="pt-44 md:pt-48 bg-slate-50 min-h-[80vh]">
              {!user ? (
                <Login />
              ) : !isAdmin ? (
                <div className="min-h-[60vh] flex items-center justify-center p-4">
                  <div className="bg-white p-12 rounded-[40px] text-center max-w-md shadow-2xl border border-slate-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-brand-blue mb-4">Acceso Denegado</h2>
                    <p className="text-slate-500 mb-8 font-medium">No tienes permisos de administrador. Tu cuenta ({user.email}) no está autorizada.</p>
                    <button 
                      onClick={() => { auth.signOut(); navigateTo('home'); }}
                      className="w-full bg-brand-blue text-white font-black py-4 rounded-2xl shadow-lg"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <AdminPanel onNavigate={navigateTo} />
              )}
            </div>
          } />
        </Routes>

        {/* Footer */}
        <footer className="bg-brand-blue pt-16 pb-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <img src={LOGO_URL} alt="KR Cambios Logo" className="w-24 h-24 object-contain" />
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-xl text-white leading-none">
                      KR CAMBIOS
                    </span>
                    <span className="text-[8px] font-bold tracking-[0.2em] mt-0.5 leading-none text-brand-green">
                      RAPIDEZ Y CONFIANZA
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 max-w-sm">
                  Tu aliado en Brasil. Envío de Remesas y transferencias internacionales con la mayor seguridad y rapidez.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
                <ul className="space-y-2">
                  <li><button onClick={() => navigateTo('home')} className="text-slate-400 hover:text-brand-green transition-colors">Inicio</button></li>
                  <li><button onClick={() => navigateTo('daily-report')} className="text-slate-400 hover:text-brand-green transition-colors">Tasas del día</button></li>
                  <li><button onClick={() => navigateTo('brazil-rates')} className="text-slate-400 hover:text-brand-green transition-colors">Tasas Brasil</button></li>
                  <li><button onClick={() => navigateTo('si-mando')} className="text-slate-400 hover:text-brand-green transition-colors">Si mando, ¿cuánto llega?</button></li>
                  <li><button onClick={() => navigateTo('brl-to-usd')} className="text-slate-400 hover:text-brand-green transition-colors">Calculadora Real a Dólar</button></li>
                  <li><button onClick={() => navigateTo('bcv-calculator')} className="text-slate-400 hover:text-brand-green transition-colors">Calculadora BCV</button></li>
                  <li><button onClick={() => navigateTo('scams')} className="text-slate-400 hover:text-brand-green transition-colors">Directorio Estafas</button></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-brand-green transition-colors">Términos y Condiciones</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-brand-green transition-colors">Política de Privacidad</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-brand-green transition-colors">Prevención de Lavado</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm">
                © {new Date().getFullYear()} KR Cambios. Todos los derechos reservados. Institución autorizada por el Banco Central do Brasil.
              </p>
              <div className="text-slate-500 text-sm flex items-center gap-4">
                <span>Diseñado para conversión y confianza.</span>
                <button onClick={() => navigateTo('admin')} className="text-slate-600 hover:text-brand-green transition-colors underline decoration-dotted">Acceso Admin</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}
