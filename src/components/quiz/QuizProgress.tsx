import { motion } from "framer-motion";

interface QuizProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const QuizProgress = ({ currentStep, totalSteps }: QuizProgressProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="relative h-2 bg-slate-800">
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-medium text-white/70 bg-slate-900/80 px-2 py-0.5 rounded-full">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
};
