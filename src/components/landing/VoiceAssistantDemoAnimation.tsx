import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles, Check, MessageSquare, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "idle" | "listening" | "processing" | "speaking" | "complete";

export function VoiceAssistantDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [audioLevel, setAudioLevel] = useState([0.3, 0.5, 0.4, 0.6, 0.3]);
  const [karaokeIndex, setKaraokeIndex] = useState(0);

  const userCommand = language === 'es' 
    ? "Registra un gasto de 45 dólares en gasolina" 
    : "Log an expense of 45 dollars for gas";

  const assistantResponse = language === 'es'
    ? ["¡Perfecto!", "He registrado", "$45 en Gasolina", "como gasto deducible."]
    : ["Perfect!", "I've logged", "$45 for Gas", "as a deductible expense."];

  useEffect(() => {
    const sequence = () => {
      setKaraokeIndex(0);
      
      setTimeout(() => setStep("listening"), 800);
      setTimeout(() => setStep("processing"), 3500);
      setTimeout(() => setStep("speaking"), 4500);
      setTimeout(() => setStep("complete"), 8000);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  // Simulate audio levels while listening
  useEffect(() => {
    if (step === "listening") {
      const timer = setInterval(() => {
        setAudioLevel([
          Math.random() * 0.5 + 0.3,
          Math.random() * 0.5 + 0.4,
          Math.random() * 0.5 + 0.3,
          Math.random() * 0.5 + 0.5,
          Math.random() * 0.5 + 0.3,
        ]);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Karaoke effect while speaking
  useEffect(() => {
    if (step === "speaking") {
      const timer = setInterval(() => {
        setKaraokeIndex((prev) => Math.min(prev + 1, assistantResponse.length));
      }, 700);
      return () => clearInterval(timer);
    }
  }, [step, assistantResponse.length]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-[240px] sm:w-[260px] md:w-[280px] aspect-[1/2] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
            <span className="text-xs font-medium text-slate-600">9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-slate-600 rounded-sm" />
            </div>
          </div>

          {/* Header */}
          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center gap-2 z-10">
            <Mic className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">
              {language === 'es' ? 'Asistente de Voz' : 'Voice Assistant'}
            </span>
            {/* Language indicator */}
            <div className="absolute right-3 flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
              <Globe className="w-3 h-3 text-white" />
              <span className="text-[10px] text-white font-medium">
                {language === 'es' ? 'ES' : 'EN'}
              </span>
            </div>
          </div>

          <div className="pt-20 px-3 h-full flex flex-col">
            <AnimatePresence mode="wait">
              {/* Idle State */}
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
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <Mic className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">
                    {language === 'es' ? 'Toca para hablar' : 'Tap to speak'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'es' ? 'o di "Hey EvoFinz"' : 'or say "Hey EvoFinz"'}
                  </p>
                </motion.div>
              )}

              {/* Listening State */}
              {step === "listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  {/* Audio Level Indicator */}
                  <div className="flex items-end gap-1 h-16 mb-4">
                    {audioLevel.map((level, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: `${level * 100}%` }}
                        transition={{ duration: 0.1 }}
                        className="w-3 bg-gradient-to-t from-violet-500 to-purple-400 rounded-full"
                      />
                    ))}
                  </div>
                  
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <p className="text-sm font-medium text-red-500">
                    {language === 'es' ? 'Escuchando...' : 'Listening...'}
                  </p>
                  
                  {/* User speech bubble */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 bg-slate-800 text-white text-xs px-4 py-2 rounded-2xl rounded-br-none max-w-[90%]"
                  >
                    <p className="italic">"{userCommand}"</p>
                  </motion.div>
                </motion.div>
              )}

              {/* Processing State */}
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
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-violet-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-violet-500" />
                    </div>
                  </div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4 text-sm font-medium text-slate-600"
                  >
                    {language === 'es' ? 'Procesando...' : 'Processing...'}
                  </motion.p>
                </motion.div>
              )}

              {/* Speaking State */}
              {(step === "speaking" || step === "complete") && (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-4"
                >
                  {/* Speaker icon */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <motion.div
                      animate={step === "speaking" ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center"
                    >
                      <Volume2 className="w-6 h-6 text-white" />
                    </motion.div>
                    {step === "speaking" && (
                      <span className="text-xs text-violet-500 font-medium">
                        {language === 'es' ? 'Hablando...' : 'Speaking...'}
                      </span>
                    )}
                  </div>

                  {/* Karaoke Text */}
                  <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {assistantResponse.map((phrase, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0.3 }}
                          animate={{ 
                            opacity: i < karaokeIndex ? 1 : 0.3,
                            scale: i === karaokeIndex - 1 ? 1.05 : 1,
                            color: i < karaokeIndex ? '#7c3aed' : '#94a3b8'
                          }}
                          className="text-sm font-medium transition-all"
                        >
                          {phrase}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Command Suggestions */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto"
                    >
                      <p className="text-[10px] text-slate-400 text-center mb-2">
                        {language === 'es' ? 'Comandos disponibles:' : 'Available commands:'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {(language === 'es' 
                          ? ['📊 "¿Cuánto gasté?"', '🚗 "Viaje a cliente"', '💰 "Nuevo ingreso"']
                          : ['📊 "How much spent?"', '🚗 "Trip to client"', '💰 "New income"']
                        ).map((cmd, i) => (
                          <motion.div
                            key={cmd}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-violet-100 text-violet-700 text-[10px] px-2 py-1 rounded-full"
                          >
                            {cmd}
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

      {/* Floating labels - positioned below phone */}
      <AnimatePresence>
        {step === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-violet-600 border border-violet-100">
              🎤 {language === 'es' ? 'Manos libres' : 'Hands-free'}
            </span>
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-purple-600 border border-purple-100">
              🌎 {language === 'es' ? 'ES/EN automático' : 'Auto ES/EN'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
