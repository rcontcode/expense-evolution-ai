import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, XCircle, CheckCircle2, ArrowRight,
  Receipt, Calculator, Clock, Brain, FileX, Wallet,
  TrendingDown, Users, Building2, Car, CreditCard,
  FileText, PiggyBank, BarChart3, Briefcase, Scale,
  Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';

type PainPointCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  bgGradient: string;
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
    color: 'text-rose-500',
    gradient: 'from-rose-500 to-pink-500',
    bgGradient: 'from-rose-500/10 to-pink-500/10',
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
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
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
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
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
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
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
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-500/10 to-purple-500/10',
    painPoints: [
      { before: 'Estrés en época de impuestos', after: 'Preparación continua todo el año', icon: AlertTriangle },
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
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-sky-500',
    bgGradient: 'from-cyan-500/10 to-sky-500/10',
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

export function PainPointsSection() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const currentCategory = categories[activeCategory];

  const nextCategory = () => {
    setActiveCategory((prev) => (prev + 1) % categories.length);
  };

  const prevCategory = () => {
    setActiveCategory((prev) => (prev - 1 + categories.length) % categories.length);
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Dynamic background based on category */}
      <motion.div 
        key={activeCategory}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`absolute inset-0 bg-gradient-to-br ${currentCategory.bgGradient}`}
      />
      
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${currentCategory.gradient} opacity-10 blur-3xl`}
            style={{
              width: 200 + i * 100,
              height: 200 + i * 100,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -20, 30, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${currentCategory.gradient}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className={`mb-4 px-4 py-2 bg-gradient-to-r ${currentCategory.gradient} text-white border-0 text-sm shadow-lg`}>
            <AlertTriangle className="w-4 h-4 mr-2 inline" />
            36 Problemas que Resolvemos
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-slate-800">Del Caos Financiero al </span>
            <span className={`bg-gradient-to-r ${currentCategory.gradient} bg-clip-text text-transparent`}>Control Total</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            ¿Te identificas con alguno de estos problemas? EvoFinz los resuelve todos.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = index === activeCategory;
            return (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  isActive 
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-xl` 
                    : 'bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white shadow-md border border-slate-200/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {category.painPoints.length}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-center gap-4 mb-8">
          <motion.button
            onClick={prevCategory}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentCategory.gradient} text-white shadow-lg flex items-center justify-center`}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            onClick={nextCategory}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentCategory.gradient} text-white shadow-lg flex items-center justify-center`}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Pain Points Gallery */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {currentCategory.painPoints.map((point, index) => {
              const Icon = point.icon;
              const isHovered = hoveredCard === index;
              
              return (
                <motion.div
                  key={point.before}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ 
                    delay: index * 0.08, 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative perspective-1000"
                >
                  <motion.div
                    animate={{ 
                      rotateX: isHovered ? 5 : 0,
                      rotateY: isHovered ? -5 : 0,
                      z: isHovered ? 50 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500"
                  >
                    {/* Animated gradient border */}
                    <motion.div
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${currentCategory.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      style={{ padding: '2px', margin: '-2px' }}
                    />
                    
                    {/* Card content */}
                    <div className="relative p-6 bg-white/95 backdrop-blur-xl rounded-3xl">
                      {/* Icon with glow */}
                      <motion.div 
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentCategory.gradient} flex items-center justify-center mb-5 shadow-lg`}
                        style={{
                          boxShadow: isHovered 
                            ? `0 10px 40px -10px ${currentCategory.color === 'text-rose-500' ? 'rgba(244, 63, 94, 0.5)' : 
                                currentCategory.color === 'text-amber-500' ? 'rgba(245, 158, 11, 0.5)' :
                                currentCategory.color === 'text-emerald-500' ? 'rgba(16, 185, 129, 0.5)' :
                                currentCategory.color === 'text-blue-500' ? 'rgba(59, 130, 246, 0.5)' :
                                currentCategory.color === 'text-violet-500' ? 'rgba(139, 92, 246, 0.5)' :
                                'rgba(6, 182, 212, 0.5)'}`
                            : 'none'
                        }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>

                      {/* Before state */}
                      <div className="relative mb-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100">
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Antes</span>
                            <p className="text-red-700 font-medium text-sm mt-1">{point.before}</p>
                          </div>
                        </div>
                      </div>

                      {/* Transformation arrow */}
                      <motion.div 
                        className="flex justify-center mb-4"
                        animate={{ y: isHovered ? [0, -3, 0] : 0 }}
                        transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentCategory.gradient} flex items-center justify-center shadow-lg`}>
                          <ArrowRight className="w-5 h-5 text-white rotate-90" />
                        </div>
                      </motion.div>

                      {/* After state */}
                      <div className="relative">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Con EvoFinz</span>
                            <p className="text-emerald-700 font-medium text-sm mt-1">{point.after}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sparkle effect on hover */}
                      <AnimatePresence>
                        {isHovered && (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                  opacity: [0, 1, 0],
                                  scale: [0, 1, 0],
                                  x: (Math.random() - 0.5) * 100,
                                  y: (Math.random() - 0.5) * 100,
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className="absolute w-2 h-2 rounded-full bg-amber-400"
                                style={{
                                  left: '50%',
                                  top: '50%',
                                }}
                              />
                            ))}
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-8 mt-16"
        >
          {[
            { value: '36', label: 'Problemas Resueltos' },
            { value: '6', label: 'Categorías' },
            { value: '100%', label: 'Automatizado' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              className="text-center px-8 py-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50"
            >
              <span className={`text-4xl font-black bg-gradient-to-r ${currentCategory.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </span>
              <p className="text-slate-600 text-sm font-medium mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
