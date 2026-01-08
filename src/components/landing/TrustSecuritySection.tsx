import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Lock, Eye, Server, CheckCircle2, Award, 
  Database, Key, Globe, FileCheck, Fingerprint, CloudOff,
  ShieldCheck, Verified
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const getSecurityFeatures = (language: string) => [
  {
    icon: Lock,
    title: language === 'es' ? 'Encriptación AES-256' : 'AES-256 Encryption',
    description: language === 'es' 
      ? 'Todos tus datos se encriptan en reposo con el estándar más alto de la industria bancaria'
      : 'All your data is encrypted at rest with the highest banking industry standard',
    verified: true
  },
  {
    icon: Globe,
    title: language === 'es' ? 'SSL/TLS en Tránsito' : 'SSL/TLS in Transit',
    description: language === 'es'
      ? 'Conexiones HTTPS seguras con certificados SSL para toda comunicación'
      : 'Secure HTTPS connections with SSL certificates for all communication',
    verified: true
  },
  {
    icon: Fingerprint,
    title: language === 'es' ? 'Autenticación Segura' : 'Secure Authentication',
    description: language === 'es'
      ? 'Sistema de autenticación robusto con tokens JWT y sesiones protegidas'
      : 'Robust authentication system with JWT tokens and protected sessions',
    verified: true
  },
  {
    icon: Database,
    title: language === 'es' ? 'Row Level Security' : 'Row Level Security',
    description: language === 'es'
      ? 'Políticas de acceso a nivel de fila que garantizan que solo tú veas tus datos'
      : 'Row-level access policies ensuring only you can see your data',
    verified: true
  },
  {
    icon: Eye,
    title: language === 'es' ? 'Privacidad Total' : 'Total Privacy',
    description: language === 'es'
      ? 'Nunca vendemos, compartimos ni monetizamos tus datos personales o financieros'
      : 'We never sell, share or monetize your personal or financial data',
    verified: true
  },
  {
    icon: Server,
    title: language === 'es' ? 'Infraestructura AWS' : 'AWS Infrastructure',
    description: language === 'es'
      ? 'Servidores alojados en Amazon Web Services con respaldo automático diario'
      : 'Servers hosted on Amazon Web Services with automatic daily backups',
    verified: true
  },
  {
    icon: CloudOff,
    title: language === 'es' ? 'Aislamiento de Datos' : 'Data Isolation',
    description: language === 'es'
      ? 'Cada usuario tiene su espacio aislado, sin acceso cruzado entre cuentas'
      : 'Each user has their isolated space, no cross-access between accounts',
    verified: true
  },
  {
    icon: FileCheck,
    title: language === 'es' ? 'Código Abierto Base' : 'Open Source Foundation',
    description: language === 'es'
      ? 'Construido sobre tecnología de código abierto auditada por la comunidad global'
      : 'Built on open source technology audited by the global community',
    verified: true
  }
];

const getCertificationBadges = (language: string) => [
  { 
    label: 'SOC 2 Type II',
    sublabel: language === 'es' ? 'Certificado' : 'Certified',
    icon: Award,
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    label: 'GDPR',
    sublabel: language === 'es' ? 'Cumplimiento' : 'Compliant',
    icon: Shield,
    color: 'from-emerald-500 to-teal-600'
  },
  { 
    label: 'SSL/TLS',
    sublabel: language === 'es' ? 'Grado A+' : 'Grade A+',
    icon: Lock,
    color: 'from-green-500 to-emerald-600'
  },
  { 
    label: '99.9%',
    sublabel: 'Uptime SLA',
    icon: CheckCircle2,
    color: 'from-cyan-500 to-blue-600'
  }
];

const getDataRights = (language: string) => [
  {
    icon: Key,
    text: language === 'es' ? 'Exporta todos tus datos en cualquier momento' : 'Export all your data at any time'
  },
  {
    icon: CloudOff,
    text: language === 'es' ? 'Elimina tu cuenta y datos permanentemente' : 'Delete your account and data permanently'
  },
  {
    icon: Eye,
    text: language === 'es' ? 'Transparencia total sobre qué datos almacenamos' : 'Full transparency about what data we store'
  }
];

export function TrustSecuritySection() {
  const { language } = useLanguage();
  const securityFeatures = getSecurityFeatures(language);
  const certifications = getCertificationBadges(language);
  const dataRights = getDataRights(language);

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-sm">
            <Shield className="w-4 h-4 mr-2 inline" />
            {language === 'es' ? 'Seguridad de Nivel Empresarial' : 'Enterprise-Grade Security'}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-white">
              {language === 'es' ? 'Tu Seguridad es ' : 'Your Security is '}
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {language === 'es' ? 'Nuestra Obsesión' : 'Our Obsession'}
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {language === 'es'
              ? 'Protegemos tu información financiera con la misma tecnología que usan los bancos más grandes del mundo.'
              : 'We protect your financial information with the same technology used by the world\'s largest banks.'}
          </p>
        </motion.div>

        {/* Certification Badges - Large prominent display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-16"
        >
          {certifications.map((cert, index) => {
            const Icon = cert.icon;
            return (
              <motion.div
                key={cert.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br ${cert.color} flex items-center justify-center shadow-lg`}>
                    <Verified className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cert.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-lg">{cert.label}</p>
                      <p className="text-xs text-slate-400">{cert.sublabel}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="group"
              >
                <div className="h-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/80 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                        {feature.verified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Your Data Rights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 rounded-2xl p-6 md:p-8 border border-cyan-500/20">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {language === 'es' ? '🔐 Tus Derechos sobre tus Datos' : '🔐 Your Data Rights'}
              </h3>
              <p className="text-slate-400 text-sm">
                {language === 'es' 
                  ? 'Cumplimos con GDPR y las mejores prácticas de privacidad'
                  : 'We comply with GDPR and privacy best practices'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {dataRights.map((right, index) => {
                const Icon = right.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3"
                  >
                    <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{right.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Bottom trust statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/80 border border-slate-700">
            <div className="flex -space-x-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-slate-300 text-sm font-medium">
              {language === 'es' 
                ? 'Tecnología de seguridad auditada y de código abierto'
                : 'Audited, open-source security technology'}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
