import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, X, Flame } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { QuizProgress } from "./QuizProgress";
import type { QuizData, QuizResult } from "@/pages/FinancialQuiz";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: QuizResult) => void;
}

const TOTAL_STEPS = 17;

const getQuestions = (language: string) => ({
  contact: {
    title: language === "es" ? "¡Empecemos!" : "Let's get started!",
    subtitle: language === "es" 
      ? "Ingresa tus datos para recibir tu evaluación personalizada"
      : "Enter your details to receive your personalized assessment",
  },
  situation: {
    title: language === "es" ? "¿Cuál describe mejor tu situación laboral?" : "Which best describes your work situation?",
    options: language === "es" 
      ? ["Empleado", "Freelancer/Contratista", "Dueño de negocio", "Estudiante", "Jubilado"]
      : ["Employee", "Freelancer/Contractor", "Business Owner", "Student", "Retired"],
  },
  country: {
    title: language === "es" ? "¿En qué país declaras impuestos?" : "In which country do you file taxes?",
    options: ["🇨🇦 Canadá/Canada", "🇨🇱 Chile", language === "es" ? "🌍 Otro" : "🌍 Other"],
  },
  goal: {
    title: language === "es" ? "¿Cuál es tu principal objetivo financiero?" : "What's your main financial goal?",
    options: language === "es"
      ? ["Ahorrar más", "Reducir deudas", "Optimizar impuestos", "Crecer patrimonio", "Jubilación anticipada (FIRE)"]
      : ["Save more", "Reduce debt", "Optimize taxes", "Grow wealth", "Early retirement (FIRE)"],
  },
  obstacle: {
    title: language === "es" ? "¿Cuál es tu mayor obstáculo?" : "What's your biggest obstacle?",
    options: language === "es"
      ? ["Falta de tiempo", "No sé por dónde empezar", "Gastos descontrolados", "Ingresos irregulares", "Muchas cuentas/bancos"]
      : ["Lack of time", "Don't know where to start", "Uncontrolled spending", "Irregular income", "Too many accounts/banks"],
  },
  timeSpent: {
    title: language === "es" ? "¿Cuánto tiempo dedicas a tus finanzas mensualmente?" : "How much time do you spend on your finances monthly?",
    options: language === "es"
      ? ["Menos de 30 min", "30 min - 1 hora", "1 - 3 horas", "Más de 3 horas"]
      : ["Less than 30 min", "30 min - 1 hour", "1 - 3 hours", "More than 3 hours"],
  },
  practices: language === "es" 
    ? [
        "¿Registras todos tus gastos mensualmente?",
        "¿Conoces exactamente cuánto ganas vs gastas cada mes?",
        "¿Tienes un presupuesto mensual que sigues?",
        "¿Guardas tus recibos y facturas de gastos de negocio?",
        "¿Sabes cuánto debes en total (deudas)?",
        "¿Tienes fondo de emergencia (3-6 meses de gastos)?",
        "¿Aprovechas al máximo tus deducciones fiscales?",
        "¿Controlas tus suscripciones recurrentes?",
        "¿Tienes metas financieras escritas?",
        "¿Revisas tu patrimonio neto regularmente?",
      ]
    : [
        "Do you record all your expenses monthly?",
        "Do you know exactly how much you earn vs spend each month?",
        "Do you have a monthly budget you follow?",
        "Do you keep receipts and invoices for business expenses?",
        "Do you know your total debt?",
        "Do you have an emergency fund (3-6 months of expenses)?",
        "Do you maximize your tax deductions?",
        "Do you track your recurring subscriptions?",
        "Do you have written financial goals?",
        "Do you review your net worth regularly?",
      ],
  comments: {
    title: language === "es" ? "¿Algo más que quieras agregar?" : "Anything else you'd like to add?",
    placeholder: language === "es" ? "Comentarios adicionales (opcional)" : "Additional comments (optional)",
  },
});

