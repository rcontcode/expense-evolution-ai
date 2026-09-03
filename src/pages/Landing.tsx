import { useState, useEffect, lazy, Suspense, ComponentType } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Camera, Receipt, FileText, Calculator, Trophy, GraduationCap,
  BarChart3, BookOpen, Mic, TrendingUp,
  ArrowRight, Check, Sparkles, Shield, Zap, Gift,
  Star, Flame, Target, Crown, Globe, MessageSquare, Layers
} from 'lucide-react';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SocialLinks } from '@/components/SocialLinks';
import { ContactForm } from '@/components/ContactForm';
import { LiveSocialProof } from '@/components/landing/LiveSocialProof';
import { SEOHead } from '@/components/shared/SEOHead';

import { Wallet, CalendarCheck } from 'lucide-react';

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
const EvoTransformationBlock = lazyWithRetry(() => import('@/components/landing/EvoTransformationBlock').then(m => ({ default: m.EvoTransformationBlock })));
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

// Wrapper kept for semantic clarity
function DecorativeLayer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
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
    description: language === 'es' ? '📚 Desafíos semanales, tracker de lectura, hábitos' : '📚 Weekly challenges, reading tracker, habits', 
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
    title: language === 'es' ? 'Biblioteca + Tracker' : 'Library + Tracker', 
    description: language === 'es' ? '📖 100+ recursos + acompañante de lectura' : '📖 100+ resources + reading companion', 
    tier: 'Premium', 
    color: 'from-green-500 to-emerald-500',
    row: 2
  },
  { 
    icon: Wallet, 
    title: language === 'es' ? 'Presupuesto Familiar' : 'Family Budget', 
    description: language === 'es' ? '🏠 Límites, alertas y salud financiera' : '🏠 Limits, alerts & financial health', 
    tier: 'Premium', 
    color: 'from-violet-500 to-purple-500',
    row: 3
  },
  { 
    icon: CalendarCheck, 
    title: language === 'es' ? 'Centro de Pagos' : 'Bills Center', 
    description: language === 'es' ? '📅 Pagos fijos y recurrentes' : '📅 Fixed & recurring bills', 
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
    subtitle: language === 'es' ? 'Para siempre, sin tarjeta' : 'Forever, no card needed',
    tagline: language === 'es' ? '🎁 Claridad en minutos' : '🎁 Clarity in minutes',
    heroFeatures: language === 'es' ? [
      { text: '50 gastos + 20 ingresos/mes', icon: '✏️' },
      { text: '5 escaneos OCR — foto y listo', icon: '📷' },
      { text: 'Dashboard visual del mes', icon: '📊' },
    ] : [
      { text: '50 expenses + 20 incomes/mo', icon: '✏️' },
      { text: '5 OCR scans — snap & done', icon: '📷' },
      { text: 'Visual monthly dashboard', icon: '📊' },
    ],
    features: language === 'es' ? [
      '2 clientes / 2 proyectos',
      'Analytics básicos de tendencia',
      'Tags predefinidos',
      'Voz premium: 5 min de regalo, luego voz del navegador',
    ] : [
      '2 clients / 2 projects',
      'Basic trend analytics',
      'Predefined tags',
      'Premium voice: 5 free min, then browser voice',
    ],
    valueNote: language === 'es' 
      ? '💡 La mayoría de apps "free" no incluyen OCR ni voz. EvoFinz sí.'
      : '💡 Most "free" apps don\'t include OCR or voice. EvoFinz does.',
    cta: language === 'es' ? '¡Comenzar Gratis!' : 'Start Free!',
    popular: false,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    isFree: true
  },
  {
    name: 'Premium',
    monthlyPrice: 7.99,
    subtitle: language === 'es' ? 'El más popular para freelancers' : 'Most popular for freelancers',
    tagline: language === 'es' ? '🔥 De desorden → Control total' : '🔥 From chaos → Total control',
    heroFeatures: language === 'es' ? [
      { text: 'Gastos e ingresos ILIMITADOS', icon: '♾️' },
      { text: '300 escaneos OCR/mes (~1h/sem ahorrada)', icon: '📷' },
      { text: 'Net Worth + Calendario fiscal', icon: '💰' },
    ] : [
      { text: 'UNLIMITED expenses & income', icon: '♾️' },
      { text: '300 OCR scans/mo (~1h/wk saved)', icon: '📷' },
      { text: 'Net Worth + Tax calendar', icon: '💰' },
    ],
    features: language === 'es' ? [
      'Clientes y proyectos ilimitados',
      'Mileage GPS — deduce viajes',
      'Tags personalizados infinitos',
      'Exportación Excel/CSV',
      'Gamificación + XP + Streaks',
      'Centro de Pagos Fijos + Calendario',
      '9+ gráficos: heatmaps, correlaciones',
      'Alertas inteligentes',
      'Análisis de contratos con IA (20/mes)',
      'Análisis bancario con IA (20/mes)',
      '4 módulos de mentoría',
      'Asistente de voz (30 min/mes)',
      'Educación financiera completa',
    ] : [
      'Unlimited clients & projects',
      'GPS mileage — deduct trips',
      'Infinite custom tags',
      'Excel/CSV export',
      'Gamification + XP + Streaks',
      'Bills Center + Calendar',
      '9+ charts: heatmaps, correlations',
      'Smart alerts',
      'AI contract analysis (20/mo)',
      'AI bank analysis (20/mo)',
      '4 mentorship modules',
      'Voice assistant (30 min/mo)',
      'Complete financial education',
    ],
    valueNote: language === 'es' 
      ? '💡 1h/sem ahorrada = ~$200/mes de tu tiempo. Pagas $7.99.'
      : '💡 1h/wk saved = ~$200/mo of your time. You pay $7.99.',
    cta: language === 'es' ? 'Elegir Premium' : 'Choose Premium',
    popular: true,
    gradient: 'from-amber-500 via-orange-500 to-red-500'
  },
  {
    name: 'Pro',
    monthlyPrice: 14.99,
    subtitle: language === 'es' ? 'Mentoría financiera inteligente' : 'Smart financial mentorship',
    tagline: language === 'es' ? '🚀 Control → Dominio experto inteligente' : '🚀 Control → Smart expert mastery',
    featured: true,
    heroFeatures: language === 'es' ? [
      { text: 'OCR ILIMITADO — escanea todo', icon: '📷' },
      { text: 'Contratos analizados automáticamente', icon: '📋' },
      { text: 'Asistente de voz 60 min/mes', icon: '🎤' },
    ] : [
      { text: 'UNLIMITED OCR — scan everything', icon: '📷' },
      { text: 'Smart contract analysis', icon: '📋' },
      { text: 'Voice assistant 60 min/mo', icon: '🎤' },
    ],
    features: language === 'es' ? [
      '👑 Todo lo de Premium incluido',
      'Optimizador fiscal inteligente — paga menos',
      'Optimizador RRSP/TFSA/APV',
      'FIRE Calculator — ¿cuándo me retiro?',
      'Análisis bancario y de contratos ILIMITADO',
      'Detector suscripciones fantasma',
      'Reconciliación bancaria automática',
      '8 módulos de mentoría completos',
      'Exportación fiscal oficial (T2125/F29)',
      'Predicciones inteligentes',
      'Soporte dedicado',
    ] : [
      '👑 Everything in Premium included',
      'Smart tax optimizer — pay less, legally',
      'RRSP/TFSA/APV optimizer',
      'FIRE Calculator — when can I retire?',
      'UNLIMITED bank & contract analysis',
      'Ghost subscription detector',
      'Automatic bank reconciliation',
      '8 complete mentorship modules',
      'Official tax export (T2125/F29)',
      'Smart predictions & trends',
      'Dedicated support',
    ],
    valueNote: language === 'es' 
      ? '💡 Tax Optimizer ahorra ~$500/año en impuestos = $41/mes. Pagas $14.99.'
      : '💡 Tax Optimizer saves ~$500/yr in taxes = $41/mo. You pay $14.99.',
    cta: language === 'es' ? '¡Quiero Pro!' : 'Get Pro!',
    popular: false,
    gradient: 'from-violet-600 via-purple-600 to-indigo-600'
  },
  {
    name: 'Evo Bundle',
    monthlyPrice: 19.99,
    isBundle: true,
    subtitle: language === 'es' ? '2 apps Pro × 1 precio — finanzas + mente' : '2 Pro apps × 1 price — finance + mind',
    tagline: language === 'es' ? '💎 Único: conecta dinero + mente de forma inteligente' : '💎 Unique: smart connection between money + mind',
    heroFeatures: language === 'es' ? [
      { text: 'EvoFinz Pro COMPLETO incluido', icon: '🔥' },
      { text: 'Fokuspark Pro COMPLETO incluido', icon: '🧠' },
      { text: 'Cruza finanzas ↔ bienestar', icon: '📊' },
    ] : [
      { text: 'Full EvoFinz Pro INCLUDED', icon: '🔥' },
      { text: 'Full Fokuspark Pro INCLUDED', icon: '🧠' },
      { text: 'Crosses finance ↔ wellness', icon: '📊' },
    ],
    features: language === 'es' ? [
      'Sesiones de enfoque y meditación',
      'Diario de preocupaciones financieras',
      'Leaderboard — compite y motívate',
      'Streaks compartidos entre apps',
      'Coaching inteligente financiero + mental',
      'Health Score unificado (0-100)',
      'Alertas predictivas cruzadas',
      'Reportes mensuales del ecosistema',
      'Soporte prioritario',
    ] : [
      'Focus & meditation sessions',
      'Financial worry journal',
      'Leaderboard — compete & motivate',
      'Shared streaks across apps',
      'Smart financial + mental coaching',
      'Unified Health Score (0-100)',
      'Cross-app predictive alerts',
      'Monthly ecosystem reports',
      'Priority support',
    ],
    valueNote: language === 'es' 
      ? '💡 Pro + Pro = $29.98/mes. Bundle = $19.99. Ahorras $120/año.'
      : '💡 Pro + Pro = $29.98/mo. Bundle = $19.99. Save $120/yr.',
    cta: language === 'es' ? '¡Quiero el Bundle!' : 'Get the Bundle!',
    popular: false,
    gradient: 'from-teal-500 via-cyan-500 to-blue-500'
  }
];


