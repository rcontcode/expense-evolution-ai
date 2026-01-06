import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XCircle, CheckCircle2, ArrowDown,
  Receipt, Calculator, Clock, Brain, FileX, Wallet,
  TrendingDown, Users, Building2, Car, CreditCard,
  FileText, PiggyBank, BarChart3, Briefcase, Scale,
  Sparkles, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

type PainPointCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  painPoints: {
    before: string;
    after: string;
    icon: React.ElementType;
  }[];
};

const categories: PainPointCategory[] = [
  {
    id: 'organization',
    name: 'Organización',
    icon: Receipt,
    painPoints: [
      { before: 'Recibos perdidos en cajones', after: 'Escanea y organiza en segundos', icon: Receipt },
      { before: 'Facturas sin clasificar por meses', after: 'Categorización automática con IA', icon: FileX },
      { before: 'Documentos duplicados sin control', after: 'Detección inteligente de duplicados', icon: FileText },
      { before: 'Caos de contratos y vencimientos', after: 'Alertas automáticas de renovación', icon: FileText },
      { before: 'Información dispersa en apps', after: 'Todo centralizado en un dashboard', icon: Brain },
      { before: 'Buscar facturas toma horas', after: 'Búsqueda instantánea por cualquier campo', icon: Clock },
    ]
  },
  {
    id: 'time',
    name: 'Tiempo',
    icon: Clock,
    painPoints: [
      { before: 'Horas en hojas de cálculo', after: 'Reportes automáticos al instante', icon: Calculator },
      { before: 'Conciliación bancaria manual', after: 'Match automático de transacciones', icon: CreditCard },
      { before: 'Cálculos de kilometraje a mano', after: 'Rutas GPS con cálculo automático', icon: Car },
      { before: 'Preparar impuestos toma semanas', after: 'T2125 listo en un click', icon: FileText },
      { before: 'Revisar cada gasto uno por uno', after: 'Procesamiento batch con IA', icon: Brain },
      { before: 'Actualizar presupuestos manualmente', after: 'Sincronización en tiempo real', icon: BarChart3 },
    ]
  },
  {
    id: 'money',
    name: 'Dinero',
    icon: Wallet,
    painPoints: [
      { before: 'Deducciones fiscales olvidadas', after: 'Sugerencias automáticas de deducciones', icon: TrendingDown },
      { before: 'Gastos reembolsables no reclamados', after: 'Tracking por cliente y proyecto', icon: Briefcase },
      { before: 'Sin visibilidad del flujo de caja', after: 'Proyecciones y alertas predictivas', icon: BarChart3 },
      { before: 'Suscripciones olvidadas que drenan', after: 'Detector de suscripciones activo', icon: CreditCard },
      { before: 'Deudas sin estrategia de pago', after: 'Plan optimizado avalanche/snowball', icon: Scale },
      { before: 'Ahorros sin crecer', after: 'Metas SMART con seguimiento visual', icon: PiggyBank },
    ]
  },
  {
    id: 'clients',
    name: 'Clientes',
    icon: Users,
    painPoints: [
      { before: 'Confusión entre proyectos', after: 'Separación clara por cliente', icon: Users },
      { before: 'Facturar sin saber cuánto cobrar', after: 'Rentabilidad por proyecto en tiempo real', icon: Calculator },
      { before: 'Contratos perdidos o sin revisar', after: 'Análisis IA de términos clave', icon: FileText },
      { before: 'Clientes con pagos atrasados', after: 'Alertas y seguimiento de cobros', icon: Clock },
      { before: 'Reportes manuales para clientes', after: 'Exportación profesional en un click', icon: BarChart3 },
      { before: 'Sin saber qué cliente es más rentable', after: 'Analytics de rentabilidad por cliente', icon: TrendingDown },
    ]
  },
  {
    id: 'taxes',
    name: 'Impuestos',
    icon: Building2,
    painPoints: [
      { before: 'Estrés en época de impuestos', after: 'Preparación continua todo el año', icon: Zap },
      { before: 'No saber cuánto reservar', after: 'Estimador de impuestos en tiempo real', icon: Calculator },
      { before: 'Olvidar fechas límite del CRA', after: 'Calendario fiscal con recordatorios', icon: Clock },
      { before: 'GST/HST calculado a mano', after: 'Cálculo automático por transacción', icon: Receipt },
      { before: 'Reportes incompatibles con CRA', after: '100% CRA Compliant garantizado', icon: CheckCircle2 },
      { before: 'Sin saber si optimizo impuestos', after: 'Sugerencias RRSP/TFSA personalizadas', icon: PiggyBank },
    ]
  },
  {
    id: 'growth',
    name: 'Crecimiento',
    icon: Sparkles,
    painPoints: [
      { before: 'Sin claridad financiera', after: 'Dashboard con insights en tiempo real', icon: Brain },
      { before: 'Decisiones basadas en intuición', after: 'Analytics y predicciones con IA', icon: BarChart3 },
      { before: 'Net worth desconocido', after: 'Tracking completo de patrimonio', icon: Wallet },
      { before: 'Sin educación financiera', after: 'Mentoría y recursos integrados', icon: Briefcase },
      { before: 'Metas financieras abstractas', after: 'FIRE calculator y proyecciones', icon: TrendingDown },
      { before: 'Hábitos financieros inconsistentes', after: 'Gamificación y rachas motivadoras', icon: Sparkles },
    ]
  },
];

