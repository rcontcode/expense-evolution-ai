import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, Server, CheckCircle2, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const getSecurityFeatures = (language: string) => [
  {
    icon: Lock,
    title: language === 'es' ? 'Encriptación AES-256' : 'AES-256 Encryption',
    description: language === 'es' 
      ? 'Tus datos están protegidos con el mismo estándar de los bancos'
      : 'Your data is protected with the same standard used by banks'
  },
  {
    icon: Shield,
    title: language === 'es' ? 'Autenticación Segura' : 'Secure Authentication',
    description: language === 'es'
      ? 'Sistema de doble factor disponible para proteger tu cuenta'
      : 'Two-factor authentication available to protect your account'
  },
  {
    icon: Eye,
    title: language === 'es' ? 'Privacidad Total' : 'Total Privacy',
    description: language === 'es'
      ? 'Nunca vendemos ni compartimos tus datos con terceros'
      : 'We never sell or share your data with third parties'
  },
  {
    icon: Server,
    title: language === 'es' ? 'Servidores Seguros' : 'Secure Servers',
    description: language === 'es'
      ? 'Datos almacenados en centros de datos certificados con respaldo automático'
      : 'Data stored in certified data centers with automatic backup'
  }
];

const getTrustBadges = (language: string) => [
  { label: 'SSL Secured', icon: Lock },
  { label: language === 'es' ? 'Protección de Datos' : 'Data Protection', icon: Award },
  { label: 'SOC 2', icon: Shield },
  { label: '99.9% Uptime', icon: CheckCircle2 }
];

export function TrustSecuritySection() {
  const { language } = useLanguage();
  const securityFeatures = getSecurityFeatures(language);
  const trustBadges = getTrustBadges(language);

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-cyan-500/10 text-cyan-600 border-cyan-500/30 text-sm">
            <Shield className="w-4 h-4 mr-2 inline" />
            {language === 'es' ? 'Seguridad de Clase Bancaria' : 'Bank-Grade Security'}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">
              {language === 'es' ? 'Tu Seguridad es ' : 'Your Security is '}
            </span>
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              {language === 'es' ? 'Nuestra Prioridad' : 'Our Priority'}
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {language === 'es'
              ? 'Protegemos tu información financiera con los más altos estándares de seguridad.'
              : 'We protect your financial information with the highest security standards.'}
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-100 border border-slate-200"
              >
                <Icon className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium text-slate-700">{badge.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
