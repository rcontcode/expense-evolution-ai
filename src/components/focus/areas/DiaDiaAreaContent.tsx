 import { lazy, Suspense, memo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useDashboardStats } from '@/hooks/data/useDashboardStats';
 
 const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
 
 export const DiaDiaAreaContent = memo(() => {
   const { language } = useLanguage();
   const navigate = useNavigate();
   const { data: stats, isLoading } = useDashboardStats({});
 
   return (
     <div className="space-y-6">
        <Suspense fallback={<Skeleton className="h-[200px]" />}>
          <DashboardCharts
            categoryBreakdown={stats?.categoryBreakdown || []}
            monthlyTrends={stats?.monthlyTrends || []}
            isLoading={isLoading}
          />
        </Suspense>
       <div className="flex gap-2 flex-wrap">
         <Button variant="outline" size="sm" onClick={() => navigate('/chaos')}>
           {language === 'es' ? '→ Chaos Inbox' : '→ Chaos Inbox'}
         </Button>
         <Button variant="outline" size="sm" onClick={() => navigate('/expenses')}>
           {language === 'es' ? '→ Agregar Gasto' : '→ Add Expense'}
         </Button>
         <Button variant="outline" size="sm" onClick={() => navigate('/mobile-capture')}>
           {language === 'es' ? '→ Captura Rápida' : '→ Quick Capture'}
         </Button>
       </div>
     </div>
   );
 });
 
 DiaDiaAreaContent.displayName = 'DiaDiaAreaContent';