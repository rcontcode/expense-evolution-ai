import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useRecurringBills } from "@/hooks/data/useRecurringBills";
import { differenceInDays, parseISO, format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2 } from "lucide-react";

export function UpcomingReminders() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: bills } = useRecurringBills();

  const now = new Date();
  const activeBills = (bills || []).filter(b => b.status === "active");

  // Get bills due within next 14 days, sorted by urgency
  const upcoming = activeBills
    .map(b => {
      const due = parseISO(b.next_due_date);
      const daysUntil = differenceInDays(due, now);
      return { ...b, due, daysUntil };
    })
    .filter(b => b.daysUntil >= -7 && b.daysUntil <= 14) // include 7 days overdue
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {l ? "¡Todo al día!" : "All caught up!"}
        </p>
        <p className="text-xs text-muted-foreground">
          {l ? "No hay pagos urgentes en los próximos 14 días" : "No urgent payments in the next 14 days"}
        </p>
      </div>
    );
  }

  const totalUpcoming = upcoming.filter(b => b.daysUntil >= 0).reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="space-y-3">
      {/* Header summary */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium">
            {upcoming.length} {l ? "pagos próximos" : "upcoming payments"}
          </span>
        </div>
        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{fc(totalUpcoming)}</span>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

        {upcoming.slice(0, 7).map((bill, i) => {
          const isOverdue = bill.daysUntil < 0;
          const isToday = bill.daysUntil === 0;
          const isUrgent = bill.daysUntil > 0 && bill.daysUntil <= 3;

          const dotColor = isOverdue
            ? "bg-red-500"
            : isToday
            ? "bg-primary"
            : isUrgent
            ? "bg-amber-500"
            : "bg-muted-foreground/40";

          const timeLabel = isOverdue
            ? `🔴 ${Math.abs(bill.daysUntil)}d ${l ? "atrás" : "ago"}`
            : isToday
            ? `🟢 ${l ? "HOY" : "TODAY"}`
            : bill.daysUntil === 1
            ? `⚡ ${l ? "MAÑANA" : "TOMORROW"}`
            : `${bill.daysUntil}d`;

          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex items-center gap-3 pl-7 py-2"
            >
              {/* Dot */}
              <div className={cn(
                "absolute left-1.5 w-3 h-3 rounded-full border-2 border-background z-10",
                dotColor
              )} />

              {/* Content */}
              <div className={cn(
                "flex-1 flex items-center justify-between p-2.5 rounded-lg transition-colors",
                isOverdue ? "bg-red-500/10 border border-red-500/20" :
                isToday ? "bg-primary/10 border border-primary/20" :
                isUrgent ? "bg-amber-500/10 border border-amber-500/15" :
                "bg-muted/30"
              )}>
                <div>
                  <p className="text-sm font-medium">{bill.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(bill.due, "EEE d MMM", { locale: l ? es : enUS })}
                    {bill.auto_pay && " · 🔄 Auto"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fc(bill.amount)}</p>
                  <p className={cn(
                    "text-[10px] font-semibold",
                    isOverdue ? "text-red-500" : isToday ? "text-primary" : isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                    {timeLabel}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
