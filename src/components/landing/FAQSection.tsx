import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from '@/contexts/LanguageContext';

const getFaqs = (language: string) => language === 'es' ? [
  {
    question: '¿EvoFinz es seguro para mis datos financieros?',
    answer: 'Absolutamente. Utilizamos encriptación AES-256, el mismo estándar que usan los bancos. Tus datos están almacenados en servidores seguros conformes con regulaciones de privacidad locales y nunca compartimos tu información con terceros.'
  },
  {
    question: '¿Puedo usar EvoFinz si no soy contador?',
    answer: 'Sí, EvoFinz está diseñado para personas sin conocimientos contables. La categorización inteligente organiza automáticamente tus gastos, sugiere deducciones fiscales y genera reportes listos para tu contador o autoridad tributaria.'
  },
  {
    question: '¿Qué países soporta EvoFinz?',
    answer: 'Actualmente soportamos Canadá (CRA, T2125, RRSP/TFSA) y Chile (SII, F29/F22, APV). El sistema se adapta automáticamente según tu perfil, mostrando las reglas fiscales y calendarios correctos para tu país. Más países próximamente.'
  },
  {
    question: '¿En qué idiomas está disponible?',
    answer: 'EvoFinz está disponible en Español e Inglés. Puedes cambiar el idioma en cualquier momento desde el selector de idioma en la esquina superior derecha.'
  },
  {
    question: '¿Puedo importar mis datos bancarios?',
    answer: 'Sí, puedes importar extractos bancarios en formato CSV/OFX. EvoFinz analiza las transacciones, detecta patrones y categoriza automáticamente. También detecta suscripciones recurrentes.'
  },
  {
    question: '¿Hay una versión gratuita?',
    answer: 'Sí, el plan gratuito incluye hasta 50 gastos manuales/mes, 20 ingresos/mes, 5 escaneos OCR gratis, 2 clientes y 2 proyectos. Perfecto para explorar las bondades de EvoFinz antes de escalar a Premium ($6.99/mes) o Pro ($14.99/mes).'
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
] : [
  {
    question: 'Is EvoFinz secure for my financial data?',
    answer: 'Absolutely. We use AES-256 encryption, the same standard used by banks. Your data is stored on secure servers compliant with local privacy regulations and we never share your information with third parties.'
  },
  {
    question: 'Can I use EvoFinz if I\'m not an accountant?',
    answer: 'Yes, EvoFinz is designed for people without accounting knowledge. Smart categorization automatically organizes your expenses, suggests tax deductions, and generates reports ready for your accountant or tax authority.'
  },
  {
    question: 'Which countries does EvoFinz support?',
    answer: 'We currently support Canada (CRA, T2125, RRSP/TFSA) and Chile (SII, F29/F22, APV). The system automatically adapts based on your profile, showing the correct tax rules and calendars for your country. More countries coming soon.'
  },
  {
    question: 'What languages are available?',
    answer: 'EvoFinz is available in Spanish and English. You can change the language at any time from the language selector in the top right corner.'
  },
  {
    question: 'Can I import my bank data?',
    answer: 'Yes, you can import bank statements in CSV/OFX format. EvoFinz analyzes transactions, detects patterns, and categorizes automatically. It also detects recurring subscriptions.'
  },
  {
    question: 'Is there a free version?',
    answer: 'Yes, the free plan includes up to 50 manual expenses/month, 20 incomes/month, 5 free OCR scans, 2 clients and 2 projects. Perfect for exploring EvoFinz before scaling to Premium ($6.99/month) or Pro ($14.99/month).'
  },
  {
    question: 'How does gamification work?',
    answer: 'You earn XP and achievements for maintaining good financial habits: logging expenses, reaching savings goals, completing financial education. You unlock levels and badges that motivate your progress.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time without penalties. Your data remains accessible in read-only mode and you can export it before closing your account.'
  },
  {
    question: 'Does EvoFinz work on my phone?',
    answer: 'Yes, EvoFinz is a Progressive Web App (PWA) that works on any device. You can install it on your phone to scan receipts on the go.'
  }
];

export function FAQSection() {
  const { language } = useLanguage();
  const faqs = getFaqs(language);

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
            {language === 'es' ? 'Preguntas Frecuentes' : 'FAQ'}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">{language === 'es' ? '¿Tienes ' : 'Have '}</span>
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
              {language === 'es' ? 'Preguntas?' : 'Questions?'}
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {language === 'es' 
              ? 'Aquí resolvemos las dudas más comunes sobre EvoFinz.'
              : 'Here we answer the most common questions about EvoFinz.'}
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
