import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, RefreshCcw, HeadphonesIcon, Download,
  Clock, Heart
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const getGuarantees = (language: string) => [
  {
    icon: RefreshCcw,
    title: language === 'es' ? 'Garantía de 30 Días' : '30-Day Guarantee',
    description: language === 'es' ? 'Si no estás satisfecho, te devolvemos tu dinero. Sin preguntas.' : "If you're not satisfied, we refund your money. No questions asked.",
    highlight: language === 'es' ? '100% reembolso' : '100% refund'
  },
  {
    icon: HeadphonesIcon,
    title: language === 'es' ? 'Soporte Prioritario' : 'Priority Support',
    description: language === 'es' ? 'Respuesta en menos de 24 horas por chat o email.' : 'Response in less than 24 hours via chat or email.',
    highlight: language === 'es' ? 'Respuesta <24h' : 'Response <24h'
  },
  {
    icon: Download,
    title: language === 'es' ? 'Tus Datos, Siempre Tuyos' : 'Your Data, Always Yours',
    description: language === 'es' ? 'Exporta toda tu información en cualquier momento.' : 'Export all your information at any time.',
    highlight: language === 'es' ? 'Exportación total' : 'Full export'
  },
  {
    icon: Clock,
    title: language === 'es' ? 'Actualizaciones Gratis' : 'Free Updates',
    description: language === 'es' ? 'Nuevas funciones y mejoras incluidas en tu plan.' : 'New features and improvements included in your plan.',
    highlight: language === 'es' ? 'Updates de por vida' : 'Lifetime updates'
  }
];

export function GuaranteesSection() {
  const { language } = useLanguage();
  const guarantees = getGuarantees(language);

  const badgeText = language === 'es' ? 'Nuestro Compromiso' : 'Our Commitment';
  const titlePart1 = language === 'es' ? 'Garantías ' : 'Risk-Free ';
  const titlePart2 = language === 'es' ? 'Sin Riesgo' : 'Guarantees';
  const subtitle = language === 'es' ? 'Queremos que pruebes EvoFinz con total confianza.' : 'We want you to try EvoFinz with complete confidence.';
  const trustMessage = language === 'es' ? 'Más de 500 usuarios confían en EvoFinz' : 'More than 500 users trust EvoFinz';

  return (
    <section className="relative py-20 bg-gradient-to-b from-emerald-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-sm">
            <ShieldCheck className="w-4 h-4 mr-2 inline" />
            {badgeText}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">{titlePart1}</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{titlePart2}</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {guarantees.map((guarantee, index) => {
            const Icon = guarantee.icon;
            return (
              <motion.div
                key={guarantee.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-300 shadow-lg shadow-emerald-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
                  {/* Highlight badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-xs font-bold px-3">
                      {guarantee.highlight}
                    </Badge>
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mt-4 mb-4 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="font-bold text-slate-800 mb-2">{guarantee.title}</h3>
                  <p className="text-sm text-slate-500">{guarantee.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-100 border border-emerald-200">
            <Heart className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">
              {trustMessage}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
