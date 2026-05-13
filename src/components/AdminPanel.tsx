import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  MessageSquare, 
  LogOut, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Clock,
  User,
  ChevronRight,
  ShieldAlert,
  UserX
} from 'lucide-react';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { EXCHANGE_RATES } from '../constants';

export default function AdminPanel({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rates' | 'messages' | 'scams'>('rates');
  const [rates, setRates] = useState<any>(EXCHANGE_RATES);
  const [bcvRateInput, setBcvRateInput] = useState<string>('36,45');
  const [parallelRateInput, setParallelRateInput] = useState<string>('45,20');
  const [indicatorRatesInput, setIndicatorRatesInput] = useState<any>({
    euroBcv: '42,50'
  });
  const [localInputs, setLocalInputs] = useState<any>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [scamReports, setScamReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    // Load current rates from Firestore
    const loadRates = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentRates = data.rates;
          setRates(currentRates);
          setBcvRateInput(data.bcvRate || '36,45');
          setParallelRateInput(data.parallelRate || '45,20');
          setAutoSync(data.autoSync !== false); // Default to true if not present
          
          if (data.indicatorRates) {
            setIndicatorRatesInput({
               euroBcv: data.indicatorRates.euroBcv || '42,50'
            });
          }
          
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt.toDate());
          }
          
          // Initialize local inputs for better editing experience
          const inputs: any = {};
          Object.entries(currentRates).forEach(([key, data]: [string, any]) => {
            inputs[`${key}_buy`] = data.buy.toString();
            inputs[`${key}_sell`] = data.sell.toString();
          });
          setLocalInputs(inputs);
        } else {
          // Initialize if doesn't exist
          await setDoc(docRef, {
            rates: EXCHANGE_RATES,
            updatedAt: Timestamp.now(),
            updatedBy: auth.currentUser?.uid
          });
        }
      } catch (error) {
        console.error("Error loading rates:", error);
      }
    };

    // Listen to messages
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    const unsubscribeScams = onSnapshot(query(collection(db, 'scam_reports'), orderBy('date', 'desc')), (snapshot) => {
      const scams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScamReports(scams);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scam_reports');
    });

    loadRates();
    return () => {
      unsubscribe();
      unsubscribeScams();
    };
  }, []);

  const handleRateChange = (currency: string, field: 'buy' | 'sell', value: string) => {
    // Update local string state immediately to allow free typing/erasing
    setLocalInputs((prev: any) => ({ ...prev, [`${currency}_${field}`]: value }));

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) return;

    setRates((prev: any) => {
      return {
        ...prev,
        [currency]: {
          ...prev[currency],
          [field]: numValue
        }
      };
    });
  };

  const syncWithApi = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/rates?t=${Date.now()}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const oficial = data.find(d => ['oficial', 'bcv', 'cencoex'].includes(d.id?.toLowerCase()));
        const paralelo = data.find(d => ['paralelo', 'enparalelovzla', 'promedio'].includes(d.id?.toLowerCase()));
        const euroBcv = data.find(d => d.id?.toLowerCase().includes('euro') && (d.title?.toLowerCase().includes('bcv') || d.id?.toLowerCase().includes('bcv')));

        let newBcv = bcvRateInput;
        let newParalelo = parallelRateInput;

        if (oficial && oficial.promedio) {
          newBcv = oficial.promedio.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          setBcvRateInput(newBcv);
        }
        if (paralelo && paralelo.promedio) {
          newParalelo = paralelo.promedio.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          setParallelRateInput(newParalelo);
        }

        setIndicatorRatesInput({
          euroBcv: euroBcv?.promedio?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '42,50',
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error syncing with API:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveRates = async () => {
    setSaving(true);
    try {
      // Calculate promedioRate
      const bcvNum = parseFloat(bcvRateInput.replace(',', '.'));
      const parNum = parseFloat(parallelRateInput.replace(',', '.'));
      const avg = (bcvNum + parNum) / 2;
      const promedioRate = avg.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      await setDoc(doc(db, 'settings', 'global'), {
        rates,
        bcvRate: bcvRateInput,
        parallelRate: parallelRateInput,
        promedioRate,
        indicatorRates: indicatorRatesInput,
        autoSync,
        updatedAt: Timestamp.now(),
        updatedBy: auth.currentUser?.uid
      });
      setLastUpdated(new Date());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'messages', id), {
        status: 'read'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `messages/${id}`);
    }
  };

  const verifyReport = async (id: string) => {
    try {
      await updateDoc(doc(db, 'scam_reports', id), {
        status: 'verified'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `scam_reports/${id}`);
    }
  };

  const deleteReport = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) return;
    try {
      await deleteDoc(doc(db, 'scam_reports', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `scam_reports/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Header - non-sticky to avoid overlap */}
      <div className="bg-brand-blue text-white py-6 px-4 md:px-8 border-b border-brand-blue-light shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-green p-3 rounded-2xl shadow-lg shadow-brand-green/20">
              <Settings size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl md:text-2xl leading-none">Panel de Control</h1>
              <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.2em] mt-1 font-bold">Gestión KR Cambios</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-white leading-none mb-1">{auth.currentUser?.email}</span>
              <span className="text-[9px] text-brand-green font-black uppercase tracking-widest leading-none">Administrador</span>
            </div>
            <button 
              onClick={() => { auth.signOut(); navigate('/'); }}
              className="p-2 md:px-4 md:py-2 bg-white/10 hover:bg-red-500 transition-all rounded-xl text-slate-300 hover:text-white flex items-center gap-2"
            >
              <LogOut size={18} />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">Salir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Tabs - Better mobile styling to avoid "bagunzado" look */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <div className="flex gap-2 mb-6 md:mb-10 bg-slate-200/50 p-1.5 rounded-[24px] border border-slate-200 w-max">
            <button 
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'rates' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <RefreshCw size={16} md:size={18} />
              Tasas del Día
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'messages' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <MessageSquare size={16} md:size={18} />
              Mensajes
              {messages.filter(m => m.status === 'new').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-brand-green text-white text-[9px] md:text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">
                  {messages.filter(m => m.status === 'new').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('scams')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'scams' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ShieldAlert size={16} md:size={18} />
              Estafas
              {scamReports.filter(s => s.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[9px] md:text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">
                  {scamReports.filter(s => s.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'rates' ? (
          <>
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-slate-50/50">
                  <div>
                    <h2 className="font-black text-brand-blue flex items-center gap-2 text-sm md:text-base">
                      <RefreshCw size={18} md:size={20} className="text-brand-green" />
                      Tasas de Cambio
                    </h2>
                    {lastUpdated && (
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase block mt-0.5">
                        Último guardado: {lastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex sm:items-center gap-2">
                    <button 
                      onClick={syncWithApi}
                      disabled={saving}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-[11px] md:text-sm transition-all bg-white border-2 border-slate-200 text-brand-blue hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw className={saving ? "animate-spin" : ""} size={14} md:size={18} />
                      Sincronizar
                    </button>
                    <button 
                      onClick={saveRates}
                      disabled={saving}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-[11px] md:text-sm transition-all shadow-lg ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-brand-green hover:bg-brand-green-hover text-white shadow-brand-green/20'}`}
                    >
                      {saving ? <RefreshCw className="animate-spin" size={14} md:size={18} /> : saveSuccess ? <CheckCircle2 size={14} md:size={18} /> : <Save size={14} md:size={18} />}
                      {saveSuccess ? '¡Listo!' : 'Guardar'}
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Global Rates (BCV & Parallel) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h4 className="font-black text-brand-blue leading-none">Sincronización Automática</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Conecta con los APIs de Venezuela en tiempo real</p>
                    </div>
                    <button 
                      onClick={() => setAutoSync(!autoSync)}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${autoSync ? 'bg-brand-green/10 text-brand-green' : 'bg-slate-100 text-slate-500'}`}
                    >
                      <RefreshCw size={18} className={autoSync ? 'animate-spin-slow' : ''} />
                      {autoSync ? 'MODO AUTOMÁTICO ACTIVO' : 'MODO MANUAL (CONGELADO)'}
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-8 pb-8 border-b border-slate-100">
                    <div className="bg-brand-blue/5 p-5 rounded-2xl border border-brand-blue/10">
                      <label className="block text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2 ml-1">Tasa BCV (Oficial)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Bs.</span>
                        <input 
                          type="text"
                          value={bcvRateInput || ''}
                          onChange={(e) => setBcvRateInput(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-brand-green outline-none font-black text-brand-blue text-sm"
                          placeholder="36,45"
                        />
                      </div>
                    </div>
                    <div className="bg-brand-green/5 p-5 rounded-2xl border border-brand-green/10">
                      <label className="block text-[10px] font-black text-brand-green uppercase tracking-widest mb-2 ml-1">Tasa Paralela (Reporte)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Bs.</span>
                        <input 
                          type="text"
                          value={parallelRateInput || ''}
                          onChange={(e) => setParallelRateInput(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-brand-green outline-none font-black text-brand-blue text-sm"
                          placeholder="45,20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Indicator Rates */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8 pb-8 border-b border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-md mx-auto w-full">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Euro BCV</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Bs.</span>
                        <input 
                          type="text"
                          value={indicatorRatesInput.euroBcv || ''}
                          onChange={(e) => setIndicatorRatesInput({...indicatorRatesInput, euroBcv: e.target.value})}
                          className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-brand-green outline-none font-bold text-brand-blue text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(rates).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-brand-green/30 transition-colors group">
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={key === 'EUR' ? 'https://purecatamphetamine.github.io/country-flag-icons/3x2/EU.svg' : `https://flagcdn.com/w40/${data.flag?.toLowerCase()}.png?v=5`} 
                            alt={key} 
                            className="w-8 h-5 object-cover rounded shadow-sm"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <div>
                            <h4 className="font-black text-brand-blue leading-none">{key}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{data.name}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                              {key === 'VES' ? `Compra (${data.symbol}/R$)` : 'Compra (R$/Moneda)'}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                {key === 'VES' ? data.symbol : 'R$'}
                              </span>
                              <input 
                                type="number"
                                step="0.0001"
                                value={localInputs[`${key}_buy`] || ''}
                                onChange={(e) => handleRateChange(key, 'buy', e.target.value)}
                                className="w-full pl-10 pr-2 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-brand-green outline-none font-black text-brand-blue transition-all text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                              {`Venta (${data.symbol}/R$)`}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                {data.symbol}
                              </span>
                              <input 
                                type="number"
                                step="0.0001"
                                value={localInputs[`${key}_sell`] || ''}
                                onChange={(e) => handleRateChange(key, 'sell', e.target.value)}
                                className="w-full pl-10 pr-2 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-brand-green outline-none font-black text-brand-blue transition-all text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
                
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex gap-3">
                <Clock className="text-brand-green shrink-0" size={20} />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Los cambios realizados aquí se reflejarán <strong>instantáneamente</strong> en todas las calculadoras y en el ticket rodante del sitio web para todos los usuarios.
                </p>
              </div>
            </div>
          </>
        ) : activeTab === 'scams' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-brand-blue">Reportes de Estafas</h2>
                <p className="text-slate-500 text-sm">Gestiona y verifica los números reportados por la comunidad.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">
                  {scamReports.filter(s => s.status === 'pending').length} Pendientes
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">
                  {scamReports.filter(s => s.status === 'verified').length} Verificados
                </span>
              </div>
            </div>

            {scamReports.length === 0 ? (
              <div className="bg-white p-12 rounded-[30px] text-center border border-slate-100">
                <ShieldAlert size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay reportes registrados</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scamReports.map((report) => (
                  <div key={report.id} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${report.status === 'verified' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          <ShieldAlert size={24} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-brand-blue text-lg truncate">{report.number}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase truncate">{report.name || 'Sin nombre'}</p>
                        </div>
                      </div>
                      <div className="sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          report.status === 'verified' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {report.status === 'verified' ? 'Verificado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                      {report.reason}
                    </p>
                    <div className="flex justify-end gap-3">
                      {report.status === 'pending' && (
                        <button 
                          onClick={() => verifyReport(report.id)}
                          className="flex items-center gap-2 text-[10px] font-black text-brand-green uppercase tracking-widest hover:bg-brand-green/5 px-3 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={14} />
                          Verificar
                        </button>
                      )}
                      <button 
                        onClick={() => deleteReport(report.id)}
                        className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                      >
                        <UserX size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw size={40} className="animate-spin mb-4" />
                <p className="font-bold">Cargando mensajes...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare size={40} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-brand-blue mb-2">No hay mensajes aún</h3>
                <p className="text-slate-500">Cuando los clientes te contacten, aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 transition-all hover:shadow-md ${msg.status === 'new' ? 'border-brand-green' : 'border-slate-200 opacity-75'}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-brand-blue shrink-0">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-brand-blue leading-none truncate">{msg.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mt-1 truncate">{msg.email || 'Sin email'}</p>
                        </div>
                      </div>
                      <div className="sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {msg.createdAt?.toDate().toLocaleDateString()}
                        </p>
                        {msg.status === 'new' && (
                          <span className="inline-block bg-brand-green/10 text-brand-green text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            Nuevo
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                      {msg.message}
                    </p>
                    <div className="flex justify-end gap-3">
                      {msg.status === 'new' && (
                        <button 
                          onClick={() => markAsRead(msg.id)}
                          className="flex items-center gap-2 text-[10px] font-black text-brand-green uppercase tracking-widest hover:bg-brand-green/5 px-3 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={14} />
                          Marcar como leído
                        </button>
                      )}
                      <a 
                        href={`https://wa.me/${msg.phone || '5541987940065'}?text=Hola ${msg.name}, recibimos tu mensaje en KR Cambios...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest hover:bg-brand-blue/5 px-3 py-2 rounded-lg transition-colors"
                      >
                        Responder por WhatsApp
                        <ChevronRight size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
