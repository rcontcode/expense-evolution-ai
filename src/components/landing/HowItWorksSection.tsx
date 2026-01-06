import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Camera, Zap, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'Captura',
    description: 'Escanea recibos, dicta gastos o importa desde tu banco. La IA hace el resto.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    number: '02',
    icon: Zap,
    title: 'Automatiza',
    description: 'Categorización automática, detección de suscripciones y alertas inteligentes.',
    color: 'from-orange-500 to-amber-500'
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Optimiza',
    description: 'Visualiza tu patrimonio, maximiza deducciones y alcanza tus metas financieras.',
    color: 'from-emerald-500 to-teal-500'
  }
];

export function HowItWorksSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-violet-500/20 text-violet-400 border-violet-500/30 text-sm">
            <Lightbulb className="w-4 h-4 mr-2 inline" />
            Así de Simple
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-white">Cómo Funciona </span>
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">EvoFinz</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Tres simples pasos para tomar el control de tus finanzas.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-orange-500 to-emerald-500 hidden md:block -translate-y-1/2 opacity-30" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:-translate-y-2">
                    {/* Step Number */}
                    <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-black text-lg">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg mx-auto`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white text-center mb-3">{step.title}</h3>
                    <p className="text-slate-400 text-center">{step.description}</p>
                  </div>

                  {/* Arrow connector (hidden on last item and mobile) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 -translate-y-1/2 z-10">
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-slate-600"
                      >
                        →
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
