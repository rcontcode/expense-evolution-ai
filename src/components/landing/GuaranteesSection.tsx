import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, RefreshCcw, HeadphonesIcon, Download,
  Clock, Heart, Zap, FileText, Users, Sparkles,
  BadgeCheck, CircleDollarSign
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const getGuarantees = (language: string) => [
  {
    icon: RefreshCcw,
    title: language === 'es' ? 'Garantía de 30 Días' : '30-Day Guarantee',
    description: language === 'es' 
      ? 'Si no estás 100% satisfecho con EvoFinz, te devolvemos tu dinero completo. Sin preguntas, sin complicaciones.' 
      : "If you're not 100% satisfied with EvoFinz, we refund your money completely. No questions, no hassle.",
    highlight: language === 'es' ? '💯 100% Reembolso' : '💯 100% Refund',
    emoji: '🔄'
  },
  {
    icon: HeadphonesIcon,
    title: language === 'es' ? 'Soporte Real' : 'Real Support',
    description: language === 'es' 
      ? 'Personas reales respondiendo tus dudas. Sin bots, sin respuestas automáticas genéricas.' 
      : 'Real people answering your questions. No bots, no generic automated responses.',
    highlight: language === 'es' ? '🎧 Respuesta <24h' : '🎧 Response <24h',
    emoji: '👥'
  },
  {
    icon: Download,
    title: language === 'es' ? 'Tus Datos, Siempre Tuyos' : 'Your Data, Always Yours',
    description: language === 'es' 
      ? 'Exporta toda tu información en formato estándar cuando quieras. Sin restricciones ni costos adicionales.' 
      : 'Export all your information in standard format whenever you want. No restrictions or additional costs.',
    highlight: language === 'es' ? '📦 Exportación Total' : '📦 Full Export',
    emoji: '🗃️'
  },
  {
    icon: Clock,
    title: language === 'es' ? 'Actualizaciones Incluidas' : 'Updates Included',
    description: language === 'es' 
      ? 'Nuevas funciones, mejoras y correcciones automáticas incluidas en tu plan sin costo extra.' 
      : 'New features, improvements and automatic fixes included in your plan at no extra cost.',
    highlight: language === 'es' ? '🚀 Updates Gratis' : '🚀 Free Updates',
    emoji: '⚡'
  },
  {
    icon: CircleDollarSign,
    title: language === 'es' ? 'Sin Costos Ocultos' : 'No Hidden Costs',
    description: language === 'es' 
      ? 'El precio que ves es el precio que pagas. Sin sorpresas, sin cargos adicionales inesperados.' 
      : 'The price you see is the price you pay. No surprises, no unexpected additional charges.',
    highlight: language === 'es' ? '💎 Precio Transparente' : '💎 Transparent Price',
    emoji: '✅'
  },
  {
    icon: Zap,
    title: language === 'es' ? 'Cancela Cuando Quieras' : 'Cancel Anytime',
    description: language === 'es' 
      ? 'Sin contratos de permanencia ni penalizaciones. Cancela tu suscripción en cualquier momento con un clic.' 
      : 'No lock-in contracts or penalties. Cancel your subscription at any time with one click.',
    highlight: language === 'es' ? '🔓 Sin Ataduras' : '🔓 No Strings',
    emoji: '🆓'
  }
];

const getTrustIndicators = (language: string) => [
  {
    icon: Users,
    value: '500+',
    label: language === 'es' ? 'Usuarios Activos' : 'Active Users'
  },
  {
    icon: FileText,
    value: '50K+',
    label: language === 'es' ? 'Documentos Procesados' : 'Documents Processed'
  },
  {
    icon: Sparkles,
    value: '4.8/5',
    label: language === 'es' ? 'Satisfacción' : 'Satisfaction'
  }
];

export function GuaranteesSection() {
  const { language } = useLanguage();
  const guarantees = getGuarantees(language);
  const trustIndicators = getTrustIndicators(language);

  return (
    <section className="relative py-24 bg-gradient-to-b from-emerald-50 via-white to-teal-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 px-4 py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-sm">
            <ShieldCheck className="w-4 h-4 mr-2 inline" />
            {language === 'es' ? 'Nuestro Compromiso Contigo' : 'Our Commitment to You'}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">
              {language === 'es' ? 'Garantías ' : 'Guarantees '}
            </span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {language === 'es' ? 'Sin Riesgo' : 'Risk-Free'}
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {language === 'es' 
              ? 'Queremos que pruebes EvoFinz con total confianza. Por eso te ofrecemos estas garantías reales.'
              : 'We want you to try EvoFinz with complete confidence. That\'s why we offer you these real guarantees.'}
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-12"
        >
          {trustIndicators.map((indicator, index) => {
            const Icon = indicator.icon;
            return (
              <motion.div
                key={indicator.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{indicator.value}</p>
                  <p className="text-xs text-slate-500">{indicator.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Guarantees Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {guarantees.map((guarantee, index) => {
            const Icon = guarantee.icon;
            return (
              <motion.div
                key={guarantee.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-300 shadow-lg shadow-emerald-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* Highlight badge */}
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-xs font-bold px-3 shadow-lg shadow-emerald-500/20">
                      {guarantee.highlight}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-4 mt-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-xl">{guarantee.emoji}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2 text-lg">{guarantee.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{guarantee.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom seal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <BadgeCheck className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 text-lg">
                  {language === 'es' ? '✨ Garantía de Satisfacción Total' : '✨ Total Satisfaction Guarantee'}
                </p>
                <p className="text-sm text-slate-600">
                  {language === 'es' 
                    ? 'Si no cumplimos nuestras promesas, te devolvemos tu dinero'
                    : 'If we don\'t keep our promises, we refund your money'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100">
              <Heart className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium text-sm">
                {language === 'es' 
                  ? 'Construido con ❤️ para emprendedores como tú'
                  : 'Built with ❤️ for entrepreneurs like you'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
