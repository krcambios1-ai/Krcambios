import React from 'react';
import { Globe, RefreshCw, CreditCard } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: <Globe className="w-10 h-10 text-brand-green" />,
      title: "Envío de Remesas",
      description: "Trabajamos con envíos de Remesas a más de 4 años. Envía dinero de forma segura, rápida y con las mejores tasas del mercado."
    },
    {
      icon: <RefreshCw className="w-10 h-10 text-brand-green" />,
      title: "Compra y Venta de Divisas",
      description: "Dólares, Euros, Libras, Pesos y más. Disponibilidad inmediata de efectivo con las mejores tasas del mercado."
    },
    {
      icon: <CreditCard className="w-10 h-10 text-brand-green" />,
      title: "Cambio Online",
      description: "Cotiza y asegura tu tasa de cambio a través de WhatsApp. Retira en nuestra sucursal sin filas ni demoras."
    }
  ];

  return (
    <section id="servicios" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-lg text-slate-600">
              Ofrecemos soluciones financieras integrales adaptadas a tus necesidades personales.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-3xl bg-slate-50 hover:bg-brand-blue transition-colors duration-300"
            >
              <div className="mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-brand-blue group-hover:text-white mb-4 transition-colors">
                {service.title}
              </h3>
              <p className="text-slate-600 group-hover:text-slate-300 transition-colors text-lg">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
