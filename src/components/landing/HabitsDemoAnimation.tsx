import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Flame, CheckCircle2, Star, TrendingUp, Zap, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const getHabits = (language: string) => [
  { 
    name: language === 'es' ? 'Revisar gastos diarios' : 'Review daily expenses',
    streak: 12,
    xp: 25,
    completed: true,
    color: 'from-emerald-500 to-green-500'
  },
  { 
    name: language === 'es' ? 'Registrar compras' : 'Log purchases',
    streak: 8,
    xp: 15,
    completed: true,
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    name: language === 'es' ? 'Leer 10 min finanzas' : 'Read 10 min finance',
    streak: 5,
    xp: 20,
    completed: false,
    color: 'from-violet-500 to-purple-500'
  },
  { 
    name: language === 'es' ? 'Actualizar presupuesto' : 'Update budget',
    streak: 3,
    xp: 30,
    completed: false,
    color: 'from-amber-500 to-orange-500'
  },
];

export function HabitsDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<'idle' | 'habits' | 'completing' | 'streak' | 'complete'>('idle');
  const [visibleHabits, setVisibleHabits] = useState(0);
  const [completedIndex, setCompletedIndex] = useState(-1);
  const [totalXP, setTotalXP] = useState(0);

  const habits = getHabits(language);

  useEffect(() => {
    const sequence = async () => {
      setStep('idle');
      setVisibleHabits(0);
      setCompletedIndex(-1);
      setTotalXP(1250);
      
      await new Promise(r => setTimeout(r, 1500));
      setStep('habits');
      
      // Show habits
      for (let i = 1; i <= habits.length; i++) {
        await new Promise(r => setTimeout(r, 400));
        setVisibleHabits(i);
      }
      
      await new Promise(r => setTimeout(r, 1000));
      setStep('completing');
      
      // Complete habits one by one
      setCompletedIndex(2);
      setTotalXP(prev => prev + 20);
      await new Promise(r => setTimeout(r, 800));
      
      setCompletedIndex(3);
      setTotalXP(prev => prev + 30);
      await new Promise(r => setTimeout(r, 1000));
      
      setStep('streak');
      
      await new Promise(r => setTimeout(r, 2500));
      setStep('complete');
      
      await new Promise(r => setTimeout(r, 3000));
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone frame - standardized size */}
      <div className="relative w-[240px] sm:w-[260px] md:w-[280px] aspect-[1/2] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        {/* Screen */}
        <div className="relative w-full h-full bg-gradient-to-b from-indigo-50 to-white rounded-[2rem] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-6 pt-10">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <span className="font-bold">{language === 'es' ? 'Hábitos Atómicos' : 'Atomic Habits'}</span>
              </div>
              <motion.div 
                key={totalXP}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1"
              >
                <Star className="w-3 h-3 text-yellow-300" />
                <span className="text-xs font-bold">{totalXP} XP</span>
              </motion.div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg"
                  >
                    <Flame className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="mt-4 text-sm text-slate-600">
                    {language === 'es' ? 'Tus hábitos de hoy...' : 'Your habits today...'}
                  </p>
                </motion.div>
              )}

              {(step !== 'idle') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {/* Progress Bar */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-600">{language === 'es' ? 'Progreso de hoy' : 'Today\'s progress'}</span>
                      <span className="text-xs font-bold text-indigo-700">
                        {habits.filter((h, i) => h.completed || i <= completedIndex).length}/{habits.length}
                      </span>
                    </div>
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ 
                          width: `${(habits.filter((h, i) => h.completed || i <= completedIndex).length / habits.length) * 100}%` 
                        }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
                      />
                    </div>
                  </div>

                  {/* Habits List */}
                  <div className="space-y-2">
                    {habits.slice(0, visibleHabits).map((habit, index) => {
                      const isComplete = habit.completed || index <= completedIndex;
                      return (
                        <motion.div
                          key={habit.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ 
                            opacity: 1, 
                            x: 0,
                            scale: index === completedIndex ? [1, 1.05, 1] : 1
                          }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-xl border ${
                            isComplete 
                              ? 'bg-emerald-50 border-emerald-200' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={index === completedIndex ? { 
                                scale: [1, 1.3, 1],
                                rotate: [0, 360]
                              } : {}}
                              transition={{ duration: 0.5 }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isComplete 
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                                  : `bg-gradient-to-br ${habit.color} opacity-30`
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-white/50" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${isComplete ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>
                                {habit.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" />
                                  <span className="text-xs text-orange-600">{habit.streak}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-500" />
                                  <span className="text-xs text-amber-600">+{habit.xp} XP</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Streak Achievement */}
                  {(step === 'streak' || step === 'complete') && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                        >
                          <Award className="w-10 h-10" />
                        </motion.div>
                        <div>
                          <p className="font-bold">{language === 'es' ? '¡Racha de 12 días!' : '12-day streak!'}</p>
                          <p className="text-xs text-amber-100">
                            {language === 'es' ? '+50 XP bonus de consistencia' : '+50 XP consistency bonus'}
                          </p>
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

      {/* Floating labels - positioned below phone */}
      {step === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mt-4"
        >
          <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-indigo-600 border border-indigo-100">
            🎯 {language === 'es' ? '1% mejor cada día' : '1% better every day'}
          </span>
          <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-orange-600 border border-orange-100">
            🔥 {language === 'es' ? 'Rachas motivadoras' : 'Motivating streaks'}
          </span>
        </motion.div>
      )}
    </div>
  );
}
