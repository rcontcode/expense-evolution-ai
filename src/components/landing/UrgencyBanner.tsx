import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Zap, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface UrgencyProps {
  variant?: 'banner' | 'compact' | 'floating';
  maxSpots?: number;
}

export const UrgencyBanner = memo(function UrgencyBanner({ 
  variant = 'banner',
  maxSpots = 100 
}: UrgencyProps) {
  const { language } = useLanguage();
  const isVisible = usePageVisibility();
  const [spotsUsed, setSpotsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 59, seconds: 59 });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch actual beta code usage
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { count } = await supabase
          .from('beta_code_uses')
          .select('*', { count: 'exact', head: true });

        // Also count total profiles as fallback
        const { count: profileCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Use whichever is higher
        setSpotsUsed(Math.max(count || 0, profileCount || 0, 45));
      } catch {
        setSpotsUsed(45); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
  }, []);

  // Countdown timer (resets every 48h based on localStorage)
  useEffect(() => {
    const TIMER_KEY = 'evofinz_urgency_timer_end';
    
    const getEndTime = () => {
      const stored = localStorage.getItem(TIMER_KEY);
      if (stored) {
        const endTime = parseInt(stored, 10);
        if (endTime > Date.now()) {
          return endTime;
        }
      }
      // Set new 48h timer
      const newEndTime = Date.now() + (48 * 60 * 60 * 1000);
      localStorage.setItem(TIMER_KEY, newEndTime.toString());
      return newEndTime;
    };

    const endTime = getEndTime();

    const updateTimer = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        // Reset timer
        localStorage.removeItem(TIMER_KEY);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    if (!isVisible) return;
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const spotsRemaining = maxSpots - spotsUsed;
  const percentUsed = Math.min((spotsUsed / maxSpots) * 100, 100);
  const isAlmostFull = percentUsed >= 80;

  // Compact variant for inline use
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-full px-3 py-1.5"
      >
        <Zap className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-xs font-medium text-orange-400">
          {language === 'es' 
            ? `Solo ${spotsRemaining} lugares Beta` 
            : `Only ${spotsRemaining} Beta spots`}
        </span>
      </motion.div>
    );
  }

  // Floating variant for corner display
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-2xl border border-orange-500/30 max-w-xs"
      >
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-bold text-white">
            {language === 'es' ? 'Oferta Beta Limitada' : 'Limited Beta Offer'}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{language === 'es' ? 'Lugares restantes' : 'Spots remaining'}</span>
            <span className="font-bold text-orange-400">{spotsRemaining}/{maxSpots}</span>
          </div>
          <Progress value={percentUsed} className="h-2 bg-slate-700" />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {language === 'es' ? 'Precio especial expira en' : 'Special price expires in'}{' '}
            <span className="font-mono text-orange-400">
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </span>
        </div>
      </motion.div>
    );
  }

  // Full banner variant
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${
        isAlmostFull 
          ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500' 
          : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500'
      } p-4 shadow-xl`}
    >
      {/* Animated background pulse */}
      {isAlmostFull && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/50 to-transparent animate-pulse" />
      )}

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Main message */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            {isAlmostFull ? (
              <Zap className="h-6 w-6 text-white" />
            ) : (
              <Gift className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isAlmostFull 
                ? (language === 'es' ? '⚡ ¡Casi agotados!' : '⚡ Almost sold out!')
                : (language === 'es' ? '🎁 Acceso Beta Exclusivo' : '🎁 Exclusive Beta Access')}
            </h3>
            <p className="text-sm text-white/90">
              {language === 'es' 
                ? 'Precio especial de lanzamiento + funciones gratis de por vida'
                : 'Special launch price + free features for life'}
            </p>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="flex items-center gap-6">
          {/* Spots */}
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-white/70" />
              <span className="text-2xl font-bold text-white">
                {isLoading ? '...' : spotsRemaining}
              </span>
            </div>
            <span className="text-xs text-white/70">
              {language === 'es' ? 'lugares' : 'spots'}
            </span>
          </div>

          {/* Progress */}
          <div className="w-24">
            <div className="flex justify-between text-[10px] text-white/70 mb-1">
              <span>{Math.round(percentUsed)}%</span>
              <span>{language === 'es' ? 'lleno' : 'full'}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentUsed}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isAlmostFull 
                    ? 'bg-gradient-to-r from-white to-yellow-200' 
                    : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="font-mono text-2xl font-bold text-white">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-white/70">
              {language === 'es' ? 'restantes' : 'remaining'}
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-orange-600 font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
          onClick={() => {
            const ctaButton = document.querySelector('[data-cta="main"]');
            ctaButton?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {language === 'es' ? '¡Quiero mi lugar!' : 'Claim my spot!'}
        </motion.button>
      </div>
    </motion.div>
  );
});
