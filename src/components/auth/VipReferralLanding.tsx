import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { toast } from 'sonner';
import { 
  Gift, 
  Star, 
  Sparkles, 
  Crown, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Trophy,
  Flame,
  Zap,
  Shield
} from 'lucide-react';

interface VipReferralLandingProps {
  referralCode: string;
  onContinueToSignup: (email: string, name: string) => void;
  onSkip: () => void;
}

export function VipReferralLanding({ referralCode, onContinueToSignup, onSkip }: VipReferralLandingProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);

  const benefits = language === 'es' ? [
    { icon: Crown, text: '90 días de acceso Premium GRATIS', color: 'text-amber-400' },
    { icon: Sparkles, text: 'OCR ilimitado para escanear recibos', color: 'text-violet-400' },
    { icon: Zap, text: 'Asistente financiero con voz', color: 'text-cyan-400' },
    { icon: Trophy, text: 'Gamificación con puntos y recompensas', color: 'text-emerald-400' },
    { icon: Shield, text: 'Protección de datos nivel empresarial', color: 'text-rose-400' },
  ] : [
    { icon: Crown, text: '90 days FREE Premium access', color: 'text-amber-400' },
    { icon: Sparkles, text: 'Unlimited OCR receipt scanning', color: 'text-violet-400' },
    { icon: Zap, text: 'Voice-powered financial assistant', color: 'text-cyan-400' },
    { icon: Trophy, text: 'Gamification with points and rewards', color: 'text-emerald-400' },
    { icon: Shield, text: 'Enterprise-grade data protection', color: 'text-rose-400' },
  ];

  const handleCaptureLead = async () => {
    if (!email.trim()) {
      toast.error(language === 'es' ? 'Por favor ingresa tu email' : 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Capture lead with consent
      const { error } = await supabase
        .from('referral_leads')
        .insert({
          email: email.trim(),
          name: name.trim() || null,
          referral_code: referralCode,
          marketing_consent: marketingConsent,
          source: 'vip_landing'
        });

      if (error) {
        console.error('Lead capture error:', error);
        // Continue anyway - don't block the user
      }

      setCaptured(true);
      
      // After a brief celebration, continue to signup
      setTimeout(() => {
        onContinueToSignup(email, name);
      }, 2000);
      
    } catch (error) {
      console.error('Error capturing lead:', error);
      // Continue anyway
      onContinueToSignup(email, name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {!captured ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg"
            >
              {/* VIP Badge */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    {language === 'es' ? '🎁 INVITACIÓN VIP' : '🎁 VIP INVITATION'}
                    <Star className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>

              {/* Phoenix Logo */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <PhoenixLogo variant="hero" showText={true} />
              </motion.div>

              {/* Headline */}
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                  {language === 'es' 
                    ? '¡Un amigo te invitó!' 
                    : 'A friend invited you!'}
                </h1>
                <p className="text-lg text-white/70">
                  {language === 'es'
                    ? 'Únete al programa beta exclusivo y transforma tus finanzas'
                    : 'Join the exclusive beta program and transform your finances'}
                </p>
              </motion.div>

              {/* Benefits */}
              <motion.div 
                className="grid gap-3 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className={`p-2 rounded-lg bg-white/10 ${benefit.color}`}>
                      <benefit.icon className="h-5 w-5" />
                    </div>
                    <span className="text-white font-medium">{benefit.text}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Lead Capture Form */}
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80 text-sm">
                      {language === 'es' ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                    </Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={language === 'es' ? 'María García' : 'John Doe'}
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white/80 text-sm">
                      {language === 'es' ? 'Tu email *' : 'Your email *'}
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@ejemplo.com"
                      required
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="consent"
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                      className="border-white/40 data-[state=checked]:bg-violet-500"
                    />
                    <Label htmlFor="consent" className="text-white/60 text-xs leading-relaxed cursor-pointer">
                      {language === 'es'
                        ? 'Acepto recibir consejos financieros, tips y novedades de EvoFinz. Puedo cancelar cuando quiera.'
                        : 'I agree to receive financial tips, advice and updates from EvoFinz. I can unsubscribe anytime.'}
                    </Label>
                  </div>

                  <Button
                    onClick={handleCaptureLead}
                    disabled={loading || !email.trim()}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold py-6 text-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Flame className="h-5 w-5 animate-pulse" />
                        {language === 'es' ? 'Procesando...' : 'Processing...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {language === 'es' ? '¡Quiero mi acceso VIP!' : 'I want my VIP access!'}
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </div>

                <button
                  onClick={onSkip}
                  className="w-full text-center text-white/50 hover:text-white/70 text-sm mt-4 transition-colors"
                >
                  {language === 'es' ? 'Continuar sin registrar email →' : 'Continue without registering email →'}
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div 
                className="flex items-center justify-center gap-2 mt-6 text-white/50 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Users className="h-4 w-4" />
                <span>
                  {language === 'es' 
                    ? '+500 beta testers ya están transformando sus finanzas' 
                    : '+500 beta testers are already transforming their finances'}
                </span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: "spring" }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-white mb-3">
                {language === 'es' ? '¡Excelente!' : 'Excellent!'}
              </h2>
              <p className="text-white/70 mb-4">
                {language === 'es' 
                  ? 'Preparando tu cuenta VIP...' 
                  : 'Preparing your VIP account...'}
              </p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}