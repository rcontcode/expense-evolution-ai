import { motion } from "framer-motion";
import { PhoenixLogo } from "@/components/ui/phoenix-logo";
import type { QuizResult } from "@/pages/FinancialQuiz";

interface PhoenixScoreAnimationProps {
  level: QuizResult["level"];
}

const levelConfig = {
  principiante: {
    state: "smoke" as const,
    glowColors: ["rgba(239, 68, 68, 0.3)", "rgba(251, 146, 60, 0.2)"],
    particleColor: "bg-red-400",
    ringColor: "ring-red-500/30",
  },
  emergente: {
    state: "default" as const,
    glowColors: ["rgba(251, 146, 60, 0.3)", "rgba(245, 158, 11, 0.2)"],
    particleColor: "bg-orange-400",
    ringColor: "ring-orange-500/30",
  },
  evolucionando: {
    state: "flames" as const,
    glowColors: ["rgba(245, 158, 11, 0.4)", "rgba(250, 204, 21, 0.3)"],
    particleColor: "bg-amber-400",
    ringColor: "ring-amber-500/30",
  },
  maestro: {
    state: "rebirth" as const,
    glowColors: ["rgba(52, 211, 153, 0.4)", "rgba(45, 212, 191, 0.3)"],
    particleColor: "bg-emerald-400",
    ringColor: "ring-emerald-500/30",
  },
};

export const PhoenixScoreAnimation = ({ level }: PhoenixScoreAnimationProps) => {
  const config = levelConfig[level];
  const particleCount = level === "maestro" ? 12 : level === "evolucionando" ? 8 : level === "emergente" ? 4 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="relative flex items-center justify-center"
    >
      {/* Pulsing glow background */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute rounded-full blur-3xl"
        style={{ 
          width: "280px", 
          height: "280px",
          background: `radial-gradient(circle, ${config.glowColors[0]} 0%, ${config.glowColors[1]} 50%, transparent 70%)`,
        }}
      />

      {/* Orbiting ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute w-52 h-52 rounded-full border-2 border-dashed ${config.ringColor}`}
      />

      {/* Orbiting particles */}
      {particleCount > 0 && (
        <>
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute"
              style={{ width: "200px", height: "200px" }}
            >
              <motion.div
                className={`absolute w-2 h-2 rounded-full ${config.particleColor} shadow-lg`}
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translateX(${85 + (i % 3) * 10}px)`,
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            </motion.div>
          ))}
        </>
      )}

      {/* Rising particles for higher levels */}
      {(level === "evolucionando" || level === "maestro") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
          {[...Array(level === "maestro" ? 16 : 8)].map((_, i) => (
            <motion.div
              key={`rise-${i}`}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [-30, -100],
                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 60],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className={`absolute w-1.5 h-1.5 rounded-full ${config.particleColor}`}
              style={{
                left: `${35 + Math.random() * 30}%`,
                bottom: "20%",
              }}
            />
          ))}
        </div>
      )}

      {/* Phoenix Logo - Using unified component with state based on level */}
      <motion.div
        animate={
          level === "maestro"
            ? { y: [0, -8, 0] }
            : level === "evolucionando"
            ? { y: [0, -4, 0] }
            : {}
        }
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10"
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
