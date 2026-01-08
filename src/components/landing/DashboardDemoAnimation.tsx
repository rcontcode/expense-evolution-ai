import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "idle" | "loading" | "charts" | "complete";

export function DashboardDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [chartProgress, setChartProgress] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setChartProgress(0);
      
      setTimeout(() => setStep("loading"), 500);
      setTimeout(() => setStep("charts"), 1500);
      setTimeout(() => setStep("complete"), 4500);
      setTimeout(() => setStep("idle"), 9000);
    };

    sequence();
    const interval = setInterval(sequence, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "charts") {
      const timer = setInterval(() => {
        setChartProgress((prev) => Math.min(prev + 1, 100));
      }, 25);
      return () => clearInterval(timer);
    }
  }, [step]);

  const barHeights = [65, 85, 45, 90, 70, 80, 55];
  const pieSegments = [
    { percent: 35, color: "from-cyan-400 to-blue-500", label: language === 'es' ? "Servicios" : "Services" },
    { percent: 25, color: "from-emerald-400 to-green-500", label: language === 'es' ? "Comidas" : "Meals" },
    { percent: 20, color: "from-amber-400 to-orange-500", label: language === 'es' ? "Transporte" : "Transport" },
    { percent: 20, color: "from-violet-400 to-purple-500", label: language === 'es' ? "Otros" : "Other" },
  ];

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

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center z-10">
            <BarChart3 className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Analytics</span>
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
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-4"
                  >
                    <PieChart className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">
                    {language === 'es' ? 'Cargando analytics...' : 'Loading analytics...'}
                  </p>
                </motion.div>
              )}

              {step === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <div className="w-full max-w-[200px] h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {language === 'es' ? 'Analizando datos...' : 'Analyzing data...'}
                  </p>
                </motion.div>
              )}

              {(step === "charts" || step === "complete") && (
                <motion.div
                  key="charts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2 space-y-3"
                >
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-slate-500">
                          {language === 'es' ? 'Ingresos' : 'Income'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">$8,450</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] text-slate-500">
                          {language === 'es' ? 'Gastos' : 'Expenses'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">$3,280</p>
                    </motion.div>
                  </div>

                  {/* Bar Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <p className="text-[10px] text-slate-500 mb-2">
                      {language === 'es' ? 'Tendencia Mensual' : 'Monthly Trend'}
                    </p>
                    <div className="flex items-end justify-between h-16 gap-1">
                      {barHeights.map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${(height * chartProgress) / 100}%` }}
                          className={`flex-1 rounded-t ${
                            i === barHeights.length - 1 
                              ? "bg-gradient-to-t from-violet-500 to-purple-400" 
                              : "bg-gradient-to-t from-slate-300 to-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {["J", "F", "M", "A", "M", "J", "J"].map((m, i) => (
                        <span key={m + i} className="text-[8px] text-slate-400 flex-1 text-center">{m}</span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Category Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <p className="text-[10px] text-slate-500 mb-2">
                      {language === 'es' ? 'Por Categoría' : 'By Category'}
                    </p>
                    <div className="space-y-1.5">
                      {pieSegments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${seg.color}`} />
                          <span className="text-[10px] text-slate-600 flex-1">{seg.label}</span>
                          <motion.div
                            className="h-1.5 rounded-full bg-slate-100 w-16 overflow-hidden"
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(seg.percent * chartProgress) / 100}%` }}
                              className={`h-full bg-gradient-to-r ${seg.color}`}
                            />
                          </motion.div>
                          <span className="text-[10px] font-medium text-slate-700 w-8 text-right">{seg.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Balance Card */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-3 text-center shadow-lg"
                    >
                      <p className="text-xs text-violet-100">
                        {language === 'es' ? 'Balance Mensual' : 'Monthly Balance'}
                      </p>
                      <p className="text-xl font-black text-white">+$5,170</p>
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
              className="absolute -right-4 top-1/3 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-violet-600 border border-violet-100"
            >
              {language === 'es' ? '📊 9+ visualizaciones' : '📊 9+ visualizations'}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-purple-600 border border-purple-100"
            >
              {language === 'es' ? '🎯 Predicciones Smart' : '🎯 Smart Predictions'}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
