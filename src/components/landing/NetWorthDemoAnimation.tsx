import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Home, Car, Coins, CreditCard, PiggyBank, ArrowUpRight, Wallet, DollarSign } from "lucide-react";

type Step = "idle" | "assets" | "liabilities" | "complete";

const assets = [
  { icon: Home, label: "Casa", value: "$350,000", color: "from-emerald-400 to-green-500", income: "$1,800/mes", incomeType: "Arriendo" },
  { icon: Car, label: "Vehículo", value: "$28,000", color: "from-blue-400 to-cyan-500", income: "$600/mes", incomeType: "Uber/Trabajo" },
  { icon: Coins, label: "Inversiones", value: "$45,000", color: "from-amber-400 to-orange-500", income: "$380/mes", incomeType: "Dividendos" },
  { icon: PiggyBank, label: "Ahorros", value: "$12,500", color: "from-violet-400 to-purple-500", income: "$52/mes", incomeType: "Intereses" },
];

const liabilities = [
  { icon: Home, label: "Hipoteca", value: "-$220,000", color: "from-red-400 to-rose-500" },
  { icon: CreditCard, label: "Tarjetas", value: "-$3,200", color: "from-orange-400 to-red-500" },
];

export function NetWorthDemoAnimation() {
  const [step, setStep] = useState<Step>("idle");
  const [assetIndex, setAssetIndex] = useState(0);
  const [liabilityIndex, setLiabilityIndex] = useState(0);
  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setAssetIndex(0);
      setLiabilityIndex(0);
      setNetWorth(0);
      
      setTimeout(() => setStep("assets"), 800);
      setTimeout(() => setStep("liabilities"), 4000);
      setTimeout(() => setStep("complete"), 6000);
      setTimeout(() => setStep("idle"), 10000);
    };

    sequence();
    const interval = setInterval(sequence, 11000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "assets") {
      const timer = setInterval(() => {
        setAssetIndex((prev) => Math.min(prev + 1, assets.length));
      }, 400);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "liabilities") {
      const timer = setInterval(() => {
        setLiabilityIndex((prev) => Math.min(prev + 1, liabilities.length));
      }, 400);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "complete") {
      const targetNetWorth = 212300;
      const duration = 1500;
      const steps = 30;
      const increment = targetNetWorth / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetNetWorth) {
          setNetWorth(targetNetWorth);
          clearInterval(timer);
        } else {
          setNetWorth(Math.round(current));
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

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center z-10">
            <Wallet className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Patrimonio Neto</span>
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
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4"
                  >
                    <TrendingUp className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">Calculando patrimonio...</p>
                </motion.div>
              )}

              {(step === "assets" || step === "liabilities" || step === "complete") && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2"
                >
                  {/* Assets Section */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-slate-700">Activos</span>
                    </div>
                    <div className="space-y-1.5">
                      {assets.slice(0, assetIndex).map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className="flex items-center gap-2 p-1.5 bg-white rounded-lg shadow-sm"
                          >
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-600">{item.label}</span>
                                <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-600 font-medium flex items-center gap-0.5">
                                  <DollarSign className="w-2 h-2" />
                                  {item.incomeType}
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-500">{item.income}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">{item.value}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Liabilities Section */}
                  {(step === "liabilities" || step === "complete") && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs font-semibold text-slate-700">Pasivos</span>
                      </div>
                      <div className="space-y-1.5">
                        {liabilities.slice(0, liabilityIndex).map((item, i) => {
                          const Icon = item.icon;
                          return (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -20, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              className="flex items-center gap-2 p-1.5 bg-white rounded-lg shadow-sm"
                            >
                              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="flex-1 text-xs text-slate-600">{item.label}</span>
                              <span className="text-xs font-bold text-red-600">{item.value}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Net Worth Result */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto"
                    >
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3 text-center shadow-lg">
                        <p className="text-xs text-emerald-100 mb-1">Patrimonio Neto</p>
                        <motion.p
                          className="text-2xl font-black text-white"
                        >
                          ${netWorth.toLocaleString()}
                        </motion.p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-200" />
                          <span className="text-xs text-emerald-200">+5.2% este mes</span>
                        </div>
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
              className="absolute -right-4 top-1/4 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-emerald-600 border border-emerald-100"
            >
              📈 Tracking automático
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-teal-600 border border-teal-100"
            >
              🎯 Proyección 6 meses
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
