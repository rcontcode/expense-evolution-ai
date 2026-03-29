import { useLanguage } from '@/contexts/LanguageContext';
import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export function TracyQuickStats() {
  const { language } = useLanguage();
  const es = language === 'es';
  const { data: goals = [] } = useSavingsGoals();

  const active = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');
  const total = goals.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Calculate average progress of active goals
  const avgProgress = active.length > 0
    ? Math.round(active.reduce((sum, g) => {
        const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
        return sum + Math.min(pct, 100);
      }, 0) / active.length)
    : 0;

  const stats = [
    {
      icon: <Target className="h-4 w-4 text-blue-500" />,
      label: es ? 'Metas activas' : 'Active goals',
      value: active.length,
      color: 'text-blue-500',
    },
    {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      label: es ? 'Completadas' : 'Completed',
      value: completed.length,
      color: 'text-emerald-500',
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
      label: es ? 'Tasa completación' : 'Completion rate',
      value: `${completionRate}%`,
      color: 'text-primary',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            {es ? 'Resumen de Metas Tracy' : 'Tracy Goals Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {active.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{es ? 'Progreso promedio' : 'Average progress'}</span>
                <span className="font-medium">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="h-2" />
            </div>
          )}

          {total === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {es ? 'Crea tu primera meta SMART para ver estadísticas' : 'Create your first SMART goal to see stats'}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
