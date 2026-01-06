import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XCircle, CheckCircle2, ArrowRight,
  Receipt, Calculator, Clock, Brain, Wallet,
  Users, Building2, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

const categories = [
  {
    id: 'organization',
    name: 'Organización',
    icon: Receipt,
    emoji: '📁',
    color: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/40',
    painPoints: [
      { before: '📄 Recibos perdidos en cajones', after: '📱 Escanea y organiza en segundos' },
      { before: '😵 Facturas sin clasificar', after: '🤖 Categorización automática' },
      { before: '📋 Documentos duplicados', after: '🔍 Detección inteligente' },
      { before: '⏰ Contratos vencidos sin aviso', after: '🔔 Alertas de renovación' },
      { before: '🗂️ Información dispersa', after: '📊 Dashboard unificado' },
      { before: '🔎 Buscar facturas = horas', after: '⚡ Búsqueda instantánea' },
    ]
  },
  {
    id: 'time',
    name: 'Tiempo',
    icon: Clock,
    emoji: '⏱️',
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/40',
    painPoints: [
      { before: '📊 Horas en hojas de cálculo', after: '✨ Reportes automáticos' },
      { before: '🏦 Conciliación bancaria manual', after: '🔗 Match automático' },
      { before: '🚗 Kilometraje a mano', after: '📍 GPS + cálculo automático' },
      { before: '📅 Preparar impuestos = semanas', after: '👆 T2125 listo en 1 click' },
      { before: '👀 Revisar gastos uno por uno', after: '🚀 Procesamiento batch inteligente' },
      { before: '✏️ Actualizar presupuestos manual', after: '🔄 Sync en tiempo real' },
    ]
  },
  {
    id: 'money',
    name: 'Dinero',
    icon: Wallet,
    emoji: '💰',
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/40',
    painPoints: [
      { before: '💸 Deducciones fiscales olvidadas', after: '💡 Sugerencias automáticas' },
      { before: '🧾 Reembolsos no reclamados', after: '📋 Tracking por proyecto' },
      { before: '❓ Sin visibilidad del cash flow', after: '📈 Proyecciones predictivas' },
      { before: '💳 Suscripciones olvidadas', after: '🔔 Detector de suscripciones' },
      { before: '😰 Deudas sin estrategia', after: '🎯 Plan avalanche/snowball' },
      { before: '🐌 Ahorros que no crecen', after: '🎯 Metas SMART visuales' },
    ]
  },
  {
    id: 'clients',
    name: 'Clientes',
    icon: Users,
    emoji: '👥',
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/40',
    painPoints: [
      { before: '🔀 Confusión entre proyectos', after: '📂 Separación clara por cliente' },
      { before: '🤷 No saber cuánto cobrar', after: '💵 Rentabilidad en tiempo real' },
      { before: '📁 Contratos perdidos', after: '🔍 Análisis automático de términos' },
      { before: '⏳ Clientes con pagos atrasados', after: '🔔 Alertas de cobro' },
      { before: '✍️ Reportes manuales', after: '📤 Exportación profesional' },
      { before: '❓ Sin saber quién es rentable', after: '📊 Analytics por cliente' },
    ]
  },
  {
    id: 'taxes',
    name: 'Impuestos',
    icon: Building2,
    emoji: '🏛️',
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/40',
    painPoints: [
      { before: '😱 Estrés en época de taxes', after: '😌 Preparación continua' },
      { before: '🤔 No saber cuánto reservar', after: '🧮 Estimador en tiempo real' },
      { before: '📆 Fechas límite olvidadas', after: '🗓️ Calendario fiscal CRA' },
      { before: '🧮 GST/HST calculado a mano', after: '⚡ Cálculo automático' },
      { before: '❌ Reportes incompatibles', after: '✅ 100% CRA Compliant' },
      { before: '💭 Sin optimizar impuestos', after: '💎 Tips RRSP/TFSA' },
    ]
  },
  {
    id: 'growth',
    name: 'Crecimiento',
    icon: Sparkles,
    emoji: '🚀',
    color: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/40',
    painPoints: [
      { before: '🌫️ Sin claridad financiera', after: '🎯 Dashboard con insights' },
      { before: '🎲 Decisiones por intuición', after: '🧠 Analytics y predicciones Smart' },
      { before: '❓ Net worth desconocido', after: '📊 Tracking de patrimonio' },
      { before: '📚 Sin educación financiera', after: '🎓 Mentoría integrada' },
      { before: '☁️ Metas abstractas', after: '🔥 FIRE calculator' },
      { before: '😔 Hábitos inconsistentes', after: '🎮 Gamificación motivadora' },
    ]
  },
];

