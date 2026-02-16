import { useState } from "react";
import { Plus, X, Receipt, DollarSign, CreditCard, Camera, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface FamilyFABProps {
  onExpense: () => void;
  onIncome: () => void;
  onBill: () => void;
  onReceipt: () => void;
  onSmartText?: () => void;
}

export function FamilyFAB({ onExpense, onIncome, onBill, onReceipt, onSmartText }: FamilyFABProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const l = language === "es";

  const actions = [
    ...(onSmartText ? [{ icon: MessageSquareText, label: l ? "Texto Libre" : "Free Text", color: "bg-violet-500", action: onSmartText }] : []),
    { icon: Receipt, label: l ? "Gasto" : "Expense", color: "bg-amber-500", action: onExpense },
    { icon: DollarSign, label: l ? "Ingreso" : "Income", color: "bg-emerald-500", action: onIncome },
    { icon: CreditCard, label: l ? "Pago Fijo" : "Fixed Bill", color: "bg-blue-500", action: onBill },
    { icon: Camera, label: l ? "Boleta" : "Receipt", color: "bg-purple-500", action: onReceipt },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && actions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { a.action(); setOpen(false); }}
            className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-full shadow-lg bg-popover border text-sm font-medium hover:bg-muted transition-colors"
          >
            <span>{a.label}</span>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", a.color)}>
              <a.icon className="h-4 w-4" />
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
          open
            ? "bg-muted-foreground text-background rotate-45"
            : "bg-primary text-primary-foreground shadow-primary/30"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
