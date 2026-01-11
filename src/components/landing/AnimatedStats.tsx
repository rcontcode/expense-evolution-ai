import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { 
  Receipt, Clock, TrendingUp, Users, Zap, Shield, 
  BookOpen, Target, Wallet, PiggyBank, Trophy, Flame,
  ArrowRight, BarChart3, Sparkles
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatItem {
  icon: typeof Receipt;
  value: number;
  suffix: string;
  label: string;
  color: string;
  glowColor: string;
  highlight?: string;
}

interface SetTitle {
  title: string;
  subtitle: string;
}

// Extended stats with more interesting data points - localized
const getAllStats = (language: string): StatItem[][] => [
  // Set 1 - Core metrics
  [
    { icon: Receipt, value: 10000, suffix: "+", label: language === 'es' ? "Recibos procesados" : "Receipts processed", color: "from-cyan-400 to-blue-500", glowColor: "rgba(34, 211, 238, 0.6)" },
    { icon: Clock, value: 5, suffix: language === 'es' ? "h/mes" : "h/mo", label: language === 'es' ? "Tiempo ahorrado" : "Time saved", color: "from-orange-400 to-red-500", glowColor: "rgba(251, 146, 60, 0.6)" },
    { icon: TrendingUp, value: 98, suffix: "%", label: language === 'es' ? "Precisión Smart" : "Smart accuracy", color: "from-emerald-400 to-teal-500", glowColor: "rgba(52, 211, 153, 0.6)" },
    { icon: Users, value: 500, suffix: "+", label: "Beta testers", color: "from-purple-400 to-pink-500", glowColor: "rgba(192, 132, 252, 0.6)" },
    { icon: Zap, value: 3, suffix: language === 'es' ? "seg" : "sec", label: language === 'es' ? "Procesamiento" : "Processing", color: "from-amber-400 to-orange-500", glowColor: "rgba(251, 191, 36, 0.6)" },
    { icon: Shield, value: 100, suffix: "%", label: language === 'es' ? "Datos seguros" : "Secure data", color: "from-blue-400 to-indigo-500", glowColor: "rgba(96, 165, 250, 0.6)" },
  ],
  // Set 2 - Education & Growth
  [
    { icon: BookOpen, value: 847, suffix: "+", label: language === 'es' ? "Libros trackeados" : "Books tracked", color: "from-violet-400 to-purple-600", glowColor: "rgba(167, 139, 250, 0.6)", highlight: language === 'es' ? "Mentoría" : "Mentorship" },
    { icon: Flame, value: 156, suffix: "%", label: language === 'es' ? "Mejora en lectura" : "Reading improvement", color: "from-rose-400 to-red-500", glowColor: "rgba(251, 113, 133, 0.6)", highlight: "+156%" },
    { icon: Target, value: 2340, suffix: "+", label: language === 'es' ? "Metas SMART creadas" : "SMART goals created", color: "from-teal-400 to-cyan-500", glowColor: "rgba(45, 212, 191, 0.6)" },
    { icon: Trophy, value: 89, suffix: "%", label: language === 'es' ? "Metas alcanzadas" : "Goals achieved", color: "from-amber-400 to-yellow-500", glowColor: "rgba(251, 191, 36, 0.6)" },
    { icon: BarChart3, value: 42, suffix: language === 'es' ? "días" : "days", label: language === 'es' ? "Streak promedio" : "Avg streak", color: "from-green-400 to-emerald-500", glowColor: "rgba(74, 222, 128, 0.6)" },
    { icon: Sparkles, value: 15, suffix: "K", label: language === 'es' ? "XP ganados total" : "Total XP earned", color: "from-pink-400 to-rose-500", glowColor: "rgba(244, 114, 182, 0.6)" },
  ],
  // Set 3 - Cashflow & Investments
  [
    { icon: Wallet, value: 234, suffix: "+", label: language === 'es' ? "E → S transiciones" : "E → S transitions", color: "from-blue-400 to-cyan-500", glowColor: "rgba(96, 165, 250, 0.6)", highlight: language === 'es' ? "Cuadrante" : "Quadrant" },
    { icon: ArrowRight, value: 89, suffix: "+", label: language === 'es' ? "S → B transiciones" : "S → B transitions", color: "from-cyan-400 to-teal-500", glowColor: "rgba(34, 211, 238, 0.6)" },
    { icon: TrendingUp, value: 156, suffix: "+", label: language === 'es' ? "B → I transiciones" : "B → I transitions", color: "from-emerald-400 to-green-500", glowColor: "rgba(52, 211, 153, 0.6)", highlight: language === 'es' ? "Inversores" : "Investors" },
    { icon: PiggyBank, value: 67, suffix: "%", label: language === 'es' ? "Ahorro promedio" : "Avg savings", color: "from-purple-400 to-violet-500", glowColor: "rgba(192, 132, 252, 0.6)" },
    { icon: Target, value: 1.2, suffix: "M", label: language === 'es' ? "Patrimonio total" : "Total net worth", color: "from-amber-400 to-orange-500", glowColor: "rgba(251, 191, 36, 0.6)" },
    { icon: Flame, value: 45, suffix: "%", label: language === 'es' ? "Libertad financiera" : "Financial freedom", color: "from-rose-400 to-pink-500", glowColor: "rgba(251, 113, 133, 0.6)" },
  ]
];

const getSetTitles = (language: string): SetTitle[] => [
  { 
    title: language === 'es' ? "Métricas Core" : "Core Metrics", 
    subtitle: language === 'es' ? "Rendimiento del sistema" : "System performance" 
  },
  { 
    title: language === 'es' ? "Educación & Crecimiento" : "Education & Growth", 
    subtitle: language === 'es' ? "Mentoría financiera" : "Financial mentorship" 
  },
  { 
    title: language === 'es' ? "Cashflow & Inversiones" : "Cashflow & Investments", 
    subtitle: language === 'es' ? "Cuadrante del dinero" : "Money quadrant" 
  }
];

function AnimatedCounter({ 
  value, 
  suffix, 
  isActive 
}: { 
  value: number; 
  suffix: string; 
  isActive: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCount(0);
      return;
    }

    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isActive, value]);

  const displayValue = value >= 1000 
    ? count.toLocaleString() 
    : Number.isInteger(value) 
      ? Math.floor(count).toString()
      : count.toFixed(1);

  return (
    <span className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
}

