import { motion } from "framer-motion";
import phoenixLogo from "@/assets/phoenix-transparent.png";
import type { QuizResult } from "@/pages/FinancialQuiz";

interface PhoenixScoreAnimationProps {
  level: QuizResult["level"];
}

const levelStyles = {
  principiante: {
    glow: "from-red-500/40 to-orange-500/30",
    pulse: "bg-red-500/20",
    filter: "grayscale(50%) brightness(0.7)",
  },
  emergente: {
    glow: "from-orange-500/40 to-amber-500/30",
    pulse: "bg-orange-500/20",
    filter: "grayscale(20%) brightness(0.85)",
  },
  evolucionando: {
    glow: "from-amber-400/50 to-yellow-400/40",
    pulse: "bg-amber-500/25",
    filter: "brightness(1.1) saturate(1.2)",
  },
  maestro: {
    glow: "from-emerald-400/50 to-teal-400/40",
    pulse: "bg-emerald-500/25",
    filter: "brightness(1.2) saturate(1.3) hue-rotate(30deg)",
  },
};

export const PhoenixScoreAnimation = ({ level }: PhoenixScoreAnimationProps) => {
  const style = levelStyles[level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="relative"
    >
      {/* Pulsing glow background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 bg-gradient-radial ${style.glow} blur-3xl rounded-full`}
        style={{ width: "200px", height: "200px", margin: "-25px" }}
      />

      {/* Orbiting particles */}
      {level !== "principiante" && (
        <>
          {[...Array(level === "maestro" ? 8 : level === "evolucionando" ? 5 : 3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ width: "150px", height: "150px" }}
            >
              <motion.div
                className={`w-2 h-2 rounded-full ${
                  level === "maestro" 
                    ? "bg-emerald-400" 
                    : level === "evolucionando" 
                    ? "bg-amber-400" 
                    : "bg-orange-400"
                }`}
                style={{
                  transform: `translateX(${60 + i * 10}px)`,
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            </motion.div>
          ))}
        </>
      )}

      {/* Phoenix image */}
      <motion.div
        animate={
          level === "maestro"
            ? {
                y: [0, -5, 0],
              }
            : level === "evolucionando"
            ? {
                y: [0, -3, 0],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10"
      >
        <img
          src={phoenixLogo}
          alt="Phoenix"
          className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
          style={{ filter: style.filter }}
        />
      </motion.div>

      {/* Flame particles for higher levels */}
      {(level === "evolucionando" || level === "maestro") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(level === "maestro" ? 12 : 6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [-20, -60],
                x: [0, (Math.random() - 0.5) * 40],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className={`absolute w-1 h-1 rounded-full ${
                level === "maestro" ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{
                left: `${40 + Math.random() * 20}%`,
                bottom: "30%",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
