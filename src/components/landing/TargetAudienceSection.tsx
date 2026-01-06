import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Users, Briefcase, Home, Building2, 
  CheckCircle2, Laptop, Heart
} from 'lucide-react';

const audiences = [
  {
    icon: Laptop,
    title: 'Freelancers & Contratistas',
    description: 'Gestiona clientes, contratos y gastos de negocio. Exporta reportes T2125 listos para el CRA.',
    benefits: ['Facturación a clientes', 'Tracking de kilometraje', 'Deducciones fiscales'],
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/10'
  },
  {
    icon: Briefcase,
    title: 'Empleados',
    description: 'Controla gastos personales, planifica tu retiro con RRSP/TFSA y alcanza la libertad financiera.',
    benefits: ['Calculadora FIRE', 'Tracking de patrimonio', 'Metas de ahorro'],
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    icon: Home,
    title: 'Familias',
    description: 'Presupuesto familiar inteligente con categorización automática y alertas de suscripciones.',
    benefits: ['Presupuestos por categoría', 'Detector de suscripciones', 'Educación financiera'],
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10'
  }
];

export function TargetAudienceSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-sm">
            <Users className="w-4 h-4 mr-2 inline" />
            Para Ti
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">¿Para Quién es </span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">EvoFinz?</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Una plataforma adaptada a diferentes perfiles financieros.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Card className="relative h-full p-8 bg-white border-slate-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group">
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 ${audience.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${audience.color} flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-3">{audience.title}</h3>
                    <p className="text-slate-600 mb-6">{audience.description}</p>

                    {/* Benefits */}
                    <ul className="space-y-3">
                      {audience.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${audience.color} flex items-center justify-center`}>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
