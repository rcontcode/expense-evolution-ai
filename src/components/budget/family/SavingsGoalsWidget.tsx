import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useSavingsGoals, useCreateSavingsGoal, useDeleteSavingsGoal, useAddToSavingsGoal } from "@/hooks/data/useSavingsGoals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, PiggyBank, Target, Calendar } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const GOAL_ICONS = ["🎯", "🏠", "✈️", "🚗", "📚", "💻", "🎓", "💍", "🏖️", "🐷"];
const GOAL_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function SavingsGoalsWidget() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: goals, isLoading } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const addToGoal = useAddToSavingsGoal();

  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", target_amount: 0, deadline: "", icon: "🎯", color: "#10b981" });
  const [contributeAmount, setContributeAmount] = useState("");

  const activeGoals = (goals || []).filter(g => g.status === "active");
  const totalTarget = activeGoals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = activeGoals.reduce((s, g) => s + Number(g.current_amount), 0);

  const handleCreate = async () => {
    if (!form.name || form.target_amount <= 0) return;
    await createGoal.mutateAsync({
      name: form.name,
      target_amount: form.target_amount,
      deadline: form.deadline ? new Date(form.deadline) : null,
      color: form.color,
    });
    setShowCreate(false);
    setForm({ name: "", target_amount: 0, deadline: "", icon: "🎯", color: "#10b981" });
  };

  const handleContribute = async () => {
    const amount = parseFloat(contributeAmount);
    if (!showContribute || !amount || amount <= 0) return;
    await addToGoal.mutateAsync({ id: showContribute, amount });
    setShowContribute(null);
    setContributeAmount("");
  };

  if (isLoading) return <div className="h-32 animate-pulse bg-muted/30 rounded-lg" />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {l
          ? '🎯 Define metas de ahorro (vacaciones, emergencias, compras grandes) y registra aportes. La barra de progreso se actualiza automáticamente con cada contribución.'
          : '🎯 Set savings goals (vacation, emergency, big purchases) and log contributions. The progress bar updates automatically with each contribution.'}
      </p>
      {/* Summary */}
      {activeGoals.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">{l ? "Total ahorrado" : "Total saved"}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fc(totalSaved)}</span>
            <span className="text-[11px] text-muted-foreground ml-1">/ {fc(totalTarget)}</span>
          </div>
        </div>
      )}

      {/* Goals list */}
      <AnimatePresence mode="popLayout">
        {activeGoals.map((goal) => {
          const pct = goal.target_amount > 0 ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 : 0;
          const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
          const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;

          return (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-lg bg-muted/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{(goal as any).icon || "🎯"}</span>
                  <div>
                    <p className="text-sm font-medium">{goal.name}</p>
                    {daysLeft !== null && (
                      <p className={cn("text-[10px]", daysLeft < 30 ? "text-amber-600" : "text-muted-foreground")}>
                        <Calendar className="inline h-3 w-3 mr-0.5" />
                        {daysLeft > 0 ? `${daysLeft} ${l ? "días restantes" : "days left"}` : (l ? "Plazo vencido" : "Past deadline")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-emerald-600"
                    onClick={() => setShowContribute(goal.id)}
                  >
                    <Plus className="h-3 w-3" />
                    {l ? "Aportar" : "Add"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteGoal.mutate(goal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{fc(Number(goal.current_amount))} / {fc(Number(goal.target_amount))}</span>
                  <span className={cn("font-semibold", pct >= 100 ? "text-emerald-600" : "text-primary")}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(pct, 100)}
                  className="h-2"
                  style={{ ['--progress-color' as any]: goal.color || '#10b981' }}
                />
                {remaining > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {l ? `Faltan ${fc(remaining)}` : `${fc(remaining)} remaining`}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {activeGoals.length === 0 && (
        <div className="text-center py-6">
          <Target className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            {l ? "Define metas para motivar tu ahorro" : "Set goals to motivate your savings"}
          </p>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowCreate(true)}>
        <Plus className="h-3.5 w-3.5" />
        {l ? "Nueva Meta de Ahorro" : "New Savings Goal"}
      </Button>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l ? "🎯 Nueva Meta de Ahorro" : "🎯 New Savings Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{l ? "Nombre" : "Name"}</Label>
              <Input
                placeholder={l ? "Ej: Vacaciones, Fondo emergencia" : "E.g. Vacation, Emergency fund"}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>{l ? "Monto objetivo" : "Target amount"}</Label>
              <Input
                type="number"
                min={0}
                value={form.target_amount || ""}
                onChange={e => setForm(f => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>{l ? "Fecha límite (opcional)" : "Deadline (optional)"}</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div>
              <Label>{l ? "Color" : "Color"}</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {GOAL_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn("w-7 h-7 rounded-full border-2 transition-all",
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ background: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.name || form.target_amount <= 0}>
              {l ? "Crear Meta" : "Create Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={!!showContribute} onOpenChange={() => setShowContribute(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{l ? "💰 Agregar Aporte" : "💰 Add Contribution"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{l ? "Monto" : "Amount"}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)}
                autoFocus
              />
            </div>
            <Button className="w-full" onClick={handleContribute} disabled={!contributeAmount || parseFloat(contributeAmount) <= 0}>
              {l ? "Agregar" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
