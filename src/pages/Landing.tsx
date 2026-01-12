import { useState, useEffect, memo, lazy, Suspense, ComponentType } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  Camera, Receipt, FileText, Calculator, Trophy, GraduationCap,
  BarChart3, BookOpen, Building2, CreditCard, Mic, TrendingUp,
  ArrowRight, Check, Sparkles, Shield, Zap, Gift, Loader2, CheckCircle2, XCircle,
  Star, Flame, Target, Crown, Heart, AlertTriangle, Clock, Lightbulb, ChevronRight, Quote, Globe
} from 'lucide-react';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';
import { FloatingStars } from '@/components/landing/FloatingStars';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

// Lazy loader with retry for transient network errors
function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
    throw new Error('Failed to load module after retries');
  });
}

// Lazy load heavy components with retry
const TransformationCarousel = lazyWithRetry(() => import('@/components/landing/TransformationCarousel').then(m => ({ default: m.TransformationCarousel })));
const FeaturesShowcase = lazyWithRetry(() => import('@/components/landing/FeaturesShowcase').then(m => ({ default: m.FeaturesShowcase })));
const AnimatedStats = lazyWithRetry(() => import('@/components/landing/AnimatedStats').then(m => ({ default: m.AnimatedStats })));
const TestimonialsCarousel = lazyWithRetry(() => import('@/components/landing/TestimonialsCarousel').then(m => ({ default: m.TestimonialsCarousel })));
const FeatureDemosCarousel = lazyWithRetry(() => import('@/components/landing/FeatureDemosCarousel').then(m => ({ default: m.FeatureDemosCarousel })));
const TrustSecuritySection = lazyWithRetry(() => import('@/components/landing/TrustSecuritySection').then(m => ({ default: m.TrustSecuritySection })));
const PainPointsSection = lazyWithRetry(() => import('@/components/landing/PainPointsSection').then(m => ({ default: m.PainPointsSection })));
const HowItWorksSection = lazyWithRetry(() => import('@/components/landing/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const TargetAudienceSection = lazyWithRetry(() => import('@/components/landing/TargetAudienceSection').then(m => ({ default: m.TargetAudienceSection })));
const FAQSection = lazyWithRetry(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })));
const GuaranteesSection = lazyWithRetry(() => import('@/components/landing/GuaranteesSection').then(m => ({ default: m.GuaranteesSection })));

