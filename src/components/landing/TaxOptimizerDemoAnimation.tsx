import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lightbulb, TrendingUp, Receipt, DollarSign, Check, ArrowRight, Sparkles, Calculator } from "lucide-react";

type Step = "idle" | "analyzing" | "suggestions" | "complete";

const suggestions = [
  { category: "Home Office", current: "$800", potential: "$2,400", saving: "$1,600", icon: "🏠" },
  { category: "Vehículo", current: "$1,200", potential: "$3,500", saving: "$2,300", icon: "🚗" },
  { category: "Educación", current: "$0", potential: "$500", saving: "$500", icon: "📚" },
];

export function TaxOptimizerDemoAnimation() {
  const [step, setStep] = useState<Step>("idle");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setSuggestionIndex(0);
      setTotalSavings(0);
      
      setTimeout(() => setStep("analyzing"), 800);
      setTimeout(() => setStep("suggestions"), 3000);
      setTimeout(() => setStep("complete"), 6500);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "suggestions") {
      const timer = setInterval(() => {
        setSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length));
      }, 600);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "complete") {
      const target = 4400;
      const duration = 1500;
      const steps = 30;
      const increment = target / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setTotalSavings(target);
          clearInterval(timer);
        } else {
          setTotalSavings(Math.round(current));
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

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-cyan-500 to-teal-600 flex items-center justify-center z-10">
            <Calculator className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Tax Optimizer Smart</span>
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
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <Brain className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">Optimiza tus impuestos</p>
                  <p className="text-xs text-slate-400">con inteligencia artificial</p>
                </motion.div>
              )}

              {step === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-cyan-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-cyan-500" />
                    </div>
                  </div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4 text-sm font-medium text-slate-600"
                  >
                    Analizando tus gastos...
                  </motion.p>
                  <div className="mt-3 space-y-1 text-center">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[10px] text-slate-400">✓ Revisando categorías CRA</motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-[10px] text-slate-400">✓ Calculando deducciones</motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-[10px] text-slate-400">✓ Identificando oportunidades</motion.p>
                  </div>
                </motion.div>
              )}

              {(step === "suggestions" || step === "complete") && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2"
                >
                  {/* Header */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-2 mb-3"
                  >
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-slate-700 text-sm">Oportunidades Encontradas</span>
                  </motion.div>

                  {/* Suggestions */}
                  <div className="space-y-2 mb-3">
                    {suggestions.slice(0, suggestionIndex).map((sug, i) => (
                      <motion.div
                        key={sug.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-xl p-2.5 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-lg">{sug.icon}</span>
                          <span className="flex-1 text-xs font-medium text-slate-700">{sug.category}</span>
                          <span className="text-xs font-bold text-emerald-600">+{sug.saving}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <div className="flex-1">
                            <span className="text-slate-400">Actual: </span>
                            <span className="text-slate-600">{sug.current}</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-cyan-500" />
                          <div className="flex-1 text-right">
                            <span className="text-slate-400">Potencial: </span>
                            <span className="text-emerald-600 font-medium">{sug.potential}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Total Savings */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto"
                    >
                      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-4 text-center shadow-lg">
                        <p className="text-cyan-100 text-xs mb-1">Ahorro potencial en impuestos</p>
                        <motion.p className="text-3xl font-black text-white">
                          ${totalSavings.toLocaleString()}
                        </motion.p>
                        <p className="text-cyan-100 text-[10px] mt-1">basado en reglas CRA 2026</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating labels */}
      <AnimatePresence>
        {step === "complete" && (
          <>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -right-4 top-1/3 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-cyan-600 border border-cyan-100"
            >
              🧠 Análisis Smart
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-teal-600 border border-teal-100"
            >
              📋 Reglas CRA actualizadas
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
