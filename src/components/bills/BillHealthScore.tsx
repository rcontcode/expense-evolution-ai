import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecurringBills, useBillPayments } from '@/hooks/data/useRecurringBills';
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ShieldCheck, Zap, Clock, TrendingUp, Award, Heart } from 'lucide-react';

function CircularGauge({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(var(--chart-2))' : score >= 60 ? 'hsl(45, 80%, 50%)' : 'hsl(0, 80%, 50%)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {score}
        </motion.span>
        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

export function BillHealthScore() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { data: bills } = useRecurringBills();
  const { data: payments } = useBillPayments();

  const health = useMemo(() => {
    const active = bills?.filter(b => b.status === 'active') || [];
    if (active.length === 0) return null;

    const now = new Date();
    const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };

    // 1. On-time rate (40 points) — based on overdue bills
    const overdue = active.filter(b => differenceInDays(parseISO(b.next_due_date), now) < 0).length;
    const onTimeRate = active.length > 0 ? ((active.length - overdue) / active.length) : 1;
    const onTimeScore = Math.round(onTimeRate * 40);

    // 2. Autopay coverage (20 points)
    const autopayCount = active.filter(b => b.auto_pay).length;
    const autopayRate = active.length > 0 ? (autopayCount / active.length) : 0;
    const autopayScore = Math.round(autopayRate * 20);

    // 3. Monthly progress (20 points)
    const thisMonthBills = active.filter(b =>
      isWithinInterval(parseISO(b.next_due_date), monthInterval)
    );
    const paidThisMonth = thisMonthBills.filter(b => {
      if (!b.last_paid_date) return false;
      return isWithinInterval(parseISO(b.last_paid_date), monthInterval);
    }).length;
    const progressRate = thisMonthBills.length > 0 ? (paidThisMonth / thisMonthBills.length) : 1;
    const progressScore = Math.round(progressRate * 20);

    // 4. Organization (20 points) — bills with priority, notes, categories
    const organized = active.filter(b =>
      b.priority && b.priority !== 'medium' || b.notes || b.beneficiary
    ).length;
    const orgRate = active.length > 0 ? Math.min(organized / active.length, 1) : 0;
    const orgScore = Math.round(Math.max(orgRate * 20, 10)); // Minimum 10 for having bills

    const totalScore = Math.min(onTimeScore + autopayScore + progressScore + orgScore, 100);

    const grade = totalScore >= 90 ? { label: l ? '🏆 Excelente' : '🏆 Excellent', color: 'text-emerald-500' }
      : totalScore >= 75 ? { label: l ? '⭐ Muy Bien' : '⭐ Great', color: 'text-blue-500' }
      : totalScore >= 60 ? { label: l ? '👍 Bien' : '👍 Good', color: 'text-amber-500' }
      : { label: l ? '⚠️ Mejorable' : '⚠️ Needs Work', color: 'text-red-500' };

    // Payment consistency — last 3 months
    const recentPayments = (payments || []).filter(p => {
      const pd = parseISO(p.paid_date);
      return pd >= subMonths(now, 3);
    });
    const streak = recentPayments.length;

    return {
      totalScore,
      grade,
      breakdown: [
        { label: l ? 'Puntualidad' : 'On-time', score: onTimeScore, max: 40, icon: <Clock className="h-3.5 w-3.5" />, color: 'text-blue-500' },
        { label: l ? 'Autopago' : 'Autopay', score: autopayScore, max: 20, icon: <Zap className="h-3.5 w-3.5" />, color: 'text-emerald-500' },
        { label: l ? 'Progreso' : 'Progress', score: progressScore, max: 20, icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'text-purple-500' },
        { label: l ? 'Organización' : 'Organization', score: orgScore, max: 20, icon: <Award className="h-3.5 w-3.5" />, color: 'text-amber-500' },
      ],
      streak,
      tips: [
        onTimeScore < 40 && (l ? '💡 Paga los vencidos para subir tu score' : '💡 Pay overdue bills to boost your score'),
        autopayScore < 15 && (l ? '⚡ Activa autopago en más cuentas' : '⚡ Enable autopay on more bills'),
        progressScore < 15 && (l ? '📅 Completa los pagos de este mes' : '📅 Complete this month\'s payments'),
      ].filter(Boolean) as string[],
    };
  }, [bills, payments, l]);

  if (!health) return null;

  return (
    <Card className="overflow-hidden border-2 border-primary/15 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Circular gauge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
            <CircularGauge score={health.totalScore} />
          </motion.div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{l ? 'Salud de Pagos' : 'Payment Health'}</span>
              <Badge variant="outline" className={`text-[10px] h-5 ${health.grade.color}`}>
                {health.grade.label}
              </Badge>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-1.5 mt-2">
              {health.breakdown.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-2">
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-[10px] w-20 text-muted-foreground">{item.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.score / item.max) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="text-[10px] font-medium w-8 text-right">{item.score}/{item.max}</span>
                </motion.div>
              ))}
            </div>

            {/* Tips */}
            {health.tips.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {health.tips.slice(0, 2).map((tip, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground">{tip}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Streak */}
        {health.streak > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <Heart className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold">
              🔥 {health.streak} {l ? 'pagos registrados (3 meses)' : 'payments recorded (3 months)'}
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
