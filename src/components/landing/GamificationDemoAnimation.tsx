import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, Target, Zap, Medal, Award, TrendingUp, Check, Sparkles, Crown, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "idle" | "xp" | "streak" | "achievements" | "levelup" | "complete";

const getAchievements = (language: string) => [
  { icon: Star, label: language === 'es' ? "Primera Semana" : "First Week", xp: 100, color: "from-amber-400 to-yellow-500", unlocked: true, rarity: "common" },
  { icon: Flame, label: language === 'es' ? "Racha 7 días" : "7-Day Streak", xp: 250, color: "from-orange-400 to-red-500", unlocked: true, rarity: "rare" },
  { icon: Target, label: language === 'es' ? "Meta Cumplida" : "Goal Achieved", xp: 500, color: "from-emerald-400 to-green-500", unlocked: true, rarity: "epic" },
  { icon: Crown, label: language === 'es' ? "Inversor Pro" : "Pro Investor", xp: 1000, color: "from-violet-400 to-purple-500", unlocked: true, rarity: "legendary" },
];

// Floating particles component
const FloatingSparkles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-yellow-400"
        style={{
          left: `${10 + i * 12}%`,
          top: `${20 + (i % 3) * 25}%`,
          fontSize: 8 + Math.random() * 6,
        }}
        animate={{
          y: [-5, -20, -5],
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2 + Math.random(),
          repeat: Infinity,
          delay: i * 0.4,
        }}
      >
        ✨
      </motion.div>
    ))}
  </div>
);