const categoryColors = [
  { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', hover: 'hover:bg-rose-100' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:bg-amber-100' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', hover: 'hover:bg-violet-100' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
];

export function PainPointsSection() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const currentCategory = categories[activeCategory];
  const currentColor = categoryColors[activeCategory];

  // Auto-rotate categories
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % categories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 15000);
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 font-medium text-sm mb-6"
            whileHover={{ scale: 1.02 }}
          >
            <Zap className="w-4 h-4" />
            36 Problemas Resueltos
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4">
            Del <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500">Caos</span> al{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Control</span>
          </h2>
          
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto">
            Cada problema tiene una solución. Explora las 6 áreas que transformamos.
          </p>
        </motion.div>

        {/* Category Pills - Horizontal scrollable */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap justify-center gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-100">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isActive = index === activeCategory;
              const color = categoryColors[index];
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => handleCategoryClick(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? `${color.bg} text-white shadow-lg` 
                      : `${color.light} ${color.text} ${color.hover}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-xl"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Navigation & Progress */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <motion.button
            onClick={() => {
              setActiveCategory((prev) => (prev - 1 + categories.length) % categories.length);
              setAutoPlay(false);
              setTimeout(() => setAutoPlay(true), 15000);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {categories.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => handleCategoryClick(index)}
                className={`relative h-2 rounded-full transition-all duration-300 ${
                  index === activeCategory ? 'w-8' : 'w-2'
                } ${categoryColors[index].bg} ${index === activeCategory ? '' : 'opacity-30'}`}
              >
                {index === activeCategory && autoPlay && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/40"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 6, ease: "linear" }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          
          <motion.button
            onClick={() => {
              setActiveCategory((prev) => (prev + 1) % categories.length);
              setAutoPlay(false);
              setTimeout(() => setAutoPlay(true), 15000);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
          >
            {currentCategory.painPoints.map((point, index) => {
              const Icon = point.icon;
              
              return (
                <motion.div
                  key={point.before}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="relative h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden">
                    {/* Top accent bar */}
                    <div className={`h-1 ${currentColor.bg}`} />
                    
                    <div className="p-5">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${currentColor.light} ${currentColor.text} mb-4`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Before */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Antes</span>
                          <p className="text-slate-700 text-sm font-medium leading-snug">{point.before}</p>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex justify-center my-2">
                        <motion.div 
                          className={`w-6 h-6 rounded-full ${currentColor.light} flex items-center justify-center`}
                          animate={{ y: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowDown className={`w-3.5 h-3.5 ${currentColor.text}`} />
                        </motion.div>
                      </div>
                      
                      {/* After */}
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Con EvoFinz</span>
                          <p className="text-slate-900 text-sm font-semibold leading-snug">{point.after}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-${currentColor.bg.replace('bg-', '')}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mt-14"
        >
          {[
            { value: '36', label: 'Problemas', icon: Zap },
            { value: '6', label: 'Categorías', icon: BarChart3 },
            { value: '100%', label: 'Automatizado', icon: Sparkles },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-md border border-slate-100"
            >
              <div className={`w-9 h-9 rounded-lg ${categoryColors[index * 2].light} ${categoryColors[index * 2].text} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}