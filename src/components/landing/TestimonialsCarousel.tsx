import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
  highlight: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Valeria Fernández",
    role: "Diseñadora UX Freelance • México",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    quote: "Llevaba 3 años guardando recibos en una caja de zapatos. En mi primera semana con EvoFinz escaneé todo y encontré $8,500 MXN en gastos que nunca había deducido.",
    rating: 5,
    highlight: "Recuperé dinero olvidado"
  },
  {
    name: "Andrés Gutiérrez",
    role: "Desarrollador Full Stack • Colombia",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    quote: "Trabajo con 3 clientes en diferentes monedas. Antes usaba Excel y siempre me confundía. EvoFinz me muestra exactamente cuánto gano por proyecto y qué puedo deducir.",
    rating: 5,
    highlight: "Claridad con múltiples clientes"
  },
  {
    name: "Carolina Reyes",
    role: "Consultora de Marketing • Chile",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    quote: "Mi contador me cobraba extra por organizar mis gastos. Ahora le envío un PDF perfecto directo desde la app. Me ahorro esa tarifa y él termina más rápido.",
    rating: 5,
    highlight: "Contador más feliz"
  },
  {
    name: "Miguel Ángel Torres",
    role: "Fotógrafo Profesional • Argentina",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    quote: "Manejo mucho equipo y viajo constantemente a eventos. El tracking de kilometraje automático es genial - solo activo el GPS y listo. Antes olvidaba registrar la mitad de mis viajes.",
    rating: 5,
    highlight: "Kilometraje sin esfuerzo"
  },
  {
    name: "Sofía Mendoza",
    role: "Abogada Independiente • Perú",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    quote: "Tengo gastos reembolsables por cada cliente. EvoFinz me genera reportes individuales en segundos. Lo que antes me tomaba medio día ahora son 2 clics.",
    rating: 5,
    highlight: "Reportes instantáneos"
  },
  {
    name: "Diego Herrera",
    role: "Coach Ejecutivo • España",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    quote: "La sección de educación financiera me sorprendió. No esperaba aprender sobre flujo de caja en una app de gastos. Los conceptos de Kiyosaki aplicados a mi negocio real fueron reveladores.",
    rating: 4,
    highlight: "Educación incluida"
  },
  {
    name: "Luciana Vargas",
    role: "Traductora Freelance • Uruguay",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    quote: "Soy terrible con los números. EvoFinz me muestra alertas cuando estoy gastando de más en alguna categoría. Es como tener un asistente financiero que no juzga.",
    rating: 5,
    highlight: "Alertas que ayudan"
  },
  {
    name: "Fernando López",
    role: "Consultor SAP • Brasil",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    quote: "Probé 4 apps antes. Todas complicadísimas o muy básicas. EvoFinz tiene el balance perfecto: potente pero no necesito un tutorial de 2 horas para usarla.",
    rating: 5,
    highlight: "Fácil y completa"
  }
];

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
      
      {/* Quote decorations */}
      <div className="absolute top-32 left-20 opacity-5">
        <Quote className="w-40 h-40 text-white" />
      </div>
      <div className="absolute bottom-32 right-20 opacity-5 rotate-180">
        <Quote className="w-40 h-40 text-white" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Lo que dicen{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              nuestros usuarios
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Historias reales de transformación financiera
          </p>
        </motion.div>

        {/* Main testimonial */}
        <div 
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative">
            {/* Navigation arrows */}
            <button
              onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10"
              >
                {/* Highlight badge */}
                <div className="flex justify-center mb-6">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full text-orange-400 text-sm font-medium border border-orange-500/30">
                    {testimonials[current].highlight}
                  </span>
                </div>

                {/* Quote */}
                <blockquote className="text-xl md:text-2xl text-white/90 text-center leading-relaxed mb-8 font-medium">
                  "{testimonials[current].quote}"
                </blockquote>

                {/* Rating */}
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* User info */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/20 ring-offset-2 ring-offset-slate-800">
                      <img
                        src={testimonials[current].avatar}
                        alt={testimonials[current].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                      <Quote className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {testimonials[current].name}
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {testimonials[current].role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === current 
                    ? "w-8 h-2 bg-gradient-to-r from-orange-400 to-amber-400" 
                    : "w-2 h-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                key={current}
                initial={{ width: "0%" }}
                animate={{ width: isPaused ? "0%" : "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Avatars preview */}
        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((t, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`transition-all duration-300 ${
                index === current 
                  ? "scale-110 ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-900" 
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
