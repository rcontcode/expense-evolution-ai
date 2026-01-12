import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Sparkles, CheckCircle2, TrendingUp, Shield, Users, Zap, Heart, Trophy, Target, BookOpen, Calculator, PiggyBank, Receipt, Car, Briefcase, Crown, ArrowRight, Star } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// The complete EvoFinz story - strategic storytelling content
const getStoryContent = (language: string) => language === 'es' ? {
  hook: {
    title: '¿Por qué EvoFinz cambiará tu vida financiera?',
    subtitle: 'La historia completa de cómo EvoFinz se convirtió en el copiloto financiero de miles de personas'
  },
  opening: {
    problem: 'Imagina esto: es domingo por la noche. Tienes una caja de zapatos llena de recibos arrugados, tres cuentas bancarias que revisar, y la fecha límite de impuestos se acerca. El estrés financiero te roba el sueño.',
    twist: 'Ahora imagina un mundo diferente: sacas tu teléfono, dices "Agregué $45 en gasolina para el proyecto del cliente X", y en 3 segundos el gasto está registrado, categorizado para deducción fiscal, y asignado para facturación. Eso es EvoFinz.'
  },
  valueProps: [
    {
      icon: 'receipt',
      title: 'De Caos a Claridad en Segundos',
      description: 'Fotografía un recibo y nuestra IA extrae monto, fecha, proveedor y categoría automáticamente. Sin tipear. Sin errores. 5 segundos vs 5 minutos.',
      stat: '95% de precisión OCR'
    },
    {
      icon: 'voice',
      title: 'Tu Asistente Personal de Bolsillo',
      description: 'Habla naturalmente: "¿Cuánto gasté en restaurantes este mes?" y recibe respuestas instantáneas. 100+ comandos de voz que entienden tu idioma.',
      stat: '100+ comandos de voz'
    },
    {
      icon: 'tax',
      title: 'Optimización Fiscal Inteligente',
      description: 'El Optimizador de Impuestos analiza tus gastos y encuentra deducciones que probablemente estás perdiendo. Compatible con CRA (Canadá) y SII (Chile).',
      stat: 'Hasta 30% más deducciones'
    },
    {
      icon: 'fire',
      title: 'Planifica tu Libertad Financiera',
      description: 'La Calculadora FIRE te muestra exactamente cuánto necesitas ahorrar para retirarte temprano. Con proyecciones personalizadas basadas en TU situación.',
      stat: 'Retiro hasta 15 años antes'
    },
    {
      icon: 'networth',
      title: 'Ve Tu Patrimonio Crecer',
      description: 'Rastrea 90+ tipos de activos (cripto, inversiones, propiedades) y observa tu patrimonio neto crecer con proyecciones a 6 meses.',
      stat: '90+ categorías de activos'
    },
    {
      icon: 'mentor',
      title: 'Educación que Transforma',
      description: 'Aprende de los mejores: principios de Kiyosaki, hábitos de James Clear, metas de Brian Tracy. Una biblioteca financiera completa con seguimiento de progreso.',
      stat: '50+ recursos educativos'
    }
  ],
  comparison: {
    title: 'EvoFinz vs. El Resto del Mercado',
    items: [
      { feature: 'Captura por voz en español/inglés', evofinz: true, others: 'Raro o inexistente' },
      { feature: 'OCR para recibos con IA', evofinz: true, others: 'Solo planes premium caros' },
      { feature: 'Optimización fiscal automática', evofinz: true, others: 'Requiere contador' },
      { feature: 'Calculadora FIRE personalizada', evofinz: true, others: 'No incluido' },
      { feature: 'Gamificación y hábitos', evofinz: true, others: 'Muy básico o inexistente' },
      { feature: 'Soporte CRA + SII', evofinz: true, others: 'Solo un país' },
      { feature: 'Análisis de contratos con IA', evofinz: true, others: 'No existe' },
      { feature: 'Precio accesible', evofinz: 'Desde $0/mes', others: '$15-50/mes' }
    ]
  },
  journeyUpgrade: {
    title: 'Tu Viaje con EvoFinz',
    stages: [
      {
        plan: 'Gratis',
        price: '$0',
        description: 'Comienza sin riesgo',
        features: ['50 gastos/mes', '5 escaneos OCR', 'Dashboard completo', 'Educación financiera'],
        cta: 'Perfecto para probar'
      },
      {
        plan: 'Premium',
        price: '$6.99',
        description: 'Para el usuario activo',
        features: ['Gastos ilimitados', '50 escaneos OCR/mes', 'Patrimonio neto completo', 'Gamificación total'],
        cta: 'El más popular'
      },
      {
        plan: 'Pro',
        price: '$14.99',
        description: 'Poder total',
        features: ['Todo ilimitado', 'OCR ilimitado', 'Optimizador fiscal IA', 'Calculadora FIRE', 'Análisis de contratos'],
        cta: 'Para freelancers y emprendedores'
      }
    ]
  },
  testimonialPitch: '"Antes gastaba 4 horas al mes organizando recibos para mi contador. Con EvoFinz, lo hago en 15 minutos mientras tomo café. El tiempo que recuperé vale más que cualquier precio."',
  closingCta: {
    title: '¿Listo para transformar tu relación con el dinero?',
    subtitle: 'Únete a miles que ya controlan sus finanzas sin estrés',
    button: 'Comenzar Gratis Ahora'
  }
} : {
  hook: {
    title: 'Why will EvoFinz change your financial life?',
    subtitle: 'The complete story of how EvoFinz became the financial copilot for thousands'
  },
  opening: {
    problem: 'Imagine this: it\'s Sunday night. You have a shoebox full of crumpled receipts, three bank accounts to review, and the tax deadline is approaching. Financial stress steals your sleep.',
    twist: 'Now imagine a different world: you take out your phone, say "I added $45 in gas for client X\'s project", and in 3 seconds the expense is recorded, categorized for tax deduction, and assigned for billing. That\'s EvoFinz.'
  },
  valueProps: [
    {
      icon: 'receipt',
      title: 'From Chaos to Clarity in Seconds',
      description: 'Photograph a receipt and our AI extracts amount, date, vendor and category automatically. No typing. No errors. 5 seconds vs 5 minutes.',
      stat: '95% OCR accuracy'
    },
    {
      icon: 'voice',
      title: 'Your Personal Pocket Assistant',
      description: 'Speak naturally: "How much did I spend on restaurants this month?" and get instant answers. 100+ voice commands that understand your language.',
      stat: '100+ voice commands'
    },
    {
      icon: 'tax',
      title: 'Smart Tax Optimization',
      description: 'The Tax Optimizer analyzes your expenses and finds deductions you\'re probably missing. Compatible with CRA (Canada) and SII (Chile).',
      stat: 'Up to 30% more deductions'
    },
    {
      icon: 'fire',
      title: 'Plan Your Financial Freedom',
      description: 'The FIRE Calculator shows you exactly how much you need to save to retire early. With personalized projections based on YOUR situation.',
      stat: 'Retire up to 15 years earlier'
    },
    {
      icon: 'networth',
      title: 'Watch Your Wealth Grow',
      description: 'Track 90+ asset types (crypto, investments, properties) and watch your net worth grow with 6-month projections.',
      stat: '90+ asset categories'
    },
    {
      icon: 'mentor',
      title: 'Transformative Education',
      description: 'Learn from the best: Kiyosaki principles, James Clear habits, Brian Tracy goals. A complete financial library with progress tracking.',
      stat: '50+ educational resources'
    }
  ],
  comparison: {
    title: 'EvoFinz vs. The Rest of the Market',
    items: [
      { feature: 'Voice capture in Spanish/English', evofinz: true, others: 'Rare or non-existent' },
      { feature: 'AI-powered receipt OCR', evofinz: true, others: 'Only expensive premium plans' },
      { feature: 'Automatic tax optimization', evofinz: true, others: 'Requires accountant' },
      { feature: 'Personalized FIRE calculator', evofinz: true, others: 'Not included' },
      { feature: 'Gamification and habits', evofinz: true, others: 'Very basic or non-existent' },
      { feature: 'CRA + SII support', evofinz: true, others: 'Only one country' },
      { feature: 'AI contract analysis', evofinz: true, others: 'Doesn\'t exist' },
      { feature: 'Affordable pricing', evofinz: 'From $0/mo', others: '$15-50/mo' }
    ]
  },
  journeyUpgrade: {
    title: 'Your Journey with EvoFinz',
    stages: [
      {
        plan: 'Free',
        price: '$0',
        description: 'Start risk-free',
        features: ['50 expenses/mo', '5 OCR scans', 'Complete dashboard', 'Financial education'],
        cta: 'Perfect to try'
      },
      {
        plan: 'Premium',
        price: '$6.99',
        description: 'For the active user',
        features: ['Unlimited expenses', '50 OCR scans/mo', 'Full net worth', 'Full gamification'],
        cta: 'Most popular'
      },
      {
        plan: 'Pro',
        price: '$14.99',
        description: 'Total power',
        features: ['Everything unlimited', 'Unlimited OCR', 'AI Tax Optimizer', 'FIRE Calculator', 'Contract analysis'],
        cta: 'For freelancers and entrepreneurs'
      }
    ]
  },
  testimonialPitch: '"I used to spend 4 hours a month organizing receipts for my accountant. With EvoFinz, I do it in 15 minutes while having coffee. The time I recovered is worth more than any price."',
  closingCta: {
    title: 'Ready to transform your relationship with money?',
    subtitle: 'Join thousands who already control their finances stress-free',
    button: 'Start Free Now'
  }
};

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    receipt: Receipt,
    voice: Zap,
    tax: Calculator,
    fire: TrendingUp,
    networth: PiggyBank,
    mentor: BookOpen
  };
  return icons[iconName] || Sparkles;
};

