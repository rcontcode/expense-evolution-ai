import { memo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ResumeQuizBannerProps {
  onResume: () => void;
  onStartFresh: () => void;
  savedStep: number;
  totalSteps: number;
}

export const ResumeQuizBanner = memo(function ResumeQuizBanner({
  onResume,
  onStartFresh,
  savedStep,
  totalSteps
}: ResumeQuizBannerProps) {
  const { language } = useLanguage();
  const progressPercent = Math.round((savedStep / totalSteps) * 100);
  
  const content = {
    es: {
      title: '¡Continúa donde lo dejaste!',
      subtitle: `Tienes un ${progressPercent}% completado`,
      resumeBtn: 'Continuar',
      startFreshBtn: 'Empezar de nuevo'
    },
    en: {
      title: 'Continue where you left off!',
      subtitle: `You have ${progressPercent}% completed`,
      resumeBtn: 'Continue',
      startFreshBtn: 'Start fresh'
    }
  };
  
  const t = content[language as keyof typeof content] || content.es;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{t.title}</h3>
            <p className="text-slate-400 text-xs">{t.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onResume}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {t.resumeBtn}
          </Button>
          <button
            onClick={onStartFresh}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title={t.startFreshBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
