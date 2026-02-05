 import { lazy, Suspense, memo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useExpenses } from '@/hooks/data/useExpenses';
 import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
 
 const TaxOptimizerCard = lazy(() => import('@/components/dashboard/TaxOptimizerCard').then(m => ({ default: m.TaxOptimizerCard })));
 const RrspTfsaOptimizerCard = lazy(() => import('@/components/dashboard/RrspTfsaOptimizerCard').then(m => ({ default: m.RrspTfsaOptimizerCard })));
 const TaxSummaryCards = lazy(() => import('@/components/dashboard/TaxSummaryCards').then(m => ({ default: m.TaxSummaryCards })));
 
 const SectionSkeleton = () => (
   <div className="space-y-4">
     <Skeleton className="h-[200px]" />
     <Skeleton className="h-[200px]" />
   </div>
 );
 
 export const ImpuestosAreaContent = memo(() => {
   const { language } = useLanguage();
   const navigate = useNavigate();
   const { data: allExpenses } = useExpenses({});
   const { taxSummary } = useTaxCalculations(allExpenses || []);
 
   return (
     <div className="space-y-6">
       <Suspense fallback={<SectionSkeleton />}>
         <div className="grid gap-6 lg:grid-cols-2">
           <TaxOptimizerCard />
           <RrspTfsaOptimizerCard />
         </div>
         <TaxSummaryCards taxSummary={taxSummary} />
       </Suspense>
       <div className="flex gap-2 flex-wrap">
         <Button variant="outline" size="sm" onClick={() => navigate('/tax-calendar')}>
           {language === 'es' ? '→ Calendario Fiscal' : '→ Tax Calendar'}
         </Button>
         <Button variant="outline" size="sm" onClick={() => navigate('/banking')}>
           {language === 'es' ? '→ Análisis Bancario' : '→ Banking Analysis'}
         </Button>
         <Button variant="outline" size="sm" onClick={() => navigate('/reconciliation')}>
           {language === 'es' ? '→ Reconciliación' : '→ Reconciliation'}
         </Button>
       </div>
     </div>
   );
 });
 
 ImpuestosAreaContent.displayName = 'ImpuestosAreaContent';