export function PainPointsSection() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const currentCategory = categories[activeCategory];

  // Auto-rotation - 10s optimal for 6 before/after comparisons
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % categories.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 20000);
  };

  return (
    <section className="relative py-20 overflow-hidden bg-slate-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 bg-gradient-to-br ${currentCategory.color} opacity-15`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-black" />
      </div>

      {/* Floating orbs with glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${currentCategory.color} blur-3xl`}
            animate={{
              x: [0, 60, -40, 0],
              y: [0, -40, 60, 0],
              opacity: [0.15, 0.25, 0.15],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 150 + i * 80,
              height: 150 + i * 80,
              left: `${5 + i * 20}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
          />
        ))}
      </div>

      {/* Sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`spark-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -100],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${50 + Math.random() * 50}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <motion.span 
            className="text-4xl mb-4 block"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {currentCategory.emoji}
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2">
            {currentCategory.name}
          </h2>
          <p className="text-slate-400">
            6 transformaciones que cambiarán tu vida
          </p>
        </motion.div>

        {/* Category Pills */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center gap-2 p-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
            {categories.map((category, index) => {
              const isActive = index === activeCategory;
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => handleCategoryClick(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? `bg-gradient-to-r ${category.color} text-white shadow-xl ${category.glow}` 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-lg">{category.emoji}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <motion.button
            onClick={() => {
              setActiveCategory((prev) => (prev - 1 + categories.length) % categories.length);
              setAutoPlay(false);
              setTimeout(() => setAutoPlay(true), 20000);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentCategory.color} flex items-center justify-center text-white shadow-lg ${currentCategory.glow}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-2">
            {categories.map((cat, index) => (
              <motion.button
                key={index}
                onClick={() => handleCategoryClick(index)}
                whileHover={{ scale: 1.3 }}
                className={`rounded-full transition-all duration-500 ${
                  index === activeCategory 
                    ? `w-10 h-3 bg-gradient-to-r ${cat.color} shadow-lg ${cat.glow}` 
                    : 'w-3 h-3 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
          
          <motion.button
            onClick={() => {
              setActiveCategory((prev) => (prev + 1) % categories.length);
              setAutoPlay(false);
              setTimeout(() => setAutoPlay(true), 20000);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentCategory.color} flex items-center justify-center text-white shadow-lg ${currentCategory.glow}`}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Before / After Headers */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-4">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500/20 to-rose-500/20 border-2 border-red-500/40 shadow-lg shadow-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-black text-xl tracking-wide">ANTES</span>
                <span className="text-2xl">😰</span>
              </div>
            </motion.div>
            
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl"
              >
                ⚡
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                <span className="text-2xl">🎉</span>
                <span className="text-emerald-400 font-black text-xl tracking-wide">AHORA</span>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Pain Points List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-3"
          >
            {currentCategory.painPoints.map((point, index) => (
              <motion.div
                key={point.before}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="group"
              >
                <div className={`grid grid-cols-[1fr_60px_1fr] items-center gap-4 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 backdrop-blur-sm border border-slate-700/50 hover:border-slate-500/50 transition-all duration-500 hover:shadow-2xl ${currentCategory.glow}`}>
                  {/* Before */}
                  <div className="flex items-center justify-center">
                    <p className="text-red-300 text-sm md:text-base lg:text-lg font-medium text-center leading-snug">
                      {point.before}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ x: [0, 8, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentCategory.color} flex items-center justify-center shadow-xl ${currentCategory.glow}`}
                    >
                      <ArrowRight className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                  
                  {/* After */}
                  <div className="flex items-center justify-center">
                    <p className="text-emerald-300 text-sm md:text-base lg:text-lg font-bold text-center leading-snug">
                      {point.after}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mt-12"
        >
          {[
            { value: '36', label: 'Problemas', emoji: '🎯' },
            { value: '6', label: 'Categorías', emoji: '📊' },
            { value: '∞', label: 'Tiempo ahorrado', emoji: '⏰' },
          ].map((stat) => (
            <motion.div 
              key={stat.label}
              whileHover={{ scale: 1.1, y: -5 }}
              className="text-center px-6 py-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50"
            >
              <span className="text-2xl block mb-1">{stat.emoji}</span>
              <span className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${currentCategory.color} bg-clip-text text-transparent`}>
                {stat.value}
              </span>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}