export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user, loading } = useAuth();

  // La portada se declara pagina publica que SI se puede deslizar.
  // -------------------------------------------------------------------------
  // POR QUE. Rudy reporto que en el celular solo ve la primera pantalla y la
  // pagina no baja. La aplicacion ya tiene un remedio propio para esto y esta
  // escrito para paginas publicas: la clase `public-scroll-page` de index.css,
  // que fuerza `height:auto`, `overflow-y:auto`, `overscroll-behavior-y:auto`
  // y —la parte que importa en un telefono— `touch-action: pan-y`. Sin
  // `pan-y`, un dedo sobre la portada puede quedarse sin efecto aunque la
  // pagina se pueda desplazar por codigo.
  //
  // Ese remedio existia y lo usaba UNA sola pagina, `FinancialQuiz.tsx`. Nadie
  // escribe una clase asi salvo que el problema le haya pasado: o sea que a
  // otra pagina publica ya le habia ocurrido y se parcho ahi, sin extenderlo a
  // las demas. La portada, que es la pagina publica mas visitada, se quedo sin
  // el.
  //
  // Tambien se quita `app-mobile-scroll-lock` por si acaso: esa clase pone
  // `height:100dvh` y `overflow:hidden`, la ponen otras pantallas de la
  // aplicacion y su limpieza depende de que el componente que la puso se
  // desmonte bien. Quitarla aqui cuesta nada y cierra ese camino.
  //
  // HONESTO: no pude reproducir la falla con mis herramientas. El navegador de
  // pruebas no logra deslizar NINGUNA pagina a 375 px —lo comprobe contra otro
  // sitio como control—, asi que mi medicion no sirve ni para confirmar ni
  // para descartar. Esto se apoya en lo que Rudy ve en su telefono y en que el
  // remedio ya existe en esta misma aplicacion. La prueba de verdad es su
  // dedo, no mi consola.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('app-mobile-scroll-lock');
    body.classList.remove('app-mobile-scroll-lock');
    root.classList.add('public-scroll-page');
    body.classList.add('public-scroll-page');

    return () => {
      root.classList.remove('public-scroll-page');
      body.classList.remove('public-scroll-page');
    };
  }, []);
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

  // Calculate prices based on billing period - fixed prices matching Stripe
  const getPrice = (monthlyPrice: number, _isBundle?: boolean) => {
    if (monthlyPrice === 0) return { display: '$0', period: language === 'es' ? '/mes' : '/mo', savings: '', annualTotal: '' };
    if (isAnnual) {
      const annualPrices: Record<string, { monthly: string; total: string; saved: string }> = {
        '7.99': { monthly: '6.49', total: '77.88', saved: '18' },
        '14.99': { monthly: '11.99', total: '143.88', saved: '20' },
        '19.99': { monthly: '15.99', total: '191.88', saved: '20' },
      };
      const key = monthlyPrice.toFixed(2);
      const prices = annualPrices[key];
      if (prices) {
        return { 
          display: `$${prices.monthly}`, 
          period: language === 'es' ? '/mes' : '/mo',
          savings: language === 'es' ? `Ahorras ${prices.saved}%` : `Save ${prices.saved}%`,
          annualTotal: language === 'es' ? `$${prices.total} USD/año` : `$${prices.total} USD/year`,
        };
      }
    }
    return { display: `$${monthlyPrice.toFixed(2)}`, period: language === 'es' ? '/mes' : '/mo', savings: '', annualTotal: '' };
  };

  const handleGetStarted = () => {
    navigate('/auth');
  };

  // Hero ref (no parallax)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 overflow-hidden">
      <SEOHead
        title={language === 'es'
          ? 'EvoFinz — Gestión Financiera Inteligente para Freelancers'
          : 'EvoFinz — Smart Financial Management for Freelancers'}
        description={language === 'es'
          ? 'Plataforma de gestión financiera con OCR, asistente de voz, gamificación y mentoría. Educación financiera para profesionales en Canadá y Latinoamérica.'
          : 'Financial management platform with OCR, voice assistant, gamification and mentorship. Financial education for professionals in Canada and Latin America.'}
        path="/"
      />
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
        {/* 2-sep-2026: aqui iba una linea verde-ambar-violeta que latia cada tres segundos
            bajo la barra. El borde inferior de la barra ya separa lo que hay que separar. */}
        
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
                >
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-semibold text-sm">Premium</span>
                  <span className="text-white font-bold">${isAnnual ? '6.49' : '7.99'}</span>
                  <span className="text-amber-200/60 text-xs">/mo</span>
                </motion.div>
                
                {/* Pro Plan */}
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/40"
                  whileHover={{ scale: 1.05 }}
                >
                  <Crown className="w-4 h-4 text-violet-400" />
                  <span className="text-violet-300 font-semibold text-sm">Pro</span>
                  <span className="text-white font-bold">${isAnnual ? '11.99' : '14.99'}</span>
                  <span className="text-violet-200/60 text-xs">/mo</span>
                </motion.div>
              </div>
              
              {/* Diagnóstico gratis → /quiz — agregado el 15-ago-2026 por orden de Rudy.
                  POR QUÉ: medido en vivo ese día, la landing tenía CERO enlaces a /quiz. Todos sus
                  botones pedían algo (crear cuenta, ver precios, pagar) y ninguno daba algo, así que
                  el visitante que aún no quería registrarse se iba sin dejar rastro. El quiz ya
                  existía, funciona y captura el correo de verdad (QuizModal.tsx valida el email y lo
                  manda a la función send-quiz-lead), pero no se ofrecía desde ninguna parte.
                  Fokuspark ya resuelve esto igual: su botón principal es "Quiero ordenar mi mente" → /quiz.

                  POR QUÉ `hidden lg:inline-flex` Y NO SIEMPRE VISIBLE: esta barra ya lleva "Ver planes"
                  + el CTA naranja, y bajo 1024px los precios se esconden justo porque el espacio se
                  acaba. Un tercer botón con texto en español —siempre más largo que el inglés— es
                  exactamente lo que rompió el navbar de Universmind Little el 14-ago (el menú no cabía
                  y se montaba sobre el logo). El móvil NO queda sin puerta al quiz: lo cubre el cierre
                  del carrusel en HowItWorksSection.tsx, que sí se ve en todos los tamaños. */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/quiz')}
                className="hidden lg:inline-flex text-white/80 hover:text-white hover:bg-white/10 font-medium text-sm"
              >
                <Target className="w-4 h-4 mr-1.5 text-cyan-400" />
                {language === 'es' ? 'Diagnóstico gratis' : 'Free assessment'}
              </Button>

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
              
              {/* Iniciar sesión, también aquí: al bajar, la barra superior del hero desaparece y
                  esta la reemplaza. Si el enlace no viviera en las dos, el cliente que vuelve lo
                  perdería de vista apenas empieza a leer.
                  `hidden sm:inline-flex` por lo mismo que "Diagnóstico gratis" de arriba: bajo ese
                  ancho el espacio se acaba y los botones se montan unos sobre otros. En móvil la
                  puerta es la barra del hero, que ahí sí está visible. */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex font-medium text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                {language === 'es' ? 'Iniciar sesión' : 'Sign in'}
              </Button>

              {/* CTA Button - Enhanced */}
              {/* 2-sep-2026: este boton tenia un halo naranja que latia cada segundo y medio y
                  un brillo blanco que lo barria de lado a lado sin parar. Ahora es un boton
                  naranja liso. El naranja se queda —es el color de la accion en todo el sitio y
                  eso si esta bien—; lo que se va es el parpadeo. */}
              <motion.div className="relative" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="relative bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm"
                >
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
        {/* EL FONDO DE TODA LA PAGINA — rehecho el 2-sep-2026.

            LO QUE HABIA. Dos manchas de 600 y 500 px de diametro, fijas detras de todo el sitio,
            que cambiaban de paleta cada ocho segundos: de cyan-azul-turquesa a naranja-rojo-ambar
            y de vuelta, en bucle, una desfasada cuatro segundos de la otra. Debajo, otras cuatro
            manchas de color en cyan, naranja, violeta y verde. En total seis colores distintos
            respirando detras del texto, para siempre.

            POR QUE SE VA. Se comparo la portada con las cinco aplicaciones contra las que compite
            —Monarch, YNAB, Rocket Money, Wave y FreshBooks—: ninguna tiene nada moviendose detras
            del contenido. Un fondo que cambia de color obliga al ojo a revisar cada pocos segundos
            si paso algo, y eso cansa antes de que la persona termine de leer. Ademas es la senal
            mas fuerte de pagina hecha en casa que tenia el sitio.

            LO QUE QUEDA. Dos lavados del azul de la marca, quietos y muy tenues, que dan
            profundidad sin llamar la atencion. Un solo tono, ninguna animacion. */}
        <DecorativeLayer className="absolute inset-0">
          <div
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, hsl(217 91% 50% / 0.16), transparent 70%)' }}
          />
        </DecorativeLayer>

        <DecorativeLayer className="absolute inset-0">
          <div
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(circle, hsl(199 89% 48% / 0.12), transparent 70%)' }}
          />
        </DecorativeLayer>
        
        {/* Grid pattern - slower parallax */}
        <DecorativeLayer className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), 
                                linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </DecorativeLayer>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-20">
        {/* Barra superior de la PRIMERA pantalla.

            POR QUÉ EXISTE (31-ago-2026, orden de Rudy). Hasta hoy la portada no tenia nada arriba:
            aquí solo vivía el selector de idioma. La barra de precios de más arriba en este mismo
            archivo aparece recién después de bajar 600 px, asi que en la primera pantalla no había
            logo que llevara al inicio ni puerta para entrar a la cuenta, y el único "Iniciar Sesión"
            estaba en el pie, a más de 12.000 px de scroll. Un cliente que ya paga y vuelve con la
            sesión vencida tenía que recorrer la portada entera para encontrar donde entrar.
            (Con la sesión viva no se nota: el useEffect de arriba lo manda directo al panel. El
            caso roto es el otro, que es justo el del cliente que vuelve después de un tiempo.)

            POR QUÉ NO ES `fixed`. Se queda dentro del hero y desaparece al bajar, que es exactamente
            cuando entra la barra de precios. Dos barras fijas a la vez se pisan una sobre otra.

            POR QUÉ COLORES CLAROS FIJOS Y NO TOKENS DE TEMA. Comprobado en el build: el contenedor
            de esta portada pinta su propio fondo claro (`from-slate-50 via-white to-slate-100`) y no
            lo cambia con el tema, así que la página se ve clara también en modo oscuro. Con
            `bg-background` el botón se volvía una pastilla OSCURA sobre una página CLARA. Si algún
            día el contenedor pasa a seguir el tema, este botón hay que cambiarlo junto con él. */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2" aria-label="EvoFinz">
            <img
              src={phoenixLogo}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 rounded-full shadow-md transition-transform group-hover:scale-105"
            />
            {/* 2-sep-2026: el nombre de la marca iba en un degradado de tres colores. Un
                nombre que cambia de color a lo largo de sus siete letras no se lee como marca.
                Azul de la marca, liso. */}
            <span className="text-lg font-black tracking-tight" style={{ color: 'hsl(217 91% 42%)' }}>
              EvoFinz
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="border-slate-300 bg-white/80 font-medium text-slate-700 backdrop-blur-sm hover:bg-white hover:text-slate-900"
            >
              {language === 'es' ? 'Iniciar sesión' : 'Sign in'}
            </Button>
          </div>
        </div>
        {/* 2-sep-2026: aqui iba <FloatingStars />, catorce simbolos de moneda de seis colores
            distintos flotando y rotando detras del titular. Se saca por decision de Rudy despues
            de comparar la portada con las cinco con las que compite —Monarch, YNAB, Rocket Money,
            Wave y FreshBooks—: ninguna tiene adorno animado detras del texto, todas ponen un solo
            color de acento y una captura del producto. El adorno era lo que hacia ver la pagina
            hecha en casa, no las palabras. El componente se deja en el repositorio por si se
            quiere en otra parte. */}
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
              className="flex flex-col items-center mb-4 relative"
            >
              {/* Logo chico, y sin el nombre debajo.
                  POR QUE. Antes iba en la variante `hero` (160-192 px) con el nombre debajo, y
                  entre las dos empujaban el titular hasta los 352 px de altura: el visitante
                  llegaba a la primera pantalla y lo primero que leia era un logo, no una razon
                  para quedarse. El nombre ya aparece dos veces mas arriba —en la barra superior y
                  en el propio titular («EvoFinz hace el resto»)— asi que aqui solo hace falta el
                  ave, y chica. */}
              <PhoenixLogo variant="sidebar" showText={false} />
            </motion.div>

            {/* EL TITULAR — cambiado el 1-sep-2026 con el OK de Rudy.
                Antes decia «Evoluciona tus Finanzas» + «La plataforma de gestion financiera mas
                completa para profesionales y freelancers». Dos frases que no hacen que nadie siga
                leyendo: un lema de marca y una afirmacion de categoria que ademas no se puede
                comprobar y que dice cualquiera.

                POR QUE ESTE. Se probaron tres titulares y Rudy los descarto con razon: cada uno le
                hablaba a UN solo publico —al independiente, al que declara impuestos, al que
                factura— y esta pagina atiende a tres (independientes, empleados y familias).
                Despues pidio que «lo entienda tambien un nino». De ahi sale este: una accion que
                cualquiera se imagina, palabras cortas y ninguna metafora.

                POR QUE SE REPARTE EN TRES RENGLONES. Un titular carga UNA idea; el subtitulo carga
                lo que la app hace; la tercera linea nombra a los tres publicos. Pedirle las tres
                cosas a una sola frase fue el error de las versiones anteriores.

                Todo lo que promete existe y esta verificado contra el codigo: la captura por foto,
                el detector de suscripciones fantasma, y la ruta fiscal con reglas reales de Canada
                y de Chile. No promete dinero ni ahorro, a proposito. */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1]"
            >
              <span className="text-slate-900">
                {language === 'es' ? 'Le tomas una foto a tu recibo.' : 'You take a photo of your receipt.'}
              </span>
              <br />
              {/* 2-sep-2026: este renglon cambiaba de color solo cada seis segundos, pasando de
                  azul-turquesa a rojo-naranja y de vuelta. Ahora es el azul de la marca, fijo. Un
                  titular que se mueve pide que lo mires a el; el trabajo del titular es que mires
                  lo que dice. */}
              <span className="inline-block" style={{ color: 'hsl(217 91% 42%)' }}>
                {language === 'es' ? 'EvoFinz hace el resto.' : 'EvoFinz does the rest.'}
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed"
            >
              {language === 'es' 
                ? <>Ordena tus gastos, te avisa <span className="font-semibold text-slate-900">lo que estás pagando de más</span> y deja <span className="font-semibold text-slate-900">tus impuestos listos</span>.</>
                : <>It sorts your expenses, warns you <span className="font-semibold text-slate-900">what you are overpaying for</span>, and gets <span className="font-semibold text-slate-900">your taxes ready</span>.</>
              }
            </motion.p>

            {/* La linea de los tres publicos. Va aparte del subtitulo a proposito: es la que
                impide que el titular vuelva a hablarle a uno solo. Reemplaza a la fila de
                «12 Modulos · Asistente de Voz · Multi-pais · 24/7 Acceso», que Rudy mando sacar:
                nadie compra «modulos» —es vocabulario nuestro— y el acceso permanente lo tiene
                cualquier pagina web. El asistente de voz no se pierde: baja a las insignias. */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="text-base md:text-lg text-slate-500 mb-8 max-w-2xl mx-auto"
            >
              {/* 2-sep-2026: antes esta linea decia «Con las reglas fiscales reales de Canadá y de
                  Chile», y junto a la insignia «+ países próximamente» le cerraba la puerta a
                  cualquiera que no viva en esos dos paises: se leia como «esta app es para Canadá
                  y Chile». Y es falso. Lo unico atado al pais es la capa de impuestos (calendario,
                  deducciones, tramos, reportes propios). Todo lo demas —gastos, ingresos, lectura
                  de recibos, presupuesto, patrimonio, cuentas por pagar, clientes y proyectos—
                  funciona igual en cualquier parte, en espanol o en ingles, y la moneda ya se
                  elige entre CAD, CLP, USD y EUR. Ahora se dice al reves: universal primero, la
                  profundidad fiscal como un extra. */}
              {language === 'es'
                ? 'Trabajes por tu cuenta, tengas un empleo o lleves las cuentas de tu casa. Funciona en cualquier país, en español o en inglés, y en tu moneda.'
                : 'Whether you work for yourself, have a job, or run your household. It works in any country, in English or Spanish, and in your currency.'
              }
            </motion.p>

            {/* Multi-country badges */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <Badge className="px-3 py-1.5 bg-slate-500/10 text-slate-700 border-slate-400/40">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                {language === 'es' ? 'En cualquier país' : 'In any country'}
              </Badge>
              <Badge className="px-3 py-1.5 bg-slate-500/10 text-slate-700 border-slate-400/40">
                {language === 'es' ? 'CAD · CLP · USD · EUR' : 'CAD · CLP · USD · EUR'}
              </Badge>
              {/* 2-sep-2026: estas cuatro insignias venian en cuatro colores distintos (dos
                  grises, una cyan, una verde). Ahora las cuatro son iguales: son cuatro datos del
                  mismo rango, no cuatro cosas de importancia distinta, y el color no significaba
                  nada. El microfono dibujado reemplaza al emoji 🎤. */}
              <Badge className="px-3 py-1.5 bg-slate-500/10 text-slate-700 border-slate-400/40">
                <Mic className="w-3.5 h-3.5 mr-1.5" />
                {language === 'es' ? 'Asistente de voz' : 'Voice assistant'}
              </Badge>
              <Badge className="px-3 py-1.5 bg-slate-500/10 text-slate-700 border-slate-400/40">
                {language === 'es'
                  ? '🇨🇦 🇨🇱 Impuestos a fondo'
                  : '🇨🇦 🇨🇱 Taxes in depth'}
              </Badge>
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
                className="relative text-lg px-10 py-7 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg shadow-orange-600/20 border-0 group"
              >
                {/* 2-sep-2026: el boton era un degradado de tres naranjas con un brillo blanco
                    que lo barria cada tres segundos y una sombra naranja del 40 %. Naranja liso,
                    sombra discreta y sin barrido. El boton mas importante de la pagina no
                    necesita moverse para que lo encuentren: es el unico que hay. */}
                <span className="relative z-10 flex items-center">
                  {language === 'es' ? 'Comenzar Gratis' : 'Start Free'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>

            {/* La linea que quita el miedo. Fokuspark ya la tiene y funciona: dice cuanto
                cuesta en tiempo, que no piden tarjeta y que se empieza gratis, justo donde el
                visitante duda antes de apretar. Antes aqui no habia nada entre el boton y la
                prueba social. */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="text-sm text-slate-500 mb-8"
            >
              {language === 'es'
                ? '2 minutos · Sin tarjeta · Empieza gratis'
                : '2 minutes · No card · Start free'}
            </motion.p>

            {/* Live Social Proof - after CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="max-w-md mx-auto mb-8"
            >
              <LiveSocialProof />
            </motion.div>


          </motion.div>
        </div>
      </section>

      {/* Quick Pricing Preview - Redesigned */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative py-6 bg-slate-900 border-y border-white/10"
      >
        {/* 2-sep-2026: la franja era un degradado de tres grises con borde ambar y una linea
            ambar que latia abajo. Gris liso y un borde normal. */}
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Plans with visual hierarchy */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* LAS CUATRO PASTILLAS DE PRECIO — rehechas el 2-sep-2026.

                  LO QUE HABIA: cada una con su propio degradado de dos colores (verde, ambar,
                  violeta, turquesa) y tres de las cuatro con un halo que crecia y se encogia sin
                  parar, desfasadas medio segundo entre si. Cuatro precios latiendo en cuatro
                  colores es la estetica de una maquina tragamonedas, y son justamente los numeros
                  con los que uno quiere que le crean.

                  LO QUE HAY: las cuatro iguales, quietas, en gris. Una sola —Premium, la que se
                  quiere vender— lleva el naranja de la accion. El color vuelve a significar algo:
                  naranja es lo que queremos que elijas. */}
              {[
                { icon: Gift,   nombre: 'Free',    precio: '$0', sufijo: null, destacada: false },
                { icon: Star,   nombre: 'Premium', precio: `$${isAnnual ? '6.49' : '7.99'}`,   sufijo: language === 'es' ? '/mes' : '/mo', destacada: true },
                { icon: Crown,  nombre: 'Pro',     precio: `$${isAnnual ? '11.99' : '14.99'}`, sufijo: language === 'es' ? '/mes' : '/mo', destacada: false },
                { icon: Layers, nombre: 'Bundle',  precio: `$${isAnnual ? '15.99' : '19.99'}`, sufijo: language === 'es' ? '/mes' : '/mo', destacada: false },
              ].map((plan) => {
                const Icono = plan.icon;
                return (
                  <motion.div
                    key={plan.nombre}
                    whileHover={{ y: -2 }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border ${
                      plan.destacada
                        ? 'bg-orange-500/15 border-orange-400/50'
                        : 'bg-white/5 border-white/15'
                    }`}
                  >
                    <Icono className={`w-5 h-5 ${plan.destacada ? 'text-orange-400' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${plan.destacada ? 'text-orange-200' : 'text-slate-300'}`}>{plan.nombre}</span>
                    <span className="font-bold text-white text-lg">{plan.precio}</span>
                    {plan.sufijo && <span className="text-slate-400 text-xs">{plan.sufijo}</span>}
                  </motion.div>
                );
              })}
            </div>

            <div className="hidden md:block w-px h-10 bg-white/15" />
            
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
                  className="relative text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm"
                >
                  {/* 2-sep-2026: sin el barrido de brillo, y sin el signo de exclamacion. El
                      boton dice lo que hace; la exclamacion no agrega nada y suena a rebaja. */}
                  <span className="relative z-10 flex items-center">
                    {language === 'es' ? 'Comenzar gratis' : 'Start free'}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Emotional Transformation Block - Pain → Promise (UniversMind-inspired) */}
      <EvoTransformationBlock />

      {/* PRESERVED (oculto del render activo, conservado por petición del usuario):
          <TransformationCarousel />
          <PainPointsSection />
      */}

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
            {/* 2-sep-2026: este circulo latia y la flecha de adentro rebotaba, las dos cosas a
                la vez y sin parar. Ahora es un circulo quieto: sigue diciendo «sigue bajando». */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: 'hsl(217 91% 50%)' }}>
              <ArrowRight className="w-5 h-5 text-white rotate-90" />
            </div>
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
                <span style={{ color: 'hsl(217 91% 42%)' }}>
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

      {/* Animated Stats */}
      <AnimatedStats />

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* Target Audience - Who is it for? */}
      <TargetAudienceSection />

      {/* Trust & Security */}
      <TrustSecuritySection />

      {/* 12 Modules Section with infinite carousel */}
      <section className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Parallax decorative elements */}
        <DecorativeLayer className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </DecorativeLayer>
        
        <DecorativeLayer className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
        </DecorativeLayer>

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
              <span className="text-orange-400">{language === 'es' ? 'de Transformación' : 'Tools'}</span>
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

      {/* Urgency Banner - before pricing */}

      {/* Pricing Section with parallax */}
      <section id="pricing-section" className="relative py-24 bg-slate-950 overflow-hidden">
        {/* Parallax background elements */}
        <DecorativeLayer className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-20 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </DecorativeLayer>

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
              <span className={`text-xs font-medium transition-opacity ${isAnnual ? 'text-green-400 opacity-100' : 'opacity-0'}`}>
                {language === 'es' ? 'Facturación anual' : 'Annual billing'}
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {pricingTiers.map((tier, index) => {
              const priceInfo = getPrice(tier.monthlyPrice, 'isBundle' in tier && tier.isBundle);
              return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative pt-6"
              >
                {/* Badge FUERA del Card para evitar overflow-hidden */}
                {tier.popular && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-[pulse-soft_2s_ease-in-out_infinite]">
                    <Star className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? 'Más Popular' : 'Most Popular'}
                  </Badge>
                )}
                {'isFree' in tier && tier.isFree && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-pulse">
                    <Gift className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? '¡100% GRATIS!' : '100% FREE!'}
                  </Badge>
                )}
                {'featured' in tier && tier.featured && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-[pulse-soft_2.2s_ease-in-out_infinite]">
                    <Crown className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? 'Más Completo' : 'Most Complete'}
                  </Badge>
                )}
                {'isBundle' in tier && tier.isBundle && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white border-0 px-4 py-1 font-bold z-20 shadow-lg animate-[pulse-soft_2.5s_ease-in-out_infinite]">
                    <Layers className="w-3 h-3 mr-1 inline" />
                    {language === 'es' ? 'Mejor Valor' : 'Best Value'}
                  </Badge>
                )}
                <Card 
                  className={`relative p-5 bg-slate-900/80 backdrop-blur-sm border-2 overflow-hidden h-full flex flex-col transition-all duration-300 ${
                    tier.popular 
                      ? 'border-orange-500 shadow-2xl shadow-orange-500/20 z-10 hover:shadow-orange-500/40 hover:-translate-y-2' 
                      : 'isFree' in tier && tier.isFree
                        ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20 z-10 hover:shadow-emerald-500/40 hover:-translate-y-2'
                        : 'featured' in tier && tier.featured
                          ? 'border-violet-500 shadow-2xl shadow-violet-500/25 z-10 hover:shadow-violet-500/40 hover:-translate-y-2'
                          : 'isBundle' in tier && tier.isBundle
                            ? 'border-teal-500 shadow-2xl shadow-teal-500/25 z-10 hover:shadow-teal-500/40 hover:-translate-y-2'
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
                  {'isBundle' in tier && tier.isBundle && (
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/30 rounded-full blur-3xl" />
                  )}
                  
                  <div className="text-center mb-3 relative">
                    <h3 className="text-lg font-bold text-white mb-0.5">{tier.name}</h3>
                    {'subtitle' in tier && tier.subtitle && (
                      <p className="text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wide">{tier.subtitle}</p>
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      {/* 2-sep-2026: cada precio se pintaba con el degradado de dos colores de
                          su plan. Un numero de precio se lee, no se decora: blanco y listo. */}
                      <span className="text-4xl font-black text-white">
                        {priceInfo.display}
                      </span>
                      <span className="text-slate-400 text-xs">USD{priceInfo.period}</span>
                    </div>
                    {priceInfo.annualTotal && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{priceInfo.annualTotal}</p>
                    )}
                    {priceInfo.savings && (
                      <p className="text-xs text-green-400 mt-0.5 font-semibold">{priceInfo.savings}</p>
                    )}
                    {/* Tagline */}
                    {'tagline' in tier && tier.tagline && (
                      <p className={`text-[11px] font-bold mt-1.5 px-2 py-0.5 rounded-full inline-block bg-gradient-to-r ${tier.gradient} text-white`}>
                        {tier.tagline}
                      </p>
                    )}
                  </div>

                  {/* Hero Features */}
                  <div className="space-y-1 mb-2">
                    {tier.heroFeatures.map((hf: { text: string; icon: string }) => (
                      <div 
                        key={hf.text} 
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                          tier.popular 
                            ? 'bg-amber-500/10 border border-amber-400/15' 
                            : 'isFree' in tier && tier.isFree
                              ? 'bg-emerald-500/10 border border-emerald-400/15'
                              : 'featured' in tier && tier.featured
                                ? 'bg-violet-500/10 border border-violet-400/15'
                                : 'bg-teal-500/10 border border-teal-400/15'
                        }`}
                      >
                        <span className="text-sm flex-shrink-0">{hf.icon}</span>
                        <span className="font-semibold text-white text-[11px] leading-tight">{hf.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features - 2-column grid for density */}
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 mb-2 flex-grow">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-1 text-[10px] leading-tight">
                        <Check className="h-2.5 w-2.5 flex-shrink-0 text-slate-500 mt-0.5" />
                        <span className="text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Value Note */}
                  {'valueNote' in tier && tier.valueNote && (
                    <p className="text-[10px] text-emerald-400/80 leading-snug mb-2 px-1">{tier.valueNote}</p>
                  )}

                  <Button 
                    className={`w-full py-4 font-bold ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-900' 
                        : 'featured' in tier && tier.featured
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-white/30'
                          : 'isBundle' in tier && tier.isBundle
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30 ring-2 ring-white/30'
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




      {/* Final CTA with parallax */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500" />
        
        {/* Parallax pattern */}
        <DecorativeLayer className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')`
            }}
          />
        </DecorativeLayer>
        
        <DecorativeLayer className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        </DecorativeLayer>
        
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
            
            {/* EL BOTON DEL CIERRE — rehecho el 2-sep-2026.

                LO QUE HABIA. El comentario del codigo lo llamaba, textualmente, «SUPER LLAMATIVO
                CTA BUTTON», y cumplia: un halo blanco que crecia y encogia, un anillo que se
                expandia hasta desaparecer, seis chispas blancas subiendo y bajando alrededor, un
                brillo ambar que barria el boton, una estrella girando sin parar y una flecha que
                se corria de lado. Siete animaciones a la vez, en el ultimo boton de la pagina.

                POR QUE SE VA. Un boton que se agita tanto no se lee como «esto es importante», se
                lee como «esto me quiere vender algo». Es la diferencia entre una tienda y un
                pregonero. En las cinco aplicaciones con las que competimos el boton final es
                liso, de un color, sin nada moviendose. */}
            <motion.div className="relative inline-block" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="relative bg-white text-slate-900 hover:bg-slate-100 text-lg px-12 py-8 shadow-xl font-semibold"
              >
                <span className="relative z-10 flex items-center">
                  {language === 'es' ? 'Crear cuenta gratis' : 'Create free account'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </span>
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
              
              {/* Social Links */}
              <SocialLinks className="order-3 md:order-2" iconSize="md" />
              
              <div className="flex items-center gap-6 text-sm pr-16 order-2 md:order-3 flex-wrap">
                <Link to="/terms" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Términos' : 'Terms'}
                </Link>
                <Link to="/privacy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Privacidad' : 'Privacy'}
                </Link>
                <Link to="/about" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Nosotros' : 'About'}
                </Link>
                <Link to="/status" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Estado' : 'Status'}
                </Link>
                <Link to="/legal#disclaimer" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {language === 'es' ? 'Legal' : 'Legal'}
                </Link>
                <ContactForm 
                  trigger={
                    <button className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {language === 'es' ? 'Contacto' : 'Contact'}
                    </button>
                  }
                />
                <Link to="/auth" className="text-slate-400 hover:text-orange-400 transition-colors font-medium">
                  {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                </Link>
              </div>
            </div>
            
            {/* Security Certifications */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-4 border-t border-slate-800">
              <span className="text-xs text-slate-500">
                {language === 'es' ? 'Seguridad de infraestructura:' : 'Infrastructure security:'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {language === 'es' ? 'Infraestructura SOC 2 Type II' : 'SOC 2 Type II Infrastructure'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {language === 'es' ? 'Infraestructura GDPR-Ready' : 'GDPR-Ready Infrastructure'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {language === 'es' ? 'Encriptación AES-256' : 'AES-256 Encryption'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                SSL/TLS
              </span>
            </div>
            
            <div className="text-center border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500 max-w-3xl mx-auto">
                {language === 'es' 
                  ? 'EvoFinz es una herramienta educativa. La información proporcionada no constituye asesoría financiera, fiscal o de inversión. Consulte siempre con profesionales certificados antes de tomar decisiones financieras.'
                  : 'EvoFinz is an educational tool. The information provided does not constitute financial, tax, or investment advice. Always consult with certified professionals before making financial decisions.'}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                © 2026 EvoFinz. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'} | v2.5.0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
