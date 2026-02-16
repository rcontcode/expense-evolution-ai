import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, Edit2, Check, X, AlertTriangle, CheckCircle, Sparkles, TrendingUp, PiggyBank, Calendar } from "lucide-react";
import { useUserSettings, useUpdateUserPreferences, UserPreferences } from "@/hooks/data/useUserSettings";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useBudgetSuggestions } from "@/hooks/data/useBudgetSuggestions";
import { useBudgetEntity } from "@/contexts/BudgetEntityContext";
import { startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlobalBudgetCard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc, formatCompact } = useFormatCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [budgetValue, setBudgetValue] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");

  const { data: settings, isLoading } = useUserSettings();
  const updatePreferences = useUpdateUserPreferences();
  const { globalSuggestion, globalAverage, isLoading: loadingSuggestion } = useBudgetSuggestions();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysPassed = differenceInDays(now, monthStart) + 1;
  const daysRemaining = daysInMonth - daysPassed;

  const budgetEntityId = useBudgetEntity();

  const { data: expenses } = useExpenses({
    dateRange: { start: monthStart, end: monthEnd },
    entityId: budgetEntityId ?? undefined,
    showAllEntities: budgetEntityId === undefined,
  });

  const preferences = (settings?.preferences as UserPreferences) || {};
  const globalBudget = preferences.global_monthly_budget || 0;
  const alertThreshold = preferences.global_budget_alert_threshold || 80;

  const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const percentage = globalBudget > 0 ? (totalSpent / globalBudget) * 100 : 0;
  const remaining = globalBudget - totalSpent;
  const dailyBudgetRemaining = remaining > 0 && daysRemaining > 0 ? remaining / daysRemaining : 0;

  const handleAutoSuggest = () => {
    if (globalSuggestion > 0) {
      setBudgetValue(globalSuggestion.toString());
      toast.success(l 
        ? `Sugerido: ${formatCompact(globalSuggestion)} (promedio ${formatCompact(globalAverage)} + 10%)`
        : `Suggested: ${formatCompact(globalSuggestion)} (avg ${formatCompact(globalAverage)} + 10%)`);
    } else {
      toast.info(l ? "No hay suficiente historial para sugerir" : "Not enough history to suggest");
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
      icon: AlertTriangle, 
      label: l ? "Excedido" : "Exceeded",
      gradient: "from-red-500 to-rose-600",
    };
    if (percentage >= 90) return { 
      icon: AlertTriangle, 
      label: l ? "Crítico" : "Critical",
      gradient: "from-orange-500 to-red-500",
    };
    if (percentage >= alertThreshold) return { 
      icon: TrendingUp, 
      label: l ? "Alerta" : "Alert",
      gradient: "from-amber-500 to-orange-500",
    };
    return { 
      icon: CheckCircle, 
      label: "OK",
      gradient: "from-emerald-500 to-teal-500",
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
            <p className="text-sm text-muted-foreground">{l ? 'Cargando...' : 'Loading...'}</p>
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
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {l ? 'Presupuesto Global' : 'Global Budget'}
            </span>
            <p className="text-xs text-muted-foreground font-normal">
              {format(now, "MMMM yyyy", { locale: l ? es : enUS })}
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
                    <label className="text-xs text-muted-foreground font-medium">
                      {l ? 'Presupuesto mensual' : 'Monthly budget'}
                    </label>
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
                        <p>{l ? 'Sugerir basado en promedio de 3 meses + 10%' : 'Suggest based on 3-month avg + 10%'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="h-9 border-emerald-200 dark:border-emerald-800 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    {l ? 'Alerta al (%)' : 'Alert at (%)'}
                  </label>
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
                  {l ? 'Guardar' : 'Save'}
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
                    {fc(totalSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {l ? 'de' : 'of'} <span className="font-medium text-foreground">{fc(globalBudget)}</span> {l ? 'presupuestado' : 'budgeted'}
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
                  <span className="font-medium">{percentage.toFixed(0)}% {l ? 'utilizado' : 'used'}</span>
                  <span className={cn(
                    "font-medium",
                    remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {remaining >= 0
                      ? `${fc(remaining)} ${l ? 'disponible' : 'available'}`
                      : `${fc(Math.abs(remaining))} ${l ? 'excedido' : 'exceeded'}`}
                  </span>
                </div>
              </div>

              {/* Daily budget remaining */}
              {remaining > 0 && daysRemaining > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs text-muted-foreground">
                    {fc(dailyBudgetRemaining)}/{l ? 'día' : 'day'} × {daysRemaining} {l ? 'días restantes' : 'days left'}
                  </p>
                </div>
              )}
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
                {l ? 'No tienes un presupuesto global configurado.' : "You don't have a global budget set up."}
              </p>
              <Button 
                size="sm" 
                onClick={startEdit}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {l ? 'Configurar presupuesto' : 'Set up budget'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
