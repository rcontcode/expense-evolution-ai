import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
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

// Puzzle-like entrance animations - each card comes from a different direction
const puzzleVariants = [
  { initial: { opacity: 0, x: -100, y: -50, rotate: -15, scale: 0.5 }, direction: "top-left" },
  { initial: { opacity: 0, y: -80, rotate: 10, scale: 0.6 }, direction: "top" },
  { initial: { opacity: 0, x: 100, y: -50, rotate: 15, scale: 0.5 }, direction: "top-right" },
  { initial: { opacity: 0, x: -100, y: 50, rotate: 12, scale: 0.6 }, direction: "bottom-left" },
  { initial: { opacity: 0, y: 80, rotate: -8, scale: 0.5 }, direction: "bottom" },
  { initial: { opacity: 0, x: 100, y: 50, rotate: -12, scale: 0.5 }, direction: "bottom-right" }
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

// Floating particle component
function FloatingParticle({ color, delay, size }: { color: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ 
        background: color,
        width: size,
        height: size,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 0.6, 0],
        scale: [0, 1.5, 0],
        y: [0, -60, -120],
        x: [0, (Math.random() - 0.5) * 40]
      }}
      transition={{ 
        duration: 4,
        repeat: Infinity,
        delay,
        ease: "easeOut"
      }}
    />
  );
}

export function AnimatedStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-slate-50" />
      
      {/* Animated decorative orbs */}
      <motion.div 
        className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"
        animate={{ 
          x: [0, -30, 0],
          y: [0, 20, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            color={stats[i % stats.length].glowColor}
            delay={i * 0.8}
            size={4 + Math.random() * 6}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
            Números que{" "}
            <motion.span 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent inline-block"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              hablan solos
            </motion.span>
          </h2>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Resultados reales de usuarios que transformaron su gestión financiera
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          <AnimatePresence>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const variant = puzzleVariants[index];
              const isHovered = hoveredIndex === index;
              
              return (
                <motion.div
                  key={stat.label}
                  initial={variant.initial}
                  whileInView={{ 
                    opacity: 1, 
                    x: 0, 
                    y: 0, 
                    rotate: 0, 
                    scale: 1 
                  }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.15,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100,
                    damping: 12
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: [0, -2, 2, 0],
                    transition: { rotate: { duration: 0.3 } }
                  }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                  className="group cursor-pointer"
                >
                  <motion.div 
                    className="relative bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 h-full overflow-hidden"
                    animate={{
                      boxShadow: isHovered 
                        ? `0 20px 40px -10px ${stat.glowColor}` 
                        : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                  >
                    {/* Animated gradient accent bar with wave effect */}
                    <motion.div 
                      className={`absolute -top-0.5 left-0 right-0 h-2 bg-gradient-to-r ${stat.color}`}
                      initial={{ scaleX: 0, originX: 0.5 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.5, duration: 0.6, ease: "easeOut" }}
                    />
                    
                    {/* Continuous wave shimmer */}
                    <motion.div 
                      className="absolute -top-0.5 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 2 + index * 0.3,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Pulsing glow effect */}
                    <motion.div 
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-6 blur-lg rounded-full"
                      style={{ background: stat.glowColor }}
                      animate={{ 
                        opacity: [0.3, 0.7, 0.3],
                        scale: [0.8, 1.3, 0.8],
                        y: [0, -4, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.4,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Orbiting particles around icon on hover */}
                    <div className="relative">
                      {isHovered && (
                        <>
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full"
                              style={{ 
                                background: stat.glowColor,
                                left: "50%",
                                top: "50%"
                              }}
                              initial={{ opacity: 0 }}
                              animate={{
                                opacity: [0, 1, 0],
                                x: [0, Math.cos(i * 2.1) * 30, 0],
                                y: [0, Math.sin(i * 2.1) * 30, 0],
                                scale: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.3
                              }}
                            />
                          ))}
                        </>
                      )}
                      
                      {/* Icon with dynamic animations */}
                      <motion.div 
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-2.5 mb-4 shadow-lg mx-auto relative z-10`}
                        animate={{ 
                          y: [0, -6, 0],
                          rotateY: isHovered ? [0, 360] : 0
                        }}
                        transition={{ 
                          y: {
                            duration: 2.5 + index * 0.3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          },
                          rotateY: {
                            duration: 0.6
                          }
                        }}
                      >
                        <Icon className="w-full h-full text-white" />
                      </motion.div>
                    </div>

                    {/* Value with count-up and subtle pulse */}
                    <motion.div 
                      className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 text-center`}
                      animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <AnimatedCounter 
                        value={stat.value} 
                        suffix={stat.suffix} 
                        isInView={isInView} 
                      />
                    </motion.div>

                    {/* Label */}
                    <motion.p 
                      className="text-slate-600 text-sm font-medium text-center leading-tight"
                      animate={isHovered ? { y: [0, -2, 0] } : {}}
                    >
                      {stat.label}
                    </motion.p>
                    
                    {/* Corner accent that appears on hover */}
                    <motion.div
                      className={`absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br ${stat.color} rounded-tl-2xl`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: isHovered ? 1 : 0,
                        opacity: isHovered ? 0.3 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Trust badge with pulse ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-white text-sm relative"
            whileHover={{ scale: 1.05 }}
          >
            {/* Pulse rings */}
            <motion.div
              className="absolute inset-0 bg-slate-800 rounded-full"
              animate={{ 
                scale: [1, 1.3, 1.3],
                opacity: [0.5, 0, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full relative"
              animate={{ 
                scale: [1, 1.2, 1],
                boxShadow: [
                  "0 0 0 0 rgba(52, 211, 153, 0.4)",
                  "0 0 0 8px rgba(52, 211, 153, 0)",
                  "0 0 0 0 rgba(52, 211, 153, 0)"
                ]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity
              }}
            />
            <span className="text-slate-300 relative z-10">Actualizado en tiempo real</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
