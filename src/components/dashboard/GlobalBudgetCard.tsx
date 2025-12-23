import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, Edit2, Check, X, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { useUserSettings, useUpdateUserPreferences, UserPreferences } from "@/hooks/data/useUserSettings";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useBudgetSuggestions } from "@/hooks/data/useBudgetSuggestions";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
export function GlobalBudgetCard() {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetValue, setBudgetValue] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");

  const { data: settings, isLoading } = useUserSettings();
  const updatePreferences = useUpdateUserPreferences();
  const { globalSuggestion, globalAverage, isLoading: loadingSuggestion } = useBudgetSuggestions();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
  });

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;
  const alertThreshold = preferences.global_budget_alert_threshold || 80;

  const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const percentage = globalBudget > 0 ? (totalSpent / globalBudget) * 100 : 0;
  const remaining = globalBudget - totalSpent;

  const handleAutoSuggest = () => {
    if (globalSuggestion > 0) {
      setBudgetValue(globalSuggestion.toString());
      toast.success(`Sugerido: $${globalSuggestion.toFixed(0)} (promedio $${globalAverage.toFixed(0)} + 10%)`);
    } else {
      toast.info("No hay suficiente historial para sugerir un presupuesto");
    }
  };

  const startEdit = () => {
    setBudgetValue(globalBudget.toString());
    setThresholdValue(alertThreshold.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    updatePreferences.mutate(
      {
        global_monthly_budget: parseFloat(budgetValue) || 0,
        global_budget_alert_threshold: parseFloat(thresholdValue) || 80,
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const getStatus = () => {
    if (percentage >= 100) return { color: "destructive", icon: AlertTriangle, label: "Excedido" };
    if (percentage >= 90) return { color: "destructive", icon: AlertTriangle, label: "Crítico" };
    if (percentage >= alertThreshold) return { color: "secondary", icon: AlertTriangle, label: "Alerta" };
    return { color: "outline", icon: CheckCircle, label: "OK" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={percentage >= 100 ? "border-destructive/50" : percentage >= alertThreshold ? "border-amber-500/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-primary" />
          Presupuesto Global - {format(now, "MMMM yyyy", { locale: es })}
        </CardTitle>
        {!isEditing && (
          <Button size="sm" variant="ghost" onClick={startEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Presupuesto mensual</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={handleAutoSuggest}
                        disabled={loadingSuggestion}
                      >
                        <Sparkles className="h-3 w-3 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sugerir basado en promedio de 3 meses + 10%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  placeholder="$0.00"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Alerta al (%)</label>
                <Input
                  type="number"
                  placeholder="80"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  className="h-9"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" onClick={handleSave} disabled={updatePreferences.isPending}>
                <Check className="h-4 w-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : globalBudget > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">de ${globalBudget.toFixed(2)} presupuestado</p>
              </div>
              <Badge variant={status.color as "destructive" | "secondary" | "outline"} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress value={Math.min(percentage, 100)} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percentage.toFixed(0)}% utilizado</span>
                <span>
                  {remaining >= 0
                    ? `$${remaining.toFixed(2)} disponible`
                    : `$${Math.abs(remaining).toFixed(2)} excedido`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No tienes un presupuesto global configurado.
            </p>
            <Button size="sm" variant="outline" onClick={startEdit}>
              Configurar presupuesto
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
