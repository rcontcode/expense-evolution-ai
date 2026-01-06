import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Star, Flame, Target, Crown, Heart, AlertTriangle, Clock, Lightbulb, ChevronRight, Quote
} from 'lucide-react';
import phoenixLogo from '@/assets/phoenix-clean-logo.png';

const features = [
  { icon: Camera, title: 'Captura Inteligente', description: 'OCR + Voz con IA', tier: 'Pro', color: 'from-orange-500 to-red-500' },
  { icon: Receipt, title: 'Gestión Completa', description: 'Gastos e Ingresos', tier: 'Premium', color: 'from-emerald-500 to-teal-500' },
  { icon: FileText, title: 'Contratos IA', description: 'Análisis automático', tier: 'Pro', color: 'from-blue-500 to-indigo-500' },
  { icon: Calculator, title: 'Calculadoras', description: 'FIRE/RRSP/TFSA', tier: 'Pro', color: 'from-purple-500 to-pink-500' },
  { icon: Trophy, title: 'Gamificación', description: 'XP y Logros', tier: 'Premium', color: 'from-amber-500 to-orange-500' },
  { icon: GraduationCap, title: 'Mentoría', description: 'Kiyosaki/Tracy', tier: 'Pro', color: 'from-cyan-500 to-blue-500' },
  { icon: BarChart3, title: 'Analytics', description: '9+ visualizaciones', tier: 'Pro', color: 'from-rose-500 to-red-500' },
  { icon: BookOpen, title: 'Educación', description: 'Tracking de recursos', tier: 'Premium', color: 'from-green-500 to-emerald-500' },
  { icon: Building2, title: 'Análisis Bancario', description: 'Detección de anomalías', tier: 'Pro', color: 'from-violet-500 to-purple-500' },
  { icon: CreditCard, title: 'Suscripciones', description: 'Detector automático', tier: 'Premium', color: 'from-pink-500 to-rose-500' },
  { icon: Mic, title: 'Asistente Voz', description: 'Dictado inteligente', tier: 'Pro', color: 'from-indigo-500 to-blue-500' },
  { icon: TrendingUp, title: 'Patrimonio', description: 'Activos vs Pasivos', tier: 'Premium', color: 'from-teal-500 to-cyan-500' },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mes',
    description: 'Para empezar',
    features: ['20 gastos/mes', '5 OCR scans', 'Dashboard básico', 'Categorización manual'],
    cta: 'Comenzar Gratis',
    popular: false,
    gradient: 'from-slate-600 to-slate-700'
  },
  {
    name: 'Premium',
    price: '$4.99',
    period: '/mes',
    description: 'Para profesionales',
    features: ['Gastos ilimitados', '50 OCR scans/mes', 'Contratos con IA', 'Exportación T2125', 'Gamificación completa'],
    cta: 'Comenzar Premium',
    popular: true,
    gradient: 'from-amber-500 via-orange-500 to-red-500'
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/mes',
    description: 'Para empresas',
    features: ['Todo ilimitado', 'AI Tax Optimizer', 'Análisis Bancario IA', 'Mentoría completa', 'Soporte prioritario'],
    cta: 'Comenzar Pro',
    popular: false,
    gradient: 'from-violet-600 to-indigo-600'
  }
];

const stats = [
  { value: '12', label: 'Módulos', icon: Sparkles },
  { value: '100%', label: 'CRA Compliant', icon: Shield },
  { value: 'IA', label: 'Integrada', icon: Zap },
  { value: '24/7', label: 'Acceso', icon: Star },
];

