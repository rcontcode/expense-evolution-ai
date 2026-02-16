import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useIncome, useUpdateIncome, useDeleteIncome } from "@/hooks/data/useIncome";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const INCOME_TYPE_ICONS: Record<string, string> = {
  salary: "💼", freelance: "💻", business_income: "🏪",
  investment_dividends: "📈", rental: "🏠", government_benefit: "🏛️",
  gift_received: "🎁", other_income: "💰",
};

const INCOME_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  salary: { es: "Sueldo", en: "Salary" },
  freelance: { es: "Freelance", en: "Freelance" },
  business_income: { es: "Negocio", en: "Business" },
  investment_dividends: { es: "Inversiones", en: "Investments" },
  rental: { es: "Arriendo", en: "Rental" },
  government_benefit: { es: "Beneficio", en: "Benefit" },
  gift_received: { es: "Regalo", en: "Gift" },
  other_income: { es: "Otro", en: "Other" },
};

export function IncomeListWidget() {
  const { language } = useLanguage();
  const l = language === "es";
  const { formatCurrency: fc } = useFormatCurrency();
  const queryClient = useQueryClient();
  const now = new Date();

  const { data: incomes } = useIncome({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editSource, setEditSource] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const startEdit = (income: any) => {
    setEditingId(income.id);
    setEditAmount(String(income.amount));
    setEditSource(income.source || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editAmount) return;
    await updateIncome.mutateAsync({
      id: editingId,
      data: {
        amount: parseFloat(editAmount),
        source: editSource || undefined,
      } as any,
    });
    queryClient.invalidateQueries({ queryKey: ["monthly-plan"] });
    setEditingId(null);
  };

  const confirmDelete = async (id: string) => {
    await deleteIncome.mutateAsync(id);
    queryClient.invalidateQueries({ queryKey: ["monthly-plan"] });
    setDeleteConfirmId(null);
  };

  if (!incomes || incomes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        {l ? "No hay ingresos registrados este mes" : "No income recorded this month"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {l
          ? "📝 Toca el lápiz para editar monto o fuente. Los cambios se reflejan instantáneamente en todo el presupuesto."
          : "📝 Tap the pencil to edit amount or source. Changes reflect instantly across the entire budget."}
      </p>

      {incomes.map((inc) => {
        const icon = INCOME_TYPE_ICONS[inc.income_type] || "💰";
        const typeLabel = INCOME_TYPE_LABELS[inc.income_type]?.[language] || inc.income_type;
        const isEditing = editingId === inc.id;

        return (
          <div
            key={inc.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-colors",
              isEditing ? "bg-primary/5 border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
            )}
          >
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-8 w-28 text-sm font-semibold"
                    autoFocus
                  />
                  <Input
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    placeholder={l ? "Fuente..." : "Source..."}
                    className="h-8 flex-1 text-sm"
                  />
                </div>
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3" /> {l ? "Cancelar" : "Cancel"}
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEdit} disabled={updateIncome.isPending}>
                    <Check className="h-3 w-3" /> {l ? "Guardar" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inc.source || typeLabel}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {typeLabel} · {format(parseISO(inc.date), "dd MMM", { locale: l ? es : enUS })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {fc(Number(inc.amount))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startEdit(inc)}
                    title={l ? "Editar" : "Edit"}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive"
                    onClick={() => setDeleteConfirmId(inc.id)}
                    title={l ? "Eliminar" : "Delete"}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {l ? "🗑️ ¿Eliminar ingreso?" : "🗑️ Delete income?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            {l ? "Esta acción no se puede deshacer." : "This action cannot be undone."}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
              {l ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteConfirmId && confirmDelete(deleteConfirmId)}
              disabled={deleteIncome.isPending}
            >
              {l ? "Eliminar" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
