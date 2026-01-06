import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, Target, Zap, Medal, Award, TrendingUp, Check } from "lucide-react";

type Step = "idle" | "xp" | "streak" | "achievements" | "complete";

const achievements = [
  { icon: Star, label: "Primera Semana", xp: 100, color: "from-amber-400 to-yellow-500", unlocked: true },
  { icon: Flame, label: "Racha 7 días", xp: 250, color: "from-orange-400 to-red-500", unlocked: true },
  { icon: Target, label: "Meta Cumplida", xp: 500, color: "from-emerald-400 to-green-500", unlocked: true },
  { icon: Medal, label: "Inversor Novato", xp: 750, color: "from-blue-400 to-cyan-500", unlocked: false },
];

export function GamificationDemoAnimation() {
  const [step, setStep] = useState<Step>("idle");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievementIndex, setAchievementIndex] = useState(0);

  useEffect(() => {
    const sequence = () => {
      setXp(0);
      setLevel(1);
      setAchievementIndex(0);
      
      setTimeout(() => setStep("xp"), 800);
      setTimeout(() => setStep("streak"), 3000);
      setTimeout(() => setStep("achievements"), 4500);
      setTimeout(() => setStep("complete"), 7500);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "xp") {
      const targetXp = 2450;
      const duration = 1500;
      const steps = 30;
      const increment = targetXp / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetXp) {
          setXp(targetXp);
          setLevel(5);
          clearInterval(timer);
        } else {
          setXp(Math.round(current));
          setLevel(Math.floor(current / 500) + 1);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "achievements") {
      const timer = setInterval(() => {
        setAchievementIndex((prev) => Math.min(prev + 1, achievements.length));
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

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center z-10">
            <Trophy className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">Gamificación</span>
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
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <Trophy className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">Cargando logros...</p>
                </motion.div>
              )}

              {(step === "xp" || step === "streak" || step === "achievements" || step === "complete") && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2"
                >
                  {/* XP & Level Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 mb-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-lg font-black text-white">{level}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-100">Nivel</p>
                          <p className="text-sm font-bold text-white">Explorador</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-amber-100">XP Total</p>
                        <p className="text-lg font-black text-white">{xp.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xp % 500) / 5}%` }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                    <p className="text-[9px] text-amber-100 mt-1 text-right">{xp % 500}/500 para nivel {level + 1}</p>
                  </motion.div>

                  {/* Streak Card */}
                  {(step === "streak" || step === "achievements" || step === "complete") && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-3 mb-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: 3 }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center"
                        >
                          <Flame className="w-6 h-6 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">Racha Actual</p>
                          <p className="text-2xl font-black text-slate-800">14 días</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Mejor racha</p>
                          <p className="text-sm font-bold text-orange-500">21 días</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Achievements */}
                  {(step === "achievements" || step === "complete") && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1"
                    >
                      <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Logros Recientes
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {achievements.slice(0, achievementIndex).map((ach, i) => {
                          const Icon = ach.icon;
                          return (
                            <motion.div
                              key={ach.label}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: "spring", bounce: 0.5 }}
                              className={`p-2 rounded-lg text-center ${
                                ach.unlocked 
                                  ? "bg-white shadow-sm" 
                                  : "bg-slate-100 opacity-50"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ach.color} flex items-center justify-center mx-auto mb-1 ${!ach.unlocked && "grayscale"}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <p className="text-[9px] font-medium text-slate-700 truncate">{ach.label}</p>
                              <p className="text-[8px] text-amber-500">+{ach.xp} XP</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Level Up Animation */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-2 text-center shadow-lg"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-bold text-white">¡Subiste de Nivel!</span>
                        <Zap className="w-4 h-4 text-yellow-300" />
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
              className="absolute -right-4 top-1/3 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-amber-600 border border-amber-100"
            >
              🏆 Logros desbloqueables
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute -left-4 top-1/2 bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-orange-600 border border-orange-100"
            >
              🔥 Rachas motivadoras
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
