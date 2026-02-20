 import { useState, useMemo } from 'react';
 import { useHighlightOnArrival } from '@/hooks/utils/useHighlightOnArrival';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Target,
  PiggyBank,
  TrendingUp,
  Sparkles,
  Settings2,
  Receipt
} from 'lucide-react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useProfile } from '@/hooks/data/useProfile';
 import { useCategoryBudgets } from '@/hooks/data/useCategoryBudgets';
 import { useUserSettings, UserPreferences } from '@/hooks/data/useUserSettings';
 import { useSavingsGoals } from '@/hooks/data/useSavingsGoals';
 import { BudgetCommandCenter } from './BudgetCommandCenter';
 import { BudgetOnboarding } from './BudgetOnboarding';
 import { BudgetQuickActions } from './BudgetQuickActions';
 import { SavingsGoalsDashboard } from './SavingsGoalsDashboard';
 import { GlobalBudgetCard } from '@/components/dashboard/GlobalBudgetCard';
 import { CategoryBudgetsCard } from '@/components/dashboard/CategoryBudgetsCard';
 import { BudgetAlertsCard } from '@/components/dashboard/BudgetAlertsCard';
 import { BudgetHistoryChart } from '@/components/dashboard/BudgetHistoryChart';
import { BillsDashboard } from '@/components/bills/BillsDashboard';
import { cn } from '@/lib/utils';
 
 export function BudgetSection() {
   const { language } = useLanguage();
   const { data: profile } = useProfile();
   const { data: budgets, isLoading: budgetsLoading } = useCategoryBudgets();
   const { data: settings } = useUserSettings();
   const { data: savingsGoals } = useSavingsGoals();
 
    const { getHighlightProps, shouldHighlight } = useHighlightOnArrival();
    const [activeTab, setActiveTab] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'overview';
    });
   const [showOnboarding, setShowOnboarding] = useState(false);
 
   const preferences = (settings?.preferences as UserPreferences) || {};
   const globalBudget = preferences.global_monthly_budget || 0;
   const l = language === 'es';
 
   // Determine if user needs onboarding
   const needsOnboarding = useMemo(() => {
     if (budgetsLoading) return false;
     return globalBudget === 0 && (!budgets || budgets.length === 0);
   }, [globalBudget, budgets, budgetsLoading]);
 
   // Show onboarding automatically for new users
   if (needsOnboarding && !showOnboarding) {
     return (
       <div className="space-y-6">
         <div className="text-center">
           <h2 className="text-2xl font-bold mb-2">
             {l ? '🎯 Control de Presupuesto' : '🎯 Budget Control'}
           </h2>
           <p className="text-muted-foreground">
             {l 
               ? 'Configura tu sistema de presupuesto para tomar el control de tus finanzas'
               : 'Set up your budget system to take control of your finances'}
           </p>
         </div>
         <BudgetOnboarding onComplete={() => setShowOnboarding(false)} />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Header with tabs */}
       <div className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold flex items-center gap-2">
               🎯 {l ? 'Control de Presupuesto' : 'Budget Control'}
             </h2>
             <p className="text-muted-foreground">
               {l 
                 ? 'Tu centro de comando para presupuestos y metas de ahorro'
                 : 'Your command center for budgets and savings goals'}
             </p>
           </div>
           <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
             <Settings2 className="h-4 w-4 mr-2" />
             {l ? 'Configurar' : 'Setup'}
           </Button>
         </div>
 
         {/* Quick Actions */}
         <BudgetQuickActions />
       </div>
 
       {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 gap-1">
           <TabsTrigger 
             value="overview" 
             className={cn(
               "flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
             )}
           >
             <LayoutDashboard className="h-4 w-4" />
             <span className="hidden sm:inline">{l ? 'Panorama' : 'Overview'}</span>
           </TabsTrigger>
           <TabsTrigger 
             value="budgets" 
             className={cn(
               "flex items-center gap-2 py-3 data-[state=active]:bg-chart-2 data-[state=active]:text-white"
             )}
           >
             <Target className="h-4 w-4" />
             <span className="hidden sm:inline">{l ? 'Presupuestos' : 'Budgets'}</span>
             {budgets && budgets.length > 0 && (
               <Badge variant="secondary" className="ml-1 text-xs">{budgets.length}</Badge>
             )}
           </TabsTrigger>
           <TabsTrigger 
             value="savings" 
             className={cn(
               "flex items-center gap-2 py-3 data-[state=active]:bg-chart-4 data-[state=active]:text-white"
             )}
           >
             <PiggyBank className="h-4 w-4" />
             <span className="hidden sm:inline">{l ? 'Metas' : 'Goals'}</span>
             {savingsGoals && savingsGoals.length > 0 && (
               <Badge variant="secondary" className="ml-1 text-xs">{savingsGoals.length}</Badge>
             )}
           </TabsTrigger>
            <TabsTrigger 
              value="bills" 
               className={cn(
                 "flex items-center gap-2 py-3 data-[state=active]:bg-amber-500 data-[state=active]:text-white",
                 shouldHighlight('bills') && 'highlight-tab-active'
               )}
            >
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">{l ? 'Pagos' : 'Bills'}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className={cn(
                "flex items-center gap-2 py-3 data-[state=active]:bg-chart-3 data-[state=active]:text-white"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{l ? 'Análisis' : 'Analytics'}</span>
            </TabsTrigger>
         </TabsList>
 
         {/* Overview Tab */}
         <TabsContent value="overview" className="space-y-6">
           <BudgetCommandCenter />
         </TabsContent>
 
         {/* Budgets Tab */}
         <TabsContent value="budgets" className="space-y-6">
           <div className="grid gap-6 lg:grid-cols-2">
             <GlobalBudgetCard />
             <BudgetAlertsCard />
           </div>
           <CategoryBudgetsCard />
         </TabsContent>
 
         {/* Savings Goals Tab */}
         <TabsContent value="savings" className="space-y-6">
           <SavingsGoalsDashboard />
         </TabsContent>
 
          {/* Bills Tab */}
          <TabsContent value="bills" className={cn("space-y-6", getHighlightProps('bills').className)} ref={getHighlightProps('bills').ref as any}>
            <BillsDashboard />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <BudgetHistoryChart />
          </TabsContent>
       </Tabs>
 
       {/* Onboarding Dialog */}
       {showOnboarding && (
         <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="w-full max-w-lg">
             <BudgetOnboarding onComplete={() => setShowOnboarding(false)} />
           </div>
         </div>
       )}
     </div>
   );
 }