import { Suspense, lazy, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserSettings, UserPreferences, BudgetMode } from "@/hooks/data/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, TrendingUp, Settings2 } from "lucide-react";
import { BudgetSetupWizard } from "@/components/budget/BudgetSetupWizard";
import { BudgetEntitySelector } from "@/components/budget/BudgetEntitySelector";
import { Button } from "@/components/ui/button";

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

const modeLabels: Record<BudgetMode, { es: string; en: string }> = {
  family_only: { es: "Solo Familiar", en: "Family Only" },
  unified: { es: "Unificado", en: "Unified" },
  separated: { es: "Separado por Entidad", en: "Separated by Entity" },
};

export default function Budget() {
  const { t, language } = useLanguage();
  const l = language === 'es';
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const preferences = (settings?.preferences as UserPreferences) || {};
  const budgetMode = preferences.budget_mode as BudgetMode | undefined;

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Show wizard if no budget_mode set
  if (settingsLoading) {
    return (
      <div className="page-container">
        <BudgetSkeleton />
      </div>
    );
  }

  if (!budgetMode || showWizard) {
    return (
      <div className="page-container py-8">
        <BudgetSetupWizard onComplete={() => setShowWizard(false)} />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.budget')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('budget.pageDescription')}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
              {modeLabels[budgetMode]?.[l ? "es" : "en"]}
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground"
          onClick={() => setShowWizard(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {l ? "Cambiar modo" : "Change mode"}
        </Button>
      </div>

      {/* Entity selector for separated mode */}
      {budgetMode === "separated" && (
        <BudgetEntitySelector
          selectedEntityId={selectedEntityId}
          onSelect={setSelectedEntityId}
        />
      )}

      <Suspense fallback={<BudgetSkeleton />}>
        <div className="space-y-6">
          {/* Main command center */}
          <MonthlyPlanCard />

          {/* Budget management */}
          <div className="grid gap-6 lg:grid-cols-2">
            <GlobalBudgetCard />
            <CategoryBudgetsCard />
          </div>

          {/* Alerts & History */}
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetAlertsCard />
            <BudgetHistoryChart />
          </div>

          {/* Projections by timeframe */}
          <Tabs defaultValue="short" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="short" className="gap-1.5 text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5" />
                {l ? 'Corto Plazo' : 'Short Term'}
              </TabsTrigger>
              <TabsTrigger value="medium" className="gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                {l ? 'Mediano Plazo' : 'Medium Term'}
              </TabsTrigger>
              <TabsTrigger value="long" className="gap-1.5 text-xs sm:text-sm">
                <Target className="h-3.5 w-3.5" />
                {l ? 'Largo Plazo' : 'Long Term'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="short" className="mt-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📅</span>
                <div>
                  <h3 className="text-sm font-semibold">{l ? 'Proyección 1-3 meses' : '1-3 Month Projection'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {l ? 'Ahorro inmediato y control de gastos del mes actual' : 'Immediate savings and current month expense control'}
                  </p>
                </div>
              </div>
              <BudgetProjectionChart />
            </TabsContent>

            <TabsContent value="medium" className="mt-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <div>
                  <h3 className="text-sm font-semibold">{l ? 'Proyección 6-12 meses' : '6-12 Month Projection'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {l ? 'Tendencias de flujo de caja y capacidad de inversión' : 'Cash flow trends and investment capacity'}
                  </p>
                </div>
              </div>
              <CashFlowProjection />
            </TabsContent>

            <TabsContent value="long" className="mt-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <div>
                  <h3 className="text-sm font-semibold">{l ? 'Proyección 1-5 años' : '1-5 Year Projection'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {l ? 'Metas de ahorro, inversión y patrimonio a largo plazo' : 'Long-term savings, investment and net worth goals'}
                  </p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <BudgetProjectionChart />
                <CashFlowProjection />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Suspense>
    </div>
  );
}
