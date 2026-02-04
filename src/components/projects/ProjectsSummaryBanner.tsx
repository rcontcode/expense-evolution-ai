import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderKanban, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { cn } from '@/lib/utils';

interface ProjectsSummaryBannerProps {
  projects: any[];
  projectFinancials: Record<string, { expenses: number; income: number }>;
}

export function ProjectsSummaryBanner({ projects, projectFinancials }: ProjectsSummaryBannerProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();

  const firstName = profile?.full_name?.split(' ')[0] || '';

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on_hold').length;
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let projectsWithBudget = 0;
    let projectsOverBudget = 0;

    projects.forEach(p => {
      const fin = projectFinancials[p.id] || { expenses: 0, income: 0 };
      totalIncome += fin.income;
      totalExpenses += fin.expenses;
      
      if (p.budget) {
        projectsWithBudget++;
        if (fin.expenses > p.budget) {
          projectsOverBudget++;
        }
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

    return {
      total: projects.length,
      active: activeProjects,
      completed: completedProjects,
      onHold: onHoldProjects,
      totalIncome,
      totalExpenses,
      netBalance,
      profitMargin,
      projectsOverBudget
    };
  }, [projects, projectFinancials]);

  const personalizedMessage = useMemo(() => {
    if (stats.total === 0) {
      return {
        message: language === 'es'
          ? `${firstName ? `${firstName}, ` : ''}¡Crea tu primer proyecto para organizar tu trabajo!`
          : `${firstName ? `${firstName}, ` : ''}Create your first project to organize your work!`,
        type: 'info' as const,
        icon: Sparkles
      };
    }

    if (stats.projectsOverBudget > 0) {
      return {
        message: language === 'es'
          ? `${firstName ? `${firstName}, ` : ''}tienes ${stats.projectsOverBudget} proyecto${stats.projectsOverBudget > 1 ? 's' : ''} excediendo el presupuesto. ¡Revisa tus gastos!`
          : `${firstName ? `${firstName}, ` : ''}you have ${stats.projectsOverBudget} project${stats.projectsOverBudget > 1 ? 's' : ''} over budget. Review your expenses!`,
        type: 'warning' as const,
        icon: AlertCircle
      };
    }

    if (stats.profitMargin >= 30) {
      return {
        message: language === 'es'
          ? `¡Excelente, ${firstName || 'usuario'}! Tu margen de ganancia es del ${stats.profitMargin.toFixed(0)}% 🎯`
          : `Excellent, ${firstName || 'user'}! Your profit margin is ${stats.profitMargin.toFixed(0)}% 🎯`,
        type: 'success' as const,
        icon: TrendingUp
      };
    }

    if (stats.active > 0 && stats.netBalance >= 0) {
      return {
        message: language === 'es'
          ? `${firstName ? `${firstName}, ` : ''}tienes ${stats.active} proyecto${stats.active > 1 ? 's' : ''} activo${stats.active > 1 ? 's' : ''} con balance positivo. ¡Buen trabajo! 💪`
          : `${firstName ? `${firstName}, ` : ''}you have ${stats.active} active project${stats.active > 1 ? 's' : ''} with positive balance. Great job! 💪`,
        type: 'success' as const,
        icon: CheckCircle2
      };
    }

    if (stats.netBalance < 0) {
      return {
        message: language === 'es'
          ? `${firstName ? `${firstName}, ` : ''}tus proyectos tienen gastos mayores a ingresos. Considera revisar los costos.`
          : `${firstName ? `${firstName}, ` : ''}your projects have expenses exceeding income. Consider reviewing costs.`,
        type: 'warning' as const,
        icon: TrendingDown
      };
    }

    return {
      message: language === 'es'
        ? `${firstName ? `Hola ${firstName}, ` : ''}aquí está el resumen de tus ${stats.total} proyectos.`
        : `${firstName ? `Hi ${firstName}, ` : ''}here's the summary of your ${stats.total} projects.`,
      type: 'info' as const,
      icon: FolderKanban
    };
  }, [stats, firstName, language]);

  const MessageIcon = personalizedMessage.icon;

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      personalizedMessage.type === 'success' && "border-success/30 bg-gradient-to-r from-success/5 via-success/10 to-emerald-500/5",
      personalizedMessage.type === 'warning' && "border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-orange-500/10 to-yellow-500/5",
      personalizedMessage.type === 'info' && "border-primary/30 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5"
    )}>
      {/* Decorative gradient bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        personalizedMessage.type === 'success' && "bg-gradient-to-r from-success via-emerald-400 to-success",
        personalizedMessage.type === 'warning' && "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500",
        personalizedMessage.type === 'info' && "bg-gradient-to-r from-primary via-accent to-primary"
      )} />
      
      <CardContent className="pt-6 pb-4">
        {/* Personalized Message */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            "p-2 rounded-xl",
            personalizedMessage.type === 'success' && "bg-success/20 text-success",
            personalizedMessage.type === 'warning' && "bg-amber-500/20 text-amber-600",
            personalizedMessage.type === 'info' && "bg-primary/20 text-primary"
          )}>
            <MessageIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {personalizedMessage.message}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === 'es' 
                ? 'Tu centro de gestión de proyectos' 
                : 'Your project management hub'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Active Projects */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{stats.active}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === 'es' ? 'Activos' : 'Active'}
                </p>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/10 border border-success/20">
              <div className="p-1.5 rounded-lg bg-success/20">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-success">{stats.completed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === 'es' ? 'Completados' : 'Completed'}
                </p>
              </div>
            </div>

            {/* Total Income */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-1.5 rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-600">
                  ${stats.totalIncome >= 1000 ? `${(stats.totalIncome / 1000).toFixed(1)}k` : stats.totalIncome.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === 'es' ? 'Ingresos' : 'Income'}
                </p>
              </div>
            </div>

            {/* Net Balance */}
            <div className={cn(
              "flex items-center gap-2 p-2.5 rounded-xl border",
              stats.netBalance >= 0 
                ? "bg-success/10 border-success/20" 
                : "bg-destructive/10 border-destructive/20"
            )}>
              <div className={cn(
                "p-1.5 rounded-lg",
                stats.netBalance >= 0 ? "bg-success/20" : "bg-destructive/20"
              )}>
                <Target className={cn(
                  "h-4 w-4",
                  stats.netBalance >= 0 ? "text-success" : "text-destructive"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-lg font-bold",
                  stats.netBalance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {stats.netBalance >= 0 ? '+' : ''}
                  ${Math.abs(stats.netBalance) >= 1000 
                    ? `${(stats.netBalance / 1000).toFixed(1)}k` 
                    : stats.netBalance.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {language === 'es' ? 'Balance' : 'Balance'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* On Hold Badge */}
        {stats.onHold > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
              <Clock className="h-3 w-3" />
              {stats.onHold} {language === 'es' ? 'en pausa' : 'on hold'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
