import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Camera, Receipt, FileText, Calculator, Trophy, GraduationCap,
  BarChart3, BookOpen, Building2, CreditCard, Mic, TrendingUp,
  ArrowRight, Check, Sparkles, Shield, Zap, Gift, Loader2, CheckCircle2, XCircle,
  Star, Flame, Target, Crown, Heart, AlertTriangle, Clock, Lightbulb, ChevronRight, Quote, Globe
} from 'lucide-react';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';
import { TransformationCarousel } from '@/components/landing/TransformationCarousel';
import { FloatingStars } from '@/components/landing/FloatingStars';
import { FeaturesShowcase } from '@/components/landing/FeaturesShowcase';
import { AnimatedStats } from '@/components/landing/AnimatedStats';
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel';
import PhoenixFlameEffect from '@/components/landing/PhoenixFlameEffect';
import { FeatureDemosCarousel } from '@/components/landing/FeatureDemosCarousel';
import { TrustSecuritySection } from '@/components/landing/TrustSecuritySection';
import { PainPointsSection } from '@/components/landing/PainPointsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TargetAudienceSection } from '@/components/landing/TargetAudienceSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { GuaranteesSection } from '@/components/landing/GuaranteesSection';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

// Parallax wrapper component for scroll-based animations
function ParallaxSection({ 
  children, 
  speed = 0.5, 
  className = "" 
}: { 
  children: React.ReactNode; 
  speed?: number; 
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);
  
  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

// Parallax background layer for depth effects
function ParallaxLayer({ 
  speed, 
  className, 
  children 
}: { 
  speed: number; 
  className?: string; 
  children?: React.ReactNode;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 3000], [0, 3000 * speed]);
  
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

const getFeatures = (language: string) => [
  { icon: Camera, title: language === 'es' ? 'Captura Inteligente' : 'Smart Capture', description: 'OCR + Voice', tier: 'Pro', color: 'from-orange-500 to-red-500' },
  { icon: Receipt, title: language === 'es' ? 'Gestión Completa' : 'Complete Management', description: language === 'es' ? 'Gastos e Ingresos' : 'Expenses & Income', tier: 'Premium', color: 'from-emerald-500 to-teal-500' },
  { icon: FileText, title: language === 'es' ? 'Contratos Smart' : 'Smart Contracts', description: language === 'es' ? 'Análisis automático' : 'Auto analysis', tier: 'Pro', color: 'from-blue-500 to-indigo-500' },
  { icon: Calculator, title: language === 'es' ? 'Calculadoras' : 'Calculators', description: 'FIRE/RRSP/APV', tier: 'Pro', color: 'from-purple-500 to-pink-500' },
  { icon: Trophy, title: language === 'es' ? 'Gamificación' : 'Gamification', description: 'XP & Badges', tier: 'Premium', color: 'from-amber-500 to-orange-500' },
  { icon: GraduationCap, title: language === 'es' ? 'Mentoría' : 'Mentorship', description: 'Kiyosaki/Tracy', tier: 'Pro', color: 'from-cyan-500 to-blue-500' },
  { icon: BarChart3, title: 'Analytics', description: language === 'es' ? '9+ visualizaciones' : '9+ charts', tier: 'Pro', color: 'from-rose-500 to-red-500' },
  { icon: BookOpen, title: language === 'es' ? 'Educación' : 'Education', description: language === 'es' ? 'Tracking de recursos' : 'Resource tracking', tier: 'Premium', color: 'from-green-500 to-emerald-500' },
  { icon: Building2, title: language === 'es' ? 'Análisis Bancario' : 'Bank Analysis', description: language === 'es' ? 'Detección de anomalías' : 'Anomaly detection', tier: 'Pro', color: 'from-violet-500 to-purple-500' },
  { icon: CreditCard, title: language === 'es' ? 'Suscripciones' : 'Subscriptions', description: language === 'es' ? 'Detector automático' : 'Auto detector', tier: 'Premium', color: 'from-pink-500 to-rose-500' },
  { icon: Mic, title: language === 'es' ? 'Asistente Voz' : 'Voice Assistant', description: language === 'es' ? 'Dictado inteligente' : 'Smart dictation', tier: 'Pro', color: 'from-indigo-500 to-blue-500' },
  { icon: TrendingUp, title: language === 'es' ? 'Patrimonio' : 'Net Worth', description: language === 'es' ? 'Activos vs Pasivos' : 'Assets vs Liabilities', tier: 'Premium', color: 'from-teal-500 to-cyan-500' },
];

const getPricingTiers = (language: string) => [
  {
    name: 'Free',
    monthlyPrice: 0,
    description: language === 'es' ? 'Para explorar' : 'To explore',
    features: language === 'es' ? [
      '50 gastos manuales/mes',
      '20 ingresos manuales/mes',
      '5 escaneos OCR gratis',
      'Dashboard básico',
      '2 clientes / 2 proyectos',
      'Vista previa de analytics'
    ] : [
      '50 manual expenses/month',
      '20 manual incomes/month',
      '5 free OCR scans',
      'Basic dashboard',
      '2 clients / 2 projects',
      'Analytics preview'
    ],
    notIncluded: ['Mileage', language === 'es' ? 'Gamificación' : 'Gamification', language === 'es' ? 'Mentoría' : 'Mentorship'],
    cta: language === 'es' ? 'Comenzar Gratis' : 'Start Free',
    popular: false,
    gradient: 'from-slate-500 to-slate-600'
  },
  {
    name: 'Premium',
    monthlyPrice: 6.99,
    description: language === 'es' ? 'Para freelancers' : 'For freelancers',
    features: language === 'es' ? [
      'Gastos e ingresos ilimitados',
      '50 escaneos OCR/mes',
      'Clientes y proyectos ilimitados',
      'Mileage tracking completo',
      'Tags personalizados',
      'Exportación Excel',
      'Gamificación + XP + Logros',
      'Net Worth tracking',
      'Calendario fiscal'
    ] : [
      'Unlimited expenses & income',
      '50 OCR scans/month',
      'Unlimited clients & projects',
      'Complete mileage tracking',
      'Custom tags',
      'Excel export',
      'Gamification + XP + Badges',
      'Net Worth tracking',
      'Tax calendar'
    ],
    notIncluded: [language === 'es' ? 'Análisis de contratos' : 'Contract analysis', 'FIRE Calculator'],
    cta: language === 'es' ? 'Elegir Premium' : 'Choose Premium',
    popular: true,
    gradient: 'from-amber-500 via-orange-500 to-red-500'
  },
  {
    name: 'Pro',
    monthlyPrice: 14.99,
    description: language === 'es' ? 'Poder total' : 'Full power',
    features: language === 'es' ? [
      'Todo de Premium',
      'OCR ilimitado',
      'Análisis inteligente de contratos',
      'Análisis bancario avanzado',
      'Optimizador fiscal inteligente',
      'Optimizador RRSP/APV',
      'FIRE Calculator completo',
      '8 componentes de mentoría',
      'Asistente de voz',
      'Exportación fiscal (T2125/F29)',
      'Soporte prioritario'
    ] : [
      'Everything in Premium',
      'Unlimited OCR',
      'Smart contract analysis',
      'Advanced bank analysis',
      'Smart tax optimizer',
      'RRSP/APV optimizer',
      'Complete FIRE Calculator',
      '8 mentorship components',
      'Voice assistant',
      'Tax export (T2125/F29)',
      'Priority support'
    ],
    notIncluded: [],
    cta: language === 'es' ? 'Elegir Pro' : 'Choose Pro',
    popular: false,
    gradient: 'from-violet-600 via-purple-600 to-indigo-600'
  }
];

const getStats = (language: string) => [
  { value: '12', label: language === 'es' ? 'Módulos' : 'Modules', icon: Sparkles },
  { value: '100%', label: language === 'es' ? 'Cumplimiento Fiscal' : 'Tax Compliant', icon: Shield },
  { value: 'Smart', label: 'Tech', icon: Zap },
  { value: '24/7', label: language === 'es' ? 'Acceso' : 'Access', icon: Star },
];

export default function Landing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [showBetaInput, setShowBetaInput] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isAnnual, setIsAnnual] = useState(false);

  const features = getFeatures(language);
  const pricingTiers = getPricingTiers(language);
  const stats = getStats(language);
  
  // Calculate prices based on billing period
  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return { display: '$0', period: language === 'es' ? '/mes' : '/mo', savings: '' };
    if (isAnnual) {
      const annualTotal = monthlyPrice * 12 * 0.8; // 20% discount
      const monthlyEquivalent = (annualTotal / 12).toFixed(2);
      return { 
        display: `$${monthlyEquivalent}`, 
        period: language === 'es' ? '/mes' : '/mo',
        savings: language === 'es' ? `Ahorras $${(monthlyPrice * 12 * 0.2).toFixed(0)}/año` : `Save $${(monthlyPrice * 12 * 0.2).toFixed(0)}/year`
      };
    }
    return { display: `$${monthlyPrice.toFixed(2)}`, period: language === 'es' ? '/mes' : '/mo', savings: '' };
  };

  const validateBetaCode = async (code: string) => {
    if (!code.trim()) {
      setCodeStatus('idle');
      return;
    }

    setCodeStatus('checking');
    
    try {
      const { data, error } = await supabase.rpc('validate_beta_invitation_code', {
        p_code: code.trim()
      });

      if (error) {
        setCodeStatus('invalid');
        return;
      }

      const result = data as { valid: boolean; reason: string } | null;
      setCodeStatus(result?.valid ? 'valid' : 'invalid');
    } catch {
      setCodeStatus('invalid');
    }
  };

  const handleBetaCodeChange = (value: string) => {
    setBetaCode(value.toUpperCase());
    
    const timeoutId = setTimeout(() => {
      validateBetaCode(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleGetStarted = () => {
    if (codeStatus === 'valid') {
      navigate(`/auth?beta=${encodeURIComponent(betaCode)}`);
    } else {
      navigate('/auth');
    }
  };

  // Hero ref (no parallax)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Animated Background with parallax layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Parallax gradient orbs - different speeds for depth */}
        <ParallaxLayer speed={-0.15} className="absolute inset-0">
          <motion.div 
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-40 blur-[120px]"
            animate={{
              background: [
                'linear-gradient(to bottom right, rgb(34, 211, 238, 0.4), rgb(59, 130, 246, 0.3), rgb(20, 184, 166, 0.4))',
                'linear-gradient(to bottom right, rgb(251, 146, 60, 0.4), rgb(239, 68, 68, 0.3), rgb(245, 158, 11, 0.4))',
                'linear-gradient(to bottom right, rgb(34, 211, 238, 0.4), rgb(59, 130, 246, 0.3), rgb(20, 184, 166, 0.4))'
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </ParallaxLayer>
        
        <ParallaxLayer speed={-0.25} className="absolute inset-0">
          <motion.div 
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
            animate={{
              background: [
                'linear-gradient(to bottom right, rgb(251, 191, 36, 0.3), rgb(249, 115, 22, 0.2), rgb(254, 240, 138, 0.3))',
                'linear-gradient(to bottom right, rgb(34, 211, 238, 0.3), rgb(99, 102, 241, 0.2), rgb(139, 92, 246, 0.3))',
                'linear-gradient(to bottom right, rgb(251, 191, 36, 0.3), rgb(249, 115, 22, 0.2), rgb(254, 240, 138, 0.3))'
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
        </ParallaxLayer>

        {/* Additional parallax decorative elements */}
        <ParallaxLayer speed={-0.1} className="absolute inset-0">
          <div className="absolute top-1/3 right-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl" />
          <div className="absolute top-2/3 left-20 w-48 h-48 bg-orange-400/10 rounded-full blur-2xl" />
        </ParallaxLayer>
        
        <ParallaxLayer speed={-0.35} className="absolute inset-0">
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-violet-400/15 rounded-full blur-xl" />
          <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl" />
        </ParallaxLayer>
        
        {/* Grid pattern - slower parallax */}
        <ParallaxLayer speed={-0.05} className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), 
                                linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </ParallaxLayer>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-20">
        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-30">
          <LanguageSelector />
        </div>
        {/* Floating Stars Background */}
        <FloatingStars />
        <div className="container mx-auto px-4 relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            {/* Phoenix Logo with animated glow */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center mb-8 relative"
            >
              {/* Animated glow behind logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="w-48 h-48 rounded-full blur-3xl"
                  animate={{
                    background: [
                      'radial-gradient(circle, rgba(34, 211, 238, 0.6) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, rgba(239, 68, 68, 0.4) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(34, 211, 238, 0.6) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 70%)'
                    ]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              {/* Phoenix Logo with flame effect on hover */}
              <PhoenixFlameEffect />
              {/* Brand name below logo */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative z-10 mt-4 text-3xl md:text-4xl font-black tracking-tight"
              >
                <motion.span 
                  className="bg-clip-text text-transparent"
                  animate={{
                    backgroundImage: [
                      'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235), rgb(20, 184, 166))',
                      'linear-gradient(to right, rgb(234, 88, 12), rgb(220, 38, 38), rgb(245, 158, 11))',
                      'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235), rgb(20, 184, 166))'
                    ]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  EvoFinz
                </motion.span>
              </motion.h2>
            </motion.div>

            {/* Main headline with animated gradient */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            >
              <motion.span 
                className="bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundImage: [
                    'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235), rgb(20, 184, 166))',
                    'linear-gradient(to right, rgb(234, 88, 12), rgb(220, 38, 38), rgb(245, 158, 11))',
                    'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235), rgb(20, 184, 166))'
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {language === 'es' ? 'Evoluciona' : 'Evolve'}
              </motion.span>
              <br />
              <span className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                {language === 'es' ? 'tus Finanzas' : 'your Finances'}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              {language === 'es' 
                ? <>La plataforma de gestión financiera más completa para <span className="text-cyan-600 font-semibold">profesionales</span> y <span className="text-teal-600 font-semibold">freelancers</span> en Canadá y Latinoamérica.</>
                : <>The most complete financial management platform for <span className="text-cyan-600 font-semibold">professionals</span> and <span className="text-teal-600 font-semibold">freelancers</span> in Canada and Latin America.</>
              }
            </motion.p>

            {/* Multi-country badges */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <Badge className="px-3 py-1.5 bg-red-500/10 text-red-600 border-red-500/30">
                🇨🇦 Canada
              </Badge>
              <Badge className="px-3 py-1.5 bg-blue-500/10 text-blue-600 border-blue-500/30">
                🇨🇱 Chile
              </Badge>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {language === 'es' ? '+ países próximamente' : '+ more countries soon'}
              </span>
            </motion.div>

            {/* Stats bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-12"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-lg shadow-slate-200/50 border border-slate-100 cursor-default"
                  >
                    <Icon className="h-4 w-4 text-cyan-500" />
                    <span className="font-bold text-slate-800">{stat.value}</span>
                    <span className="text-slate-500 text-sm">{stat.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="relative text-lg px-10 py-7 bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 hover:from-amber-500 hover:via-orange-600 hover:to-orange-700 text-white font-bold shadow-2xl shadow-orange-500/40 border-0 group overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10 flex items-center">
                  {language === 'es' ? 'Comenzar Gratis' : 'Start Free'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowBetaInput(!showBetaInput)}
                className="text-lg px-8 py-7 border-2 border-slate-300 bg-white hover:bg-slate-50 hover:border-cyan-400 text-slate-700 shadow-lg"
              >
                <Gift className="mr-2 h-5 w-5 text-cyan-500" />
                {language === 'es' ? '¿Tienes código beta?' : 'Have a beta code?'}
              </Button>
            </motion.div>

            {/* Beta Code Input */}
            {showBetaInput && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-md mx-auto"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <Input
                    placeholder="ABCD-1234-WXYZ"
                    value={betaCode}
                    onChange={(e) => handleBetaCodeChange(e.target.value)}
                    className={`relative h-16 text-center text-lg font-mono uppercase bg-white border-2 text-slate-800 placeholder:text-slate-400 shadow-lg ${
                      codeStatus === 'valid' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : codeStatus === 'invalid'
                          ? 'border-red-500 bg-red-50'
                          : 'border-slate-200 focus:border-cyan-400'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {codeStatus === 'checking' && <Loader2 className="h-6 w-6 animate-spin text-slate-400" />}
                    {codeStatus === 'valid' && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                    {codeStatus === 'invalid' && <XCircle className="h-6 w-6 text-red-500" />}
                  </div>
                </div>
                {codeStatus === 'valid' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-emerald-600 text-sm mt-3 flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      ¡Código válido! Acceso beta desbloqueado.
                    </p>
                    <Button 
                      onClick={handleGetStarted}
                      className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-6 shadow-lg"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Activar Acceso Beta
                    </Button>
                  </motion.div>
                )}
                {codeStatus === 'invalid' && (
                  <p className="text-red-600 text-sm mt-3">Código inválido o expirado.</p>
                )}
              </motion.div>
            )}


          </motion.div>
        </div>
      </section>

      {/* Transformation Journey Carousel - Right after hero */}
      <TransformationCarousel />

      {/* Pain Points - Show the problem */}
      <PainPointsSection />

      {/* How It Works - 3 simple steps */}
      <HowItWorksSection />

      {/* Features Showcase - Auto-scrolling (What you can do with EvoFinz) */}
      <FeaturesShowcase />

      {/* Smooth Transition Element between Features and Demo */}
      <div className="relative h-24 md:h-32 overflow-hidden bg-gradient-to-b from-slate-100 to-white">
        {/* Center arrow with connecting lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Left line */}
          <motion.div
            className="absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-[2px] mr-6 bg-gradient-to-r from-transparent via-cyan-400/50 to-cyan-500"
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Right line */}
          <motion.div
            className="absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-[2px] ml-6 bg-gradient-to-l from-transparent via-blue-400/50 to-blue-500"
            initial={{ scaleX: 0, originX: 1 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Center animated arrow */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"
              animate={{ boxShadow: ['0 10px 25px -5px rgba(6, 182, 212, 0.3)', '0 10px 35px -5px rgba(6, 182, 212, 0.5)', '0 10px 25px -5px rgba(6, 182, 212, 0.3)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5 text-white rotate-90" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Demo Animation Carousel - NOW AFTER FEATURES */}
      <section className="py-16 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <Badge className="mb-4 px-4 py-2 bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-sm">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Vista Previa
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-800">
                Mira cómo <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">funciona</span>
              </h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">
                Explora las funcionalidades principales de EvoFinz en acción
              </p>
            </div>
            <FeatureDemosCarousel />
          </motion.div>
        </div>
      </section>

      {/* Animated Stats with parallax */}
      <ParallaxSection speed={0.15}>
        <AnimatedStats />
      </ParallaxSection>

      {/* Testimonials with subtle parallax */}
      <ParallaxSection speed={0.1}>
        <TestimonialsCarousel />
      </ParallaxSection>

      {/* Target Audience - Who is it for? */}
      <TargetAudienceSection />

      {/* Trust & Security */}
      <TrustSecuritySection />

      {/* 12 Modules Section with parallax background */}
      <section className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Parallax decorative elements */}
        <ParallaxLayer speed={0.2} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </ParallaxLayer>
        
        <ParallaxLayer speed={0.35} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
        </ParallaxLayer>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm">
              <Flame className="w-4 h-4 mr-2 inline" />
              Potencia Total
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-white">12 Módulos </span>
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Potentes</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tus finanzas personales y de negocio en un solo lugar.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <Card 
                    className="relative p-5 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer group overflow-hidden h-full hover:shadow-xl hover:shadow-orange-500/10"
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <Badge 
                      className={`absolute top-3 right-3 text-xs font-bold ${
                        feature.tier === 'Pro' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'
                      }`}
                    >
                      {feature.tier}
                    </Badge>
                    
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section with parallax */}
      <section className="relative py-24 bg-slate-950 overflow-hidden">
        {/* Parallax background elements */}
        <ParallaxLayer speed={0.15} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-20 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </ParallaxLayer>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-2 bg-violet-500/20 text-violet-400 border-violet-500/30 text-sm">
              <Target className="w-4 h-4 mr-2 inline" />
              Planes Flexibles
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
              Planes Simples y Transparentes
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Empieza gratis, escala cuando lo necesites.
            </p>
            
            {/* Annual/Monthly Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>
                Mensual
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                  isAnnual ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-700'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: isAnnual ? 32 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
                Anual
              </span>
              {isAnnual && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse">
                  -20% OFF
                </Badge>
              )}
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => {
              const priceInfo = getPrice(tier.monthlyPrice);
              return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`relative ${tier.popular ? 'pt-4' : ''}`}
              >
                {/* Badge FUERA del Card para evitar overflow-hidden */}
                {tier.popular && (
                  <Badge className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-[pulse-soft_2s_ease-in-out_infinite]">
                    <Star className="w-3 h-3 mr-1 inline" />
                    Más Popular
                  </Badge>
                )}
                <Card 
                  className={`relative p-8 bg-slate-900/80 backdrop-blur-sm border-2 overflow-hidden h-full flex flex-col transition-all duration-300 ${
                    tier.popular 
                      ? 'border-orange-500 shadow-2xl shadow-orange-500/20 scale-105 z-10 hover:shadow-orange-500/40 hover:-translate-y-2' 
                      : 'border-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-2'
                  }`}
                >
                  {/* Popular glow effect */}
                  {tier.popular && (
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl" />
                  )}
                  
                  <div className="text-center mb-6 relative">
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-5xl font-black bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
                        {priceInfo.display}
                      </span>
                      <span className="text-slate-400">{priceInfo.period}</span>
                    </div>
                    {priceInfo.savings && (
                      <p className="text-sm text-green-400 mt-1 font-medium">{priceInfo.savings}</p>
                    )}
                    <p className="text-sm text-slate-400 mt-2">{tier.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <div className={`p-1 rounded-full bg-gradient-to-r ${tier.gradient} flex-shrink-0`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                    {/* Features not included - creates FOMO */}
                    {tier.notIncluded && tier.notIncluded.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm opacity-50">
                        <div className="p-1 rounded-full bg-slate-700 flex-shrink-0">
                          <XCircle className="h-3 w-3 text-slate-500" />
                        </div>
                        <span className="text-slate-500 line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full py-6 font-bold ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-900' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                    onClick={() => navigate('/auth')}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Card>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guarantees Section */}
      <GuaranteesSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA with parallax */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500" />
        
        {/* Parallax pattern */}
        <ParallaxLayer speed={0.2} className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')`
            }}
          />
        </ParallaxLayer>
        
        {/* Floating parallax circles */}
        <ParallaxLayer speed={0.3} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        </ParallaxLayer>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <img 
                src={phoenixLogo} 
                alt="EvoFinz" 
                className="h-20 w-auto mx-auto drop-shadow-lg"
              />
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white drop-shadow-lg">
              ¿Listo para Evolucionar tus Finanzas?
            </h2>
            <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto drop-shadow">
              Únete a cientos de profesionales que ya están optimizando sus finanzas con EvoFinz.
            </p>
            
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-10 py-7 shadow-2xl font-bold group"
            >
              Crear Cuenta Gratis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <img src={phoenixLogo} alt="EvoFinz" className="h-10 w-auto" />
                <span className="font-bold text-white">EvoFinz</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link to="/legal" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Términos de Uso
                </Link>
                <Link to="/legal#privacy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Privacidad
                </Link>
                <Link to="/legal#disclaimer" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Descargo Legal
                </Link>
                <Link to="/auth" className="text-slate-400 hover:text-orange-400 transition-colors font-medium">
                  Iniciar Sesión
                </Link>
              </div>
            </div>
            <div className="text-center border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500 max-w-3xl mx-auto">
                EvoFinz es una herramienta educativa. La información proporcionada no constituye asesoría financiera, fiscal o de inversión. 
                Consulte siempre con profesionales certificados antes de tomar decisiones financieras.
              </p>
              <p className="text-xs text-slate-600 mt-2">
                © 2026 EvoFinz. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