// Simplified parallax - uses CSS transform for better performance
function ParallaxSection({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  speed?: number; 
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Static decorative layer - no scroll tracking for performance
function ParallaxLayer({ 
  className, 
  children 
}: { 
  speed?: number; 
  className?: string; 
  children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

const getFeatures = (language: string) => [
  { 
    icon: Camera, 
    title: language === 'es' ? 'Captura Inteligente' : 'Smart Capture', 
    description: language === 'es' ? '📸 Foto → Gasto en 3 segundos' : '📸 Photo → Expense in 3 seconds', 
    tier: 'Pro', 
    color: 'from-orange-500 to-red-500',
    row: 1
  },
  { 
    icon: Receipt, 
    title: language === 'es' ? 'Gestión Completa' : 'Complete Management', 
    description: language === 'es' ? '💰 Todo tu dinero, un solo lugar' : '💰 All your money, one place', 
    tier: 'Premium', 
    color: 'from-emerald-500 to-teal-500',
    row: 1
  },
  { 
    icon: FileText, 
    title: language === 'es' ? 'Contratos Smart' : 'Smart Contracts', 
    description: language === 'es' ? '📋 Análisis automático de términos' : '📋 Auto term analysis', 
    tier: 'Pro', 
    color: 'from-blue-500 to-indigo-500',
    row: 1
  },
  { 
    icon: Calculator, 
    title: language === 'es' ? 'Calculadoras Pro' : 'Pro Calculators', 
    description: language === 'es' ? '🔥 FIRE, RRSP, APV optimizado' : '🔥 FIRE, RRSP, APV optimized', 
    tier: 'Pro', 
    color: 'from-purple-500 to-pink-500',
    row: 1
  },
  { 
    icon: Trophy, 
    title: language === 'es' ? 'Gamificación' : 'Gamification', 
    description: language === 'es' ? '🏆 Logros, XP y niveles' : '🏆 Achievements, XP & levels', 
    tier: 'Premium', 
    color: 'from-amber-500 to-orange-500',
    row: 2
  },
  { 
    icon: GraduationCap, 
    title: language === 'es' ? 'Mentoría Elite' : 'Elite Mentorship', 
    description: language === 'es' ? '📚 Kiyosaki, Tracy, Clear' : '📚 Kiyosaki, Tracy, Clear', 
    tier: 'Pro', 
    color: 'from-cyan-500 to-blue-500',
    row: 2
  },
  { 
    icon: BarChart3, 
    title: language === 'es' ? 'Analytics Avanzado' : 'Advanced Analytics', 
    description: language === 'es' ? '📊 +15 visualizaciones épicas' : '📊 +15 epic visualizations', 
    tier: 'Pro', 
    color: 'from-rose-500 to-red-500',
    row: 2
  },
  { 
    icon: BookOpen, 
    title: language === 'es' ? 'Biblioteca Financiera' : 'Financial Library', 
    description: language === 'es' ? '📖 Libros, podcasts, cursos' : '📖 Books, podcasts, courses', 
    tier: 'Premium', 
    color: 'from-green-500 to-emerald-500',
    row: 2
  },
  { 
    icon: Building2, 
    title: language === 'es' ? 'Análisis Bancario' : 'Bank Analysis', 
    description: language === 'es' ? '🏦 Detecta anomalías ocultas' : '🏦 Detect hidden anomalies', 
    tier: 'Pro', 
    color: 'from-violet-500 to-purple-500',
    row: 3
  },
  { 
    icon: CreditCard, 
    title: language === 'es' ? 'Suscripciones' : 'Subscriptions', 
    description: language === 'es' ? '💳 Encuentra gastos fantasma' : '💳 Find phantom expenses', 
    tier: 'Premium', 
    color: 'from-pink-500 to-rose-500',
    row: 3
  },
  { 
    icon: Mic, 
    title: language === 'es' ? 'Asistente de Voz' : 'Voice Assistant', 
    description: language === 'es' ? '🎤 Controla todo hablando' : '🎤 Control everything by speaking', 
    tier: 'Pro', 
    color: 'from-indigo-500 to-blue-500',
    row: 3
  },
  { 
    icon: TrendingUp, 
    title: language === 'es' ? 'Patrimonio Neto' : 'Net Worth', 
    description: language === 'es' ? '📈 Activos vs Pasivos visual' : '📈 Visual Assets vs Liabilities', 
    tier: 'Premium', 
    color: 'from-teal-500 to-cyan-500',
    row: 3
  },
];

const getPricingTiers = (language: string) => [
  {
    name: 'Free',
    monthlyPrice: 0,
    description: language === 'es' 
      ? '¡Sin costo, para siempre! Perfecto para explorar y empezar tu viaje financiero.' 
      : 'No cost, forever! Perfect to explore and start your financial journey.',
    transformation: language === 'es' 
      ? '🎁 ¡Empieza HOY gratis!'
      : '🎁 Start FREE today!',
    features: language === 'es' ? [
      '✏️ 50 gastos manuales/mes',
      '💵 20 ingresos manuales/mes',
      '📷 5 escaneos OCR para probar',
      '📊 Dashboard básico con resumen',
      '👥 2 clientes / 2 proyectos',
      '📈 Vista previa de analytics',
      '🏷️ Tags básicos predefinidos',
      '📅 Vista mensual simple'
    ] : [
      '✏️ 50 manual expenses/month',
      '💵 20 manual incomes/month',
      '📷 5 OCR scans to try',
      '📊 Basic dashboard with summary',
      '👥 2 clients / 2 projects',
      '📈 Analytics preview',
      '🏷️ Basic predefined tags',
      '📅 Simple monthly view'
    ],
    notIncluded: language === 'es' ? [
      '🚗 Mileage tracking',
      '🎮 Gamificación y XP',
      '📚 Mentoría financiera',
      '💰 Net Worth tracking',
      '📋 Contratos inteligentes',
      '🏦 Análisis bancario',
      '🧮 Calculadoras FIRE/RRSP',
      '🎤 Asistente de voz',
      '📤 Exportación avanzada'
    ] : [
      '🚗 Mileage tracking',
      '🎮 Gamification & XP',
      '📚 Financial mentorship',
      '💰 Net Worth tracking',
      '📋 Smart contracts',
      '🏦 Bank analysis',
      '🧮 FIRE/RRSP calculators',
      '🎤 Voice assistant',
      '📤 Advanced export'
    ],
    cta: language === 'es' ? '¡Comenzar Gratis!' : 'Start Free!',
    popular: false,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    isFree: true
  },
  {
    name: 'Premium',
    monthlyPrice: 6.99,
    description: language === 'es' 
      ? 'Para freelancers y emprendedores que quieren control total de sus finanzas.' 
      : 'For freelancers and entrepreneurs who want total control of their finances.',
    transformation: language === 'es' 
      ? '🔥 De desorden → Control total'
      : '🔥 From chaos → Total control',
    features: language === 'es' ? [
      '✨ TODO lo del plan Free +',
      '♾️ Gastos e ingresos ILIMITADOS',
      '📷 50 escaneos OCR/mes',
      '👥 Clientes ilimitados',
      '📁 Proyectos ilimitados',
      '🚗 Mileage tracking completo',
      '🏷️ Tags personalizados infinitos',
      '📤 Exportación Excel/CSV',
      '🎮 Gamificación + XP + Logros',
      '💰 Net Worth tracking completo',
      '📅 Calendario fiscal con alertas',
      '📊 Analytics avanzados (9+ gráficos)',
      '🔔 Notificaciones inteligentes',
      '📚 Biblioteca de educación financiera'
    ] : [
      '✨ EVERYTHING in Free +',
      '♾️ UNLIMITED expenses & income',
      '📷 50 OCR scans/month',
      '👥 Unlimited clients',
      '📁 Unlimited projects',
      '🚗 Complete mileage tracking',
      '🏷️ Infinite custom tags',
      '📤 Excel/CSV export',
      '🎮 Gamification + XP + Badges',
      '💰 Complete Net Worth tracking',
      '📅 Tax calendar with alerts',
      '📊 Advanced analytics (9+ charts)',
      '🔔 Smart notifications',
      '📚 Financial education library'
    ],
    notIncluded: language === 'es' ? [
      '📋 Análisis inteligente de contratos',
      '🏦 Análisis bancario avanzado',
      '🧮 Optimizador fiscal inteligente',
      '💎 Optimizador RRSP/APV',
      '🔥 FIRE Calculator completo',
      '🎓 8 módulos de mentoría',
      '🎤 Asistente de voz',
      '📄 Exportación fiscal (T2125/F29)'
    ] : [
      '📋 Smart contract analysis',
      '🏦 Advanced bank analysis',
      '🧮 Smart tax optimizer',
      '💎 RRSP/APV optimizer',
      '🔥 Complete FIRE Calculator',
      '🎓 8 mentorship modules',
      '🎤 Voice assistant',
      '📄 Tax export (T2125/F29)'
    ],
    cta: language === 'es' ? 'Elegir Premium' : 'Choose Premium',
    popular: true,
    gradient: 'from-amber-500 via-orange-500 to-red-500'
  },
  {
    name: 'Pro',
    monthlyPrice: 14.99,
    description: language === 'es' 
      ? 'Dominio absoluto. Todas las herramientas para convertirte en un profesional financiero.' 
      : 'Absolute mastery. All the tools to become a financial professional.',
    transformation: language === 'es' 
      ? '🚀 De empleado → Experto financiero'
      : '🚀 From employee → Financial expert',
    // Highlight Pro as the most complete plan
    featured: true,
    features: language === 'es' ? [
      '👑 TODO lo del plan Premium +',
      '📷 OCR ILIMITADO (sin límites)',
      '📋 Análisis inteligente de contratos',
      '🏦 Análisis bancario con detección de anomalías',
      '🧮 Optimizador fiscal inteligente',
      '💎 Optimizador RRSP/TFSA/APV',
      '🔥 FIRE Calculator completo + proyecciones',
      '🎓 8 módulos de mentoría (Kiyosaki, Tracy, Clear)',
      '🎤 Asistente de voz inteligente',
      '📄 Exportación fiscal oficial (T2125/F29)',
      '🔄 Detector de suscripciones automático',
      '📊 Predicciones y tendencias',
      '💳 Reconciliación bancaria',
      '⭐ Soporte prioritario 24/7'
    ] : [
      '👑 EVERYTHING in Premium +',
      '📷 UNLIMITED OCR (no limits)',
      '📋 Smart contract analysis',
      '🏦 Bank analysis with anomaly detection',
      '🧮 Smart tax optimizer',
      '💎 RRSP/TFSA/APV optimizer',
      '🔥 Complete FIRE Calculator + projections',
      '🎓 8 mentorship modules (Kiyosaki, Tracy, Clear)',
      '🎤 Smart voice assistant',
      '📄 Official tax export (T2125/F29)',
      '🔄 Automatic subscription detector',
      '📊 Predictions & trends',
      '💳 Bank reconciliation',
      '⭐ Priority 24/7 support'
    ],
    notIncluded: [],
    cta: language === 'es' ? '¡Quiero Pro!' : 'Get Pro!',
    popular: false,
    gradient: 'from-violet-600 via-purple-600 to-indigo-600'
  }
];

const getStats = (language: string) => [
  { value: '12', label: language === 'es' ? 'Módulos' : 'Modules', icon: Sparkles },
  { value: '100+', label: language === 'es' ? 'Comandos de Voz' : 'Voice Commands', icon: Zap },
  { value: '🇨🇦🇨🇱', label: language === 'es' ? 'Multi-país' : 'Multi-country', icon: Shield },
  { value: '24/7', label: language === 'es' ? 'Acceso' : 'Access', icon: Star },
];

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, loading } = useAuth();
  const [showBetaInput, setShowBetaInput] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isAnnual, setIsAnnual] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // If user is logged in and on root path, redirect to dashboard
    // But allow /landing route to show landing page for preview purposes
    if (!loading && user && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [loading, user, navigate, location.pathname]);

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
      {/* Sticky Pricing Bar - Premium design */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: showStickyBar ? 0 : -100, 
          opacity: showStickyBar ? 1 : 0 
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50"
      >
        {/* Animated glow line at bottom */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-amber-400 to-violet-500"
          animate={{ 
            opacity: [0.5, 1, 0.5],
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <img src={phoenixLogo} alt="EvoFinz" className="h-8 w-8 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <span className="font-bold text-white hidden sm:inline">EvoFinz</span>
            </motion.div>

            {/* Plans - Clean badges with prices */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden sm:flex items-center gap-3">
                {/* Free Plan */}
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(16,185,129,0.3)' }}
                >
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold text-sm">Free</span>
                  <span className="text-white font-bold">$0</span>
                </motion.div>
                
                {/* Premium Plan - featured */}
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40"
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    borderColor: ['rgba(251,191,36,0.4)', 'rgba(251,191,36,0.7)', 'rgba(251,191,36,0.4)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-semibold text-sm">Premium</span>
                  <span className="text-white font-bold">${isAnnual ? '5.59' : '6.99'}</span>
                  <span className="text-amber-200/60 text-xs">/mo</span>
                </motion.div>
                
                {/* Pro Plan */}
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/40"
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    borderColor: ['rgba(139,92,246,0.4)', 'rgba(139,92,246,0.7)', 'rgba(139,92,246,0.4)']
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <Crown className="w-4 h-4 text-violet-400" />
                  <span className="text-violet-300 font-semibold text-sm">Pro</span>
                  <span className="text-white font-bold">${isAnnual ? '11.99' : '14.99'}</span>
                  <span className="text-violet-200/60 text-xs">/mo</span>
                </motion.div>
              </div>
              
              {/* Ver Planes */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const pricingSection = document.getElementById('pricing-section');
                  pricingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 font-medium text-sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
                {language === 'es' ? 'Ver planes' : 'View plans'}
              </Button>
              
              {/* CTA Button - Enhanced */}
              <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <motion.div
                  className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-60 blur-sm"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                  />
                  <span className="relative z-10 flex items-center">
                    {language === 'es' ? 'Comenzar Gratis' : 'Start Free'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

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
              {/* Unified Phoenix Logo with hero variant */}
              <PhoenixLogo variant="hero" showText={true} />
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
                      {language === 'es' ? '¡Código válido! Acceso beta desbloqueado.' : 'Valid code! Beta access unlocked.'}
                    </p>
                    <Button 
                      onClick={handleGetStarted}
                      className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-6 shadow-lg"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      {language === 'es' ? 'Activar Acceso Beta' : 'Activate Beta Access'}
                    </Button>
                  </motion.div>
                )}
                {codeStatus === 'invalid' && (
                  <p className="text-red-600 text-sm mt-3">{language === 'es' ? 'Código inválido o expirado.' : 'Invalid or expired code.'}</p>
                )}
              </motion.div>
            )}


          </motion.div>
        </div>
      </section>

      {/* Quick Pricing Preview - Redesigned */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative py-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-y border-amber-500/20"
      >
        {/* Animated glow line */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Plans with visual hierarchy */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Free */}
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/40 shadow-lg shadow-emerald-500/10"
              >
                <Gift className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-300">Free</span>
                <span className="font-black text-white text-lg">$0</span>
              </motion.div>
              
              {/* Premium - highlighted */}
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                animate={{ boxShadow: ['0 0 10px rgba(251,191,36,0.2)', '0 0 20px rgba(251,191,36,0.4)', '0 0 10px rgba(251,191,36,0.2)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/50"
              >
                <Star className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-amber-300">Premium</span>
                <span className="font-black text-white text-lg">${isAnnual ? '5.59' : '6.99'}</span>
                <span className="text-amber-200/70 text-xs">{language === 'es' ? '/mes' : '/mo'}</span>
              </motion.div>
              
              {/* Pro - crown */}
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                animate={{ boxShadow: ['0 0 10px rgba(139,92,246,0.2)', '0 0 20px rgba(139,92,246,0.4)', '0 0 10px rgba(139,92,246,0.2)'] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/30 to-purple-500/30 border border-violet-400/50"
              >
                <Crown className="w-5 h-5 text-violet-400" />
                <span className="font-bold text-violet-300">Pro</span>
                <span className="font-black text-white text-lg">${isAnnual ? '11.99' : '14.99'}</span>
                <span className="text-violet-200/70 text-xs">{language === 'es' ? '/mes' : '/mo'}</span>
              </motion.div>
            </div>

            {/* Divider with glow */}
            <div className="hidden md:block w-px h-10 bg-gradient-to-b from-transparent via-amber-400/50 to-transparent" />
            
            {/* CTAs - improved */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const pricingSection = document.getElementById('pricing-section');
                  pricingSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 text-white font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
                {language === 'es' ? 'Comparar planes' : 'Compare plans'}
              </Button>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="relative text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-orange-500/30 overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <span className="relative z-10 flex items-center">
                    {language === 'es' ? '¡Comenzar Gratis!' : 'Start Free!'}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

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
                {language === 'es' ? 'Vista Previa' : 'Preview'}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-800">
                {language === 'es' ? 'Mira cómo ' : 'See how it '}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {language === 'es' ? 'funciona' : 'works'}
                </span>
              </h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">
                {language === 'es' ? 'Explora las funcionalidades principales de EvoFinz en acción' : 'Explore the main features of EvoFinz in action'}
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

      {/* 12 Modules Section with infinite carousel */}
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
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 text-sm shadow-lg">
              <Flame className="w-4 h-4 mr-2 inline" />
              {language === 'es' ? '🚀 Arsenal Completo' : '🚀 Complete Arsenal'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-white">{language === 'es' ? '12 Herramientas ' : '12 Transformation '}</span>
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">{language === 'es' ? 'de Transformación' : 'Tools'}</span>
            </h2>
            <p className="text-slate-300 text-lg max-w-3xl mx-auto">
              {language === 'es' 
                ? 'Del caos financiero a la claridad total. Cada módulo es una pieza de tu arsenal hacia la libertad financiera.' 
                : 'From financial chaos to total clarity. Each module is a piece of your arsenal towards financial freedom.'}
            </p>
          </motion.div>

          {/* Row 1 - moves right to left */}
          <div className="relative overflow-hidden mb-4">
            <motion.div 
              className="flex gap-4"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            >
              {[...features.filter(f => f.row === 1), ...features.filter(f => f.row === 1)].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={`row1-${index}`} className="flex-shrink-0 w-[280px]">
                    <Card className="relative p-5 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden h-full hover:shadow-xl hover:shadow-orange-500/10">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <Badge className={`absolute top-3 right-3 text-xs font-bold ${feature.tier === 'Pro' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'}`}>
                        {feature.tier}
                      </Badge>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4 shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-300">{feature.description}</p>
                    </Card>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Row 2 - moves left to right */}
          <div className="relative overflow-hidden mb-4">
            <motion.div 
              className="flex gap-4"
              animate={{ x: ['-50%', '0%'] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              {[...features.filter(f => f.row === 2), ...features.filter(f => f.row === 2)].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={`row2-${index}`} className="flex-shrink-0 w-[280px]">
                    <Card className="relative p-5 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-violet-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden h-full hover:shadow-xl hover:shadow-violet-500/10">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <Badge className={`absolute top-3 right-3 text-xs font-bold ${feature.tier === 'Pro' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'}`}>
                        {feature.tier}
                      </Badge>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4 shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-300">{feature.description}</p>
                    </Card>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Row 3 - moves right to left (slower) */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex gap-4"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              {[...features.filter(f => f.row === 3), ...features.filter(f => f.row === 3)].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={`row3-${index}`} className="flex-shrink-0 w-[280px]">
                    <Card className="relative p-5 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden h-full hover:shadow-xl hover:shadow-cyan-500/10">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <Badge className={`absolute top-3 right-3 text-xs font-bold ${feature.tier === 'Pro' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'}`}>
                        {feature.tier}
                      </Badge>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-4 shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-300">{feature.description}</p>
                    </Card>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Bottom message */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10 text-slate-400 text-sm"
          >
            {language === 'es' 
              ? '✨ Cada herramienta diseñada para acelerar tu transformación financiera'
              : '✨ Each tool designed to accelerate your financial transformation'}
          </motion.p>
        </div>
      </section>

      {/* Pricing Section with parallax */}
      <section id="pricing-section" className="relative py-24 bg-slate-950 overflow-hidden">
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
              {language === 'es' ? 'Planes Flexibles' : 'Flexible Plans'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
              {language === 'es' ? 'Planes Simples y Transparentes' : 'Simple and Transparent Plans'}
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              {language === 'es' ? 'Empieza gratis, escala cuando lo necesites.' : 'Start free, scale when you need it.'}
            </p>
            
            {/* Annual/Monthly Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>
                {language === 'es' ? 'Mensual' : 'Monthly'}
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
                {language === 'es' ? 'Anual' : 'Annual'}
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
                className={`relative ${tier.popular ? 'pt-4' : 'isFree' in tier && tier.isFree ? 'pt-4' : 'featured' in tier && tier.featured ? 'pt-4' : ''}`}
              >
                {/* Badge FUERA del Card para evitar overflow-hidden */}
                {tier.popular && (
                  <Badge className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-[pulse-soft_2s_ease-in-out_infinite]">
                    <Star className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? 'Más Popular' : 'Most Popular'}
                  </Badge>
                )}
                {'isFree' in tier && tier.isFree && (
                  <Badge className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-pulse">
                    <Gift className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? '¡100% GRATIS!' : '100% FREE!'}
                  </Badge>
                )}
                {'featured' in tier && tier.featured && (
                  <Badge className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-[pulse-soft_2.2s_ease-in-out_infinite]">
                    <Crown className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? 'Más Completo' : 'Most Complete'}
                  </Badge>
                )}
                <Card 
                  className={`relative p-8 bg-slate-900/80 backdrop-blur-sm border-2 overflow-hidden h-full flex flex-col transition-all duration-300 ${
                    tier.popular 
                      ? 'border-orange-500 shadow-2xl shadow-orange-500/20 scale-105 z-10 hover:shadow-orange-500/40 hover:-translate-y-2' 
                      : 'isFree' in tier && tier.isFree
                        ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-2'
                        : 'featured' in tier && tier.featured
                          ? 'border-violet-500 shadow-2xl shadow-violet-500/25 scale-105 z-10 hover:shadow-violet-500/40 hover:-translate-y-2'
                          : 'border-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-2'
                  }`}
                >
                  {/* Popular glow effect */}
                  {tier.popular && (
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl" />
                  )}
                  {'isFree' in tier && tier.isFree && (
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl" />
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
                    
                    {/* Transformation Badge */}
                    {'transformation' in tier && tier.transformation && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${tier.gradient} text-xs font-bold text-white shadow-lg`}
                      >
                        <Flame className="h-3 w-3" />
                        {tier.transformation}
                      </motion.div>
                    )}
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
                        : 'featured' in tier && tier.featured
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-white/30'
                          : 'isFree' in tier && tier.isFree
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/30'
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

      {/* Compact Pricing Reminder - Second appearance */}
      <section className="relative py-16 bg-gradient-to-b from-slate-100 to-slate-200 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="mb-3 px-3 py-1 bg-violet-500/20 text-violet-600 border-violet-500/30 text-sm">
              <TrendingUp className="w-3 h-3 mr-1 inline" />
              {language === 'es' ? 'Tu Transformación' : 'Your Transformation'}
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              {language === 'es' ? 'Elige Tu Nivel de Evolución' : 'Choose Your Evolution Level'}
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Cada plan te acerca más a la libertad financiera. ¿Cuál es tu siguiente paso?'
                : 'Each plan brings you closer to financial freedom. What\'s your next step?'}
            </p>
          </motion.div>

          {/* Compact pricing cards */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {pricingTiers.map((tier, index) => {
              const priceInfo = getPrice(tier.monthlyPrice);
              return (
                <motion.div
                  key={`compact-${tier.name}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`relative rounded-xl p-5 cursor-pointer transition-all ${
                    tier.popular
                      ? 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white shadow-xl shadow-orange-500/30'
                      : 'featured' in tier && tier.featured
                        ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30'
                        : 'isFree' in tier && tier.isFree
                          ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30'
                          : 'bg-white/80 backdrop-blur-sm border border-slate-200 hover:shadow-lg'
                  }`}
                  onClick={() => navigate('/auth')}
                >
                  {tier.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-slate-900 text-white text-xs px-2 py-0.5 shadow-lg">
                        <Star className="w-2 h-2 mr-1 inline" />
                        {language === 'es' ? 'Popular' : 'Popular'}
                      </Badge>
                    </div>
                  )}
                  {'featured' in tier && tier.featured && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-white text-violet-600 text-xs px-2 py-0.5 shadow-lg font-bold">
                        <Crown className="w-2 h-2 mr-1 inline" />
                        {language === 'es' ? 'Más Completo' : 'Most Complete'}
                      </Badge>
                    </div>
                  )}
                  {'isFree' in tier && tier.isFree && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-white text-emerald-600 text-xs px-2 py-0.5 shadow-lg font-bold">
                        <Gift className="w-2 h-2 mr-1 inline" />
                        {language === 'es' ? '¡GRATIS!' : 'FREE!'}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h4 className={`font-bold text-lg ${tier.popular || ('isFree' in tier && tier.isFree) || ('featured' in tier && tier.featured) ? 'text-white' : 'text-slate-800'}`}>
                      {tier.name}
                    </h4>
                    <div className="flex items-baseline justify-center gap-1 my-2">
                      <span className={`text-3xl font-black ${tier.popular || ('isFree' in tier && tier.isFree) || ('featured' in tier && tier.featured) ? 'text-white' : `bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}`}>
                        {priceInfo.display}
                      </span>
                      <span className={`text-sm ${tier.popular || ('isFree' in tier && tier.isFree) || ('featured' in tier && tier.featured) ? 'text-white/80' : 'text-slate-500'}`}>
                        {priceInfo.period}
                      </span>
                    </div>
                    
                    {/* Transformation highlight */}
                    {'transformation' in tier && tier.transformation && (
                      <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                        tier.popular || ('isFree' in tier && tier.isFree) || ('featured' in tier && tier.featured)
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {'isFree' in tier && tier.isFree ? <Gift className="w-3 h-3 inline mr-1" /> : 
                         'featured' in tier && tier.featured ? <Crown className="w-3 h-3 inline mr-1" /> : 
                         <Flame className="w-3 h-3 inline mr-1" />}
                        {tier.transformation}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className={`w-full mt-3 ${
                        tier.popular
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'featured' in tier && tier.featured
                            ? 'bg-white hover:bg-slate-100 text-violet-600 font-bold shadow-lg'
                            : 'isFree' in tier && tier.isFree
                              ? 'bg-white hover:bg-slate-100 text-emerald-600 font-bold'
                              : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
                      }`}
                    >
                      {tier.cta}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Annual toggle reminder */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-6 flex items-center justify-center gap-3"
          >
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${
                isAnnual 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {isAnnual 
                ? (language === 'es' ? '✨ Ahorrando 20% Anual' : '✨ Saving 20% Annual')
                : (language === 'es' ? 'Cambiar a Anual (-20%)' : 'Switch to Annual (-20%)')
              }
            </button>
          </motion.div>
        </div>
      </section>

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
              {/* Use PhoenixLogo component for consistency */}
              <PhoenixLogo variant="hero" showText={false} />
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white drop-shadow-lg">
              {language === 'es' ? '¿Listo para Evolucionar tus Finanzas?' : 'Ready to Evolve Your Finances?'}
            </h2>
            <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto drop-shadow">
              {language === 'es' ? 'Únete a cientos de profesionales que ya están optimizando sus finanzas con EvoFinz.' : 'Join hundreds of professionals already optimizing their finances with EvoFinz.'}
            </p>
            
            {/* SUPER LLAMATIVO CTA BUTTON */}
            <motion.div
              className="relative inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Outer glow rings */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30 blur-2xl"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.1, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute -inset-2 rounded-2xl border-2 border-white/50"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    left: `${10 + i * 16}%`,
                    top: i % 2 === 0 ? '-10px' : 'auto',
                    bottom: i % 2 === 1 ? '-10px' : 'auto',
                  }}
                  animate={{
                    y: i % 2 === 0 ? [-5, -15, -5] : [5, 15, 5],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}
              
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="relative bg-gradient-to-r from-white via-slate-100 to-white text-slate-900 text-lg px-12 py-8 shadow-2xl font-bold group overflow-hidden border-2 border-white/50 hover:from-amber-50 hover:to-orange-50"
              >
                {/* Inner shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                
                {/* Star sparkle icon */}
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </motion.span>
                
                <span className="relative z-10 text-slate-900 font-black">
                  {language === 'es' ? 'Crear Cuenta Gratis' : 'Create Free Account'}
                </span>
                
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="ml-2"
                >
                  <ArrowRight className="h-5 w-5 text-slate-900" />
                </motion.span>
              </Button>
            </motion.div>
            
            {/* Bonus text under button */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-white/80 text-sm flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-300" />
              {language === 'es' ? 'Sin tarjeta de crédito requerida' : 'No credit card required'}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                {/* Use PhoenixLogo component for consistency */}
                <PhoenixLogo variant="mini" showText={true} />
              </div>
              <div className="flex items-center gap-6 text-sm pr-16">
                <Link to="/legal" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Términos de Uso' : 'Terms of Use'}
                </Link>
                <Link to="/legal#privacy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Privacidad' : 'Privacy'}
                </Link>
                <Link to="/legal#disclaimer" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Descargo Legal' : 'Disclaimer'}
                </Link>
                <Link to="/auth" className="text-slate-400 hover:text-orange-400 transition-colors font-medium">
                  {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                </Link>
              </div>
            </div>
            
            {/* Security Certifications Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-4 border-t border-slate-800">
              <span className="text-xs text-slate-500">
                {language === 'es' ? 'Verificar certificaciones:' : 'Verify certifications:'}
              </span>
              <a 
                href="https://supabase.com/security" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                SOC 2 Type II
              </a>
              <a 
                href="https://supabase.com/docs/guides/platform/going-into-prod#security" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                {language === 'es' ? 'Seguridad de Infraestructura' : 'Infrastructure Security'}
              </a>
              <a 
                href="https://supabase.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                GDPR
              </a>
              <a 
                href="https://aws.amazon.com/compliance/data-center/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                AWS {language === 'es' ? 'Centros de Datos' : 'Data Centers'}
              </a>
            </div>
            
            <div className="text-center border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500 max-w-3xl mx-auto">
                {language === 'es' 
                  ? 'EvoFinz es una herramienta educativa. La información proporcionada no constituye asesoría financiera, fiscal o de inversión. Consulte siempre con profesionales certificados antes de tomar decisiones financieras.'
                  : 'EvoFinz is an educational tool. The information provided does not constitute financial, tax, or investment advice. Always consult with certified professionals before making financial decisions.'}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                © 2026 EvoFinz. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'} | v1.0.0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
