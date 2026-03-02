import { lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { Inbox, PlusCircle, Zap } from 'lucide-react';

const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));

export const DiaDiaAreaContent = memo(({ forcedTab: _forcedTab }: { forcedTab?: string | null }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats({});
  const es = language === 'es';

  return (
    <div className="space-y-4">
      <Suspense fallback={<Skeleton className="h-[200px] rounded-xl" />}>
        <DashboardCharts
          categoryBreakdown={stats?.categoryBreakdown || []}
          monthlyTrends={stats?.monthlyTrends || []}
          isLoading={isLoading}
        />
      </Suspense>
      <div className="border-t border-border/50 pt-3">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/chaos')}>
            <Inbox className="h-3.5 w-3.5" />
            Chaos Inbox
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/expenses')}>
            <PlusCircle className="h-3.5 w-3.5" />
            {es ? 'Agregar Gasto' : 'Add Expense'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/mobile-capture')}>
            <Zap className="h-3.5 w-3.5" />
            {es ? 'Captura Rápida' : 'Quick Capture'}
          </Button>
        </div>
      </div>
    </div>
  );
});

DiaDiaAreaContent.displayName = 'DiaDiaAreaContent';