// Floating orb component
function FloatingOrb({ color, size, delay, x, y }: { 
  color: string; 
  size: number; 
  delay: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-2xl pointer-events-none"
      style={{ 
        background: color,
        width: size,
        height: size,
        left: x,
        top: y,
        opacity: 0.4
      }}
      animate={{ 
        x: [0, 30, -20, 0],
        y: [0, -40, 20, 0],
        scale: [1, 1.2, 0.9, 1],
        opacity: [0.3, 0.5, 0.3]
      }}
      transition={{ 
        duration: 8 + delay,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );
}

export function AnimatedStats() {
  const { language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });
  const [currentSet, setCurrentSet] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const allStats = getAllStats(language);
  const setTitles = getSetTitles(language);

  // Auto-rotate through stat sets - 8s optimal for 6 stats with animated counters
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSet(prev => (prev + 1) % allStats.length);
        setIsTransitioning(false);
      }, 400);
    }, 8000);

    return () => clearInterval(interval);
  }, [isInView, allStats.length]);

  const currentStats = allStats[currentSet];
  const currentTitle = setTitles[currentSet];

  // Color cycling for background
  const bgColors = [
    "from-cyan-200/30 via-blue-200/20 to-purple-200/30",
    "from-violet-200/30 via-pink-200/20 to-rose-200/30",
    "from-emerald-200/30 via-teal-200/20 to-cyan-200/30"
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Animated gradient background that changes with sets */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${bgColors[currentSet]}`}
        key={currentSet}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      
      {/* Animated floating orbs */}
      <FloatingOrb color={currentStats[0]?.glowColor || "rgba(34, 211, 238, 0.4)"} size={300} delay={0} x="10%" y="20%" />
      <FloatingOrb color={currentStats[2]?.glowColor || "rgba(52, 211, 153, 0.4)"} size={250} delay={2} x="70%" y="60%" />
      <FloatingOrb color={currentStats[4]?.glowColor || "rgba(251, 191, 36, 0.4)"} size={200} delay={4} x="40%" y="10%" />

      {/* Rotating decorative ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-dashed border-slate-300/50 rounded-full pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-dotted border-slate-400/30 rounded-full pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Dynamic title that changes with sets */}
        <div className="text-center mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSet}
              initial={{ opacity: 0, y: 20, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, rotateX: 90 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2">
                <motion.span
                  className={`bg-gradient-to-r ${currentStats[0]?.color} bg-clip-text text-transparent inline-block`}
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  {currentTitle.title}
                </motion.span>
              </h2>
              <p className="text-muted-foreground text-lg">{currentTitle.subtitle}</p>
            </motion.div>
          </AnimatePresence>
          
          {/* Set indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {allStats.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentSet(index);
                    setIsTransitioning(false);
                  }, 300);
                }}
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                  index === currentSet ? "w-8" : "w-2"
                }`}
                style={{ 
                  background: index === currentSet 
                    ? `linear-gradient(90deg, ${allStats[index][0].glowColor}, ${allStats[index][2].glowColor})`
                    : "rgba(148, 163, 184, 0.4)"
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {index === currentSet && (
                  <motion.div
                    className="absolute inset-0 bg-white/50"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats carousel with 3D rotation effect */}
        <motion.div 
          className="perspective-1000"
          animate={{ 
            rotateY: isTransitioning ? [0, 5, 0] : 0,
            scale: isTransitioning ? [1, 0.98, 1] : 1
          }}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSet}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
              initial={{ opacity: 0, rotateY: -15, x: 100 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              exit={{ opacity: 0, rotateY: 15, x: -100 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
              {currentStats.map((stat, index) => {
                const Icon = stat.icon;
                const isHovered = hoveredIndex === index;
                
                // Different entrance animations for each card
                const entranceVariants = [
                  { initial: { opacity: 0, scale: 0, rotate: -180 } },
                  { initial: { opacity: 0, y: -100, rotate: 45 } },
                  { initial: { opacity: 0, x: 100, rotate: -45 } },
                  { initial: { opacity: 0, y: 100, rotate: -90 } },
                  { initial: { opacity: 0, x: -100, rotate: 90 } },
                  { initial: { opacity: 0, scale: 0, rotate: 180 } }
                ];
                
                return (
                  <motion.div
                    key={`${currentSet}-${index}`}
                    initial={entranceVariants[index].initial}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      y: 0, 
                      scale: 1, 
                      rotate: 0 
                    }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.6,
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }}
                    whileHover={{ 
                      scale: 1.08,
                      rotate: [0, -3, 3, 0],
                      transition: { rotate: { duration: 0.4 } }
                    }}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    className="group cursor-pointer"
                  >
                    <motion.div 
                      className="relative bg-card/90 text-card-foreground backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-border/60 h-full overflow-hidden"
                      animate={{
                        boxShadow: isHovered 
                          ? `0 25px 50px -12px ${stat.glowColor}` 
                          : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        borderColor: isHovered ? stat.glowColor : "hsl(var(--border) / 0.6)"
                      }}
                    >
                      {/* Animated gradient bar with color cycling */}
                      <motion.div 
                        className={`absolute -top-0.5 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.color}`}
                        initial={{ scaleX: 0 }}
                        animate={{ 
                          scaleX: 1,
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                        }}
                        transition={{ 
                          scaleX: { delay: index * 0.1, duration: 0.5 },
                          backgroundPosition: { duration: 3, repeat: Infinity }
                        }}
                        style={{ backgroundSize: "200% 200%", transformOrigin: "left" }}
                      />
                      
                      {/* Multiple shimmer waves */}
                      {[0, 1].map((i) => (
                        <motion.div 
                          key={i}
                          className="absolute -top-0.5 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 2 + index * 0.2 + i * 0.5,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                      
                      {/* Pulsing glow */}
                      <motion.div 
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 blur-xl rounded-full"
                        style={{ background: stat.glowColor }}
                        animate={{ 
                          opacity: [0.2, 0.6, 0.2],
                          scale: [0.7, 1.2, 0.7]
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                      />
                      
                      {/* Highlight badge */}
                      {stat.highlight && (
                        <motion.div
                          className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${stat.color} shadow-lg`}
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                        >
                          {stat.highlight}
                        </motion.div>
                      )}
                      
                      {/* Icon container with 3D flip on hover */}
                      <div className="relative mb-3">
                        <motion.div 
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} p-2 shadow-lg mx-auto relative`}
                          animate={{ 
                            y: [0, -5, 0],
                            rotateY: isHovered ? 360 : 0
                          }}
                          transition={{ 
                            y: { duration: 2 + index * 0.2, repeat: Infinity, ease: "easeInOut" },
                            rotateY: { duration: 0.6 }
                          }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <Icon className="w-full h-full text-white" />
                          
                          {/* Icon glow ring */}
                          <motion.div
                            className="absolute inset-0 rounded-xl"
                            style={{ boxShadow: `0 0 20px ${stat.glowColor}` }}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </motion.div>
                        
                        {/* Orbiting dots on hover */}
                        {isHovered && (
                          <>
                            {[0, 1, 2, 3].map((i) => (
                              <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full"
                                style={{ 
                                  background: stat.glowColor,
                                  left: "50%",
                                  top: "50%"
                                }}
                                animate={{
                                  x: Math.cos((i * Math.PI) / 2) * 25,
                                  y: Math.sin((i * Math.PI) / 2) * 25,
                                  opacity: [0, 1, 0],
                                  scale: [0.5, 1, 0.5]
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: i * 0.15
                                }}
                              />
                            ))}
                          </>
                        )}
                      </div>

                      {/* Value with count-up */}
                      <motion.div 
                        className="text-2xl md:text-3xl font-black text-card-foreground mb-1 text-center"
                        animate={{ 
                          scale: isHovered ? [1, 1.1, 1] : 1
                        }}
                        transition={{ 
                          scale: { duration: 0.3 }
                        }}
                      >
                        <AnimatedCounter 
                          value={stat.value} 
                          suffix={stat.suffix} 
                          isActive={isInView && !isTransitioning}
                        />
                      </motion.div>

                      {/* Label */}
                      <motion.p 
                        className="text-muted-foreground text-xs font-medium text-center leading-tight"
                        animate={isHovered ? { y: [0, -2, 0] } : {}}
                      >
                        {stat.label}
                      </motion.p>
                      
                      {/* Bottom corner accent */}
                      <motion.div
                        className={`absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br ${stat.color} rounded-tl-2xl opacity-20`}
                        animate={{ 
                          scale: isHovered ? 1.5 : 1,
                          opacity: isHovered ? 0.4 : 0.2
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation arrows */}
        <div className="flex justify-center gap-4 mt-8">
          <motion.button
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentSet(prev => prev === 0 ? allStats.length - 1 : prev - 1);
                setIsTransitioning(false);
              }, 300);
            }}
            className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground border border-border"
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </motion.button>
          <motion.button
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentSet(prev => (prev + 1) % allStats.length);
                setIsTransitioning(false);
              }, 300);
            }}
            className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground border border-border"
            whileHover={{ scale: 1.1, x: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Trust badge with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <motion.div 
            className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-800/90 backdrop-blur-sm rounded-full text-white text-sm relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            
            {/* Animated dot */}
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full relative"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 bg-emerald-400 rounded-full"
                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
            
            <span className="text-slate-200 relative z-10">
              {language === 'es' ? 'Datos actualizados cada ' : 'Data updated every '}
              <motion.span 
                className="text-emerald-400 font-semibold"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >{language === 'es' ? '6 segundos' : '6 seconds'}</motion.span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}