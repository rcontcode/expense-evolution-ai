import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { QuizHero } from "@/components/quiz/QuizHero";
import { QuizModal } from "@/components/quiz/QuizModal";
import { QuizResults } from "@/components/quiz/QuizResults";
import { ThemeBackground } from "@/components/ThemeBackground";
import { supabase } from "@/integrations/supabase/client";

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
  marketingConsent?: boolean;
}

export interface QuizResult {
  score: number;
  level: "principiante" | "emergente" | "evolucionando" | "maestro";
  failedQuestions: number[];
  data: QuizData;
}

export interface ReferralInfo {
  code: string;
  referrerName: string | null;
  isValid: boolean;
}

const FinancialQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  const validateReferralCode = async (code: string) => {
    setIsLoadingReferral(true);
    try {
      // Try to validate the code and get referrer info
      const { data, error } = await supabase.rpc("validate_any_beta_code", {
        p_code: code.toUpperCase(),
      });

      if (!error && data) {
        // Try to get referrer name from the code (format: NAME-XXXXXX)
        const namePart = code.split("-")[0];
        const referrerName = namePart && namePart.length > 2 
          ? namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase()
          : null;

        setReferralInfo({
          code: code.toUpperCase(),
          referrerName,
          isValid: true,
        });
      } else {
        setReferralInfo({
          code: code.toUpperCase(),
          referrerName: null,
          isValid: false,
        });
      }
    } catch (err) {
      console.error("Error validating referral code:", err);
      setReferralInfo({
        code: code.toUpperCase(),
        referrerName: null,
        isValid: false,
      });
    } finally {
      setIsLoadingReferral(false);
    }
  };

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

  // Navigate to auth with referral code
  const handleNavigateToAuth = () => {
    if (referralInfo?.isValid) {
      navigate(`/auth?ref=${referralInfo.code}`);
    } else {
      navigate("/auth");
    }
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
        <QuizResults 
          result={result} 
          onRetake={handleRetakeQuiz}
          referralInfo={referralInfo}
          onNavigateToAuth={handleNavigateToAuth}
        />
      ) : (
        <QuizHero 
          onStartQuiz={handleStartQuiz} 
          referralInfo={referralInfo}
          isLoadingReferral={isLoadingReferral}
        />
      )}

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onComplete={handleQuizComplete}
        referralInfo={referralInfo}
      />
    </div>
  );
};

export default FinancialQuiz;
