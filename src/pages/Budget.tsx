import { Suspense, lazy, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserSettings, UserPreferences, BudgetMode } from "@/hooks/data/useUserSettings";
import { BudgetEntityProvider } from "@/contexts/BudgetEntityContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, TrendingUp, Settings2 } from "lucide-react";
import { BudgetSetupWizard } from "@/components/budget/BudgetSetupWizard";
import { BudgetEntitySelector } from "@/components/budget/BudgetEntitySelector";
import { FamilyBudgetView } from "@/components/budget/FamilyBudgetView";
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

  // Family-only mode: null entity = family data only
  if (budgetMode === "family_only") {
    return (
      <BudgetEntityProvider entityId={null}>
        <div className="page-container py-4">
          <FamilyBudgetView budgetMode={budgetMode} onChangeMode={() => setShowWizard(true)} />
        </div>
      </BudgetEntityProvider>
    );
  }

  // Unified mode: undefined entity = show all data
  if (budgetMode === "unified") {
    return (
      <BudgetEntityProvider entityId={undefined}>
        <div className="page-container py-4">
          <FamilyBudgetView budgetMode={budgetMode} onChangeMode={() => setShowWizard(true)} />
        </div>
      </BudgetEntityProvider>
    );
  }

  // Full separated view for companies — selectedEntityId null means "Family"
  return (
    <BudgetEntityProvider entityId={selectedEntityId}>
      <div className="page-container space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.budget')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('budget.pageDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              🏢 {modeLabels[budgetMode]?.[l ? "es" : "en"]}
            </span>
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
        </div>

        {/* Contextual guide for separated mode */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {l
              ? "💡 Modo Separado: Cada entidad (familia, empresa) tiene su propio presupuesto independiente. Selecciona una entidad abajo para ver y gestionar su presupuesto, categorías y proyecciones de forma aislada."
              : "💡 Separated Mode: Each entity (family, company) has its own independent budget. Select an entity below to view and manage its budget, categories, and projections independently."}
          </p>
        </div>

        <BudgetEntitySelector
          selectedEntityId={selectedEntityId}
          onSelect={setSelectedEntityId}
        />

        <Suspense fallback={<BudgetSkeleton />}>
          <div className="space-y-6">
            <MonthlyPlanCard />
            <div className="grid gap-6 lg:grid-cols-2">
              <GlobalBudgetCard />
              <CategoryBudgetsCard />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <BudgetAlertsCard />
              <BudgetHistoryChart />
            </div>
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
                <BudgetProjectionChart />
              </TabsContent>
              <TabsContent value="medium" className="mt-4 space-y-2">
                <CashFlowProjection />
              </TabsContent>
              <TabsContent value="long" className="mt-4 space-y-2">
                <div className="grid gap-6 lg:grid-cols-2">
                  <BudgetProjectionChart />
                  <CashFlowProjection />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Suspense>
      </div>
    </BudgetEntityProvider>
  );
}