export const QuizModal = ({ isOpen, onClose, onComplete }: QuizModalProps) => {
  const { language } = useLanguage();
  const questions = getQuestions(language);

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<QuizData>({
    name: "",
    email: "",
    phone: "",
    situation: "",
    country: "",
    goal: "",
    obstacle: "",
    timeSpent: "",
    answers: Array(10).fill(false),
  });
  const [comments, setComments] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) {
        newErrors.name = language === "es" ? "Nombre requerido" : "Name required";
      }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = language === "es" ? "Email válido requerido" : "Valid email required";
      }
    } else if (step === 1 && !formData.situation) {
      newErrors.situation = language === "es" ? "Selecciona una opción" : "Select an option";
    } else if (step === 2 && !formData.country) {
      newErrors.country = language === "es" ? "Selecciona una opción" : "Select an option";
    } else if (step === 3 && !formData.goal) {
      newErrors.goal = language === "es" ? "Selecciona una opción" : "Select an option";
    } else if (step === 4 && !formData.obstacle) {
      newErrors.obstacle = language === "es" ? "Selecciona una opción" : "Select an option";
    } else if (step === 5 && !formData.timeSpent) {
      newErrors.timeSpent = language === "es" ? "Selecciona una opción" : "Select an option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateScore = (): QuizResult => {
    const yesCount = formData.answers.filter(Boolean).length;
    const score = Math.round((yesCount / 10) * 100);
    
    let level: QuizResult["level"];
    if (score <= 25) level = "principiante";
    else if (score <= 50) level = "emergente";
    else if (score <= 75) level = "evolucionando";
    else level = "maestro";

    const failedQuestions = formData.answers
      .map((answer, index) => (!answer ? index : -1))
      .filter((index) => index !== -1);

    return {
      score,
      level,
      failedQuestions,
      data: formData,
    };
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      const result = calculateScore();
      onComplete(result);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleOptionSelect = (field: keyof QuizData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({});
    // Auto-advance after selection for multiple choice
    setTimeout(() => {
      if (step < TOTAL_STEPS - 1) {
        setStep(step + 1);
      }
    }, 300);
  };

  const handleYesNo = (questionIndex: number, answer: boolean) => {
    const newAnswers = [...formData.answers];
    newAnswers[questionIndex] = answer;
    setFormData({ ...formData, answers: newAnswers });
    // Auto-advance
    setTimeout(() => {
      if (step < TOTAL_STEPS - 1) {
        setStep(step + 1);
      }
    }, 300);
  };

  const renderStep = () => {
    // Step 0: Contact info
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{questions.contact.title}</h2>
            <p className="text-slate-400">{questions.contact.subtitle}</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">
                {language === "es" ? "Nombre *" : "Name *"}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={language === "es" ? "Tu nombre" : "Your name"}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">
                {language === "es" ? "Email *" : "Email *"}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={language === "es" ? "tu@email.com" : "your@email.com"}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-300">
                {language === "es" ? "Teléfono (opcional)" : "Phone (optional)"}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      );
    }

    // Steps 1-5: Multiple choice questions
    const multipleChoiceSteps: { step: number; field: keyof QuizData; data: { title: string; options: string[] } }[] = [
      { step: 1, field: "situation", data: questions.situation },
      { step: 2, field: "country", data: questions.country },
      { step: 3, field: "goal", data: questions.goal },
      { step: 4, field: "obstacle", data: questions.obstacle },
      { step: 5, field: "timeSpent", data: questions.timeSpent },
    ];

    const mcStep = multipleChoiceSteps.find((s) => s.step === step);
    if (mcStep) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-8">
            {mcStep.data.title}
          </h2>
          <div className="grid gap-3">
            {mcStep.data.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionSelect(mcStep.field, option)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  formData[mcStep.field] === option
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {option}
              </motion.button>
            ))}
          </div>
          {errors[mcStep.field] && (
            <p className="text-red-400 text-sm text-center">{errors[mcStep.field]}</p>
          )}
        </div>
      );
    }

    // Steps 6-15: Yes/No questions
    if (step >= 6 && step <= 15) {
      const questionIndex = step - 6;
      const question = questions.practices[questionIndex];
      return (
        <div className="space-y-8">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center">
            {question}
          </h2>
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleYesNo(questionIndex, true)}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all ${
                formData.answers[questionIndex] === true
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-emerald-500/20 hover:border-emerald-500/50"
              }`}
            >
              <Check className="w-6 h-6" />
              {language === "es" ? "Sí" : "Yes"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleYesNo(questionIndex, false)}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all ${
                formData.answers[questionIndex] === false && step > 6
                  ? "bg-red-500 text-white"
                  : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-red-500/20 hover:border-red-500/50"
              }`}
            >
              <X className="w-6 h-6" />
              {language === "es" ? "No" : "No"}
            </motion.button>
          </div>
        </div>
      );
    }

    // Step 16: Comments
    if (step === 16) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-4">
            {questions.comments.title}
          </h2>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={questions.comments.placeholder}
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 p-0 overflow-hidden">
        {/* Progress bar */}
        <QuizProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* Content */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            {language === "es" ? "Atrás" : "Back"}
          </Button>

          {step === 0 || step === 16 ? (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {step === 16 ? (
                <>
                  <Flame className="w-5 h-5 mr-2" />
                  {language === "es" ? "Ver Resultados" : "See Results"}
                </>
              ) : (
                <>
                  {language === "es" ? "Continuar" : "Continue"}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
