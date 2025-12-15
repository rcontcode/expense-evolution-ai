import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Camera, Receipt, FileText, Calculator, Trophy, GraduationCap,
  BarChart3, BookOpen, Building2, CreditCard, Mic, TrendingUp,
  ArrowRight, Check, Sparkles, Shield, Zap, Gift, Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import evofinzLogo from '@/assets/evofinz-logo.png';

const features = [
  { icon: Camera, title: 'Captura Inteligente', description: 'OCR + Voz con IA', tier: 'Pro' },
  { icon: Receipt, title: 'Gestión Completa', description: 'Gastos e Ingresos', tier: 'Premium' },
  { icon: FileText, title: 'Contratos IA', description: 'Análisis automático', tier: 'Pro' },
  { icon: Calculator, title: 'Calculadoras', description: 'FIRE/RRSP/TFSA', tier: 'Pro' },
  { icon: Trophy, title: 'Gamificación', description: 'XP y Logros', tier: 'Premium' },
  { icon: GraduationCap, title: 'Mentoría', description: 'Kiyosaki/Tracy', tier: 'Pro' },
  { icon: BarChart3, title: 'Analytics', description: '9+ visualizaciones', tier: 'Pro' },
  { icon: BookOpen, title: 'Educación', description: 'Tracking de recursos', tier: 'Premium' },
  { icon: Building2, title: 'Análisis Bancario', description: 'Detección de anomalías', tier: 'Pro' },
  { icon: CreditCard, title: 'Suscripciones', description: 'Detector automático', tier: 'Premium' },
  { icon: Mic, title: 'Asistente Voz', description: 'Dictado inteligente', tier: 'Pro' },
  { icon: TrendingUp, title: 'Patrimonio', description: 'Activos vs Pasivos', tier: 'Premium' },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mes',
    description: 'Para empezar',
    features: ['20 gastos/mes', '5 OCR scans', 'Dashboard básico', 'Categorización manual'],
    cta: 'Comenzar Gratis',
    popular: false
  },
  {
    name: 'Premium',
    price: '$4.99',
    period: '/mes',
    description: 'Para profesionales',
    features: ['Gastos ilimitados', '50 OCR scans/mes', 'Contratos con IA', 'Exportación T2125', 'Gamificación completa'],
    cta: 'Comenzar Premium',
    popular: true
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/mes',
    description: 'Para empresas',
    features: ['Todo ilimitado', 'AI Tax Optimizer', 'Análisis Bancario IA', 'Mentoría completa', 'Soporte prioritario'],
    cta: 'Comenzar Pro',
    popular: false
  }
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
    
    // Debounce validation
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src={evofinzLogo} alt="EvoFinz" className="h-24 w-auto object-contain drop-shadow-lg" />
            </div>

            {/* Tagline */}
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Evoluciona tus Finanzas
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La plataforma de gestión financiera más completa para profesionales y freelancers en Canadá. 
              Cumplimiento CRA, IA integrada, y mentoría financiera.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mb-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>12 módulos</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Cumplimiento CRA</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>IA integrada</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button 
                size="lg" 
                variant="gradient"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 shadow-xl"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setShowBetaInput(!showBetaInput)}
                className="text-lg px-8 py-6"
              >
                <Gift className="mr-2 h-5 w-5" />
                ¿Tienes código beta?
              </Button>
            </div>

            {/* Beta Code Input */}
            {showBetaInput && (
              <div className="max-w-md mx-auto animate-fade-in">
                <div className="relative">
                  <Input
                    placeholder="EVOFINZ-BETA-2025-XX"
                    value={betaCode}
                    onChange={(e) => handleBetaCodeChange(e.target.value)}
                    className={`h-14 text-center text-lg font-mono uppercase ${
                      codeStatus === 'valid' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                        : codeStatus === 'invalid'
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                          : ''
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {codeStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    {codeStatus === 'valid' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {codeStatus === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
                {codeStatus === 'valid' && (
                  <p className="text-green-600 text-sm mt-2">¡Código válido! Acceso beta desbloqueado.</p>
                )}
                {codeStatus === 'invalid' && (
                  <p className="text-red-600 text-sm mt-2">Código inválido o expirado.</p>
                )}
                {codeStatus === 'valid' && (
                  <Button 
                    onClick={handleGetStarted}
                    className="mt-4 w-full"
                    variant="gradient"
                  >
                    Activar Acceso Beta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">12 Módulos Potentes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tus finanzas personales y de negocio en un solo lugar.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  className="p-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group relative overflow-hidden"
                >
                  <Badge 
                    className={`absolute top-2 right-2 text-xs ${
                      feature.tier === 'Pro' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  >
                    {feature.tier}
                  </Badge>
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">Planes Simples y Transparentes</h2>
            <p className="text-muted-foreground">
              Empieza gratis, escala cuando lo necesites.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`p-6 relative ${
                  tier.popular 
                    ? 'border-2 border-primary shadow-xl scale-105' 
                    : ''
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Más Popular
                  </Badge>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={tier.popular ? 'gradient' : 'outline'}
                  onClick={() => navigate('/auth')}
                >
                  {tier.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            ¿Listo para Evolucionar tus Finanzas?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Únete a cientos de profesionales que ya están optimizando sus finanzas con EvoFinz.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-xl"
          >
            Crear Cuenta Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={evofinzLogo} alt="EvoFinz" className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground">
              © 2025 EvoFinz. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/auth" className="hover:text-foreground">Iniciar Sesión</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
