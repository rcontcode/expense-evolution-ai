 import { lazy, Suspense, memo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useLanguage } from '@/contexts/LanguageContext';
 
 const FamilyMonthlyAnalysis = lazy(() => import('@/components/dashboard/FamilyMonthlyAnalysis').then(m => ({ default: m.FamilyMonthlyAnalysis })));
 const IncomeAnalyticsDashboard = lazy(() => import('@/components/analytics/IncomeAnalyticsDashboard').then(m => ({ default: m.IncomeAnalyticsDashboard })));
 const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));
 const CategoryBudgetsCard = lazy(() => import('@/components/dashboard/CategoryBudgetsCard').then(m => ({ default: m.CategoryBudgetsCard })));
 const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
 const DebtManagerCard = lazy(() => import('@/components/dashboard/DebtManagerCard').then(m => ({ default: m.DebtManagerCard })));
 const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));
 
 const SectionSkeleton = () => (
   <div className="space-y-4">
     <Skeleton className="h-[200px]" />
     <Skeleton className="h-[200px]" />
   </div>
 );
 
 export const FamiliaAreaContent = memo(() => {
   const { language } = useLanguage();
   const navigate = useNavigate();
   const now = new Date();
 
   return (
     <div className="space-y-6">
       <Suspense fallback={<SectionSkeleton />}>
         <FamilyMonthlyAnalysis year={now.getFullYear()} month={now.getMonth()} />
         <IncomeAnalyticsDashboard year={now.getFullYear()} month={now.getMonth()} />
         <div className="grid gap-6 lg:grid-cols-2">
           <GlobalBudgetCard />
           <CategoryBudgetsCard />
         </div>
         <BudgetAlertsCard />
         <DebtManagerCard />
         <SubscriptionTracker />
       </Suspense>
       <div className="flex gap-2 flex-wrap">
         <Button variant="outline" size="sm" onClick={() => navigate('/net-worth')}>
           {language === 'es' ? '→ Ver Patrimonio Neto' : '→ View Net Worth'}
         </Button>
       </div>
     </div>
   );
 });
 
 FamiliaAreaContent.displayName = 'FamiliaAreaContent';