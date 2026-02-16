import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserSettings, UserPreferences, BudgetMode } from "@/hooks/data/useUserSettings";
import { BudgetEntityProvider } from "@/contexts/BudgetEntityContext";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetSetupWizard } from "@/components/budget/BudgetSetupWizard";
import { BudgetEntitySelector } from "@/components/budget/BudgetEntitySelector";
import { FamilyBudgetView } from "@/components/budget/FamilyBudgetView";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

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
      <div className="page-container space-y-4">
        <BudgetEntitySelector
          selectedEntityId={selectedEntityId}
          onSelect={setSelectedEntityId}
        />
        <FamilyBudgetView budgetMode={budgetMode} onChangeMode={() => setShowWizard(true)} />
      </div>
    </BudgetEntityProvider>
  );
}
