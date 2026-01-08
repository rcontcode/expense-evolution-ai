import { useEffect, useRef } from 'react';
import { 
  Camera, Receipt, Users, Car, FileText, PiggyBank, 
  TrendingUp, Brain, Target, Shield, Sparkles, Calculator
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const getShowcaseItems = (language: string) => [
  {
    icon: Camera,
    title: language === 'es' ? "Captura en Segundos" : "Capture in Seconds",
    why: language === 'es' ? "Nunca más perder un recibo" : "Never lose a receipt again",
    what: language === 'es' ? "Foto, voz o texto → gasto registrado" : "Photo, voice or text → expense logged",
    how: language === 'es' ? "EvoFinz extrae monto, fecha y categoría automáticamente" : "EvoFinz extracts amount, date and category automatically",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/20"
  },
  {
    icon: Receipt,
    title: language === 'es' ? "Todo Organizado" : "All Organized",
    why: language === 'es' ? "Claridad total de tus finanzas" : "Total clarity of your finances",
    what: language === 'es' ? "Gastos e ingresos en un solo lugar" : "Expenses and income in one place",
    how: language === 'es' ? "Categorización inteligente + filtros potentes" : "Smart categorization + powerful filters",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/20"
  },
  {
    icon: Users,
    title: language === 'es' ? "Clientes y Proyectos" : "Clients & Projects",
    why: language === 'es' ? "Factura lo que te deben" : "Invoice what they owe you",
    what: language === 'es' ? "Asocia gastos a clientes para reembolso" : "Link expenses to clients for reimbursement",
    how: language === 'es' ? "Reportes profesionales listos para enviar" : "Professional reports ready to send",
    gradient: "from-blue-500 to-indigo-500",
    bgGlow: "bg-blue-500/20"
  },
  {
    icon: Car,
    title: language === 'es' ? "Kilometraje Deducible" : "Deductible Mileage",
    why: language === 'es' ? "Cada km cuenta para impuestos" : "Every km counts for taxes",
    what: language === 'es' ? "Registra rutas de trabajo" : "Log work routes",
    how: language === 'es' ? "Mapa visual + cálculo automático según tu país" : "Visual map + auto calculation per your country",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/20"
  },
  {
    icon: FileText,
    title: language === 'es' ? "Contratos Inteligentes" : "Smart Contracts",
    why: language === 'es' ? "No pierdas lo que te corresponde" : "Don't miss what you deserve",
    what: language === 'es' ? "Análisis automático de términos de reembolso" : "Auto analysis of reimbursement terms",
    how: language === 'es' ? "Sube contrato → sugiere gastos elegibles" : "Upload contract → suggests eligible expenses",
    gradient: "from-cyan-500 to-blue-500",
    bgGlow: "bg-cyan-500/20"
  },
  {
    icon: PiggyBank,
    title: language === 'es' ? "Metas de Ahorro" : "Savings Goals",
    why: language === 'es' ? "Convierte sueños en planes" : "Turn dreams into plans",
    what: language === 'es' ? "Define metas con fecha límite" : "Set goals with deadlines",
    how: language === 'es' ? "Tracking visual + alertas de progreso" : "Visual tracking + progress alerts",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "bg-pink-500/20"
  },
  {
    icon: TrendingUp,
    title: language === 'es' ? "Patrimonio Neto" : "Net Worth",
    why: language === 'es' ? "Mide tu riqueza real" : "Measure your real wealth",
    what: language === 'es' ? "Activos vs Pasivos actualizados" : "Assets vs Liabilities updated",
    how: language === 'es' ? "Gráficos de evolución mensual" : "Monthly evolution charts",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/20"
  },
  {
    icon: Brain,
    title: language === 'es' ? "Mentoría Financiera" : "Financial Mentorship",
    why: language === 'es' ? "Aprende de los mejores" : "Learn from the best",
    what: language === 'es' ? "Principios Kiyosaki, Tracy, Rohn" : "Kiyosaki, Tracy, Rohn principles",
    how: language === 'es' ? "Cuadrante cashflow + diario + hábitos" : "Cashflow quadrant + journal + habits",
    gradient: "from-fuchsia-500 to-pink-500",
    bgGlow: "bg-fuchsia-500/20"
  },
  {
    icon: Calculator,
    title: language === 'es' ? "Calculadora FIRE" : "FIRE Calculator",
    why: language === 'es' ? "¿Cuándo puedes retirarte?" : "When can you retire?",
    what: language === 'es' ? "Libertad financiera proyectada" : "Projected financial freedom",
    how: language === 'es' ? "Ingresa datos → fecha de independencia" : "Enter data → independence date",
    gradient: "from-green-500 to-emerald-500",
    bgGlow: "bg-green-500/20"
  },
  {
    icon: Shield,
    title: language === 'es' ? "Impuestos Optimizados" : "Tax Optimized",
    why: language === 'es' ? "Paga solo lo justo" : "Pay only what's fair",
    what: language === 'es' ? "Deducciones maximizadas" : "Maximized deductions",
    how: language === 'es' ? "Calendario fiscal + exportación automática" : "Tax calendar + auto export",
    gradient: "from-red-500 to-orange-500",
    bgGlow: "bg-red-500/20"
  },
  {
    icon: Target,
    title: language === 'es' ? "Análisis Bancario" : "Bank Analysis",
    why: language === 'es' ? "Detecta fugas de dinero" : "Detect money leaks",
    what: language === 'es' ? "Suscripciones y anomalías" : "Subscriptions and anomalies",
    how: language === 'es' ? "Sube extracto → EvoFinz identifica patrones" : "Upload statement → EvoFinz identifies patterns",
    gradient: "from-indigo-500 to-violet-500",
    bgGlow: "bg-indigo-500/20"
  },
  {
    icon: Sparkles,
    title: language === 'es' ? "Gamificación" : "Gamification",
    why: language === 'es' ? "Finanzas divertidas" : "Fun finances",
    what: language === 'es' ? "XP, logros y rachas" : "XP, achievements and streaks",
    how: language === 'es' ? "Cada acción suma puntos y desbloquea badges" : "Every action earns points and unlocks badges",
    gradient: "from-yellow-500 to-amber-500",
    bgGlow: "bg-yellow-500/20"
  }
];

export const FeaturesShowcase = () => {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const showcaseItems = getShowcaseItems(language);
  
  // Duplicate items for seamless infinite scroll
  const duplicatedItems = [...showcaseItems, ...showcaseItems, ...showcaseItems];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5; // pixels per frame

    const animate = () => {
      scrollPosition += speed;
      
      // Reset position when we've scrolled through one set of items
      const singleSetWidth = scrollContainer.scrollWidth / 3;
      if (scrollPosition >= singleSetWidth) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Pause on hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[300px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 mb-10 relative z-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-orange-500/10 backdrop-blur-sm rounded-full text-sm text-slate-300 border border-white/10 mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            {language === 'es' ? '12 Módulos Potentes' : '12 Powerful Modules'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            {language === 'es' ? 'Todo lo que puedes hacer con' : 'Everything you can do with'}{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
              EvoFinz
            </span>
          </h2>
        </div>
      </div>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      {/* Scrolling carousel */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-hidden py-4 px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {duplicatedItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.title}-${index}`}
              className="flex-shrink-0 w-[300px] group"
            >
              <div className="relative h-full">
                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${item.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                
                {/* Card */}
                <div className="relative h-full bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-800 group-hover:border-slate-700 transition-all duration-300 overflow-hidden">
                  {/* Background glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${item.bgGlow} rounded-full blur-2xl opacity-50`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-slate-300 transition-all">
                      {item.title}
                    </h3>

                    {/* Why */}
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {language === 'es' ? 'Para qué' : 'Why'}
                      </span>
                      <p className={`text-sm font-medium bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                        {item.why}
                      </p>
                    </div>

                    {/* What */}
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {language === 'es' ? 'Qué hace' : 'What'}
                      </span>
                      <p className="text-sm text-slate-300">
                        {item.what}
                      </p>
                    </div>

                    {/* How */}
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {language === 'es' ? 'Cómo' : 'How'}
                      </span>
                      <p className="text-xs text-slate-400">
                        {item.how}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll hint */}
      <div className="flex justify-center mt-6">
        <span className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-8 h-[2px] bg-gradient-to-r from-transparent via-slate-600 to-transparent animate-pulse" />
          {language === 'es' ? 'Desplazamiento automático • Pausa al pasar el cursor' : 'Auto scroll • Pause on hover'}
          <span className="w-8 h-[2px] bg-gradient-to-r from-transparent via-slate-600 to-transparent animate-pulse" />
        </span>
      </div>
    </section>
  );
};
