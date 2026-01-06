import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, XCircle, CheckCircle2, ArrowRight,
  Receipt, Calculator, Clock, Brain
} from 'lucide-react';

const painPoints = [
  {
    before: 'Recibos perdidos en cajones',
    after: 'Escanea y organiza en segundos',
    icon: Receipt
  },
  {
    before: 'Horas en hojas de cálculo',
    after: 'Categorización automática con IA',
    icon: Calculator
  },
  {
    before: 'Estrés en época de impuestos',
    after: 'Reportes T2125 listos todo el año',
    icon: Clock
  },
  {
    before: 'Sin claridad financiera',
    after: 'Dashboard con insights en tiempo real',
    icon: Brain
  }
];

export function PainPointsSection() {
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
          <Badge className="mb-4 px-4 py-2 bg-orange-500/10 text-orange-600 border-orange-500/30 text-sm">
            <AlertTriangle className="w-4 h-4 mr-2 inline" />
            El Problema
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">Del Caos Financiero al </span>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Control Total</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            ¿Te identificas con alguno de estos problemas? EvoFinz los resuelve todos.
          </p>
        </motion.div>

        {/* Before/After Comparison */}
        <div className="max-w-4xl mx-auto space-y-6">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.before}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex flex-col md:flex-row items-center gap-4 bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100"
              >
                {/* Icon */}
                <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-slate-600" />
                </div>

                {/* Before */}
                <div className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="text-red-700 font-medium">{point.before}</span>
                </div>

                {/* Arrow */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="shrink-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </motion.div>

                {/* After */}
                <div className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700 font-medium">{point.after}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
