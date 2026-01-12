import { motion } from "framer-motion";
import { PhoenixLogo } from "@/components/ui/phoenix-logo";
import type { QuizResult } from "@/pages/FinancialQuiz";

interface PhoenixScoreAnimationProps {
  level: QuizResult["level"];
}

const levelConfig = {
  principiante: {
    state: "smoke" as const,
    glowColors: ["rgba(239, 68, 68, 0.4)", "rgba(251, 146, 60, 0.3)"],
    particleColor: "bg-red-400",
    ringColor: "ring-red-500/40",
    innerGlow: "shadow-red-500/50",
  },
  emergente: {
    state: "default" as const,
    glowColors: ["rgba(251, 146, 60, 0.4)", "rgba(245, 158, 11, 0.3)"],
    particleColor: "bg-orange-400",
    ringColor: "ring-orange-500/40",
    innerGlow: "shadow-orange-500/50",
  },
  evolucionando: {
    state: "flames" as const,
    glowColors: ["rgba(245, 158, 11, 0.5)", "rgba(250, 204, 21, 0.4)"],
    particleColor: "bg-amber-400",
    ringColor: "ring-amber-500/40",
    innerGlow: "shadow-amber-500/50",
  },
  maestro: {
    state: "rebirth" as const,
    glowColors: ["rgba(52, 211, 153, 0.5)", "rgba(45, 212, 191, 0.4)"],
    particleColor: "bg-emerald-400",
    ringColor: "ring-emerald-500/40",
    innerGlow: "shadow-emerald-500/50",
  },
};

export const PhoenixScoreAnimation = ({ level }: PhoenixScoreAnimationProps) => {
  const config = levelConfig[level];
  const particleCount = level === "maestro" ? 16 : level === "evolucionando" ? 10 : level === "emergente" ? 6 : 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, type: "spring", bounce: 0.4 }}
      className="relative flex items-center justify-center w-[180px] h-[180px]"
    >
      {/* Multi-layer pulsing glow */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute rounded-full blur-3xl"
        style={{ 
          width: "300px", 
          height: "300px",
          background: `radial-gradient(circle, ${config.glowColors[0]} 0%, ${config.glowColors[1]} 40%, transparent 70%)`,
        }}
      />
      
      {/* Secondary inner glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute rounded-full blur-2xl"
        style={{ 
          width: "180px", 
          height: "180px",
          background: `radial-gradient(circle, ${config.glowColors[0]} 0%, transparent 60%)`,
        }}
      />

      {/* Orbiting dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute w-44 h-44 rounded-full border-2 border-dashed ${config.ringColor}`}
      />
      
      {/* Second orbiting ring (counter-rotation) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className={`absolute w-48 h-48 rounded-full border border-dashed ${config.ringColor} opacity-50`}
      />

      {/* Orbiting particles - enhanced */}
      {particleCount > 0 && (
        <>
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{
                duration: 5 + i * 0.5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute"
              style={{ width: "160px", height: "160px" }}
            >
              <motion.div
                className={`absolute w-2.5 h-2.5 rounded-full ${config.particleColor} shadow-lg ${config.innerGlow}`}
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translateX(${70 + (i % 4) * 8}px)`,
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.7, 1.3, 0.7],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.12,
                }}
              />
            </motion.div>
          ))}
        </>
      )}

      {/* Rising particles for higher levels - more dramatic */}
      {(level === "evolucionando" || level === "maestro") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
          {[...Array(level === "maestro" ? 20 : 12)].map((_, i) => (
            <motion.div
              key={`rise-${i}`}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [-20, -120],
                x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 80],
              }}
              transition={{
                duration: 2.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className={`absolute w-1.5 h-1.5 rounded-full ${config.particleColor} shadow-lg`}
              style={{
                left: `${30 + Math.random() * 40}%`,
                bottom: "25%",
              }}
            />
          ))}
        </div>
      )}

      {/* Sparkle effects for maestro */}
      {level === "maestro" && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </>
      )}

      {/* Phoenix Logo - Enhanced floating animation */}
      <motion.div
        animate={
          level === "maestro"
            ? { y: [0, -10, 0], scale: [1, 1.02, 1] }
            : level === "evolucionando"
            ? { y: [0, -6, 0] }
            : level === "emergente"
            ? { y: [0, -3, 0] }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative z-10 drop-shadow-2xl ${config.innerGlow}`}
      >
        <PhoenixLogo 
          variant="hero" 
          state={config.state}
          showEffects={level !== "principiante"}
          showText={false}
        />
      </motion.div>
    </motion.div>
  );
};
