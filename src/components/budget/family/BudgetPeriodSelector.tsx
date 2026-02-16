import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useUserSettings, UserPreferences } from "@/hooks/data/useUserSettings";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, RefreshCw } from "lucide-react";

export type BudgetPeriod = 'monthly' | 'biweekly' | 'weekly';

interface BudgetPeriodSelectorProps {
  period: BudgetPeriod;
  onPeriodChange: (period: BudgetPeriod) => void;
  rolloverEnabled: boolean;
  onRolloverChange: (enabled: boolean) => void;
}

const PERIOD_LABELS: Record<BudgetPeriod, { es: string; en: string; days: number }> = {
  monthly: { es: "Mensual", en: "Monthly", days: 30 },
  biweekly: { es: "Quincenal", en: "Biweekly", days: 15 },
  weekly: { es: "Semanal", en: "Weekly", days: 7 },
};

export function BudgetPeriodSelector({ period, onPeriodChange, rolloverEnabled, onRolloverChange }: BudgetPeriodSelectorProps) {
  const { language } = useLanguage();
  const l = language === "es";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {l ? "Período de presupuesto" : "Budget period"}
        </Label>
        <Select value={period} onValueChange={v => onPeriodChange(v as BudgetPeriod)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {l ? val.es : val.en} ({val.days} {l ? "días" : "days"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{l ? "Rollover" : "Rollover"}</p>
            <p className="text-[10px] text-muted-foreground">
              {l ? "Acumular lo no gastado al siguiente período" : "Carry over unspent budget to next period"}
            </p>
          </div>
        </div>
        <Switch checked={rolloverEnabled} onCheckedChange={onRolloverChange} />
      </div>

      {rolloverEnabled && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 px-1">
          ✅ {l
            ? "El presupuesto no utilizado se transferirá automáticamente al siguiente período."
            : "Unused budget will automatically carry over to the next period."}
        </p>
      )}
    </div>
  );
}
