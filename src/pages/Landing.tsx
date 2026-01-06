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
  Star, Flame, Target, Crown
} from 'lucide-react';
import evofinzLogo from '@/assets/evofinz-logo.png';

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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] transition-all duration-1000"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
            left: mousePosition.x * 0.02 + '%',
            top: mousePosition.y * 0.02 + '%',
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] transition-all duration-1000"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
            right: mousePosition.x * 0.01 + '%',
            bottom: mousePosition.y * 0.01 + '%',
          }}
        />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.8)_70%)]" />
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
            {/* Logo with glow effect */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mb-8 relative"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-gradient-to-br from-orange-500/50 to-red-500/50 rounded-full blur-3xl animate-pulse" />
              </div>
              <img 
                src={evofinzLogo} 
                alt="EvoFinz" 
                className="relative z-10 h-32 md:h-40 w-auto object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* Main headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Evoluciona
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent animate-gradient-x">
                tus Finanzas
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              La plataforma de gestión financiera más completa para 
              <span className="text-orange-400 font-semibold"> profesionales </span>
              y 
              <span className="text-amber-400 font-semibold"> freelancers </span>
              en Canadá.
            </motion.p>

            {/* Stats bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-12"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <Icon className="h-4 w-4 text-orange-400" />
                    <span className="font-bold text-white">{stat.value}</span>
                    <span className="text-slate-400 text-sm">{stat.label}</span>
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
                className="relative text-lg px-10 py-7 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-slate-900 font-bold shadow-2xl shadow-orange-500/30 border-0 group overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowBetaInput(!showBetaInput)}
                className="text-lg px-8 py-7 border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-orange-400/50 text-white"
              >
                <Gift className="mr-2 h-5 w-5 text-orange-400" />
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
                <div className="relative">
                  <Input
                    placeholder="EVOFINZ-BETA-2026-XX"
                    value={betaCode}
                    onChange={(e) => handleBetaCodeChange(e.target.value)}
                    className={`h-16 text-center text-lg font-mono uppercase bg-slate-900/80 border-2 text-white placeholder:text-slate-500 ${
                      codeStatus === 'valid' 
                        ? 'border-emerald-500 bg-emerald-950/50' 
                        : codeStatus === 'invalid'
                          ? 'border-red-500 bg-red-950/50'
                          : 'border-white/20 focus:border-orange-400'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {codeStatus === 'checking' && <Loader2 className="h-6 w-6 animate-spin text-slate-400" />}
                    {codeStatus === 'valid' && <CheckCircle2 className="h-6 w-6 text-emerald-400" />}
                    {codeStatus === 'invalid' && <XCircle className="h-6 w-6 text-red-400" />}
                  </div>
                </div>
                {codeStatus === 'valid' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-emerald-400 text-sm mt-3 flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      ¡Código válido! Acceso beta desbloqueado.
                    </p>
                    <Button 
                      onClick={handleGetStarted}
                      className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-6"
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Activar Acceso Beta
                    </Button>
                  </motion.div>
                )}
                {codeStatus === 'invalid' && (
                  <p className="text-red-400 text-sm mt-3">Código inválido o expirado.</p>
                )}
              </motion.div>
            )}

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
              >
                <div className="w-1.5 h-3 bg-white/50 rounded-full" />
              </motion.div>
            </motion.div>
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
                    className="relative p-5 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden h-full"
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
              >
                <Card 
                  className={`relative p-8 bg-slate-900/80 backdrop-blur-sm border-2 overflow-hidden h-full flex flex-col ${
                    tier.popular 
                      ? 'border-orange-500 shadow-2xl shadow-orange-500/20 scale-105 z-10' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Popular glow effect */}
                  {tier.popular && (
                    <>
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl" />
                      <Badge className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-1 font-bold">
                        <Star className="w-3 h-3 mr-1 inline" />
                        Más Popular
                      </Badge>
                    </>
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
                src={evofinzLogo} 
                alt="EvoFinz" 
                className="h-20 w-auto mx-auto"
                style={{ filter: 'brightness(0) invert(1) drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
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
              <img src={evofinzLogo} alt="EvoFinz" className="h-10 w-auto" />
              <span className="font-bold text-white">EvoFinz</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 EvoFinz. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm">
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
