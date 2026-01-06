import { useEffect, useRef } from 'react';
import { 
  Camera, Receipt, Users, Car, FileText, PiggyBank, 
  TrendingUp, Brain, Target, Shield, Sparkles, Calculator
} from 'lucide-react';

const showcaseItems = [
  {
    icon: Camera,
    title: "Captura en Segundos",
    why: "Nunca más perder un recibo",
    what: "Foto, voz o texto → gasto registrado",
    how: "EvoFinz extrae monto, fecha y categoría automáticamente",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/20"
  },
  {
    icon: Receipt,
    title: "Todo Organizado",
    why: "Claridad total de tus finanzas",
    what: "Gastos e ingresos en un solo lugar",
    how: "Categorización inteligente + filtros potentes",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/20"
  },
  {
    icon: Users,
    title: "Clientes y Proyectos",
    why: "Factura lo que te deben",
    what: "Asocia gastos a clientes para reembolso",
    how: "Reportes profesionales listos para enviar",
    gradient: "from-blue-500 to-indigo-500",
    bgGlow: "bg-blue-500/20"
  },
  {
    icon: Car,
    title: "Kilometraje Deducible",
    why: "Cada km cuenta para impuestos",
    what: "Registra rutas de trabajo",
    how: "Mapa visual + cálculo automático CRA",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/20"
  },
  {
    icon: FileText,
    title: "Contratos Inteligentes",
    why: "No pierdas lo que te corresponde",
    what: "Análisis automático de términos de reembolso",
    how: "Sube contrato → sugiere gastos elegibles",
    gradient: "from-cyan-500 to-blue-500",
    bgGlow: "bg-cyan-500/20"
  },
  {
    icon: PiggyBank,
    title: "Metas de Ahorro",
    why: "Convierte sueños en planes",
    what: "Define metas con fecha límite",
    how: "Tracking visual + alertas de progreso",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "bg-pink-500/20"
  },
  {
    icon: TrendingUp,
    title: "Patrimonio Neto",
    why: "Mide tu riqueza real",
    what: "Activos vs Pasivos actualizados",
    how: "Gráficos de evolución mensual",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/20"
  },
  {
    icon: Brain,
    title: "Mentoría Financiera",
    why: "Aprende de los mejores",
    what: "Principios Kiyosaki, Tracy, Rohn",
    how: "Cuadrante cashflow + diario + hábitos",
    gradient: "from-fuchsia-500 to-pink-500",
    bgGlow: "bg-fuchsia-500/20"
  },
  {
    icon: Calculator,
    title: "Calculadora FIRE",
    why: "¿Cuándo puedes retirarte?",
    what: "Libertad financiera proyectada",
    how: "Ingresa datos → fecha de independencia",
    gradient: "from-green-500 to-emerald-500",
    bgGlow: "bg-green-500/20"
  },
  {
    icon: Shield,
    title: "Impuestos Optimizados",
    why: "Paga solo lo justo",
    what: "Deducciones CRA maximizadas",
    how: "Calendario fiscal + T2125 automático",
    gradient: "from-red-500 to-orange-500",
    bgGlow: "bg-red-500/20"
  },
  {
    icon: Target,
    title: "Análisis Bancario",
    why: "Detecta fugas de dinero",
    what: "Suscripciones y anomalías",
    how: "Sube extracto → EvoFinz identifica patrones",
    gradient: "from-indigo-500 to-violet-500",
    bgGlow: "bg-indigo-500/20"
  },
  {
    icon: Sparkles,
    title: "Gamificación",
    why: "Finanzas divertidas",
    what: "XP, logros y rachas",
    how: "Cada acción suma puntos y desbloquea badges",
    gradient: "from-yellow-500 to-amber-500",
    bgGlow: "bg-yellow-500/20"
  }
];

// Duplicate items for seamless infinite scroll
const duplicatedItems = [...showcaseItems, ...showcaseItems, ...showcaseItems];

export const FeaturesShowcase = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
            12 Módulos Potentes
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Todo lo que puedes hacer con{' '}
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
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Para qué</span>
                      <p className={`text-sm font-medium bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                        {item.why}
                      </p>
                    </div>

                    {/* What */}
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qué hace</span>
                      <p className="text-sm text-slate-300">
                        {item.what}
                      </p>
                    </div>

                    {/* How */}
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cómo</span>
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
          Desplazamiento automático • Pausa al pasar el cursor
          <span className="w-8 h-[2px] bg-gradient-to-r from-transparent via-slate-600 to-transparent animate-pulse" />
        </span>
      </div>
    </section>
  );
};