// The Story Section Component - expandable storytelling
function StorySection({ language }: { language: string }) {
  const navigate = useNavigate();
  const story = getStoryContent(language);

  return (
    <div className="space-y-8">
      {/* Opening Hook */}
      <div className="relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-purple-500 to-pink-500 rounded-full" />
        <div className="pl-6 space-y-4">
          <p className="text-slate-600 leading-relaxed italic border-l-0">
            "{story.opening.problem}"
          </p>
          <p className="text-slate-800 font-medium leading-relaxed">
            {story.opening.twist}
          </p>
        </div>
      </div>

      {/* Value Props Grid */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {story.valueProps.map((prop, index) => {
          const IconComponent = getIconComponent(prop.icon);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shrink-0 group-hover:scale-110 transition-transform">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{prop.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{prop.description}</p>
                  <span className="inline-block mt-2 text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                    {prop.stat}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          {story.comparison.title}
        </h4>
        <div className="space-y-2">
          {story.comparison.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
              <span className="text-slate-300 text-sm flex-1">{item.feature}</span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-400 font-medium text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {typeof item.evofinz === 'boolean' ? 'EvoFinz' : item.evofinz}
                </span>
                <span className="text-slate-500 text-xs w-32 text-right">{item.others}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Journey */}
      <div className="mt-8">
        <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          {story.journeyUpgrade.title}
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          {story.journeyUpgrade.stages.map((stage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                index === 1 
                  ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/20' 
                  : index === 2 
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white'
              }`}
            >
              {index === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> {language === 'es' ? 'Más popular' : 'Most popular'}
                </span>
              )}
              {index === 2 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Pro
                </span>
              )}
              <div className="text-center mb-3">
                <h5 className="font-bold text-slate-800">{stage.plan}</h5>
                <div className="text-2xl font-black text-violet-600">{stage.price}<span className="text-sm font-normal text-slate-500">/{language === 'es' ? 'mes' : 'mo'}</span></div>
                <p className="text-xs text-slate-500">{stage.description}</p>
              </div>
              <ul className="space-y-1.5">
                {stage.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="text-center mt-3 text-xs font-medium text-violet-600">{stage.cta}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="mt-6 p-4 bg-gradient-to-r from-violet-100 to-purple-100 rounded-xl border border-violet-200">
        <p className="text-slate-700 italic text-sm leading-relaxed">
          {story.testimonialPitch}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ))}
          </div>
          <span className="text-xs text-slate-500">— EvoFinz User</span>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mt-8 text-center p-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl text-white">
        <h4 className="font-bold text-xl mb-2">{story.closingCta.title}</h4>
        <p className="text-violet-200 text-sm mb-4">{story.closingCta.subtitle}</p>
        <Button 
          onClick={() => navigate('/auth')}
          className="bg-white text-violet-600 hover:bg-violet-50 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
        >
          {story.closingCta.button}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

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
  const story = getStoryContent(language);

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
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {/* Special Story FAQ - First Position with special styling */}
            <AccordionItem 
              value="story"
              className="bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 rounded-xl border-2 border-violet-300 px-6 shadow-md hover:shadow-lg transition-all overflow-hidden"
            >
              <AccordionTrigger className="text-left font-bold text-violet-700 hover:text-violet-800 py-5 text-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block">{story.hook.title}</span>
                    <span className="block text-xs font-normal text-violet-500 mt-0.5">
                      {language === 'es' ? '✨ Descubre la historia completa' : '✨ Discover the complete story'}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <StorySection language={language} />
              </AccordionContent>
            </AccordionItem>

            {/* Regular FAQs */}
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
