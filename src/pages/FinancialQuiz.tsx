import { useState } from "react";
import { QuizHero } from "@/components/quiz/QuizHero";
import { QuizModal } from "@/components/quiz/QuizModal";
import { QuizResults } from "@/components/quiz/QuizResults";
import { ThemeBackground } from "@/components/ThemeBackground";

export interface QuizData {
  name: string;
  email: string;
  phone: string;
  situation: string;
  country: string;
  goal: string;
  obstacle: string;
  timeSpent: string;
  answers: boolean[];
}

export interface QuizResult {
  score: number;
  level: "principiante" | "emergente" | "evolucionando" | "maestro";
  failedQuestions: number[];
  data: QuizData;
}

const FinancialQuiz = () => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const handleQuizComplete = (quizResult: QuizResult) => {
    setResult(quizResult);
    setIsQuizOpen(false);
  };

  const handleStartQuiz = () => {
    setIsQuizOpen(true);
  };

  const handleRetakeQuiz = () => {
    setResult(null);
    setIsQuizOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <ThemeBackground />
      
      {/* Floating golden particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {result ? (
        <QuizResults result={result} onRetake={handleRetakeQuiz} />
      ) : (
        <QuizHero onStartQuiz={handleStartQuiz} />
      )}

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default FinancialQuiz;
