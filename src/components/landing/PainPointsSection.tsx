import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XCircle, CheckCircle2, ArrowRight,
  Receipt, Calculator, Clock, Brain, FileX, Wallet,
  TrendingDown, Users, Building2, Car, CreditCard,
  FileText, PiggyBank, BarChart3, Briefcase, Scale,
  Sparkles, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const categories = [
  {
    id: 'organization',
    name: 'Organización',
    icon: Receipt,
    color: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/30',
    painPoints: [
      { before: 'Recibos perdidos', after: 'Escanea en segundos', icon: Receipt },
      { before: 'Facturas sin clasificar', after: 'IA categoriza todo', icon: FileX },
      { before: 'Documentos duplicados', after: 'Detección automática', icon: FileText },
      { before: 'Contratos vencidos', after: 'Alertas de renovación', icon: FileText },
      { before: 'Info dispersa en apps', after: 'Dashboard unificado', icon: Brain },
      { before: 'Buscar toma horas', after: 'Búsqueda instantánea', icon: Clock },
    ]
  },
  {
    id: 'time',
    name: 'Tiempo',
    icon: Clock,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/30',
    painPoints: [
      { before: 'Horas en Excel', after: 'Reportes automáticos', icon: Calculator },
      { before: 'Conciliación manual', after: 'Match automático', icon: CreditCard },
      { before: 'Kilometraje a mano', after: 'GPS + cálculo auto', icon: Car },
      { before: 'Impuestos = semanas', after: 'T2125 en 1 click', icon: FileText },
      { before: 'Revisar uno por uno', after: 'Batch con IA', icon: Brain },
      { before: 'Actualizar manual', after: 'Sync en tiempo real', icon: BarChart3 },
    ]
  },
  {
    id: 'money',
    name: 'Dinero',
    icon: Wallet,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/30',
    painPoints: [
      { before: 'Deducciones olvidadas', after: 'Sugerencias auto', icon: TrendingDown },
      { before: 'Reembolsos perdidos', after: 'Tracking completo', icon: Briefcase },
      { before: 'Sin ver cash flow', after: 'Proyecciones IA', icon: BarChart3 },
      { before: 'Suscripciones ocultas', after: 'Detector activo', icon: CreditCard },
      { before: 'Deudas sin plan', after: 'Avalanche/Snowball', icon: Scale },
      { before: 'Ahorros estancados', after: 'Metas SMART', icon: PiggyBank },
    ]
  },
  {
    id: 'clients',
    name: 'Clientes',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/30',
    painPoints: [
      { before: 'Proyectos mezclados', after: 'Separación clara', icon: Users },
      { before: '¿Cuánto cobrar?', after: 'Rentabilidad real', icon: Calculator },
      { before: 'Contratos perdidos', after: 'Análisis IA', icon: FileText },
      { before: 'Pagos atrasados', after: 'Alertas de cobro', icon: Clock },
      { before: 'Reportes manuales', after: 'Export pro 1-click', icon: BarChart3 },
      { before: '¿Cliente rentable?', after: 'Analytics por cliente', icon: TrendingDown },
    ]
  },
  {
    id: 'taxes',
    name: 'Impuestos',
    icon: Building2,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
    painPoints: [
      { before: 'Estrés fiscal', after: 'Prep. continua', icon: Zap },
      { before: '¿Cuánto reservar?', after: 'Estimador real-time', icon: Calculator },
      { before: 'Fechas olvidadas', after: 'Calendario CRA', icon: Clock },
      { before: 'GST/HST manual', after: 'Cálculo automático', icon: Receipt },
      { before: 'Reportes incompatibles', after: '100% CRA Compliant', icon: CheckCircle2 },
      { before: '¿Optimizo bien?', after: 'Tips RRSP/TFSA', icon: PiggyBank },
    ]
  },
  {
    id: 'growth',
    name: 'Crecimiento',
    icon: Sparkles,
    color: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/30',
    painPoints: [
      { before: 'Sin claridad', after: 'Insights real-time', icon: Brain },
      { before: 'Decisiones a ciegas', after: 'Predicciones IA', icon: BarChart3 },
      { before: 'Net worth = ?', after: 'Tracking patrimonio', icon: Wallet },
      { before: 'Sin educación', after: 'Mentoría integrada', icon: Briefcase },
      { before: 'Metas abstractas', after: 'FIRE calculator', icon: TrendingDown },
      { before: 'Hábitos rotos', after: 'Gamificación', icon: Sparkles },
    ]
  },
];

export function PainPointsSection() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const currentCategory = categories[activeCategory];

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % categories.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 12000);
  };

  return (
    <section className="relative py-16 overflow-hidden bg-slate-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${currentCategory.color} opacity-10`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black" />
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-96 h-96 rounded-full bg-gradient-to-br ${currentCategory.color} opacity-20 blur-3xl`}
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -30, 50, 0],
            }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 25}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Compact Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2">
            <span className="text-red-400">Problema</span>
            <span className="mx-3 text-slate-500">→</span>
            <span className="text-emerald-400">Solución</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            36 frustraciones eliminadas en 6 categorías
          </p>
        </motion.div>

        {/* Category Pills */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap justify-center gap-2">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isActive = index === activeCategory;
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => handleCategoryClick(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg ${category.glow}` 
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.button
            onClick={() => {
              setActiveCategory((prev) => (prev - 1 + categories.length) % categories.length);
              setAutoPlay(false);
              setTimeout(() => setAutoPlay(true), 12000);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          
          <div className="flex items-center gap-1.5">
            {categories.map((cat, index) => (
              <motion.button
                key={index}
                onClick={() => handleCategoryClick(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeCategory ? 'w-6' : 'w-1.5'
                }`}
                style={{
                  background: index === activeCategory 
                    ? `linear-gradient(to right, var(--tw-gradient-stops))` 
                    : 'rgb(71, 85, 105)',
                  ['--tw-gradient-from' as string]: index === activeCategory ? categories[index].color.split(' ')[0].replace('from-', '').replace('-500', '') : undefined,
                }}
              >
                <div className={`h-full rounded-full bg-gradient-to-r ${index === activeCategory ? cat.color : ''}`} />
              </motion.button>
            ))}
          </div>
          
          <motion.button
            onClick={() => {
              setActiveCategory((prev) => (prev + 1) % categories.length);
              setAutoPlay(false);
              setTimeout(() => setAutoPlay(true), 12000);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Pain Points Grid - Horizontal Layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-6xl mx-auto"
          >
            {currentCategory.painPoints.map((point, index) => {
              const Icon = point.icon;
              
              return (
                <motion.div
                  key={point.before}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group"
                >
                  <div className={`relative flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-lg ${currentCategory.glow.replace('/30', '/10')}`}>
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${currentCategory.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Before */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span className="text-red-400 text-xs font-medium truncate">{point.before}</span>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex-shrink-0"
                    >
                      <ArrowRight className={`w-4 h-4 text-slate-500`} />
                    </motion.div>
                    
                    {/* After */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-400 text-xs font-semibold truncate">{point.after}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Compact Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-6 mt-10"
        >
          {[
            { value: '36', label: 'Problemas' },
            { value: '6', label: 'Categorías' },
            { value: '∞', label: 'Tiempo ahorrado' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <span className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${currentCategory.color} bg-clip-text text-transparent`}>
                {stat.value}
              </span>
              <p className="text-slate-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}