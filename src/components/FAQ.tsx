import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "¿Cuáles son los horarios de atención?",
      answer: "Atendemos de Lunes a Sábado de 09:00 a 20:00 hrs. Domingos no trabajamos."
    },
    {
      question: "¿Cobran comisiones adicionales por el cambio de divisas?",
      answer: "No, nuestras tasas de cambio ya incluyen todos los costos operativos. Lo que ves en el cotizador es exactamente lo que recibes, sin sorpresas ni letras chicas."
    },
    {
      question: "¿Qué documentos necesito para realizar una operación?",
      answer: "Para operaciones estándar, solo necesitas presentar un documento de identidad válido (RG, CNH o Pasaporte). Para montos elevados, podríamos requerir documentación adicional por normativas del Banco Central."
    },
    {
      question: "¿Cuánto tiempo demora una transferencia internacional?",
      answer: "La mayoría de las transferencias internacionales se completan en un plazo de 24 a 48 horas hábiles, dependiendo del país de destino y el banco receptor."
    },
    {
      question: "¿Puedo asegurar la tasa de cambio por WhatsApp?",
      answer: "Sí, puedes contactarnos por WhatsApp para congelar la tasa de cambio actual. Tendrás un plazo determinado para acercarte a la sucursal y concretar la operación."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg text-slate-600">
            Resolvemos tus dudas para que operes con total tranquilidad.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-lg text-brand-blue pr-8">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="text-brand-green flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-slate-400 flex-shrink-0" />
                )}
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-slate-600">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
