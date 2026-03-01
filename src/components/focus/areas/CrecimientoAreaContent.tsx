 import { lazy, Suspense, memo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useLanguage } from '@/contexts/LanguageContext';
 
 const FIRECalculatorCard = lazy(() => import('@/components/dashboard/FIRECalculatorCard').then(m => ({ default: m.FIRECalculatorCard })));
 const PortfolioTrackerCard = lazy(() => import('@/components/dashboard/PortfolioTrackerCard').then(m => ({ default: m.PortfolioTrackerCard })));
 const PersonalizedInvestmentTips = lazy(() => import('@/components/investments/PersonalizedInvestmentTips').then(m => ({ default: m.PersonalizedInvestmentTips })));
 const CashflowQuadrantCard = lazy(() => import('@/components/mentorship/CashflowQuadrantCard').then(m => ({ default: m.CashflowQuadrantCard })));
 const FinancialFreedomCard = lazy(() => import('@/components/mentorship/FinancialFreedomCard').then(m => ({ default: m.FinancialFreedomCard })));
 const PayYourselfFirstCard = lazy(() => import('@/components/mentorship/PayYourselfFirstCard').then(m => ({ default: m.PayYourselfFirstCard })));
 const DebtClassificationCard = lazy(() => import('@/components/mentorship/DebtClassificationCard').then(m => ({ default: m.DebtClassificationCard })));
 const SMARTGoalsCard = lazy(() => import('@/components/mentorship/SMARTGoalsCard').then(m => ({ default: m.SMARTGoalsCard })));
 const FinancialJournalCard = lazy(() => import('@/components/mentorship/FinancialJournalCard').then(m => ({ default: m.FinancialJournalCard })));
 const FinancialHabitsCard = lazy(() => import('@/components/mentorship/FinancialHabitsCard').then(m => ({ default: m.FinancialHabitsCard })));
 const FinancialEducationCard = lazy(() => import('@/components/mentorship/FinancialEducationCard').then(m => ({ default: m.FinancialEducationCard })));
 
 const SectionSkeleton = () => (
   <div className="space-y-4">
     <Skeleton className="h-[200px]" />
     <Skeleton className="h-[200px]" />
   </div>
 );
 
 export const CrecimientoAreaContent = memo(() => {
   const { language } = useLanguage();
   const navigate = useNavigate();
 
   return (
     <div className="space-y-6">
       <Suspense fallback={<SectionSkeleton />}>
         <FIRECalculatorCard />
         <div className="grid gap-6 lg:grid-cols-3">
           <div className="lg:col-span-2">
             <PortfolioTrackerCard />
           </div>
           <div className="lg:col-span-1">
             <PersonalizedInvestmentTips />
           </div>
         </div>
         <div className="grid gap-6 md:grid-cols-2">
           <CashflowQuadrantCard />
           <FinancialFreedomCard />
         </div>
         <div className="grid gap-6 md:grid-cols-2">
           <PayYourselfFirstCard />
           <DebtClassificationCard />
         </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SMARTGoalsCard />
            <FinancialJournalCard />
            <FinancialHabitsCard />
          </div>
          <FinancialEducationCard />
       </Suspense>
       <div className="flex gap-2 flex-wrap">
         <Button variant="outline" size="sm" onClick={() => navigate('/mentorship')}>
           {language === 'es' ? '→ Página de Mentoría' : '→ Mentorship Page'}
         </Button>
       </div>
     </div>
   );
 });
 
 CrecimientoAreaContent.displayName = 'CrecimientoAreaContent';