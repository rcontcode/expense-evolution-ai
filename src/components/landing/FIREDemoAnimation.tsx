import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TrendingUp, Calendar, DollarSign, Target, PiggyBank, Sparkles } from "lucide-react";

type Step = "idle" | "input" | "calculating" | "result";

export function FIREDemoAnimation() {
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [years, setYears] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setProgress(0);
      setYears(0);
      
      setTimeout(() => setStep("input"), 800);
      setTimeout(() => setStep("calculating"), 3500);
      setTimeout(() => setStep("result"), 5000);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "result") {
      const targetYears = 12;
      const duration = 1500;
      const steps = 20;
      const increment = targetYears / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetYears) {
          setYears(targetYears);
          setProgress(100);
          clearInterval(timer);
        } else {
          setYears(Math.round(current));
          setProgress(Math.round((current / targetYears) * 100));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [step]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl shadow-slate-900/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden aspect-[9/16]">
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
            <span className="text-xs font-medium text-slate-600">9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-slate-600 rounded-sm" />
            </div>
          </div>

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center z-10">
            <Flame className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Calculadora FIRE</span>
          </div>

          <div className="pt-20 px-3 h-full flex flex-col">
            <AnimatePresence mode="wait">
              {step === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <Flame className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">Financial Independence</p>
                  <p className="text-xs text-slate-400">Retire Early</p>
                </motion.div>
              )}

              {step === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-3"
                >
                  <p className="text-xs text-slate-500 text-center mb-3">Ingresa tus datos</p>
                  
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400">Ingresos anuales</p>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-bold text-slate-700"
                          >
                            $85,000
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400">Gastos anuales</p>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-bold text-slate-700"
                          >
                            $45,000
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <PiggyBank className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400">Ahorros actuales</p>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-bold text-slate-700"
                          >
                            $120,000
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Target className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400">Retorno esperado</p>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-bold text-slate-700"
                          >
                            7% anual
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl py-2.5 text-center text-white font-bold text-sm shadow-lg"
                  >
                    Calcular FIRE
                  </motion.div>
                </motion.div>
              )}

              {step === "calculating" && (
                <motion.div
                  key="calculating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-orange-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4 text-sm font-medium text-slate-600"
                  >
                    Calculando libertad...
                  </motion.p>
                </motion.div>
              )}

              {step === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-3"
                >
                  {/* Main Result */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-center shadow-lg mb-3"
                  >
                    <Flame className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-orange-100 text-xs mb-1">Fecha FIRE estimada</p>
                    <p className="text-3xl font-black text-white mb-1">{years} años</p>
                    <p className="text-orange-100 text-sm font-medium">2038</p>
                  </motion.div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-lg p-2 text-center shadow-sm"
                    >
                      <p className="text-[10px] text-slate-400">Tasa de ahorro</p>
                      <p className="text-lg font-bold text-emerald-600">47%</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-lg p-2 text-center shadow-sm"
                    >
                      <p className="text-[10px] text-slate-400">Meta FIRE</p>
                      <p className="text-lg font-bold text-orange-600">$1.125M</p>
                    </motion.div>
                  </div>

                  {/* Progress to FIRE */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-500">Progreso actual</span>
                      <span className="font-bold text-orange-600">10.7%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "10.7%" }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">$120,000 de $1,125,000</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating labels */}
      <AnimatePresence>
        {step === "result" && (
          <>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -right-4 top-1/3 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-orange-600 border border-orange-100"
            >
              🔥 Regla del 4%
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-red-600 border border-red-100"
            >
              📈 Proyección realista
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
