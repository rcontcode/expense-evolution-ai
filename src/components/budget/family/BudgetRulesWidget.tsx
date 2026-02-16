import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useBudgetAlertRules, useCreateAlertRule, useDeleteAlertRule, useUpdateAlertRule, BudgetAlertRule } from "@/hooks/data/useBudgetAlertRules";
import { EXPENSE_CATEGORY_TRANSLATIONS, ExpenseCategory } from "@/lib/constants/expense-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CONDITION_LABELS = {
  exceeds: { es: "Gasto excede", en: "Spending exceeds" },
  approaches: { es: "Gasto se acerca a", en: "Spending approaches" },
  daily_exceeds: { es: "Gasto diario excede", en: "Daily spending exceeds" },
};

export function BudgetRulesWidget() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: rules, isLoading } = useBudgetAlertRules();
  const createRule = useCreateAlertRule();
  const deleteRule = useDeleteAlertRule();
  const updateRule = useUpdateAlertRule();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    condition_type: "exceeds" as 'exceeds' | 'approaches' | 'daily_exceeds',
    threshold_amount: 0,
  });

  const categories = Object.entries(EXPENSE_CATEGORY_TRANSLATIONS).map(([key, val]) => ({
    value: key,
    label: val[l ? 'es' : 'en'],
    icon: val.icon,
  }));

  const handleCreate = async () => {
    if (!form.name || form.threshold_amount <= 0) return;
    await createRule.mutateAsync({
      name: form.name,
      category: form.category || null,
      condition_type: form.condition_type,
      threshold_amount: form.threshold_amount,
    });
    setShowCreate(false);
    setForm({ name: "", category: "", condition_type: "exceeds", threshold_amount: 0 });
  };

  const toggleRule = (rule: BudgetAlertRule) => {
    updateRule.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  if (isLoading) return <div className="h-24 animate-pulse bg-muted/30 rounded-lg" />;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {(rules || []).map((rule) => {
          const catInfo = rule.category ? EXPENSE_CATEGORY_TRANSLATIONS[rule.category as ExpenseCategory] : null;
          const condLabel = CONDITION_LABELS[rule.condition_type as keyof typeof CONDITION_LABELS] || CONDITION_LABELS.exceeds;

          return (
            <motion.div
              key={rule.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "p-3 rounded-lg flex items-center justify-between gap-2",
                rule.is_active ? "bg-muted/30" : "bg-muted/10 opacity-60"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Zap className={cn("h-4 w-4 shrink-0", rule.is_active ? "text-amber-500" : "text-muted-foreground")} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rule.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {catInfo ? `${catInfo.icon} ` : "📊 "}{l ? condLabel.es : condLabel.en} {fc(Number(rule.threshold_amount))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch checked={rule.is_active} onCheckedChange={() => toggleRule(rule)} className="scale-75" />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRule.mutate(rule.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {(!rules || rules.length === 0) && (
        <div className="text-center py-6">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {l ? "Crea reglas para recibir alertas automáticas" : "Create rules to receive automatic alerts"}
          </p>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowCreate(true)}>
        <Plus className="h-3.5 w-3.5" />
        {l ? "Nueva Regla" : "New Rule"}
      </Button>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l ? "⚡ Nueva Regla Automática" : "⚡ New Automatic Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{l ? "Nombre de la regla" : "Rule name"}</Label>
              <Input
                placeholder={l ? "Ej: Alerta comida excesiva" : "E.g. Food overspend alert"}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>{l ? "Categoría (o todas)" : "Category (or all)"}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder={l ? "Todas las categorías" : "All categories"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{l ? "📊 Todas" : "📊 All"}</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{l ? "Condición" : "Condition"}</Label>
              <Select value={form.condition_type} onValueChange={v => setForm(f => ({ ...f, condition_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exceeds">{l ? "Gasto excede monto" : "Spending exceeds amount"}</SelectItem>
                  <SelectItem value="approaches">{l ? "Gasto se acerca al 80%" : "Spending approaches 80%"}</SelectItem>
                  <SelectItem value="daily_exceeds">{l ? "Gasto diario excede" : "Daily spending exceeds"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{l ? "Monto umbral" : "Threshold amount"}</Label>
              <Input
                type="number"
                min={0}
                value={form.threshold_amount || ""}
                onChange={e => setForm(f => ({ ...f, threshold_amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.name || form.threshold_amount <= 0}>
              {l ? "Crear Regla" : "Create Rule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
