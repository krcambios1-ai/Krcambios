import React from 'react';
import { ShieldCheck, Clock, Award, Lock } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Clock className="w-8 h-8 text-brand-green" />,
      title: "Rapidez Garantizada",
      description: "Operaciones ágiles y sin demoras. Tu tiempo vale oro y nosotros lo sabemos."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-brand-green" />,
      title: "Máxima Seguridad",
      description: "Transacciones protegidas con los más altos estándares de seguridad financiera."
    },
    {
      icon: <Award className="w-8 h-8 text-brand-green" />,
      title: "Mejor Tasa del Mercado",
      description: "Monitoreamos el mercado constantemente para ofrecerte siempre la cotización más competitiva."
    },
    {
      icon: <Lock className="w-8 h-8 text-brand-green" />,
      title: "Cumplimiento Legal",
      description: "Operamos bajo estricto cumplimiento de las normativas vigentes en Brasil."
    }
  ];

  return (
    <section id="seguridad" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
            ¿Por qué elegir KR Cambios?
          </h2>
          <p className="text-lg text-slate-600">
            Nos distinguimos por brindar un servicio transparente, seguro y enfocado en la satisfacción total de nuestros clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-brand-blue mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
