import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUpdateUserPreferences } from "@/hooks/data/useUserSettings";
import { useFiscalEntities } from "@/hooks/data/useFiscalEntities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Home, ArrowRight, Sparkles, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const FEATURES: Array<{ label: { es: string; en: string }; family: boolean; unified: boolean; separated: boolean }> = [
  { label: { es: "Control diario de gastos", en: "Daily expense tracking" }, family: true, unified: true, separated: true },
  { label: { es: "Pagos fijos (arriendo, servicios)", en: "Fixed payments (rent, utilities)" }, family: true, unified: true, separated: true },
  { label: { es: "Alertas inteligentes", en: "Smart alerts" }, family: true, unified: true, separated: true },
  { label: { es: "Metas de ahorro", en: "Savings goals" }, family: true, unified: true, separated: true },
  { label: { es: "Sección gastos de negocio", en: "Business expenses section" }, family: false, unified: true, separated: true },
  { label: { es: "Ingresos por entidad", en: "Income per entity" }, family: false, unified: false, separated: true },
  { label: { es: "Presupuesto independiente por empresa", en: "Independent budget per company" }, family: false, unified: false, separated: true },
  { label: { es: "Selector de entidad fiscal", en: "Fiscal entity selector" }, family: false, unified: false, separated: true },
  { label: { es: "Proyecciones por entidad", en: "Projections per entity" }, family: false, unified: true, separated: true },
  { label: { es: "Vista consolidada hogar + negocio", en: "Consolidated home + business view" }, family: false, unified: true, separated: false },
];

export type BudgetMode = "unified" | "separated" | "family_only";

interface BudgetSetupWizardProps {
  onComplete: (mode: BudgetMode) => void;
}

export function BudgetSetupWizard({ onComplete }: BudgetSetupWizardProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const [selected, setSelected] = useState<BudgetMode | null>(null);
  const updatePrefs = useUpdateUserPreferences();
  const { data: entities } = useFiscalEntities();

  const hasEntities = (entities?.length ?? 0) > 0;

  const modes = [
    {
      id: "family_only" as BudgetMode,
      icon: Home,
      title: l ? "Solo Familiar" : "Family Only",
      subtitle: l ? "Presupuesto personal y del hogar" : "Personal & household budget",
      description: l
        ? "Ideal para empleados, asalariados o cualquier persona que quiera controlar sus gastos familiares. Interfaz simple y directa. Incluye: control diario de gastos, pagos fijos (arriendo, servicios), alertas inteligentes y metas de ahorro."
        : "Ideal for employees or anyone wanting to manage household expenses. Simple and direct interface. Includes: daily expense tracking, fixed payments (rent, utilities), smart alerts, and savings goals.",
      examples: l
        ? "Ej: Empleado, jubilado, estudiante, ama/o de casa"
        : "E.g.: Employee, retiree, student, homemaker",
      recommended: !hasEntities,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-300 dark:border-emerald-700",
    },
    {
      id: "unified" as BudgetMode,
      icon: Users,
      title: l ? "Unificado" : "Unified",
      subtitle: l ? "Una sola bolsa de dinero" : "One pool of money",
      description: l
        ? "Personal + negocio juntos en un solo presupuesto. Perfecto para freelancers, sole proprietorship o trabajadores independientes. Verás una sección extra de gastos del negocio dentro de la misma vista."
        : "Personal + business in one budget. Perfect for freelancers, sole proprietors, or independent workers. You'll see an extra business expenses section within the same view.",
      examples: l
        ? "Ej: Freelancer, consultor independiente, conductor de app"
        : "E.g.: Freelancer, independent consultant, app driver",
      recommended: false,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-300 dark:border-amber-700",
    },
    {
      id: "separated" as BudgetMode,
      icon: Building2,
      title: l ? "Separado" : "Separated",
      subtitle: l ? "Un presupuesto por entidad" : "One budget per entity",
      description: l
        ? "Familia aparte de cada empresa (Inc, SA, Ltd, etc). Ideal para quienes tienen empresas formalmente constituidas. Cada entidad tiene su propio presupuesto, categorías y proyecciones independientes."
        : "Family separate from each company (Inc, SA, Ltd, etc). Ideal for formally incorporated businesses. Each entity has its own budget, categories, and independent projections.",
      examples: l
        ? "Ej: Dueño de SPA/SA/Inc, múltiples negocios registrados"
        : "E.g.: Owner of LLC/Inc/Ltd, multiple registered businesses",
      recommended: hasEntities,
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-300 dark:border-blue-700",
    },
  ];

  const handleConfirm = () => {
    if (!selected) return;
    updatePrefs.mutate({ budget_mode: selected }, {
      onSuccess: () => onComplete(selected),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          {l ? "Configuración inicial" : "Initial setup"}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          {l ? "¿Cómo quieres manejar tu presupuesto?" : "How do you want to manage your budget?"}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {l
            ? "Elige el modo que mejor se adapte a tu situación. Puedes cambiarlo después en configuración."
            : "Choose the mode that best fits your situation. You can change it later in settings."}
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selected === mode.id;

          return (
            <motion.div
              key={mode.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2",
                  isSelected
                    ? `${mode.borderColor} ${mode.bgColor} shadow-lg`
                    : "border-transparent hover:border-muted-foreground/20"
                )}
                onClick={() => setSelected(mode.id)}
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                    mode.color
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{mode.title}</h3>
                      {mode.recommended && (
                        <Badge variant="secondary" className="text-xs">
                          {l ? "Recomendado" : "Recommended"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {mode.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {mode.description}
                    </p>
                    {/* Feature checklist */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1"
                      >
                        {FEATURES.map((f, i) => {
                          const has = mode.id === "family_only" ? f.family : mode.id === "unified" ? f.unified : f.separated;
                          return (
                            <span key={i} className={cn("text-xs flex items-center gap-1.5", has ? "text-foreground" : "text-muted-foreground/50 line-through")}>
                              {has
                                ? <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                : <X className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />}
                              {f.label[language]}
                            </span>
                          );
                        })}
                      </motion.div>
                    )}
                    {mode.examples && (
                      <p className="text-xs text-primary/70 mt-1.5 italic">
                        {mode.examples}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-primary-foreground"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Confirm Button */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          disabled={!selected || updatePrefs.isPending}
          onClick={handleConfirm}
          className="gap-2 px-8"
        >
          {updatePrefs.isPending
            ? (l ? "Guardando..." : "Saving...")
            : (l ? "Continuar" : "Continue")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
