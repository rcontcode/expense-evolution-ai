import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MiniCardProps {
  emoji: string;
  label: string;
  value: string;
  color: string;
  missing?: boolean;
  missingAction?: () => void;
  missingLabel?: string;
  trend?: { value: number; label: string };
}

export function MiniCard({
  emoji, label, value, color, missing, missingAction, missingLabel, trend,
}: MiniCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={missing ? { scale: 0.97 } : undefined}
      className={cn(
        "p-3 rounded-xl bg-muted/40 space-y-1 transition-colors",
        missing && "border border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/60"
      )}
      onClick={missing ? missingAction : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {missing ? (
        <p className="text-sm text-primary font-medium">{missingLabel}</p>
      ) : (
        <>
          <p className={cn("text-lg font-bold", color)}>{value}</p>
          {trend && (
            <p className={cn(
              "text-[10px] font-medium",
              trend.value >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(0)}% {trend.label}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
