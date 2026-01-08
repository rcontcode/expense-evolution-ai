import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, Edit2, Check, X, AlertTriangle, CheckCircle, Sparkles, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useUserSettings, useUpdateUserPreferences, UserPreferences } from "@/hooks/data/useUserSettings";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useBudgetSuggestions } from "@/hooks/data/useBudgetSuggestions";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    if (percentage >= 100) return { 
      color: "destructive", 
      icon: AlertTriangle, 
      label: "Excedido",
      gradient: "from-red-500 to-rose-600",
      bg: "bg-red-50 dark:bg-red-950/30",
      ring: "ring-red-500/30"
    };
    if (percentage >= 90) return { 
      color: "destructive", 
      icon: AlertTriangle, 
      label: "Crítico",
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      ring: "ring-orange-500/30"
    };
    if (percentage >= alertThreshold) return { 
      color: "secondary", 
      icon: TrendingUp, 
      label: "Alerta",
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      ring: "ring-amber-500/30"
    };
    return { 
      color: "outline", 
      icon: CheckCircle, 
      label: "OK",
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      ring: "ring-emerald-500/30"
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      percentage >= 100 ? "ring-2 ring-red-500/50" : percentage >= alertThreshold ? "ring-2 ring-amber-500/50" : ""
    )}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="flex items-center gap-3 text-base">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25"
          >
            <Wallet className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Presupuesto Global</span>
            <p className="text-xs text-muted-foreground font-normal">
              {format(now, "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </CardTitle>
        {!isEditing && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button size="sm" variant="ghost" onClick={startEdit} className="h-8 w-8 p-0 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
              <Edit2 className="h-4 w-4 text-emerald-600" />
            </Button>
          </motion.div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 relative">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-medium">Presupuesto mensual</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white hover:opacity-90"
                          onClick={handleAutoSuggest}
                          disabled={loadingSuggestion}
                        >
                          <Sparkles className="h-3 w-3" />
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
                    className="h-9 border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Alerta al (%)</label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    className="h-9 border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={handleSave} disabled={updatePreferences.isPending} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <Check className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : globalBudget > 0 ? (
            <motion.div
              key="display"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    ${totalSpent.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    de <span className="font-medium text-foreground">${globalBudget.toFixed(2)}</span> presupuestado
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge 
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5",
                      `bg-gradient-to-r ${status.gradient} text-white border-0`
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </Badge>
                </motion.div>
              </div>
              <div className="space-y-2">
                <div className="relative h-4 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      `bg-gradient-to-r ${status.gradient}`
                    )}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{percentage.toFixed(0)}% utilizado</span>
                  <span className={cn(
                    "font-medium",
                    remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {remaining >= 0
                      ? `$${remaining.toFixed(2)} disponible`
                      : `$${Math.abs(remaining).toFixed(2)} excedido`}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center"
              >
                <PiggyBank className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <p className="text-sm text-muted-foreground mb-4">
                No tienes un presupuesto global configurado.
              </p>
              <Button 
                size="sm" 
                onClick={startEdit}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Configurar presupuesto
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
