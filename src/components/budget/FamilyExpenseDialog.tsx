import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateExpense } from "@/hooks/data/useExpenses";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const FAMILY_CATEGORIES = [
  { value: "meals", icon: "🍽️", es: "Comida", en: "Food" },
  { value: "fuel", icon: "⛽", es: "Transporte", en: "Transport" },
  { value: "utilities", icon: "💡", es: "Servicios", en: "Utilities" },
  { value: "software", icon: "💻", es: "Suscripciones", en: "Subscriptions" },
  { value: "family_outings", icon: "👨‍👩‍👧‍👦", es: "Salidas", en: "Outings" },
  { value: "hobbies", icon: "🎨", es: "Hobbies", en: "Hobbies" },
  { value: "gifts", icon: "🎁", es: "Regalos", en: "Gifts" },
  { value: "scheduled_purchases", icon: "🛍️", es: "Compras", en: "Shopping" },
  { value: "materials", icon: "🏠", es: "Hogar", en: "Home" },
  { value: "travel", icon: "✈️", es: "Viajes", en: "Travel" },
  { value: "equipment", icon: "🏥", es: "Salud", en: "Health" },
  { value: "other", icon: "📋", es: "Otros", en: "Other" },
] as const;

interface FamilyExpenseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FamilyExpenseDialog({ open, onClose }: FamilyExpenseDialogProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentCurrency } = useFormatCurrency();
  const queryClient = useQueryClient();
  const createMutation = useCreateExpense();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const reset = () => {
    setAmount("");
    setDescription("");
    setCategory("");
    setStep(1);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!amount || !category || !user) return;

    try {
      await createMutation.mutateAsync({
        amount: parseFloat(amount),
        category,
        vendor: description || undefined,
        description: description || undefined,
        date: new Date().toISOString().split("T")[0],
        currency: currentCurrency,
        status: "approved",
        reimbursement_type: "non_reimbursable",
        user_id: user.id,
      } as any);

      // Ensure budget view data refreshes
      queryClient.invalidateQueries({ queryKey: ["monthly-plan"] });

      toast({
        title: l ? "✅ ¡Gasto registrado!" : "✅ Expense recorded!",
        description: `${FAMILY_CATEGORIES.find(c => c.value === category)?.icon} ${amount}`,
      });
      handleClose();
    } catch {
      toast({
        title: l ? "Error" : "Error",
        description: l ? "No se pudo guardar" : "Could not save",
        variant: "destructive",
      });
    }
  };

  const selectedCat = FAMILY_CATEGORIES.find(c => c.value === category);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {step === 1
              ? (l ? "🛒 ¿En qué gastaste?" : "🛒 What did you spend on?")
              : `${selectedCat?.icon} ${l ? selectedCat?.es : selectedCat?.en}`
            }
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-3 gap-2 py-2">
            {FAMILY_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl",
                  "bg-muted/50 hover:bg-primary/10 hover:scale-105",
                  "transition-all duration-150 active:scale-95",
                  "border border-transparent hover:border-primary/20"
                )}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {l ? cat.es : cat.en}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Amount - BIG */}
            <div className="text-center space-y-1">
              <label className="text-xs text-muted-foreground">
                {l ? "💰 ¿Cuánto?" : "💰 How much?"}
              </label>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-muted-foreground">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-3xl font-bold text-center border-none shadow-none h-14 w-40 focus-visible:ring-0"
                  autoFocus
                />
              </div>
            </div>

            {/* Description - optional */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                {l ? "📝 Descripción (opcional)" : "📝 Description (optional)"}
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={l ? "Ej: Supermercado, café..." : "E.g: Groceries, coffee..."}
                className="text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                ← {l ? "Atrás" : "Back"}
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!amount || createMutation.isPending}
              >
                {createMutation.isPending
                  ? (l ? "Guardando..." : "Saving...")
                  : (l ? "✅ Guardar" : "✅ Save")
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
