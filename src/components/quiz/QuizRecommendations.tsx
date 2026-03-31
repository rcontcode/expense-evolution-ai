import { motion } from "framer-motion";
import { 
  Receipt, 
  BarChart3, 
  Wallet, 
  FileText, 
  CreditCard, 
  PiggyBank, 
  Calculator, 
  Bell, 
  Target, 
  TrendingUp,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

interface QuizRecommendationsProps {
  failedQuestions: number[];
  language: string;
  situation: string;
}

const getRecommendations = (language: string) => [
  {
    icon: Receipt,
    priority: "URGENTE",
    priorityColor: "text-red-400 bg-red-500/10",
    title: {
      es: "Registro de Gastos",
      en: "Expense Tracking",
    },
    description: {
      es: "Sin visibilidad de tus gastos, es imposible mejorar. EvoFinz te permite capturar gastos con foto, voz o texto en segundos.",
      en: "Without visibility of your expenses, improvement is impossible. EvoFinz lets you capture expenses with photo, voice or text in seconds.",
    },
    feature: {
      es: "📸 Captura con OCR automático",
      en: "📸 Capture with automatic OCR",
    },
  },
  {
    icon: BarChart3,
    priority: "URGENTE",
    priorityColor: "text-red-400 bg-red-500/10",
    title: {
      es: "Balance Ingreso vs Gastos",
      en: "Income vs Expense Balance",
    },
    description: {
      es: "Conocer tu flujo de dinero es el primer paso para la libertad financiera. El Dashboard te muestra tu balance en tiempo real.",
      en: "Knowing your money flow is the first step to financial freedom. The Dashboard shows your balance in real time.",
    },
    feature: {
      es: "📊 Dashboard en tiempo real",
      en: "📊 Real-time Dashboard",
    },
  },
  {
    icon: Wallet,
    priority: "IMPORTANTE",
    priorityColor: "text-amber-400 bg-amber-500/10",
    title: {
      es: "Presupuesto Mensual",
      en: "Monthly Budget",
    },
    description: {
      es: "Un presupuesto te da control. Crea presupuestos por categoría y recibe alertas automáticas cuando te acerques al límite.",
      en: "A budget gives you control. Create category budgets and receive automatic alerts when approaching the limit.",
    },
    feature: {
      es: "🎯 Alertas inteligentes",
      en: "🎯 Smart alerts",
    },
  },
  {
    icon: FileText,
    priority: "IMPORTANTE",
    priorityColor: "text-amber-400 bg-amber-500/10",
    title: {
      es: "Recibos y Facturas",
      en: "Receipts and Invoices",
    },
    description: {
      es: "Guardar comprobantes es esencial para deducciones fiscales. OCR automático extrae todos los datos de tus recibos.",
      en: "Keeping receipts is essential for tax deductions. Automatic OCR extracts all data from your receipts.",
    },
    feature: {
      es: "🔍 Extracción automática con IA",
      en: "🔍 Automatic AI extraction",
    },
  },
  {
    icon: CreditCard,
    priority: "URGENTE",
    priorityColor: "text-red-400 bg-red-500/10",
    title: {
      es: "Control de Deudas",
      en: "Debt Control",
    },
    description: {
      es: "No saber cuánto debes te mantiene en la oscuridad. El Gestor de Deudas te ayuda a pagar más rápido con estrategias probadas.",
      en: "Not knowing how much you owe keeps you in the dark. The Debt Manager helps you pay off faster with proven strategies.",
    },
    feature: {
      es: "💳 Estrategias Avalanche y Snowball",
      en: "💳 Avalanche and Snowball strategies",
    },
  },
  {
    icon: PiggyBank,
    priority: "IMPORTANTE",
    priorityColor: "text-amber-400 bg-amber-500/10",
    title: {
      es: "Fondo de Emergencia",
      en: "Emergency Fund",
    },
    description: {
      es: "Un colchón financiero es tu seguro ante imprevistos. Configura metas de ahorro y sigue tu progreso con gamificación.",
      en: "A financial cushion is your insurance against unexpected events. Set savings goals and track progress with gamification.",
    },
    feature: {
      es: "🎮 Sistema gamificado con XP y logros",
      en: "🎮 Gamified system with XP and achievements",
    },
  },
  {
    icon: Calculator,
    priority: "IMPORTANTE",
    priorityColor: "text-amber-400 bg-amber-500/10",
    title: {
      es: "Optimización Fiscal",
      en: "Tax Optimization",
    },
    description: {
      es: "Podrías estar dejando dinero en la mesa. El Optimizador Fiscal analiza tus gastos para maximizar deducciones.",
      en: "You could be leaving money on the table. The Tax Optimizer analyzes your expenses to maximize deductions.",
    },
    feature: {
      es: "🍁 CRA (Canadá) y SII (Chile)",
      en: "🍁 CRA (Canada) and SII (Chile)",
    },
  },
  {
    icon: Bell,
    priority: "RECOMENDADO",
    priorityColor: "text-blue-400 bg-blue-500/10",
    title: {
      es: "Control de Suscripciones",
      en: "Subscription Control",
    },
    description: {
      es: "Las suscripciones olvidadas drenan tu dinero silenciosamente. Detector automático desde tus extractos bancarios.",
      en: "Forgotten subscriptions silently drain your money. Automatic detector from your bank statements.",
    },
    feature: {
      es: "🔔 Alertas de renovación",
      en: "🔔 Renewal alerts",
    },
  },
  {
    icon: Target,
    priority: "IMPORTANTE",
    priorityColor: "text-amber-400 bg-amber-500/10",
    title: {
      es: "Metas Financieras",
      en: "Financial Goals",
    },
    description: {
      es: "Sin metas claras, no hay dirección. Sistema SMART de metas con metodología de productividad + micro-hábitos integrada.",
      en: "Without clear goals, there's no direction. SMART goal system with productivity + micro-habits methodology integrated.",
    },
    feature: {
      es: "📚 Mentoría de expertos integrada",
      en: "📚 Integrated expert mentorship",
    },
  },
  {
    icon: TrendingUp,
    priority: "RECOMENDADO",
    priorityColor: "text-blue-400 bg-blue-500/10",
    title: {
      es: "Patrimonio Neto",
      en: "Net Worth",
    },
    description: {
      es: "Tu patrimonio neto es el verdadero indicador de tu salud financiera. Tracking de activos y pasivos con proyecciones.",
      en: "Your net worth is the true indicator of your financial health. Asset and liability tracking with projections.",
    },
    feature: {
      es: "📈 Clasificación inteligente incluida",
      en: "📈 Smart classification included",
    },
  },
];

export const QuizRecommendations = ({ failedQuestions, language, situation }: QuizRecommendationsProps) => {
  const allRecommendations = getRecommendations(language);
  
  // Get top 3 recommendations based on failed questions
  const recommendations = failedQuestions
    .slice(0, 3)
    .map((index) => allRecommendations[index])
    .filter(Boolean);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/70 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
              <rec.icon className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${rec.priorityColor}`}>
                  {rec.priority}
                </span>
              </div>
              <h4 className="text-white font-semibold mb-1">
                {rec.title[language as "es" | "en"] || rec.title.es}
              </h4>
              <p className="text-slate-400 text-sm mb-2">
                {rec.description[language as "es" | "en"] || rec.description.es}
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>{rec.feature[language as "es" | "en"] || rec.feature.es}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
