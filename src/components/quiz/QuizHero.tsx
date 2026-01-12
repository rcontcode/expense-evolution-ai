import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Shield, Clock, Users, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PhoenixLogo } from "@/components/ui/phoenix-logo";
import { LanguageSelector } from "@/components/LanguageSelector";

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
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-30">
        <LanguageSelector />
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          {t.badge}
        </span>
      </motion.div>

      {/* Phoenix Logo - Using unified component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <PhoenixLogo variant="hero" showText={false} showEffects={true} />
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-slate-300">{t.trustBadges.time}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">{t.trustBadges.private}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
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
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 text-white font-semibold text-lg px-10 py-7 rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105 border border-amber-400/30"
        >
          <Flame className="w-6 h-6 mr-2" />
          {t.cta}
        </Button>
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {t.ctaSubtext}
        </p>
      </motion.div>

      {/* Social Proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex items-center gap-3 mb-12 px-4 py-2 rounded-full bg-slate-800/30 backdrop-blur-sm border border-slate-700/30"
      >
        <div className="flex -space-x-2">
          {[
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
          ].map((avatar, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-900 shadow-lg"
            >
              <img
                src={avatar}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <span className="text-slate-400 text-sm font-medium">{t.socialProof}</span>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
      >
        {t.features.map((feature, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-center hover:border-amber-500/30 transition-colors group"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-colors">
              <feature.icon className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold mb-2 text-lg">{feature.title}</h3>
            <p className="text-slate-400 text-sm">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
