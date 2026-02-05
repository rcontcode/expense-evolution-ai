 import { lazy, Suspense, memo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useDashboardStats } from '@/hooks/data/useDashboardStats';
 import { useMileageSummary } from '@/hooks/data/useMileage';
 
 const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
 const MileageTabContent = lazy(() => import('@/components/dashboard/MileageTabContent').then(m => ({ default: m.MileageTabContent })));
 
 const SectionSkeleton = () => (
   <div className="space-y-4">
     <Skeleton className="h-[200px]" />
     <Skeleton className="h-[200px]" />
   </div>
 );
 
 export const NegocioAreaContent = memo(() => {
   const { language } = useLanguage();
   const navigate = useNavigate();
   const { data: stats, isLoading } = useDashboardStats({});
   const { data: mileageSummary, isLoading: mileageLoading } = useMileageSummary();
 
   return (
     <div className="space-y-6">
       <Suspense fallback={<SectionSkeleton />}>
         <DashboardCharts
           categoryBreakdown={stats?.categoryBreakdown || []}
           clientBreakdown={stats?.clientBreakdown || []}
           monthlyTrends={stats?.monthlyTrends || []}
           isLoading={isLoading}
         />
       </Suspense>
       <Suspense fallback={<Skeleton className="h-[200px]" />}>
         <MileageTabContent mileageSummary={mileageSummary} isLoading={mileageLoading} />
       </Suspense>
       <div className="flex gap-2 flex-wrap">
         <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
           {language === 'es' ? '→ Ver Clientes' : '→ View Clients'}
         </Button>
         <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
           {language === 'es' ? '→ Ver Contratos' : '→ View Contracts'}
         </Button>
         <Button variant="outline" size="sm" onClick={() => navigate('/mileage')}>
           {language === 'es' ? '→ Registrar Kilometraje' : '→ Log Mileage'}
         </Button>
       </div>
     </div>
   );
 });
 
 NegocioAreaContent.displayName = 'NegocioAreaContent';