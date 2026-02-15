import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const INCOME_TYPES = [
  { value: "salary", icon: "💼", es: "Sueldo", en: "Salary" },
  { value: "freelance", icon: "💻", es: "Freelance", en: "Freelance" },
  { value: "business_income", icon: "🏪", es: "Negocio", en: "Business" },
  { value: "investment_dividends", icon: "📈", es: "Inversiones", en: "Investments" },
  { value: "rental", icon: "🏠", es: "Arriendo", en: "Rental" },
  { value: "government_benefit", icon: "🏛️", es: "Beneficio", en: "Benefit" },
  { value: "gift_received", icon: "🎁", es: "Regalo", en: "Gift" },
  { value: "other_income", icon: "💰", es: "Otro", en: "Other" },
] as const;

interface FamilyIncomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FamilyIncomeDialog({ open, onClose }: FamilyIncomeDialogProps) {
  const { language } = useLanguage();
  const l = language === "es";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [incomeType, setIncomeType] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setAmount("");
    setSource("");
    setIncomeType("");
    setStep(1);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTypeSelect = (type: string) => {
    setIncomeType(type);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!amount || !incomeType || !user) return;
    setSaving(true);

    try {
      const typeInfo = INCOME_TYPES.find(t => t.value === incomeType);
      const { error } = await supabase.from("income").insert({
        amount: parseFloat(amount),
        income_type: incomeType as any,
        source: source || (l ? typeInfo?.es : typeInfo?.en) || "Income",
        description: source || null,
        date: new Date().toISOString().split("T")[0],
        user_id: user.id,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-plan"] });

      toast({
        title: l ? "✅ ¡Ingreso registrado!" : "✅ Income recorded!",
        description: `${typeInfo?.icon} $${amount}`,
      });
      handleClose();
    } catch {
      toast({
        title: l ? "Error" : "Error",
        description: l ? "No se pudo guardar" : "Could not save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedType = INCOME_TYPES.find(t => t.value === incomeType);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {step === 1
              ? (l ? "💰 ¿Qué tipo de ingreso?" : "💰 What type of income?")
              : `${selectedType?.icon} ${l ? selectedType?.es : selectedType?.en}`
            }
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-2 gap-2 py-2">
            {INCOME_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl",
                  "bg-muted/50 hover:bg-emerald-500/10 hover:scale-[1.02]",
                  "transition-all duration-150 active:scale-95",
                  "border border-transparent hover:border-emerald-500/20"
                )}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-medium">{l ? type.es : type.en}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Amount */}
            <div className="text-center space-y-1">
              <label className="text-xs text-muted-foreground">
                {l ? "💰 ¿Cuánto recibiste?" : "💰 How much did you receive?"}
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

            {/* Source */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                {l ? "📝 Fuente (opcional)" : "📝 Source (optional)"}
              </label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={l ? "Ej: Empresa ABC, cliente..." : "E.g: Company ABC, client..."}
                className="text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                ← {l ? "Atrás" : "Back"}
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!amount || saving}
              >
                {saving
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
