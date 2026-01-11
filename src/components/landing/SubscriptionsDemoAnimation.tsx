import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, AlertTriangle, TrendingUp, Eye, Ban, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const getSubscriptions = (language: string) => [
  { name: 'Netflix', amount: 15.99, category: 'Entertainment', icon: '🎬', status: 'active' },
  { name: 'Spotify', amount: 9.99, category: 'Music', icon: '🎵', status: 'active' },
  { name: 'Amazon Prime', amount: 14.99, category: 'Shopping', icon: '📦', status: 'active' },
  { name: 'Adobe CC', amount: 54.99, category: 'Work', icon: '🎨', status: 'forgotten' },
  { name: 'Gym', amount: 49.99, category: 'Health', icon: '💪', status: 'unused' },
];

export function SubscriptionsDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<'idle' | 'scanning' | 'found' | 'analysis' | 'complete'>('idle');
  const [visibleSubs, setVisibleSubs] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  const subscriptions = getSubscriptions(language);

  useEffect(() => {
    const sequence = async () => {
      setStep('idle');
      setVisibleSubs(0);
      setShowAlert(false);
      
      await new Promise(r => setTimeout(r, 1500));
      setStep('scanning');
      
      // Show subscriptions one by one
      for (let i = 1; i <= subscriptions.length; i++) {
        await new Promise(r => setTimeout(r, 500));
        setVisibleSubs(i);
      }
      
      await new Promise(r => setTimeout(r, 800));
      setStep('found');
      setShowAlert(true);
      
      await new Promise(r => setTimeout(r, 1500));
      setStep('analysis');
      
      await new Promise(r => setTimeout(r, 2000));
      setStep('complete');
      
      await new Promise(r => setTimeout(r, 3000));
    };

    sequence();
    const interval = setInterval(sequence, 11000);
    return () => clearInterval(interval);
  }, []);

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const potentialSavings = subscriptions.filter(s => s.status !== 'active').reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="relative flex items-center justify-center py-8">
      <div className="relative">
        {/* Phone frame */}
        <div className="relative w-[280px] h-[520px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[3rem] p-2 shadow-2xl border border-slate-700">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20" />
          
          {/* Screen */}
          <div className="relative w-full h-full bg-gradient-to-b from-slate-50 to-white rounded-[2.5rem] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-6 pt-10">
              <div className="flex items-center gap-2 text-white">
                <CreditCard className="w-5 h-5" />
                <span className="font-bold">{language === 'es' ? 'Detector de Suscripciones' : 'Subscription Detector'}</span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <AnimatePresence mode="wait">
                {step === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-8"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full border-4 border-pink-200 border-t-pink-500"
                    />
                    <p className="mt-4 text-sm text-slate-600">
                      {language === 'es' ? 'Escaneando transacciones...' : 'Scanning transactions...'}
                    </p>
                  </motion.div>
                )}

                {(step !== 'idle') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    {/* Summary Card */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">{language === 'es' ? 'Total mensual' : 'Monthly total'}</span>
                        <span className="font-bold text-lg text-rose-600">${totalMonthly.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        ${(totalMonthly * 12).toFixed(0)}/{language === 'es' ? 'año' : 'year'}
                      </div>
                    </motion.div>

                    {/* Subscriptions List */}
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {subscriptions.slice(0, visibleSubs).map((sub, index) => (
                        <motion.div
                          key={sub.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-2.5 rounded-lg bg-white border ${
                            sub.status === 'forgotten' ? 'border-red-300 bg-red-50' :
                            sub.status === 'unused' ? 'border-amber-300 bg-amber-50' :
                            'border-slate-200'
                          } flex items-center gap-3`}
                        >
                          <span className="text-xl">{sub.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-800 truncate">{sub.name}</span>
                              {sub.status === 'forgotten' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full">
                                  {language === 'es' ? '¡Olvidada!' : 'Forgotten!'}
                                </span>
                              )}
                              {sub.status === 'unused' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full">
                                  {language === 'es' ? 'Sin usar' : 'Unused'}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{sub.category}</span>
                          </div>
                          <span className="font-bold text-slate-800">${sub.amount}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Alert */}
                    {showAlert && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-bold text-sm">{language === 'es' ? '¡Alerta de ahorro!' : 'Savings alert!'}</span>
                        </div>
                        <p className="text-xs text-amber-100">
                          {language === 'es' 
                            ? `Podrías ahorrar $${potentialSavings.toFixed(2)}/mes cancelando suscripciones sin usar`
                            : `You could save $${potentialSavings.toFixed(2)}/mo canceling unused subscriptions`}
                        </p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    {(step === 'analysis' || step === 'complete') && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <button className="flex-1 py-2 rounded-lg bg-rose-100 text-rose-700 text-xs font-medium flex items-center justify-center gap-1">
                          <Ban className="w-3 h-3" />
                          {language === 'es' ? 'Cancelar' : 'Cancel'}
                        </button>
                        <button className="flex-1 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3" />
                          {language === 'es' ? 'Revisar' : 'Review'}
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating labels */}
        {step === 'complete' && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute -left-32 top-1/4 bg-white rounded-xl px-3 py-2 shadow-xl border border-pink-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-pink-600" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-800">{subscriptions.length}</div>
                  <div className="text-slate-500">{language === 'es' ? 'Detectadas' : 'Detected'}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -right-28 top-1/2 bg-white rounded-xl px-3 py-2 shadow-xl border border-emerald-200"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-700">+${(potentialSavings * 12).toFixed(0)}</div>
                  <div className="text-slate-500">/{language === 'es' ? 'año' : 'year'}</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
