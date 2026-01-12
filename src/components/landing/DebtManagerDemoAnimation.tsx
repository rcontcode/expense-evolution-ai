import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Zap, Calendar, DollarSign, CheckCircle2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const getDebts = (language: string) => [
  { name: language === 'es' ? 'Tarjeta de Crédito' : 'Credit Card', balance: 5200, rate: 19.9, min: 156, color: 'from-red-500 to-rose-600' },
  { name: language === 'es' ? 'Préstamo Auto' : 'Car Loan', balance: 12500, rate: 6.5, min: 350, color: 'from-orange-500 to-amber-600' },
  { name: language === 'es' ? 'Línea de Crédito' : 'Line of Credit', balance: 3800, rate: 12.0, min: 95, color: 'from-yellow-500 to-orange-500' },
];

export function DebtManagerDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<'idle' | 'analyzing' | 'strategy' | 'projection' | 'complete'>('idle');
  const [debtIndex, setDebtIndex] = useState(0);
  const [extraPayment, setExtraPayment] = useState(0);

  const debts = getDebts(language);

  useEffect(() => {
    const sequence = async () => {
      setStep('idle');
      setDebtIndex(0);
      setExtraPayment(0);
      
      await new Promise(r => setTimeout(r, 1500));
      setStep('analyzing');
      
      // Animate through debts
      for (let i = 0; i <= debts.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setDebtIndex(i);
      }
      
      await new Promise(r => setTimeout(r, 800));
      setStep('strategy');
      
      // Animate extra payment
      for (let i = 0; i <= 200; i += 20) {
        await new Promise(r => setTimeout(r, 100));
        setExtraPayment(i);
      }
      
      await new Promise(r => setTimeout(r, 1000));
      setStep('projection');
      
      await new Promise(r => setTimeout(r, 2500));
      setStep('complete');
      
      await new Promise(r => setTimeout(r, 3000));
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        {/* Phone frame - standardized size */}
        <div className="relative w-[240px] sm:w-[260px] md:w-[280px] aspect-[1/2] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />

          {/* Screen */}
          <div className="relative w-full h-full bg-gradient-to-b from-slate-50 to-white rounded-[2rem] overflow-hidden">
            {/* Status bar */}
            <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
              <span className="text-xs font-medium text-slate-600">9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-slate-600 rounded-sm" />
              </div>
            </div>

            {/* Header */}
            <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-rose-500 to-red-600 flex items-center px-4 z-10">
              <TrendingDown className="w-4 h-4 text-white mr-2" />
              <span className="text-white font-bold text-sm">
                {language === "es" ? "Gestor de Deudas" : "Debt Manager"}
              </span>
            </div>

            <div className="pt-20 px-4 space-y-3">
              <AnimatePresence mode="wait">
                {step === "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center"
                      >
                        <DollarSign className="w-8 h-8 text-white" />
                      </motion.div>
                      <p className="text-slate-600 text-sm">
                        {language === "es" ? "Analizando tus deudas..." : "Analyzing your debts..."}
                      </p>
                    </div>
                  </motion.div>
                )}

                {(step === "analyzing" ||
                  step === "strategy" ||
                  step === "projection" ||
                  step === "complete") && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {/* Debts list */}
                    <div className="space-y-2">
                      {debts.map((debt, index) => (
                        <motion.div
                          key={debt.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{
                            opacity: index < debtIndex ? 1 : 0.3,
                            x: 0,
                            scale: index < debtIndex ? 1 : 0.95,
                          }}
                          transition={{ delay: index * 0.2 }}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-slate-800 text-sm">
                              {debt.name}
                            </span>
                            <span
                              className={`text-xs font-bold bg-gradient-to-r ${debt.color} bg-clip-text text-transparent`}
                            >
                              {debt.rate}% APR
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-900">
                              ${debt.balance.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500">Min: ${debt.min}</span>
                          </div>
                          {index < debtIndex && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              className={`h-1 mt-2 rounded-full bg-gradient-to-r ${debt.color}`}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Strategy Section */}
                    {(step === "strategy" ||
                      step === "projection" ||
                      step === "complete") && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-violet-600" />
                          <span className="font-bold text-violet-900 text-sm">
                            {language === "es" ? "Método Avalancha" : "Avalanche Method"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600">
                              {language === "es" ? "Pago extra:" : "Extra payment:"}
                            </span>
                            <span className="font-bold text-violet-700">${extraPayment}/mo</span>
                          </div>
                          <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(extraPayment / 200) * 100}%` }}
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Projection */}
                    {(step === "projection" || step === "complete") && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-bold text-sm">
                            {language === "es" ? "Libre de deudas en:" : "Debt-free in:"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-3xl font-black"
                          >
                            2.5
                          </motion.span>
                          <span className="text-emerald-100">
                            {language === "es" ? "años" : "years"}
                          </span>
                          <span className="text-xs text-emerald-200 ml-auto">
                            vs 4.2 {language === "es" ? "sin extra" : "without extra"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-100">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          {language === "es"
                            ? "Ahorras $1,847 en intereses"
                            : "Save $1,847 in interest"}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Info badges - positioned below phone (standardized) */}
        <AnimatePresence>
          {step === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-2 mt-4"
            >
              <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-rose-600 border border-rose-100">
                ⚡ {language === "es" ? "Avalancha vs Bola de Nieve" : "Avalanche vs Snowball"}
              </span>
              <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-emerald-600 border border-emerald-100">
                ✨ -$1,847 {language === "es" ? "en intereses" : "in interest"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
