import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExitIntentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  currentStep: number;
  totalSteps: number;
}

export const ExitIntentPopup = memo(function ExitIntentPopup({
  isOpen,
  onClose,
  onContinue,
  currentStep,
  totalSteps
}: ExitIntentPopupProps) {
  const { language } = useLanguage();
  
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  
  const content = {
    es: {
      title: '¡Espera! Ya casi terminas',
      subtitle: 'Tu progreso se guardará automáticamente',
      progress: `Has completado el ${progressPercent}% de la evaluación`,
      benefits: [
        'Resultados personalizados en 2 minutos',
        'Recomendaciones basadas en tu situación',
        'Plan de acción específico para ti'
      ],
      continueBtn: 'Continuar evaluación',
      leaveBtn: 'Salir de todas formas',
      savedNote: 'Podrás continuar donde lo dejaste'
    },
    en: {
      title: 'Wait! You\'re almost done',
      subtitle: 'Your progress will be saved automatically',
      progress: `You've completed ${progressPercent}% of the assessment`,
      benefits: [
        'Personalized results in 2 minutes',
        'Recommendations based on your situation',
        'Specific action plan for you'
      ],
      continueBtn: 'Continue assessment',
      leaveBtn: 'Leave anyway',
      savedNote: 'You can continue where you left off'
    }
  };
  
  const t = content[language as keyof typeof content] || content.es;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-full max-w-md mx-4"
          >
            <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden">
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="p-6 pt-8">
                {/* Icon */}
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center"
                >
                  <Clock className="w-8 h-8 text-amber-400" />
                </motion.div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  {t.title}
                </h2>
                <p className="text-slate-400 text-center text-sm mb-4">
                  {t.subtitle}
                </p>
                
                {/* Progress indicator */}
                <div className="bg-slate-700/50 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">{t.progress}</span>
                    <span className="text-amber-400 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>
                </div>
                
                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  {t.benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-300">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
                
                {/* CTAs */}
                <div className="space-y-3">
                  <Button
                    onClick={onContinue}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-amber-500/30"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    {t.continueBtn}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <button
                    onClick={onClose}
                    className="w-full text-sm text-slate-500 hover:text-slate-400 transition-colors py-2"
                  >
                    {t.leaveBtn}
                  </button>
                </div>
                
                {/* Saved note */}
                <p className="text-xs text-slate-500 text-center mt-4 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.savedNote}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
