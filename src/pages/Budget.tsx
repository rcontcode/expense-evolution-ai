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
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { SimpleModePageBanner } from "@/components/dashboard/SimpleModePageBanner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const preferences = (settings?.preferences as UserPreferences) || {};
  const budgetMode = preferences.budget_mode as BudgetMode | undefined;

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  if (settingsLoading) {
    return (
      <Layout>
        <div className="page-container">
          <PageHeader
            title={l ? '💰 Presupuesto' : '💰 Budget'}
            description={!isMobile ? (l ? 'Control integral de tus finanzas' : 'Comprehensive financial control') : undefined}
          />
            <SimpleModePageBanner
              pageId="budget"
              description={{
                es: 'Define cuánto quieres gastar por categoría. Te avisaremos cuando te acerques al límite.',
                en: 'Define how much you want to spend per category. We\'ll warn you as you approach the limit.',
              }}
            />
          <BudgetSkeleton />
        </div>
      </Layout>
    );
  }

  if (!budgetMode || showWizard) {
    return (
      <Layout>
        <div className="page-container py-8">
          <PageHeader
            title={l ? '💰 Presupuesto' : '💰 Budget'}
            description={!isMobile ? (l ? 'Configura tu modo de presupuesto' : 'Set up your budget mode') : undefined}
          />
            <SimpleModePageBanner
              pageId="budget"
              description={{
                es: 'Define cuánto quieres gastar por categoría. Te avisaremos cuando te acerques al límite.',
                en: 'Define how much you want to spend per category. We\'ll warn you as you approach the limit.',
              }}
            />
          <BudgetSetupWizard onComplete={() => setShowWizard(false)} />
        </div>
      </Layout>
    );
  }

  // Family-only mode: null entity = family data only
  if (budgetMode === "family_only") {
    return (
      <Layout>
        <BudgetEntityProvider entityId={null}>
          <div className="page-container py-4">
            <PageHeader
              title={l ? '💰 Presupuesto' : '💰 Budget'}
              description={!isMobile ? (l ? 'Control integral de tus finanzas familiares' : 'Comprehensive family financial control') : undefined}
            />
            <SimpleModePageBanner
              pageId="budget"
              description={{
                es: 'Define cuánto quieres gastar por categoría. Te avisaremos cuando te acerques al límite.',
                en: 'Define how much you want to spend per category. We\'ll warn you as you approach the limit.',
              }}
            />
            <FamilyBudgetView budgetMode={budgetMode} onChangeMode={() => setShowWizard(true)} />
          </div>
        </BudgetEntityProvider>
      </Layout>
    );
  }

  // Unified mode: undefined entity = show all data
  if (budgetMode === "unified") {
    return (
      <Layout>
        <BudgetEntityProvider entityId={undefined}>
          <div className="page-container py-4">
            <PageHeader
              title={l ? '💰 Presupuesto' : '💰 Budget'}
              description={!isMobile ? (l ? 'Vista unificada: hogar + negocio' : 'Unified view: home + business') : undefined}
            />
            <SimpleModePageBanner
              pageId="budget"
              description={{
                es: 'Define cuánto quieres gastar por categoría. Te avisaremos cuando te acerques al límite.',
                en: 'Define how much you want to spend per category. We\'ll warn you as you approach the limit.',
              }}
            />
            <FamilyBudgetView budgetMode={budgetMode} onChangeMode={() => setShowWizard(true)} />
          </div>
        </BudgetEntityProvider>
      </Layout>
    );
  }

  // Full separated view for companies — selectedEntityId null means "Family"
  return (
    <Layout>
      <BudgetEntityProvider entityId={selectedEntityId}>
        <div className="page-container space-y-4">
          <PageHeader
            title={l ? '💰 Presupuesto' : '💰 Budget'}
            description={!isMobile ? (l ? 'Separado por entidad fiscal' : 'Separated by fiscal entity') : undefined}
          />
            <SimpleModePageBanner
              pageId="budget"
              description={{
                es: 'Define cuánto quieres gastar por categoría. Te avisaremos cuando te acerques al límite.',
                en: 'Define how much you want to spend per category. We\'ll warn you as you approach the limit.',
              }}
            />
          <BudgetEntitySelector
            selectedEntityId={selectedEntityId}
            onSelect={setSelectedEntityId}
          />
          <FamilyBudgetView budgetMode={budgetMode} onChangeMode={() => setShowWizard(true)} />
        </div>
      </BudgetEntityProvider>
    </Layout>
  );
}