export function GamificationDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievementIndex, setAchievementIndex] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const achievements = getAchievements(language);

  useEffect(() => {
    const sequence = () => {
      setXp(0);
      setLevel(1);
      setAchievementIndex(0);
      setShowLevelUp(false);
      
      setTimeout(() => setStep("xp"), 800);
      setTimeout(() => setStep("streak"), 3000);
      setTimeout(() => setStep("achievements"), 4500);
      setTimeout(() => {
        setStep("levelup");
        setShowLevelUp(true);
      }, 7500);
      setTimeout(() => setStep("complete"), 9500);
      setTimeout(() => setStep("idle"), 12000);
    };

    sequence();
    const interval = setInterval(sequence, 13000);
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
      }, 350);
      return () => clearInterval(timer);
    }
  }, [step, achievements.length]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'ring-2 ring-yellow-400 ring-offset-1';
      case 'epic': return 'ring-2 ring-purple-400 ring-offset-1';
      case 'rare': return 'ring-2 ring-blue-400 ring-offset-1';
      default: return '';
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-[240px] sm:w-[260px] md:w-[280px] aspect-[1/2] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden">
          <FloatingSparkles />
          
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
            <span className="text-xs font-medium text-slate-600">9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-slate-600 rounded-sm" />
            </div>
          </div>

          <motion.div 
            className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center z-10 overflow-hidden"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              backgroundSize: '200% 200%',
              background: 'linear-gradient(90deg, #f59e0b, #ea580c, #f59e0b)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Trophy className="w-4 h-4 text-white mr-2" />
            </motion.div>
            <span className="text-white font-bold text-sm">{language === 'es' ? 'Gamificación' : 'Gamification'}</span>
            <motion.div
              className="absolute right-4"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-yellow-200" />
            </motion.div>
          </motion.div>

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
                    animate={{ 
                      scale: [1, 1.15, 1], 
                      rotate: [0, 5, -5, 0],
                      boxShadow: [
                        '0 0 20px rgba(251, 191, 36, 0.3)',
                        '0 0 40px rgba(251, 191, 36, 0.5)',
                        '0 0 20px rgba(251, 191, 36, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <Trophy className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.p 
                    className="text-sm font-medium text-slate-600"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {language === 'es' ? 'Cargando logros...' : 'Loading achievements...'}
                  </motion.p>
                </motion.div>
              )}

              {(step === "xp" || step === "streak" || step === "achievements" || step === "levelup" || step === "complete") && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2 relative"
                >
                  {/* Level Up Overlay */}
                  <AnimatePresence>
                    {showLevelUp && step === "levelup" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl"
                      >
                        <motion.div
                          initial={{ y: 50 }}
                          animate={{ y: 0 }}
                          className="text-center"
                        >
                          <motion.div
                            animate={{ 
                              scale: [1, 1.3, 1],
                              rotate: [0, -10, 10, 0],
                            }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg mb-2"
                          >
                            <span className="text-3xl">🎉</span>
                          </motion.div>
                          <motion.p
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.3, repeat: 3 }}
                            className="text-lg font-black text-white"
                          >
                            {language === 'es' ? '¡NIVEL 5!' : 'LEVEL 5!'}
                          </motion.p>
                          <p className="text-xs text-white/70">{language === 'es' ? '¡Eres un experto!' : "You're an expert!"}</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* XP & Level Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 mb-3 shadow-lg relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <motion.div 
                          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                          animate={{ scale: level > 1 ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-lg font-black text-white">{level}</span>
                        </motion.div>
                        <div>
                          <p className="text-[10px] text-amber-100">{language === 'es' ? 'Nivel' : 'Level'}</p>
                          <p className="text-sm font-bold text-white">
                            {level >= 5 ? (language === 'es' ? 'Experto' : 'Expert') : (language === 'es' ? 'Explorador' : 'Explorer')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-amber-100">XP Total</p>
                        <motion.p 
                          className="text-lg font-black text-white"
                          animate={{ scale: xp > 0 ? [1, 1.1, 1] : 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {xp.toLocaleString()}
                        </motion.p>
                      </div>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden relative z-10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xp % 500) / 5}%` }}
                        className="h-full bg-white rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-[9px] text-amber-100 mt-1 text-right relative z-10">{xp % 500}/500 {language === 'es' ? 'para nivel' : 'to level'} {level + 1}</p>
                  </motion.div>

                  {/* Streak Card */}
                  {(step === "streak" || step === "achievements" || step === "levelup" || step === "complete") && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      className="bg-white rounded-xl p-3 mb-3 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, -5, 5, 0],
                          }}
                          transition={{ duration: 0.6, repeat: 4 }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center relative"
                        >
                          <Flame className="w-6 h-6 text-white" />
                          {/* Fire particles */}
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-orange-300"
                              style={{ fontSize: 8 }}
                              animate={{
                                y: [-5, -15],
                                x: [(i - 1) * 5, (i - 1) * 8],
                                opacity: [1, 0],
                                scale: [1, 0.5],
                              }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            >
                              🔥
                            </motion.div>
                          ))}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">{language === 'es' ? 'Racha Actual' : 'Current Streak'}</p>
                          <motion.p 
                            className="text-2xl font-black text-slate-800"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.5, repeat: 2 }}
                          >
                            {language === 'es' ? '14 días' : '14 days'}
                          </motion.p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">{language === 'es' ? 'Mejor racha' : 'Best streak'}</p>
                          <p className="text-sm font-bold text-orange-500">{language === 'es' ? '21 días' : '21 days'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Achievements */}
                  {(step === "achievements" || step === "levelup" || step === "complete") && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1"
                    >
                      <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                        <Award className="w-3 h-3" /> {language === 'es' ? 'Logros Recientes' : 'Recent Achievements'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {achievements.slice(0, achievementIndex).map((ach, i) => {
                          const Icon = ach.icon;
                          return (
                            <motion.div
                              key={ach.label}
                              initial={{ opacity: 0, scale: 0, rotate: -180 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              transition={{ type: "spring", bounce: 0.5, delay: i * 0.05 }}
                              className={`p-2 rounded-lg text-center bg-white shadow-sm ${getRarityColor(ach.rarity)}`}
                            >
                              <motion.div 
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${ach.color} flex items-center justify-center mx-auto mb-1`}
                                animate={ach.rarity === 'legendary' ? {
                                  boxShadow: [
                                    '0 0 0 0 rgba(250, 204, 21, 0)',
                                    '0 0 10px 3px rgba(250, 204, 21, 0.4)',
                                    '0 0 0 0 rgba(250, 204, 21, 0)',
                                  ],
                                } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <Icon className="w-4 h-4 text-white" />
                              </motion.div>
                              <p className="text-[9px] font-medium text-slate-700 truncate">{ach.label}</p>
                              <motion.p 
                                className="text-[8px] text-amber-500 font-bold"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.3, delay: i * 0.1 + 0.3 }}
                              >
                                +{ach.xp} XP
                              </motion.p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Reward Preview */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-2 text-center shadow-lg relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className="flex items-center justify-center gap-2 relative z-10">
                        <Gift className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-bold text-white">{language === 'es' ? '¡Recompensa cerca!' : 'Reward nearby!'}</span>
                        <Gift className="w-4 h-4 text-yellow-300" />
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
        {(step === "complete" || step === "levelup") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            <motion.span 
              className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-amber-600 border border-amber-100"
              whileHover={{ scale: 1.05 }}
            >
              🏆 {language === 'es' ? 'Logros desbloqueables' : 'Unlockable achievements'}
            </motion.span>
            <motion.span 
              className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-orange-600 border border-orange-100"
              whileHover={{ scale: 1.05 }}
            >
              🔥 {language === 'es' ? 'Rachas motivadoras' : 'Motivating streaks'}
            </motion.span>
            <motion.span 
              className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-purple-600 border border-purple-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              🎁 {language === 'es' ? 'Recompensas reales' : 'Real rewards'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
