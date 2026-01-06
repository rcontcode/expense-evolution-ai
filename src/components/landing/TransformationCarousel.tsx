import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// Currency rotation data for the special slide
const currencyVariations = [
  { currency: "peso", color: "from-cyan-400 to-blue-500", continuation: "y cada peso construye tu futuro" },
  { currency: "dólar", color: "from-emerald-400 to-teal-500", continuation: "y cada dólar suma a tu libertad" },
  { currency: "euro", color: "from-blue-400 to-indigo-500", continuation: "y cada euro es un paso adelante" },
  { currency: "real", color: "from-amber-400 to-orange-500", continuation: "y cada real trabaja para ti" },
  { currency: "sol", color: "from-yellow-400 to-amber-500", continuation: "y cada sol ilumina tu camino" },
  { currency: "quetzal", color: "from-teal-400 to-cyan-500", continuation: "y cada quetzal vale oro" },
  { currency: "colón", color: "from-purple-400 to-pink-500", continuation: "y cada colón cuenta tu historia" },
  { currency: "lempira", color: "from-orange-400 to-red-500", continuation: "y cada lempira forja tu destino" },
];

const journeySlides = [
  {
    quote: "¿A dónde se fue todo este mes?",
    subtext: "Esa sensación cuando revisas tu cuenta y no cuadra nada...",
    gradient: "from-slate-600 via-slate-500 to-gray-600",
    bgGradient: "from-slate-950/95 via-slate-900 to-gray-950/95",
    accent: "slate",
    icon: "💭",
    isSpecial: false
  },
  {
    quote: "Otro año sin poder ahorrar",
    subtext: "El tiempo pasa y las metas siguen igual de lejos...",
    gradient: "from-gray-500 via-slate-500 to-zinc-500",
    bgGradient: "from-gray-950/95 via-slate-900 to-zinc-950/95",
    accent: "gray",
    icon: "⏳",
    isSpecial: false
  },
  {
    quote: "¿Y si existe una forma más simple?",
    subtext: "Ese momento cuando descubres que no tiene que ser tan difícil...",
    gradient: "from-cyan-500 via-blue-500 to-teal-500",
    bgGradient: "from-cyan-950/95 via-slate-900 to-blue-950/95",
    accent: "cyan",
    icon: "💡",
    isSpecial: false
  },
  {
    quote: "Cada {currency} tiene su lugar",
    subtext: "{continuation}",
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    bgGradient: "from-blue-950/95 via-slate-900 to-indigo-950/95",
    accent: "blue",
    icon: "📊",
    isSpecial: true
  },
  {
    quote: "Hoy desperté sin estrés financiero",
    subtext: "Imagina revisar tus cuentas y sentir paz, no ansiedad...",
    gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
    bgGradient: "from-purple-950/95 via-slate-900 to-violet-950/95",
    accent: "purple",
    icon: "✨",
    isSpecial: false
  },
  {
    quote: "Por fin puedo planear ese viaje",
    subtext: "Cuando tus sueños dejan de ser 'algún día' y tienen fecha...",
    gradient: "from-pink-500 via-rose-500 to-orange-500",
    bgGradient: "from-pink-950/95 via-slate-900 to-rose-950/95",
    accent: "pink",
    icon: "🌟",
    isSpecial: false
  },
  {
    quote: "Mi yo del futuro me lo agradecerá",
    subtext: "El orgullo de saber que estás construyendo algo real...",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGradient: "from-orange-950/95 via-slate-900 to-amber-950/95",
    accent: "orange",
    icon: "🏆",
    isSpecial: false
  },
  {
    quote: "Libertad se escribe con números claros",
    subtext: "Cuando el control de tu dinero te da control de tu vida...",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    bgGradient: "from-emerald-950/95 via-slate-900 to-green-950/95",
    accent: "emerald",
    icon: "🦅",
    isSpecial: false
  }
];

// Component for the animated currency text
const AnimatedCurrencyText = () => {
  const [currencyIndex, setCurrencyIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrencyIndex((prev) => (prev + 1) % currencyVariations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const current = currencyVariations[currencyIndex];

  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
        <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          "Cada{" "}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={currencyIndex}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`inline-block bg-gradient-to-r ${current.color} bg-clip-text text-transparent`}
          >
            {current.currency}
          </motion.span>
        </AnimatePresence>
        <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          {" "}tiene su lugar"
        </span>
      </h2>
      <AnimatePresence mode="wait">
        <motion.p
          key={currencyIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto italic"
        >
          {current.continuation}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export const TransformationCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % journeySlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + journeySlides.length) % journeySlides.length);
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const currentSlide = journeySlides[currentIndex];

  return (
    <section 
      className="relative py-20 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bgGradient}`}
        />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full text-sm text-slate-300 border border-white/10 mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            Tu historia puede cambiar hoy
          </span>
        </motion.div>

        {/* Main Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slide Content */}
          <div className="relative min-h-[300px] flex items-center justify-center px-8 md:px-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-6xl mb-6"
                >
                  {currentSlide.icon}
                </motion.div>

                {/* Quote - Special or Regular */}
                {currentSlide.isSpecial ? (
                  <AnimatedCurrencyText />
                ) : (
                  <>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight"
                    >
                      <span className={`bg-gradient-to-r ${currentSlide.gradient} bg-clip-text text-transparent`}>
                        "{currentSlide.quote}"
                      </span>
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto italic"
                    >
                      {currentSlide.subtext}
                    </motion.p>
                  </>
                )}

                {/* Gradient line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className={`h-1 w-32 mx-auto mt-8 rounded-full bg-gradient-to-r ${currentSlide.gradient}`}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {journeySlides.map((slide, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-2 rounded-full transition-all duration-500 ${
                  index === currentIndex 
                    ? 'w-8 bg-gradient-to-r ' + slide.gradient
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ir a slide ${index + 1}`}
              >
                {index === currentIndex && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Journey indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-xs text-slate-500">Del desorden</span>
              <div className="flex gap-1">
                {journeySlides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index <= currentIndex 
                        ? index < 3 
                          ? 'bg-slate-400' 
                          : index < 5 
                            ? 'bg-cyan-400' 
                            : 'bg-emerald-400'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-emerald-400">A la libertad</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};