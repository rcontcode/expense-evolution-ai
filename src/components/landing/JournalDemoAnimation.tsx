import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Smile, Meh, Frown, Lightbulb, PenLine, Sparkles, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const getEntries = (language: string) => [
  { 
    date: '15 Ene', 
    mood: 'happy', 
    title: language === 'es' ? 'Primer mes ahorrando 20%' : 'First month saving 20%',
    lesson: language === 'es' ? 'Automatizar ahorros funciona' : 'Automating savings works',
    icon: Smile,
    color: 'from-emerald-500 to-green-500'
  },
  { 
    date: '08 Ene', 
    mood: 'neutral', 
    title: language === 'es' ? 'Gasto impulsivo de $150' : 'Impulse spend of $150',
    lesson: language === 'es' ? 'Esperar 24h antes de comprar' : 'Wait 24h before buying',
    icon: Meh,
    color: 'from-amber-500 to-yellow-500'
  },
  { 
    date: '02 Ene', 
    mood: 'sad', 
    title: language === 'es' ? 'Multa de tránsito inesperada' : 'Unexpected traffic ticket',
    lesson: language === 'es' ? 'Mantener fondo de emergencia' : 'Keep emergency fund',
    icon: Frown,
    color: 'from-rose-500 to-red-500'
  },
];

export function JournalDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<'idle' | 'entries' | 'writing' | 'insight' | 'complete'>('idle');
  const [entryIndex, setEntryIndex] = useState(0);
  const [typedText, setTypedText] = useState('');

  const entries = getEntries(language);
  const newEntry = language === 'es' 
    ? 'Hoy me sentí orgulloso por no caer en tentación de compra...'
    : 'Today I felt proud for not giving in to a purchase temptation...';

  useEffect(() => {
    const sequence = async () => {
      setStep('idle');
      setEntryIndex(0);
      setTypedText('');
      
      await new Promise(r => setTimeout(r, 1500));
      setStep('entries');
      
      // Show entries
      for (let i = 1; i <= entries.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setEntryIndex(i);
      }
      
      await new Promise(r => setTimeout(r, 1000));
      setStep('writing');
      
      // Type effect
      for (let i = 0; i <= newEntry.length; i++) {
        await new Promise(r => setTimeout(r, 30));
        setTypedText(newEntry.slice(0, i));
      }
      
      await new Promise(r => setTimeout(r, 1000));
      setStep('insight');
      
      await new Promise(r => setTimeout(r, 2500));
      setStep('complete');
      
      await new Promise(r => setTimeout(r, 3000));
    };

    sequence();
    const interval = setInterval(sequence, 13000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center py-8">
      <div className="relative">
        {/* Phone frame - Standard size */}
        <div className="relative w-[260px] h-[520px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[3rem] p-2 shadow-2xl border border-slate-700">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-2xl z-20" />
          
          {/* Screen */}
          <div className="relative w-full h-full bg-gradient-to-b from-amber-50 to-white rounded-[2.5rem] overflow-hidden">
            {/* Header - Compact */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-4 pt-8">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="w-4 h-4" />
                <span className="font-bold text-sm">{language === 'es' ? 'Diario Financiero' : 'Financial Journal'}</span>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <AnimatePresence mode="wait">
                {step === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-6"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                    >
                      <PenLine className="w-7 h-7 text-white" />
                    </motion.div>
                    <p className="mt-3 text-xs text-slate-600">
                      {language === 'es' ? 'Tu diario financiero...' : 'Your financial journal...'}
                    </p>
                  </motion.div>
                )}

                {(step !== 'idle') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    {/* Previous Entries - Compact */}
                    <div className="space-y-1.5">
                      {entries.slice(0, entryIndex).map((entry, index) => {
                        const MoodIcon = entry.icon;
                        return (
                          <motion.div
                            key={entry.date}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${entry.color} flex items-center justify-center flex-shrink-0`}>
                                <MoodIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] text-slate-500">{entry.date}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-800 line-clamp-1">{entry.title}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Lightbulb className="w-2.5 h-2.5 text-amber-500" />
                                  <span className="text-[10px] text-amber-700 line-clamp-1">{entry.lesson}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Writing New Entry - Compact */}
                    {(step === 'writing' || step === 'insight' || step === 'complete') && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <PenLine className="w-3 h-3 text-amber-600" />
                          <span className="text-[10px] font-bold text-amber-800">
                            {language === 'es' ? 'Nueva entrada' : 'New entry'}
                          </span>
                          <span className="text-[10px] text-amber-600 ml-auto">{language === 'es' ? 'Hoy' : 'Today'}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 min-h-[28px] line-clamp-2">
                          {typedText}
                          {step === 'writing' && (
                            <motion.span
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="inline-block w-0.5 h-3 bg-amber-600 ml-0.5"
                            />
                          )}
                        </p>
                      </motion.div>
                    )}

                    {/* AI Insight - Compact */}
                    {(step === 'insight' || step === 'complete') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span className="font-bold text-[10px]">{language === 'es' ? 'Insight EvoFinz' : 'EvoFinz Insight'}</span>
                        </div>
                        <p className="text-[10px] text-violet-100 line-clamp-2">
                          {language === 'es' 
                            ? '¡Excelente! Tu autocontrol ha mejorado 40% este mes.'
                            : 'Excellent! Your self-control improved 40% this month.'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <TrendingUp className="w-3 h-3 text-violet-200" />
                          <span className="text-[10px] text-violet-200">+40% {language === 'es' ? 'autocontrol' : 'self-control'}</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating labels - Below phone */}
        <div className="flex justify-center gap-3 mt-4">
          {step === 'complete' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg px-3 py-2 shadow-lg border border-amber-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <BookOpen className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{language === 'es' ? 'Reflexiona' : 'Reflect'}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg px-3 py-2 shadow-lg border border-violet-200"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium text-violet-700">{language === 'es' ? 'Aprende' : 'Learn'}</span>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
