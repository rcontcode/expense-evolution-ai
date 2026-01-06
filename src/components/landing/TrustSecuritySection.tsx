import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, Server, CheckCircle2, Award } from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encriptación AES-256',
    description: 'Tus datos están protegidos con el mismo estándar de los bancos'
  },
  {
    icon: Shield,
    title: 'Autenticación Segura',
    description: 'Sistema de doble factor disponible para proteger tu cuenta'
  },
  {
    icon: Eye,
    title: 'Privacidad Total',
    description: 'Nunca vendemos ni compartimos tus datos con terceros'
  },
  {
    icon: Server,
    title: 'Servidores en Canadá',
    description: 'Datos almacenados en servidores canadienses conformes con PIPEDA'
  }
];

const trustBadges = [
  { label: 'SSL Secured', icon: Lock },
  { label: 'PIPEDA Compliant', icon: Award },
  { label: 'SOC 2', icon: Shield },
  { label: '99.9% Uptime', icon: CheckCircle2 }
];

export function TrustSecuritySection() {
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
            Seguridad de Clase Bancaria
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">Tu Seguridad es </span>
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Nuestra Prioridad</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Protegemos tu información financiera con los más altos estándares de seguridad.
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
