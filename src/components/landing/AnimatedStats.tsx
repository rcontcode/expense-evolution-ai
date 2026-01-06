import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Receipt, Clock, TrendingUp, Users, Zap, Shield } from "lucide-react";

interface StatItem {
  icon: typeof Receipt;
  value: number;
  suffix: string;
  label: string;
  color: string;
  glowColor: string;
}

const stats: StatItem[] = [
  {
    icon: Receipt,
    value: 10000,
    suffix: "+",
    label: "Recibos procesados",
    color: "from-cyan-400 to-blue-500",
    glowColor: "rgba(34, 211, 238, 0.6)"
  },
  {
    icon: Clock,
    value: 5,
    suffix: "h/mes",
    label: "Tiempo ahorrado",
    color: "from-orange-400 to-red-500",
    glowColor: "rgba(251, 146, 60, 0.6)"
  },
  {
    icon: TrendingUp,
    value: 98,
    suffix: "%",
    label: "Precisión IA",
    color: "from-emerald-400 to-teal-500",
    glowColor: "rgba(52, 211, 153, 0.6)"
  },
  {
    icon: Users,
    value: 500,
    suffix: "+",
    label: "Beta testers activos",
    color: "from-purple-400 to-pink-500",
    glowColor: "rgba(192, 132, 252, 0.6)"
  },
  {
    icon: Zap,
    value: 3,
    suffix: "seg",
    label: "Procesamiento promedio",
    color: "from-amber-400 to-orange-500",
    glowColor: "rgba(251, 191, 36, 0.6)"
  },
  {
    icon: Shield,
    value: 100,
    suffix: "%",
    label: "Datos protegidos",
    color: "from-blue-400 to-indigo-500",
    glowColor: "rgba(96, 165, 250, 0.6)"
  }
];

function AnimatedCounter({ 
  value, 
  suffix, 
  isInView 
}: { 
  value: number; 
  suffix: string; 
  isInView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function AnimatedStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-slate-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            Números que{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              hablan solos
            </span>
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Resultados reales de usuarios que transformaron su gestión financiera
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="relative bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden">
                  {/* Animated gradient accent bar */}
                  <motion.div 
                    className={`absolute -top-0.5 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.color}`}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                  />
                  
                  {/* Shimmer effect on accent bar */}
                  <motion.div 
                    className="absolute -top-0.5 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3 + index * 0.5,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Glow effect */}
                  <motion.div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-4 blur-md rounded-full"
                    style={{ background: stat.glowColor }}
                    animate={{ 
                      opacity: [0.4, 0.8, 0.4],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Icon with floating animation */}
                  <motion.div 
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-2.5 mb-4 shadow-lg mx-auto relative`}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: "easeInOut"
                    }}
                  >
                    <Icon className="w-full h-full text-white" />
                  </motion.div>

                  {/* Value */}
                  <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 text-center`}>
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix} 
                      isInView={isInView} 
                    />
                  </div>

                  {/* Label */}
                  <p className="text-slate-600 text-sm font-medium text-center leading-tight">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-white text-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-slate-300">Actualizado en tiempo real</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
