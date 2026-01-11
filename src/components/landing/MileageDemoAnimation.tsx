import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Car, Route, Clock, DollarSign, Check, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "idle" | "origin" | "destination" | "calculating" | "complete";

export function MileageDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setDistance(0);
      
      setTimeout(() => setStep("origin"), 800);
      setTimeout(() => setStep("destination"), 2500);
      setTimeout(() => setStep("calculating"), 4000);
      setTimeout(() => setStep("complete"), 5500);
      setTimeout(() => setStep("idle"), 10000);
    };

    sequence();
    const interval = setInterval(sequence, 11000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "complete") {
      const targetDistance = 42.5;
      const duration = 1000;
      const steps = 20;
      const increment = targetDistance / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetDistance) {
          setDistance(targetDistance);
          clearInterval(timer);
        } else {
          setDistance(Math.round(current * 10) / 10);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [step]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-[240px] sm:w-[260px] md:w-[280px] aspect-[1/2] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
            <span className="text-xs font-medium text-slate-600">9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-slate-600 rounded-sm" />
            </div>
          </div>

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center z-10">
            <Car className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">
              {language === 'es' ? 'Kilometraje' : 'Mileage'}
            </span>
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
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-4"
                  >
                    <Navigation className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">
                    {language === 'es' ? 'Nuevo viaje' : 'New trip'}
                  </p>
                </motion.div>
              )}

              {(step === "origin" || step === "destination" || step === "calculating" || step === "complete") && (
                <motion.div
                  key="journey"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-3"
                >
                  {/* Map Preview */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl h-32 mb-3 overflow-hidden"
                  >
                    {/* Fake map grid */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `linear-gradient(rgba(59,130,246,.3) 1px, transparent 1px), 
                                          linear-gradient(90deg, rgba(59,130,246,.3) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                      }}
                    />
                    
                    {/* Route line */}
                    {(step === "destination" || step === "calculating" || step === "complete") && (
                      <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 200 100"
                      >
                        <motion.path
                          d="M 30 70 Q 70 20 100 50 T 170 30"
                          fill="none"
                          stroke="url(#routeGradient)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="0 1"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5 }}
                        />
                        <defs>
                          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#6366F1" />
                          </linearGradient>
                        </defs>
                      </motion.svg>
                    )}
                    
                    {/* Origin marker */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="absolute left-6 bottom-4"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                    </motion.div>
                    
                    {/* Destination marker */}
                    {(step === "destination" || step === "calculating" || step === "complete") && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                        className="absolute right-6 top-4"
                      >
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                          <MapPin className="w-3 h-3 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Address inputs */}
                  <div className="space-y-2 mb-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400">
                          {language === 'es' ? 'Origen' : 'Origin'}
                        </p>
                        <p className="text-xs font-medium text-slate-700 truncate">123 King Street, Toronto</p>
                      </div>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: step !== "origin" ? 1 : 0.5, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400">
                          {language === 'es' ? 'Destino' : 'Destination'}
                        </p>
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {step === "origin" 
                            ? (language === 'es' ? "Selecciona destino..." : "Select destination...") 
                            : "456 Bay Street, Toronto"}
                        </p>
                      </div>
                      {step !== "origin" && <Check className="w-4 h-4 text-emerald-500" />}
                    </motion.div>
                  </div>

                  {/* Calculating state */}
                  {step === "calculating" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 py-4"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full"
                      />
                      <span className="text-xs text-slate-500">
                        {language === 'es' ? 'Calculando ruta...' : 'Calculating route...'}
                      </span>
                    </motion.div>
                  )}

                  {/* Results */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2 mt-auto"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                          <Route className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-slate-800">{distance} km</p>
                          <p className="text-[10px] text-slate-500">
                            {language === 'es' ? 'Distancia' : 'Distance'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                          <Clock className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                          <p className="text-lg font-bold text-slate-800">35 min</p>
                          <p className="text-[10px] text-slate-500">
                            {language === 'es' ? 'Tiempo' : 'Time'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 text-center shadow-lg">
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-100" />
                          <span className="text-xs text-blue-100">
                            {language === 'es' ? 'Deducción Fiscal' : 'Tax Deduction'}
                          </span>
                        </div>
                        <p className="text-xl font-black text-white">$29.75</p>
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
        {step === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-blue-600 border border-blue-100">
              🗺️ {language === 'es' ? 'Cálculo automático' : 'Auto calculation'}
            </span>
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-indigo-600 border border-indigo-100">
              💰 {language === 'es' ? '$0.70/km fiscal' : '$0.70/km tax rate'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
