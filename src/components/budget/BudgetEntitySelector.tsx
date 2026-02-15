import { useLanguage } from "@/contexts/LanguageContext";
import { useFiscalEntities } from "@/hooks/data/useFiscalEntities";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2 } from "lucide-react";

interface BudgetEntitySelectorProps {
  selectedEntityId: string | null;
  onSelect: (entityId: string | null) => void;
}

export function BudgetEntitySelector({ selectedEntityId, onSelect }: BudgetEntitySelectorProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { data: entities } = useFiscalEntities();

  if (!entities || entities.length === 0) return null;

  return (
    <Tabs
      value={selectedEntityId ?? "family"}
      onValueChange={(v) => onSelect(v === "family" ? null : v)}
    >
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1.5">
        <TabsTrigger value="family" className="gap-1.5 text-xs sm:text-sm">
          <Home className="h-3.5 w-3.5" />
          {l ? "Familia" : "Family"}
        </TabsTrigger>
        {entities.map((entity) => (
          <TabsTrigger key={entity.id} value={entity.id} className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5" />
            {entity.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
