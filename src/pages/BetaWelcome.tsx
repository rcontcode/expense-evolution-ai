import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingAmbientMusic } from '@/components/onboarding/OnboardingAmbientMusic';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';
import { 
  Sparkles, Gift, Crown, Zap, Heart, Star,
  ArrowRight, CheckCircle2, Rocket
} from 'lucide-react';
import evofinzLogo from '@/assets/evofinz-logo.png';

export default function BetaWelcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [userName, setUserName] = useState('Beta Tester');

  useEffect(() => {
    // Get user name from metadata
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name.split(' ')[0]);
    }
  }, [user]);

  useEffect(() => {
    // Celebration confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#1e3a5f', '#14b8a6', '#f59e0b']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#1e3a5f', '#14b8a6', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => setShowContent(true), 500);
  }, []);

  const benefits = [
    {
      icon: Crown,
      title: 'Acceso Premium Completo',
      description: 'Todas las funcionalidades Pro desbloqueadas sin costo durante beta'
    },
    {
      icon: Zap,
      title: 'Prioridad en Features',
      description: 'Acceso anticipado a nuevas funcionalidades antes que nadie'
    },
    {
      icon: Heart,
      title: 'Canal Directo de Feedback',
      description: 'Tus sugerencias moldean el producto directamente'
    },
    {
      icon: Star,
      title: 'Badge Founding Member',
      description: 'Badge exclusivo que muestra que estuviste desde el inicio'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4 overflow-hidden relative">
      <OnboardingAmbientMusic />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {showContent && (
        <div className="w-full max-w-3xl relative z-10 animate-scale-in">
          <Card className="p-8 md:p-12 bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl">
            <div className="text-center mb-10">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img src={evofinzLogo} alt="EvoFinz" className="h-20 w-auto object-contain" />
              </div>

              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 px-6 py-3 rounded-full mb-6">
                <Gift className="h-5 w-5 text-accent animate-pulse" />
                <span className="font-bold text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  🎉 ¡ACCESO BETA ACTIVADO!
                </span>
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-4">
                ¡Bienvenid@ a la Familia,{' '}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {userName}
                </span>
                ! 🚀
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Ahora eres parte de un grupo exclusivo de early adopters. Esto es lo que obtienes:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 animate-fade-in"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shrink-0">
                    <benefit.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {benefit.title}
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mb-8">
              <Badge className="px-6 py-3 text-base font-bold bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-lg animate-pulse">
                ⭐ FOUNDING MEMBER ⭐
              </Badge>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={() => navigate('/beta-features')}
                className="text-lg px-12 py-7 shadow-2xl font-bold group"
                variant="gradient"
              >
                <Rocket className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Explorar Lo Que Puedes Hacer
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
