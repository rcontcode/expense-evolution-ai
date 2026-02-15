import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const MonthlyPlanCard = lazy(() => import("@/components/budget/MonthlyPlanCard").then(m => ({ default: m.MonthlyPlanCard })));
const GlobalBudgetCard = lazy(() => import("@/components/dashboard/GlobalBudgetCard").then(m => ({ default: m.GlobalBudgetCard })));
const BudgetHistoryChart = lazy(() => import("@/components/dashboard/BudgetHistoryChart").then(m => ({ default: m.BudgetHistoryChart })));
const BudgetAlertsCard = lazy(() => import("@/components/dashboard/BudgetAlertsCard").then(m => ({ default: m.BudgetAlertsCard })));
const CategoryBudgetsCard = lazy(() => import("@/components/dashboard/CategoryBudgetsCard").then(m => ({ default: m.CategoryBudgetsCard })));
const BudgetProjectionChart = lazy(() => import("@/components/analytics/BudgetProjectionChart").then(m => ({ default: m.BudgetProjectionChart })));
const CashFlowProjection = lazy(() => import("@/components/analytics/CashFlowProjection").then(m => ({ default: m.CashFlowProjection })));

function BudgetSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function Budget() {
  const { t } = useLanguage();

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('nav.budget')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('budget.pageDescription')}
        </p>
      </div>

      <Suspense fallback={<BudgetSkeleton />}>
        <div className="space-y-6">
          <MonthlyPlanCard />
          <div className="grid gap-6 lg:grid-cols-2">
            <GlobalBudgetCard />
            <BudgetHistoryChart />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetAlertsCard />
            <CategoryBudgetsCard />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetProjectionChart />
            <CashFlowProjection />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
