import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy, Zap } from "lucide-react";

export function GamificationStreak() {
  const { language } = useLanguage();
  const l = language === "es";
  const { user } = useAuth();

  const { data: points } = useQuery({
    queryKey: ["beta-tester-points-streak", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("beta_tester_points")
        .select("total_points, streak_days, best_streak, tier")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate level from points
  const totalXP = points?.total_points || 0;
  const level = Math.floor(Math.sqrt(totalXP / 10)) + 1;
  const currentLevelXP = (level - 1) * (level - 1) * 10;
  const nextLevelXP = level * level * 10;
  const xpProgress = nextLevelXP > currentLevelXP
    ? ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 0;

  const streak = points?.streak_days || 0;
  const bestStreak = points?.best_streak || 0;
  const tier = points?.tier || "bronze";

  const tierConfig: Record<string, { emoji: string; label: string; color: string }> = {
    bronze: { emoji: "🥉", label: l ? "Bronce" : "Bronze", color: "text-amber-700" },
    silver: { emoji: "🥈", label: l ? "Plata" : "Silver", color: "text-slate-400" },
    gold: { emoji: "🥇", label: l ? "Oro" : "Gold", color: "text-yellow-500" },
    platinum: { emoji: "💎", label: l ? "Platino" : "Platinum", color: "text-cyan-400" },
    diamond: { emoji: "👑", label: l ? "Diamante" : "Diamond", color: "text-purple-400" },
  };

  const tc = tierConfig[tier] || tierConfig.bronze;

  return (
    <div className="space-y-3">
      {/* Level & XP */}
      <div className="flex items-center gap-3">
        <motion.div
          className="relative w-14 h-14 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <motion.circle
              cx="22" cy="22" r="18"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={113}
              initial={{ strokeDashoffset: 113 }}
              animate={{ strokeDashoffset: 113 - (xpProgress / 100) * 113 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </svg>
          <span className="absolute text-sm font-bold">{level}</span>
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{l ? "Nivel" : "Level"} {level}</span>
            <span className="text-base">{tc.emoji}</span>
            <span className={cn("text-xs font-medium", tc.color)}>{tc.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totalXP} XP · {Math.round(nextLevelXP - totalXP)} {l ? "para siguiente nivel" : "to next level"}
          </p>
        </div>
      </div>

      {/* Streak & stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-orange-500/10">
          <Flame className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-sm font-bold text-orange-500">{streak}</p>
            <p className="text-[9px] text-muted-foreground">{l ? "Racha" : "Streak"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-purple-500/10">
          <Trophy className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-sm font-bold text-purple-500">{bestStreak}</p>
            <p className="text-[9px] text-muted-foreground">{l ? "Mejor" : "Best"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-bold text-primary">{totalXP}</p>
            <p className="text-[9px] text-muted-foreground">XP</p>
          </div>
        </div>
      </div>

      {/* Motivation message */}
      <div className="p-2.5 rounded-lg bg-muted/40 text-center">
        <p className="text-xs text-muted-foreground">
          {streak >= 7
            ? `🔥 ${l ? "¡Racha épica! Sigue registrando tus finanzas diariamente." : "Epic streak! Keep logging your finances daily."}`
            : streak >= 3
            ? `⚡ ${l ? "¡Buena racha! No pierdas el momentum." : "Good streak! Don't lose momentum."}`
            : `💪 ${l ? "Registra gastos e ingresos para aumentar tu racha." : "Log expenses & income to build your streak."}`}
        </p>
      </div>
    </div>
  );
}
