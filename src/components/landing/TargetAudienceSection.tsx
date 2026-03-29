import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Users, Briefcase, Home, 
  CheckCircle2, Laptop, Rocket, Heart, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const getAudiences = (language: string) => [
  {
    icon: Laptop,
    emoji: '💼',
    title: language === 'es' ? 'Freelancers & Contratistas' : 'Freelancers & Contractors',
    subtitle: language === 'es' ? '¡Domina tu negocio independiente!' : 'Master your independent business!',
    description: language === 'es' 
      ? 'Tu centro de comando financiero. Gestiona clientes, contratos y gastos mientras generas reportes fiscales automáticos. ¡Más tiempo para lo que amas!'
      : 'Your financial command center. Manage clients, contracts and expenses while generating automatic tax reports. More time for what you love!',
    benefits: language === 'es' 
      ? ['📋 Gestión de clientes y contratos', '🚗 Tracking de kilometraje con mapas', '🧾 Escaneo inteligente de recibos', '💰 Deducciones fiscales automáticas', '📊 Reportes T2125/F29 listos', '🏦 Análisis de estados bancarios']
      : ['📋 Client & contract management', '🚗 Mileage tracking with maps', '🧾 Smart receipt scanning', '💰 Automatic tax deductions', '📊 Tax reports ready to file', '🏦 Bank statement analysis'],
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10',
    accentColor: 'text-cyan-600'
  },
  {
    icon: Briefcase,
    emoji: '🚀',
    title: language === 'es' ? 'Empleados Ambiciosos' : 'Ambitious Employees',
    subtitle: language === 'es' ? '¡Construye tu libertad financiera!' : 'Build your financial freedom!',
    description: language === 'es'
      ? 'No te conformes con un sueldo. Visualiza tu patrimonio, planifica tu retiro anticipado y transforma cada peso en un paso hacia la independencia.'
      : 'Don\'t settle for a paycheck. Visualize your wealth, plan early retirement and transform every dollar into a step towards independence.',
    benefits: language === 'es'
      ? ['🔥 Calculadora FIRE para retiro temprano', '📈 Tracking de patrimonio neto', '🎯 Metas de ahorro SMART', '💎 Clasificación de activos Kiyosaki', '📚 Mentoría financiera integrada', '🏆 Gamificación y logros']
      : ['🔥 FIRE Calculator for early retirement', '📈 Net worth tracking', '🎯 SMART savings goals', '💎 Kiyosaki asset classification', '📚 Integrated financial mentorship', '🏆 Gamification & achievements'],
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10',
    accentColor: 'text-orange-600'
  },
  {
    icon: Home,
    emoji: '👨‍👩‍👧‍👦',
    title: language === 'es' ? 'Familias Inteligentes' : 'Smart Families',
    subtitle: language === 'es' ? '¡Finanzas familiares sin estrés!' : 'Stress-free family finances!',
    description: language === 'es'
      ? 'Transforma el caos financiero familiar en armonía. Presupuestos claros, detección de gastos fantasma y educación financiera para toda la familia.'
      : 'Transform family financial chaos into harmony. Clear budgets, phantom expense detection and financial education for the whole family.',
    benefits: language === 'es'
      ? ['📊 Presupuestos por categoría', '🔍 Detector de suscripciones olvidadas', '📖 Educación financiera gamificada', '💳 Control de deudas inteligente', '🎓 Diario financiero reflexivo', '📅 Calendario de vencimientos']
      : ['📊 Category-based budgets', '🔍 Forgotten subscription detector', '📖 Gamified financial education', '💳 Smart debt management', '🎓 Reflective financial journal', '📅 Due date calendar'],
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
    accentColor: 'text-emerald-600'
  }
];

export function TargetAudienceSection() {
  const { language } = useLanguage();
  const audiences = getAudiences(language);

  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-sm font-semibold shadow-lg">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            {language === 'es' ? 'Diseñado Para Ti' : 'Designed For You'}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">
              {language === 'es' ? '¿Cuál es tu ' : 'What\'s your '}
            </span>
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {language === 'es' ? 'perfil financiero?' : 'financial profile?'}
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {language === 'es'
              ? 'Una plataforma que evoluciona contigo. Descubre las herramientas perfectas para tu situación.'
              : 'A platform that evolves with you. Discover the perfect tools for your situation.'}
          </p>
          <p className="text-slate-500 text-sm mt-3">
            🌎 {language === 'es' 
              ? 'Disponible en 20+ países hispanohablantes y 60+ angloparlantes. Módulos fiscales: 🇨🇦 🇨🇱 (más próximamente)'
              : 'Available in 20+ Spanish-speaking and 60+ English-speaking countries. Tax modules: 🇨🇦 🇨🇱 (more coming soon)'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
              >
                <Card className="relative h-full p-8 bg-white border-slate-200/50 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 overflow-hidden group rounded-2xl">
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 ${audience.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Decorative corner accent */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${audience.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                  
                  <div className="relative z-10">
                    {/* Icon + Emoji */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${audience.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-4xl">{audience.emoji}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-1">{audience.title}</h3>
                    <p className={`text-sm font-semibold ${audience.accentColor} mb-3`}>{audience.subtitle}</p>
                    <p className="text-slate-600 mb-6 text-sm leading-relaxed">{audience.description}</p>

                    {/* Benefits */}
                    <ul className="space-y-2.5">
                      {audience.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <span className="text-sm text-slate-700 font-medium leading-tight">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-slate-500"
        >
          {language === 'es' 
            ? '✨ Todas las funciones disponibles en cada perfil — tú decides cómo usarlas'
            : '✨ All features available in every profile — you decide how to use them'}
        </motion.p>
      </div>
    </section>
  );
}
