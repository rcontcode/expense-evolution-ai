import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Shield, Clock, Users, Sparkles, TrendingUp, Lock, Crown, Star, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PhoenixLogo } from "@/components/ui/phoenix-logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Link } from "react-router-dom";
import type { ReferralInfo } from "@/pages/FinancialQuiz";

interface QuizHeroProps {
  onStartQuiz: () => void;
  referralInfo?: ReferralInfo | null;
  isLoadingReferral?: boolean;
}

export const QuizHero = ({ onStartQuiz, referralInfo, isLoadingReferral }: QuizHeroProps) => {
  const { language } = useLanguage();
  
  // Animated today counter (starts at base and increments randomly)
  const [todayEvaluations, setTodayEvaluations] = useState(47);
  
  useEffect(() => {
    // Simulate real-time activity
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setTodayEvaluations(prev => prev + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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
      todayCount: "evaluaciones hoy",
      alreadyHaveAccount: "¿Ya tienes cuenta?",
      login: "Inicia sesión",
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
      todayCount: "evaluations today",
      alreadyHaveAccount: "Already have an account?",
      login: "Log in",
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

  const vipContent = {
    es: {
      vipBadge: "🌟 Invitación VIP",
      invitedBy: "invitado por",
      exclusiveAccess: "Acceso Exclusivo a Beta Privada",
      vipBenefits: [
        "90 días de acceso Premium gratis",
        "Soporte prioritario de fundadores",
        "Acceso anticipado a nuevas funciones",
      ],
    },
    en: {
      vipBadge: "🌟 VIP Invitation",
      invitedBy: "invited by",
      exclusiveAccess: "Exclusive Private Beta Access",
      vipBenefits: [
        "90 days of free Premium access",
        "Priority support from founders",
        "Early access to new features",
      ],
    },
  };

  const vipT = vipContent[language as keyof typeof vipContent] || vipContent.es;
  const hasValidReferral = referralInfo?.isValid && referralInfo?.referrerName;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-30">
        <LanguageSelector />
      </div>

      {/* VIP Referral Banner - Stunning golden design */}
      <AnimatePresence>
        {hasValidReferral && !isLoadingReferral && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="mb-8 w-full max-w-xl"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20">
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent -skew-x-12"
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              {/* Floating stars */}
              <div className="absolute top-2 right-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </motion.div>
              </div>
              <div className="absolute bottom-2 left-6">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              </div>

              <div className="relative p-5 text-center">
                {/* VIP Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-sm mb-3 shadow-lg shadow-amber-500/30"
                >
                  <Crown className="w-4 h-4" />
                  {vipT.vipBadge}
                  <Crown className="w-4 h-4" />
                </motion.div>

                {/* Invited by message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-white/90 mb-2"
                >
                  {vipT.invitedBy}{" "}
                  <span className="font-bold text-amber-400 text-xl">
                    {referralInfo?.referrerName}
                  </span>
                </motion.p>

                {/* Exclusive access message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-amber-200/80 text-sm mb-4"
                >
                  {vipT.exclusiveAccess}
                </motion.p>

                {/* VIP Benefits pills */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-2"
                >
                  {vipT.vipBenefits.map((benefit, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-amber-500/30 text-xs text-amber-100"
                    >
                      <Gift className="w-3 h-3 text-amber-400" />
                      {benefit}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">{t.trustBadges.private}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
          <span className="text-sm font-medium text-emerald-400">{t.trustBadges.free}</span>
        </div>
        {/* Urgency counter */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/30"
        >
          <TrendingUp className="w-4 h-4 text-orange-400" />
          <motion.span 
            key={todayEvaluations}
            initial={{ scale: 1.2, color: "#fb923c" }}
            animate={{ scale: 1, color: "#fdba74" }}
            className="text-sm font-medium text-orange-300"
          >
            {todayEvaluations} {t.todayCount}
          </motion.span>
        </motion.div>
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {t.ctaSubtext}
        </p>
        {/* Already have account link */}
        <p className="text-sm text-slate-500">
          {t.alreadyHaveAccount}{" "}
          <Link 
            to="/auth" 
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            {t.login}
          </Link>
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
