import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, Headphones, Star, Check, Clock, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = "idle" | "resources" | "reading" | "complete";

const getResources = (language: string) => [
  { icon: BookOpen, title: language === 'es' ? "Padre Rico, Padre Pobre" : "Rich Dad, Poor Dad", author: "R. Kiyosaki", type: language === 'es' ? "Libro" : "Book", progress: 100, color: "from-amber-400 to-orange-500" },
  { icon: BookOpen, title: language === 'es' ? "El Hombre Más Rico de Babilonia" : "The Richest Man in Babylon", author: "G. Clason", type: language === 'es' ? "Libro" : "Book", progress: 65, color: "from-emerald-400 to-green-500" },
  { icon: Headphones, title: "Financial Freedom", author: "Grant Sabatier", type: "Podcast", progress: 45, color: "from-violet-400 to-purple-500" },
];

const getLessons = (language: string) => [
  language === 'es' ? "Paga primero a ti mismo" : "Pay yourself first",
  language === 'es' ? "Los ricos compran activos" : "The rich buy assets",
  language === 'es' ? "El dinero trabaja para ti" : "Money works for you",
];

export function EducationDemoAnimation() {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("idle");
  const [resourceIndex, setResourceIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);

  const resources = getResources(language);
  const lessons = getLessons(language);

  useEffect(() => {
    const sequence = () => {
      setResourceIndex(0);
      setLessonIndex(0);
      
      setTimeout(() => setStep("resources"), 800);
      setTimeout(() => setStep("reading"), 4500);
      setTimeout(() => setStep("complete"), 7000);
      setTimeout(() => setStep("idle"), 11000);
    };

    sequence();
    const interval = setInterval(sequence, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === "resources") {
      const timer = setInterval(() => {
        setResourceIndex((prev) => Math.min(prev + 1, resources.length));
      }, 500);
      return () => clearInterval(timer);
    }
  }, [step, resources.length]);

  useEffect(() => {
    if (step === "complete") {
      const timer = setInterval(() => {
        setLessonIndex((prev) => Math.min(prev + 1, lessons.length));
      }, 400);
      return () => clearInterval(timer);
    }
  }, [step, lessons.length]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone frame - standardized size */}
      <div className="relative w-[260px] h-[520px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <div className="relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2rem] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-8 bg-slate-800/10 backdrop-blur-sm flex items-center justify-between px-6 pt-1 z-10">
            <span className="text-xs font-medium text-slate-600">9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-slate-600 rounded-sm" />
            </div>
          </div>

          <div className="absolute top-8 inset-x-0 h-12 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center z-10">
            <GraduationCap className="w-4 h-4 text-white mr-2" />
            <span className="text-white font-bold text-sm">
              {language === 'es' ? 'Educación Financiera' : 'Financial Education'}
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
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg"
                  >
                    <BookOpen className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-600">
                    {language === 'es' ? 'Tu biblioteca financiera' : 'Your financial library'}
                  </p>
                </motion.div>
              )}

              {(step === "resources" || step === "reading" || step === "complete") && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col py-2"
                >
                  {/* Stats Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 mb-3"
                  >
                    <div className="flex-1 bg-white rounded-lg p-2 text-center shadow-sm">
                      <p className="text-lg font-bold text-emerald-600">12</p>
                      <p className="text-[9px] text-slate-400">
                        {language === 'es' ? 'Completados' : 'Completed'}
                      </p>
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-2 text-center shadow-sm">
                      <p className="text-lg font-bold text-blue-600">3</p>
                      <p className="text-[9px] text-slate-400">
                        {language === 'es' ? 'En progreso' : 'In progress'}
                      </p>
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-2 text-center shadow-sm">
                      <p className="text-lg font-bold text-amber-600">156h</p>
                      <p className="text-[9px] text-slate-400">
                        {language === 'es' ? 'Estudiadas' : 'Studied'}
                      </p>
                    </div>
                  </motion.div>

                  {/* Resources List */}
                  <div className="space-y-2 mb-2">
                    {resources.slice(0, resourceIndex).map((res, i) => {
                      const Icon = res.icon;
                      return (
                        <motion.div
                          key={res.title}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white rounded-lg p-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${res.color} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-slate-700 truncate">{res.title}</p>
                              <p className="text-[8px] text-slate-400">{res.author} • {res.type}</p>
                            </div>
                            {res.progress === 100 && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${res.progress}%` }}
                              transition={{ duration: 0.8, delay: i * 0.2 }}
                              className={`h-full bg-gradient-to-r ${res.color} rounded-full`}
                            />
                          </div>
                          <p className="text-[8px] text-slate-400 text-right mt-0.5">{res.progress}%</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Reading Progress */}
                  {(step === "reading" || step === "complete") && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 mb-2 shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-100" />
                        <span className="text-[10px] text-green-100">
                          {language === 'es' ? 'Sesión de hoy' : "Today's session"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-black text-white">45 min</p>
                          <p className="text-[10px] text-green-100">
                            {language === 'es' ? '12 páginas leídas' : '12 pages read'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= 4 ? "text-yellow-300 fill-yellow-300" : "text-green-300"}`} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Key Lessons */}
                  {step === "complete" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl p-2 shadow-sm"
                    >
                      <p className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-1">
                        <Award className="w-3 h-3" /> {language === 'es' ? 'Lecciones clave aprendidas' : 'Key lessons learned'}
                      </p>
                      <div className="space-y-1">
                        {lessons.slice(0, lessonIndex).map((lesson) => (
                          <motion.div
                            key={lesson}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-[10px] text-slate-600"
                          >
                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            </div>
                            &quot;{lesson}&quot;
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
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-emerald-600 border border-emerald-100">
              {language === 'es' ? '📚 Libros y podcasts' : '📚 Books & podcasts'}
            </span>
            <span className="bg-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-green-600 border border-green-100">
              {language === 'es' ? '💡 Lecciones guardadas' : '💡 Saved lessons'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
