import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Shield, Clock, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import phoenixLogo from "@/assets/phoenix-transparent.png";

interface QuizHeroProps {
  onStartQuiz: () => void;
}

export const QuizHero = ({ onStartQuiz }: QuizHeroProps) => {
  const { language } = useLanguage();

  const content = {
    es: {
      badge: "Evaluación Gratuita",
      title: "¿Cuál es tu Nivel de",
      titleHighlight: "Salud Financiera?",
      subtitle: "Responde 15 preguntas en 3 minutos y descubre tu nivel financiero con nuestra evaluación gratuita basada en las mejores prácticas de expertos mundiales",
      cta: "Iniciar Evaluación Gratuita",
      ctaSubtext: "15 preguntas • 3 minutos • Resultados personalizados",
      trustBadges: {
        time: "3 min",
        private: "100% Privado",
        free: "Gratis",
      },
      socialProof: "5,000+ profesionales evaluados",
      features: [
        {
          icon: Flame,
          title: "Diagnóstico Personalizado",
          description: "Basado en tu situación laboral y país",
        },
        {
          icon: Shield,
          title: "Recomendaciones Específicas",
          description: "Acciones concretas para mejorar",
        },
        {
          icon: Users,
          title: "Metodología Experta",
          description: "Basado en Kiyosaki, Tracy y más",
        },
      ],
    },
    en: {
      badge: "Free Assessment",
      title: "What's Your",
      titleHighlight: "Financial Health Level?",
      subtitle: "Answer 15 questions in 3 minutes and discover your financial level with our free assessment based on world-class expert practices",
      cta: "Start Free Assessment",
      ctaSubtext: "15 questions • 3 minutes • Personalized results",
      trustBadges: {
        time: "3 min",
        private: "100% Private",
        free: "Free",
      },
      socialProof: "5,000+ professionals assessed",
      features: [
        {
          icon: Flame,
          title: "Personalized Diagnosis",
          description: "Based on your work situation and country",
        },
        {
          icon: Shield,
          title: "Specific Recommendations",
          description: "Concrete actions to improve",
        },
        {
          icon: Users,
          title: "Expert Methodology",
          description: "Based on Kiyosaki, Tracy and more",
        },
      ],
    },
  };

  const t = content[language as keyof typeof content] || content.es;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium">
          <Flame className="w-4 h-4" />
          {t.badge}
        </span>
      </motion.div>

      {/* Phoenix Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 to-orange-500/20 blur-3xl rounded-full" />
          <img
            src={phoenixLogo}
            alt="Phoenix"
            className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 drop-shadow-2xl"
          />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 text-white"
      >
        {t.title}{" "}
        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
          {t.titleHighlight}
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-lg md:text-xl text-slate-300 text-center max-w-2xl mb-8"
      >
        {t.subtitle}
      </motion.p>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-4 mb-8"
      >
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm">{t.trustBadges.time}</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm">{t.trustBadges.private}</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-sm font-medium text-emerald-400">{t.trustBadges.free}</span>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col items-center gap-4 mb-12"
      >
        <Button
          onClick={onStartQuiz}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105"
        >
          <Flame className="w-5 h-5 mr-2" />
          {t.cta}
        </Button>
        <p className="text-sm text-slate-500">{t.ctaSubtext}</p>
      </motion.div>

      {/* Social Proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex items-center gap-2 mb-12"
      >
        <div className="flex -space-x-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold"
            >
              {["👨", "👩", "👨", "👩"][i]}
            </div>
          ))}
        </div>
        <span className="text-slate-400 text-sm">{t.socialProof}</span>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
      >
        {t.features.map((feature, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/70 transition-colors"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <feature.icon className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
