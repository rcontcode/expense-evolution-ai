import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Sparkles, Check, DollarSign, Calendar, AlertCircle, Building2, Briefcase } from "lucide-react";

type Step = "idle" | "uploading" | "analyzing" | "extracting" | "complete";

const extractedTerms = [
  { icon: DollarSign, label: "Valor del contrato", value: "$45,000/año" },
  { icon: Calendar, label: "Duración", value: "12 meses" },
  { icon: Building2, label: "Cliente", value: "Tech Corp Inc." },
];

const reimbursements = [
  { category: "Viajes", percent: "100%", color: "bg-emerald-500" },
  { category: "Comidas cliente", percent: "50%", color: "bg-blue-500" },
  { category: "Equipamiento", percent: "Hasta $500", color: "bg-violet-500" },
];

export function ContractsDemoAnimation() {
  const [step, setStep] = useState<Step>("idle");
  const [termIndex, setTermIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setTermIndex(0);
      setUploadProgress(0);
      
      setTimeout(() => setStep("uploading"), 800);
      setTimeout(() => setStep("analyzing"), 2500);
      setTimeout(() => setStep("extracting"), 4500);
      setTimeout(() => setStep("complete"), 7000);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "uploading") {
      const timer = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 8, 100));
      }, 80);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "extracting") {
      const timer = setInterval(() => {
        setTermIndex((prev) => Math.min(prev + 1, extractedTerms.length));
      }, 400);
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

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center z-10">
            <FileText className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Contratos IA</span>
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
                    className="w-full max-w-[180px] h-24 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center bg-indigo-50"
                  >
                    <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                    <p className="text-xs text-indigo-500 font-medium">Subir contrato</p>
                  </motion.div>
                  <p className="text-[10px] text-slate-400 mt-2">PDF o imagen</p>
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
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-xs font-medium text-slate-600 mb-2">contrato_2026.pdf</p>
                  <div className="w-full max-w-[180px] h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      style={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{uploadProgress}%</p>
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
                      className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-indigo-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-indigo-500" />
                    </div>
                  </div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4 text-sm font-medium text-slate-600"
                  >
                    IA analizando contrato...
                  </motion.p>
                  <div className="mt-3 space-y-1 text-center">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-[10px] text-slate-400">✓ Leyendo documento</motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-[10px] text-slate-400">✓ Extrayendo cláusulas</motion.p>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="text-[10px] text-slate-400">✓ Identificando términos</motion.p>
                  </div>
                </motion.div>
              )}

              {(step === "extracting" || step === "complete") && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2"
                >
                  {/* Success header */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="flex items-center justify-center gap-2 mb-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">Contrato Analizado</span>
                  </motion.div>

                  {/* Extracted Terms */}
                  <div className="bg-white rounded-xl p-2 shadow-sm mb-2">
                    <p className="text-[10px] text-slate-500 mb-2">Términos Extraídos</p>
                    <div className="space-y-1.5">
                      {extractedTerms.slice(0, termIndex).map((term, i) => {
                        const Icon = term.icon;
                        return (
                          <motion.div
                            key={term.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg"
                          >
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                            <span className="flex-1 text-[10px] text-slate-500">{term.label}</span>
                            <span className="text-[10px] font-bold text-slate-700">{term.value}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reimbursement Rules */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl p-2 shadow-sm"
                    >
                      <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Reembolsos Detectados
                      </p>
                      <div className="space-y-1">
                        {reimbursements.map((r, i) => (
                          <motion.div
                            key={r.category}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${r.color}`} />
                            <span className="flex-1 text-[10px] text-slate-600">{r.category}</span>
                            <span className="text-[10px] font-bold text-emerald-600">{r.percent}</span>
                          </motion.div>
                        ))}
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
              className="absolute -right-4 top-1/3 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-indigo-600 border border-indigo-100"
            >
              📄 Extracción automática
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-blue-600 border border-blue-100"
            >
              💼 Reglas de reembolso
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
