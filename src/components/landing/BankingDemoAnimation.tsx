import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Upload, Sparkles, AlertTriangle, RefreshCw, Search, TrendingUp, CreditCard, Wifi, Home, ShoppingCart } from "lucide-react";

type Step = "idle" | "uploading" | "analyzing" | "results";

const transactions = [
  { icon: Wifi, name: "Netflix", amount: "-$15.99", category: "Suscripción", color: "text-red-500", recurring: true },
  { icon: ShoppingCart, name: "Walmart", amount: "-$127.43", category: "Compras", color: "text-orange-500", recurring: false },
  { icon: Home, name: "Rent Payment", amount: "-$1,500.00", category: "Vivienda", color: "text-blue-500", recurring: true },
  { icon: CreditCard, name: "Amazon Prime", amount: "-$12.99", category: "Suscripción", color: "text-purple-500", recurring: true },
];

const anomalies = [
  { type: "duplicate", message: "Posible cargo duplicado", amount: "$45.00" },
  { type: "spike", message: "Gasto inusual detectado", amount: "$320.00" },
];

export function BankingDemoAnimation() {
  const [step, setStep] = useState<Step>("idle");
  const [transactionIndex, setTransactionIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setTransactionIndex(0);
      setUploadProgress(0);
      
      setTimeout(() => setStep("uploading"), 800);
      setTimeout(() => setStep("analyzing"), 3000);
      setTimeout(() => setStep("results"), 5000);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "uploading") {
      const timer = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 100));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "results") {
      const timer = setInterval(() => {
        setTransactionIndex((prev) => Math.min(prev + 1, transactions.length));
      }, 300);
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

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center z-10">
            <Building2 className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Smart Banking</span>
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
                    whileHover={{ scale: 1.05 }}
                    className="w-full max-w-[180px] h-24 border-2 border-dashed border-rose-300 rounded-xl flex flex-col items-center justify-center bg-rose-50 cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-rose-400 mb-2" />
                    <p className="text-xs text-rose-500 font-medium">Subir estado de cuenta</p>
                  </motion.div>
                  <p className="text-[10px] text-slate-400 mt-2">CSV, PDF o foto</p>
                </motion.div>
              )}

              {step === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-full max-w-[180px] h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <motion.div
                      style={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Subiendo... {uploadProgress}%</p>
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
                      className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-rose-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-rose-500" />
                    </div>
                  </div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4 text-sm font-medium text-slate-600"
                  >
                    Analizando...
                  </motion.p>
                  <div className="mt-2 space-y-1 text-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-[10px] text-slate-400"
                    >
                      ✓ Detectando patrones
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-[10px] text-slate-400"
                    >
                      ✓ Identificando suscripciones
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="text-[10px] text-slate-400"
                    >
                      ✓ Buscando anomalías
                    </motion.p>
                  </div>
                </motion.div>
              )}

              {step === "results" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2"
                >
                  {/* Anomaly Alert */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-medium text-amber-700">2 alertas detectadas</span>
                    </div>
                  </motion.div>

                  {/* Transactions */}
                  <div className="space-y-1.5 mb-2">
                    {transactions.slice(0, transactionIndex).map((tx, i) => {
                      const Icon = tx.icon;
                      return (
                        <motion.div
                          key={tx.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-sm"
                        >
                          <div className={`w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center ${tx.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-slate-700 truncate">{tx.name}</p>
                            <p className="text-[8px] text-slate-400">{tx.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-700">{tx.amount}</p>
                            {tx.recurring && (
                              <span className="text-[8px] text-rose-500 flex items-center gap-0.5">
                                <RefreshCw className="w-2 h-2" /> Recurrente
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Smart Search */}
                  {transactionIndex >= transactions.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto"
                    >
                      <div className="bg-white rounded-lg p-2 shadow-sm flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] text-slate-400">¿Cuánto gasto en suscripciones?</span>
                      </div>
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-2 text-center shadow-lg">
                        <p className="text-[10px] text-rose-100">Total Suscripciones/mes</p>
                        <p className="text-lg font-black text-white">$28.98</p>
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
        {step === "results" && transactionIndex >= 3 && (
          <>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -right-4 top-1/3 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-rose-600 border border-rose-100"
            >
              🔍 Detección de anomalías
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-pink-600 border border-pink-100"
            >
              💬 Chat inteligente
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
