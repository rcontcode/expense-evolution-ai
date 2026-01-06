import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: '¿EvoFinz es seguro para mis datos financieros?',
    answer: 'Absolutamente. Utilizamos encriptación AES-256, el mismo estándar que usan los bancos. Tus datos están almacenados en servidores canadienses conformes con PIPEDA y nunca compartimos tu información con terceros.'
  },
  {
    question: '¿Puedo usar EvoFinz si no soy contador?',
    answer: 'Sí, EvoFinz está diseñado para personas sin conocimientos contables. La IA categoriza automáticamente tus gastos, sugiere deducciones fiscales y genera reportes listos para tu contador o el CRA.'
  },
  {
    question: '¿Qué es el reporte T2125?',
    answer: 'El T2125 es el formulario del CRA para reportar ingresos y gastos de negocio como freelancer o contratista. EvoFinz genera este reporte automáticamente con todos tus gastos categorizados correctamente.'
  },
  {
    question: '¿Puedo importar mis datos bancarios?',
    answer: 'Sí, puedes importar extractos bancarios en formato CSV/OFX. La IA analiza las transacciones, detecta patrones y categoriza automáticamente. También detecta suscripciones recurrentes.'
  },
  {
    question: '¿Hay una versión gratuita?',
    answer: 'Sí, el plan gratuito incluye hasta 20 gastos/mes, 5 escaneos OCR y un dashboard básico. Perfecto para empezar a organizar tus finanzas antes de escalar a un plan premium.'
  },
  {
    question: '¿Cómo funciona la gamificación?',
    answer: 'Ganas XP y logros por mantener buenos hábitos financieros: registrar gastos, alcanzar metas de ahorro, completar educación financiera. Desbloqueas niveles y badges que motivan tu progreso.'
  },
  {
    question: '¿Puedo cancelar en cualquier momento?',
    answer: 'Sí, puedes cancelar tu suscripción en cualquier momento sin penalidades. Tus datos permanecen accesibles en modo lectura y puedes exportarlos antes de cerrar tu cuenta.'
  },
  {
    question: '¿EvoFinz funciona en mi celular?',
    answer: 'Sí, EvoFinz es una Progressive Web App (PWA) que funciona en cualquier dispositivo. Puedes instalarla en tu celular para escanear recibos sobre la marcha.'
  }
];

export function FAQSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-violet-500/10 text-violet-600 border-violet-500/30 text-sm">
            <HelpCircle className="w-4 h-4 mr-2 inline" />
            Preguntas Frecuentes
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">¿Tienes </span>
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">Preguntas?</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Aquí resolvemos las dudas más comunes sobre EvoFinz.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl border border-slate-200 px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-violet-600 py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
