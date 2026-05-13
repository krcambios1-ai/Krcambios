import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, AlertTriangle, CheckCircle, UserX, Phone, MessageSquare, Plus } from 'lucide-react';
import { ScamReport, subscribeToReports, reportScammer } from '../services/scamService';
import { auth } from '../firebase';

export default function ScamDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reports, setReports] = useState<ScamReport[]>([]);
  
  const [newReport, setNewReport] = useState({
    number: '',
    name: '',
    reason: ''
  });

  useEffect(() => {
    const unsubscribeReports = subscribeToReports((data) => setReports(data));
    
    return () => {
      unsubscribeReports();
    };
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await reportScammer(newReport);
      setShowReportForm(false);
      setNewReport({ number: '', name: '', reason: '' });
      alert('Reporte enviado con éxito. Será revisado por nuestro equipo.');
    } catch (error) {
      console.error("Error reporting:", error);
      alert('Error al enviar el reporte.');
    }
  };

  const filteredReports = reports.filter(r => 
    r.number.includes(searchTerm) || (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section id="directorio-estafas" className="py-8 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-red-600 font-medium text-sm mb-6">
            <ShieldAlert size={16} />
            Seguridad Primero
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
            Directorio de Seguridad
          </h2>
          <p className="text-lg text-slate-600">
            Consulta números reportados por actividades sospechosas o reporta un nuevo caso para proteger a la comunidad.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search and Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-brand-blue mb-4 flex items-center gap-2">
                <Search size={20} className="text-brand-green" />
                Consultar Número
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej: +55 41 9..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                />
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Ingresa el número completo con código de país.
              </p>
            </div>

            <div className="bg-brand-blue p-6 rounded-2xl shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4">¿Fuiste contactado?</h3>
              <p className="text-slate-300 text-sm mb-6">
                Si recibiste una oferta sospechosa o alguien se hace pasar por nosotros, repórtalo de inmediato.
              </p>
              <button 
                onClick={() => setShowReportForm(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Reportar Número
              </button>
            </div>
          </div>

          {/* Reports List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-bottom border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-brand-blue">Reportes Recientes</h3>
                <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded-full">
                  {filteredReports.length} resultados
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            report.status === 'verified' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            <UserX size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-brand-blue text-lg">{report.number}</h4>
                              {report.status === 'verified' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  <AlertTriangle size={10} /> Verificado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 font-medium">{report.name || 'Nombre no proporcionado'}</p>
                            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                              {report.reason}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-xs text-slate-400 font-medium">
                            {report.date?.toDate ? report.date.toDate().toLocaleDateString() : report.date}
                          </span>
                          <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-brand-blue transition-colors">
                              <MessageSquare size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-brand-green transition-colors">
                              <CheckCircle size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Search size={32} />
                    </div>
                    <h4 className="text-lg font-semibold text-brand-blue">No se encontraron reportes</h4>
                    <p className="text-slate-500">Intenta con otro número o criterio de búsqueda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal Placeholder */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-brand-blue">Reportar Estafador</h3>
              <button onClick={() => setShowReportForm(false)} className="text-slate-400 hover:text-brand-blue">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleReportSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Teléfono</label>
                <input 
                  type="text" 
                  required
                  value={newReport.number}
                  onChange={(e) => setNewReport({...newReport, number: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none" 
                  placeholder="+55..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre o Alias (Opcional)</label>
                <input 
                  type="text" 
                  value={newReport.name}
                  onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none" 
                  placeholder="Ej: Juan Estafador" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo del Reporte</label>
                <textarea 
                  rows={3} 
                  required
                  minLength={10}
                  value={newReport.reason}
                  onChange={(e) => setNewReport({...newReport, reason: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none resize-none" 
                  placeholder="Describe lo sucedido (mínimo 10 caracteres)..."
                ></textarea>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <p className="text-xs text-amber-700">
                  Tu reporte será revisado por nuestro equipo de seguridad antes de ser publicado. Por favor, sé lo más preciso posible.
                </p>
              </div>
              <button type="submit" className="w-full bg-brand-blue text-white font-bold py-4 rounded-xl hover:bg-brand-blue-light transition-colors">
                Enviar Reporte
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