export default function Landing() {
  const navigate = useNavigate();
  const [showBetaInput, setShowBetaInput] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Animated Background with alternating colors */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated gradient orbs - alternating between cool and warm */}
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
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-4 relative z-10">
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
              {/* Logo container with intentional circular clipping */}
              <div className="relative z-10">
                {/* Pulsing glow ring */}
                <div className="absolute inset-0 w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400 animate-[pulse-glow_3s_ease-in-out_infinite] blur-md" />
                <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/80">
                  <img 
                    src={phoenixLogo} 
                    alt="EvoFinz Phoenix" 
                    className="w-[115%] h-[115%] object-contain"
                  />
                </div>
              </div>
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
                Evoluciona
              </motion.span>
              <br />
              <span className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                tus Finanzas
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              La plataforma de gestión financiera más completa para 
              <span className="text-cyan-600 font-semibold"> profesionales </span>
              y 
              <span className="text-teal-600 font-semibold"> freelancers </span>
              en Canadá.
            </motion.p>

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
                  Comenzar Gratis
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
                ¿Tienes código beta?
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

      {/* Hero's Journey Emotional Carousel */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30">
              <Heart className="w-4 h-4 mr-2 inline animate-pulse" />
              Tu Viaje de Transformación
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black">
              <span className="text-white">Del Caos al </span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Control Total</span>
            </h2>
          </motion.div>

          {/* Emotional Journey Carousel */}
          <div className="relative">
            <motion.div 
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* 1. MIEDOS - Fear Phase */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-center"
              >
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500 animate-pulse" />
                  <div className="relative h-full bg-gradient-to-br from-red-950/90 via-slate-900 to-orange-950/90 backdrop-blur-xl rounded-xl p-6 border border-red-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 text-red-500/10 text-[120px] font-black">1</div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-red-500/30">
                        <AlertTriangle className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-red-400 tracking-widest">FASE 1</span>
                      <h3 className="text-2xl font-black text-white mt-1 mb-3">Los Miedos</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        "¿A dónde se fue mi dinero?" El caos financiero genera ansiedad, noches sin dormir y la sensación de perder el control.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">Caos</span>
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">Ansiedad</span>
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">Incertidumbre</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 2. TEMORES - Fear of Future */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-center"
              >
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500" />
                  <div className="relative h-full bg-gradient-to-br from-amber-950/90 via-slate-900 to-yellow-950/90 backdrop-blur-xl rounded-xl p-6 border border-amber-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 text-amber-500/10 text-[120px] font-black">2</div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-amber-400 tracking-widest">FASE 2</span>
                      <h3 className="text-2xl font-black text-white mt-1 mb-3">Los Temores</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        "¿Y si pierdo todo?" El miedo al futuro, a las multas fiscales, a no poder proveer para tu familia te paraliza.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">Multas</span>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">Futuro incierto</span>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">Parálisis</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 3. DESPERTAR - Awakening */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-center"
              >
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-500 to-teal-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500" />
                  <div className="relative h-full bg-gradient-to-br from-cyan-950/90 via-slate-900 to-blue-950/90 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 text-cyan-500/10 text-[120px] font-black">3</div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                        <Lightbulb className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-cyan-400 tracking-widest">FASE 3</span>
                      <h3 className="text-2xl font-black text-white mt-1 mb-3">El Despertar</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        "¡Hay una mejor manera!" Descubres EvoFinz y sientes esperanza. La claridad comienza a iluminar tu camino.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs">Esperanza</span>
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs">Decisión</span>
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs">Claridad</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 4. TRANSFORMACIÓN - Transformation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-center"
              >
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500 animate-[pulse_3s_ease-in-out_infinite]" />
                  <div className="relative h-full bg-gradient-to-br from-purple-950/90 via-slate-900 to-violet-950/90 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 text-purple-500/10 text-[120px] font-black">4</div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 animate-pulse">
                        <Flame className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-purple-400 tracking-widest">FASE 4</span>
                      <h3 className="text-2xl font-black text-white mt-1 mb-3">La Transformación</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        "¡Ahora entiendo!" Cada recibo escaneado, cada gasto categorizado te acerca a la maestría financiera.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">Crecimiento</span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">Aprendizaje</span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">Progreso</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 5. SUEÑOS - Dreams */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-center"
              >
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-rose-500 to-red-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-500" />
                  <div className="relative h-full bg-gradient-to-br from-pink-950/90 via-slate-900 to-rose-950/90 backdrop-blur-xl rounded-xl p-6 border border-pink-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 text-pink-500/10 text-[120px] font-black">5</div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
                        <Heart className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-pink-400 tracking-widest">FASE 5</span>
                      <h3 className="text-2xl font-black text-white mt-1 mb-3">Los Sueños</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        "¡Puedo lograrlo!" Visualizas la casa propia, los viajes, la educación de tus hijos. Tus metas tienen fecha.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">Visión</span>
                        <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">Metas</span>
                        <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">Propósito</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 6. VICTORIA - Victory */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-center"
              >
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition duration-500 animate-[pulse_2s_ease-in-out_infinite]" />
                  <div className="relative h-full bg-gradient-to-br from-emerald-950/90 via-slate-900 to-green-950/90 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 text-emerald-500/10 text-[120px] font-black">6</div>
                    
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 animate-bounce">
                        <Trophy className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 tracking-widest">FASE 6</span>
                      <h3 className="text-2xl font-black text-white mt-1 mb-3">La Victoria</h3>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        "¡Lo logré!" Libertad financiera alcanzada. Paz mental. Control total. Tu futuro asegurado.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs">Libertad</span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs">Paz</span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs">Éxito</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <div className="flex justify-center mt-6 gap-2">
              <span className="text-slate-500 text-sm flex items-center gap-2">
                <ChevronRight className="w-4 h-4 animate-pulse" />
                Desliza para ver tu transformación
                <ChevronRight className="w-4 h-4 animate-pulse" />
              </span>
            </div>
          </div>

          {/* Motivational Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <div className="inline-block relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-orange-500/20 rounded-2xl blur-xl" />
              <blockquote className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl px-8 py-6 border border-slate-700/50">
                <Quote className="w-8 h-8 text-orange-500/50 mb-2" />
                <p className="text-xl md:text-2xl font-medium text-white italic mb-3">
                  "El viaje de mil millas comienza con un solo paso... <br/>
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 bg-clip-text text-transparent font-bold">
                    Tu primer paso es hoy.
                  </span>"
                </p>
                <footer className="text-slate-400 text-sm">— Lao Tzu, adaptado para tu transformación financiera</footer>
              </blockquote>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4">
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

      {/* Pricing Section */}
      <section className="relative py-24 bg-slate-950">
        <div className="container mx-auto px-4">
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
            <p className="text-slate-400 text-lg">
              Empieza gratis, escala cuando lo necesites.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
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
                        {tier.price}
                      </span>
                      <span className="text-slate-400">{tier.period}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{tier.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <div className={`p-1 rounded-full bg-gradient-to-r ${tier.gradient}`}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-slate-300">{feature}</span>
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
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={phoenixLogo} alt="EvoFinz" className="h-10 w-auto" />
              <span className="font-bold text-white">EvoFinz</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 EvoFinz. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm pr-16">
              <Link to="/auth" className="text-slate-400 hover:text-orange-400 transition-colors font-medium">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
