import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Sparkles, Check, Receipt, DollarSign, Calendar, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "idle" | "capture" | "processing" | "complete";

const getExtractedData = (language: string) => [
  { icon: Building2, label: language === 'es' ? "Vendedor" : "Vendor", value: "Tim Hortons" },
  { icon: DollarSign, label: "Total", value: "$12.47" },
  { icon: Calendar, label: language === 'es' ? "Fecha" : "Date", value: "06/01/2026" },
  { icon: Receipt, label: language === 'es' ? "Categoría" : "Category", value: language === 'es' ? "Comidas" : "Meals" },
];

export function ReceiptDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [dataIndex, setDataIndex] = useState(0);
  const extractedData = getExtractedData(language);

  useEffect(() => {
    const sequence = () => {
      // Start capture
      setTimeout(() => setStep("capture"), 1000);
      // Start processing
      setTimeout(() => setStep("processing"), 2500);
      // Show complete
      setTimeout(() => setStep("complete"), 4000);
      // Reset
      setTimeout(() => {
        setStep("idle");
        setDataIndex(0);
      }, 8000);
    };

    sequence();
    const interval = setInterval(sequence, 9000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "complete") {
      const timer = setInterval(() => {
        setDataIndex((prev) => Math.min(prev + 1, extractedData.length));
      }, 300);
      return () => clearInterval(timer);
    }
  }, [step, extractedData.length]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone frame - standardized size */}
      <div className="relative w-[260px] h-[520px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
            <span className="text-xs font-medium text-slate-600">9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-slate-600 rounded-sm" />
            </div>
          </div>

          {/* App header */}
          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center z-10">
            <span className="text-white font-bold text-sm">EvoFinz</span>
          </div>

          {/* Main content area */}
          <div className="pt-20 px-4 h-full flex flex-col">
            <AnimatePresence mode="wait">
              {/* Idle / Camera View */}
              {(step === "idle" || step === "capture") && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  {/* Viewfinder */}
                  <div className="relative w-full aspect-square rounded-2xl bg-slate-300 overflow-hidden mb-4">
                    {/* Fake receipt in viewfinder */}
                    <div className="absolute inset-4 bg-white rounded-lg shadow-lg p-3">
                      <div className="w-16 h-3 bg-slate-200 rounded mb-2 mx-auto" />
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <div className="w-20 h-2 bg-slate-100 rounded" />
                          <div className="w-10 h-2 bg-slate-100 rounded" />
                        </div>
                        <div className="flex justify-between">
                          <div className="w-16 h-2 bg-slate-100 rounded" />
                          <div className="w-8 h-2 bg-slate-100 rounded" />
                        </div>
                        <div className="flex justify-between">
                          <div className="w-24 h-2 bg-slate-100 rounded" />
                          <div className="w-12 h-2 bg-slate-100 rounded" />
                        </div>
                        <div className="border-t border-dashed border-slate-200 my-2" />
                        <div className="flex justify-between">
                          <div className="w-12 h-3 bg-slate-300 rounded font-bold" />
                          <div className="w-14 h-3 bg-slate-300 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Camera corners */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-500 rounded-tl" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-500 rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-500 rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-500 rounded-br" />

                    {/* Flash effect */}
                    {step === "capture" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white"
                      />
                    )}
                  </div>

                  {/* Capture button */}
                  <motion.div
                    animate={step === "capture" ? { scale: [1, 0.9, 1] } : {}}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"
                  >
                    <Camera className="w-7 h-7 text-white" />
                  </motion.div>
                  <p className="text-xs text-slate-500 mt-2">
                    {language === 'es' ? 'Toca para capturar' : 'Tap to capture'}
                  </p>
                </motion.div>
              )}

              {/* Processing */}
              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
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
                    {language === 'es' ? 'Procesando...' : 'Processing...'}
                  </motion.p>
                  <div className="mt-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-cyan-500"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Complete */}
              {step === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Success header */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-emerald-600">
                      {language === 'es' ? '¡Listo!' : 'Done!'}
                    </span>
                  </motion.div>

                  {/* Extracted data */}
                  <div className="bg-white rounded-xl shadow-lg p-3 space-y-2">
                    {extractedData.slice(0, dataIndex).map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">{item.label}</p>
                            <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                          </div>
                          <Check className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Save button */}
                  {dataIndex >= extractedData.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <div className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-center text-white font-bold text-sm shadow-lg">
                        {language === 'es' ? 'Guardar Gasto' : 'Save Expense'}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating labels - positioned below phone */}
      <AnimatePresence>
        {step === "complete" && dataIndex >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-cyan-600 border border-cyan-100">
              {language === 'es' ? '✨ Detectó el vendedor' : '✨ Vendor detected'}
            </span>
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-emerald-600 border border-emerald-100">
              {language === 'es' ? '💰 Total extraído' : '💰 Total extracted'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
