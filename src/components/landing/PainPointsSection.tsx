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
    glow: 'shadow-rose-500/25',
    painPoints: [
      { before: 'Recibos perdidos en cajones', after: 'Escanea y organiza en segundos' },
      { before: 'Facturas sin clasificar', after: 'Categorización automática con IA' },
      { before: 'Documentos duplicados', after: 'Detección inteligente' },
      { before: 'Contratos vencidos sin aviso', after: 'Alertas de renovación' },
      { before: 'Información dispersa', after: 'Dashboard unificado' },
      { before: 'Buscar facturas toma horas', after: 'Búsqueda instantánea' },
    ]
  },
  {
    id: 'time',
    name: 'Tiempo',
    icon: Clock,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/25',
    painPoints: [
      { before: 'Horas en hojas de cálculo', after: 'Reportes automáticos' },
      { before: 'Conciliación bancaria manual', after: 'Match automático' },
      { before: 'Kilometraje calculado a mano', after: 'GPS con cálculo automático' },
      { before: 'Preparar impuestos = semanas', after: 'T2125 listo en 1 click' },
      { before: 'Revisar gastos uno por uno', after: 'Procesamiento batch IA' },
      { before: 'Actualizar presupuestos manual', after: 'Sync en tiempo real' },
    ]
  },
  {
    id: 'money',
    name: 'Dinero',
    icon: Wallet,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/25',
    painPoints: [
      { before: 'Deducciones fiscales olvidadas', after: 'Sugerencias automáticas' },
      { before: 'Reembolsos no reclamados', after: 'Tracking por proyecto' },
      { before: 'Sin visibilidad del cash flow', after: 'Proyecciones predictivas' },
      { before: 'Suscripciones olvidadas', after: 'Detector de suscripciones' },
      { before: 'Deudas sin estrategia', after: 'Plan avalanche/snowball' },
      { before: 'Ahorros que no crecen', after: 'Metas SMART visuales' },
    ]
  },
  {
    id: 'clients',
    name: 'Clientes',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/25',
    painPoints: [
      { before: 'Confusión entre proyectos', after: 'Separación clara por cliente' },
      { before: 'No saber cuánto cobrar', after: 'Rentabilidad en tiempo real' },
      { before: 'Contratos perdidos', after: 'Análisis IA de términos' },
      { before: 'Clientes con pagos atrasados', after: 'Alertas de cobro' },
      { before: 'Reportes manuales', after: 'Exportación profesional' },
      { before: 'Sin saber quién es rentable', after: 'Analytics por cliente' },
    ]
  },
  {
    id: 'taxes',
    name: 'Impuestos',
    icon: Building2,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/25',
    painPoints: [
      { before: 'Estrés en época de taxes', after: 'Preparación continua' },
      { before: 'No saber cuánto reservar', after: 'Estimador en tiempo real' },
      { before: 'Fechas límite olvidadas', after: 'Calendario fiscal CRA' },
      { before: 'GST/HST calculado a mano', after: 'Cálculo automático' },
      { before: 'Reportes incompatibles', after: '100% CRA Compliant' },
      { before: 'Sin optimizar impuestos', after: 'Tips RRSP/TFSA' },
    ]
  },
  {
    id: 'growth',
    name: 'Crecimiento',
    icon: Sparkles,
    color: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/25',
    painPoints: [
      { before: 'Sin claridad financiera', after: 'Dashboard con insights' },
      { before: 'Decisiones por intuición', after: 'Analytics y predicciones IA' },
      { before: 'Net worth desconocido', after: 'Tracking de patrimonio' },
      { before: 'Sin educación financiera', after: 'Mentoría integrada' },
      { before: 'Metas abstractas', after: 'FIRE calculator' },
      { before: 'Hábitos inconsistentes', after: 'Gamificación motivadora' },
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
            className={`absolute w-72 h-72 rounded-full bg-gradient-to-br ${currentCategory.color} opacity-20 blur-3xl`}
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -20, 40, 0],
            }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              left: `${10 + i * 35}%`,
              top: `${5 + i * 20}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
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
                      ? `bg-gradient-to-r ${category.color} text-white shadow-xl ${category.glow}` 
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
        <div className="flex items-center justify-center gap-3 mb-8">
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
              <button
                key={index}
                onClick={() => handleCategoryClick(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeCategory ? `w-6 bg-gradient-to-r ${cat.color}` : 'w-1.5 bg-slate-600'
                }`}
              />
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

        {/* Before / After Comparison */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            {/* Headers */}
            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-4">
              {/* Before Header */}
              <div className="text-center">
                <motion.div 
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-bold text-lg">ANTES</span>
                </motion.div>
              </div>
              
              {/* After Header */}
              <div className="text-center">
                <motion.div 
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-lg">CON EVOFINZ</span>
                </motion.div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {currentCategory.painPoints.map((point, index) => (
                <motion.div
                  key={point.before}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="group"
                >
                  <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4 p-3 md:p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-lg ${currentCategory.glow}`}>
                    {/* Before */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                      </div>
                      <span className="text-red-300/90 text-xs md:text-sm font-medium line-clamp-2">{point.before}</span>
                    </div>
                    
                    {/* Animated Arrow */}
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r ${currentCategory.color} flex items-center justify-center shadow-lg ${currentCategory.glow}`}
                    >
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </motion.div>
                    
                    {/* After */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                      </div>
                      <span className="text-emerald-300 text-xs md:text-sm font-semibold line-clamp-2">{point.after}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex justify-center items-center gap-8 mt-10"
        >
          {[
            { value: '36', label: 'Problemas resueltos' },
            { value: '6', label: 'Categorías' },
            { value: '100%', label: 'Automatizado' },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center">
              <span className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${currentCategory.color} bg-clip-text text-transparent`}>
                {stat.value}
              </span>
              <p className="text-slate-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}