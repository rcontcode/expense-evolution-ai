import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Receipt, 
  DollarSign, 
  Users,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuickStatsCardsProps {
  pendingDocs: number;
  totalExpenses: number;
  monthlyTotal: number;
  billableExpenses: number;
  isLoading?: boolean;
}

export function QuickStatsCards({
  pendingDocs,
  totalExpenses,
  monthlyTotal,
  billableExpenses,
  isLoading
}: QuickStatsCardsProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const stats = [
    {
      id: 'pending',
      label: t('dashboard.pendingDocuments'),
      value: pendingDocs,
      icon: FileText,
      path: '/chaos',
      hasAction: pendingDocs > 0,
      colorClass: pendingDocs > 0 
        ? 'text-amber-600 dark:text-amber-400' 
        : 'text-muted-foreground/60',
      bgClass: pendingDocs > 0 
        ? 'bg-amber-500/10 border-amber-500/20' 
        : 'bg-muted/30 border-muted/20',
      iconBg: pendingDocs > 0 ? 'bg-amber-500/20' : 'bg-muted/50'
    },
    {
      id: 'expenses',
      label: t('dashboard.totalExpenses'),
      value: totalExpenses,
      icon: Receipt,
      path: '/expenses',
      hasAction: false,
      colorClass: 'text-destructive/80',
      bgClass: 'bg-destructive/5 border-destructive/10',
      iconBg: 'bg-destructive/10'
    },
    {
      id: 'monthly',
      label: language === 'es' ? 'Este mes' : 'This month',
      value: `$${monthlyTotal?.toFixed(0) || 0}`,
      icon: DollarSign,
      path: '/income',
      hasAction: false,
      colorClass: 'text-success/80',
      bgClass: 'bg-success/5 border-success/10',
      iconBg: 'bg-success/10'
    },
    {
      id: 'billable',
      label: t('dashboard.billableExpenses'),
      value: billableExpenses,
      icon: Users,
      path: '/clients',
      hasAction: false,
      colorClass: 'text-primary/80',
      bgClass: 'bg-primary/5 border-primary/10',
      iconBg: 'bg-primary/10'
    }
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {stats.map((stat) => (
        <Card 
          key={stat.id}
          onClick={() => navigate(stat.path)}
          className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:shadow-md hover:-translate-y-0.5",
            "border",
            stat.bgClass,
            stat.hasAction && "card-actionable ring-1 ring-amber-500/30"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">
                  {stat.label}
                </p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  stat.colorClass
                )}>
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                stat.iconBg
              )}>
                <stat.icon className={cn(
                  "h-5 w-5",
                  stat.colorClass,
                  stat.hasAction && "animate-pulse"
                )} />
              </div>
            </div>
            {stat.hasAction && (
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                {language === 'es' ? 'Requiere atención' : 'Needs attention'}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
