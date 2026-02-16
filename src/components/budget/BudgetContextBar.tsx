import { useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, Languages, Building2, Globe, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

const COUNTRY_FLAGS: Record<string, string> = { CA: "🇨🇦", CL: "🇨🇱" };
const COUNTRY_NAMES: Record<string, { es: string; en: string }> = {
  CA: { es: "Canadá", en: "Canada" },
  CL: { es: "Chile", en: "Chile" },
};

const AVAILABLE_CURRENCIES = [
  { code: "CAD", label: "CAD — Dólar Canadiense", flag: "🇨🇦" },
  { code: "CLP", label: "CLP — Peso Chileno", flag: "🇨🇱" },
  { code: "USD", label: "USD — Dólar Americano", flag: "🇺🇸" },
];

export function BudgetContextBar() {
  const { currentCountry, currentCurrency, currentEntity, activeCountries, isMultiCountry } = useEntity();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const l = language === "es";
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const flag = COUNTRY_FLAGS[currentCountry] || "🌎";
  const countryName = COUNTRY_NAMES[currentCountry]?.[language] || currentCountry;

  const handleCurrencyChange = async (newCurrency: string) => {
    if (newCurrency === currentCurrency || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_currency: newCurrency })
        .eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(l ? `Moneda cambiada a ${newCurrency}` : `Currency changed to ${newCurrency}`);
    } catch {
      toast.error(l ? "Error al cambiar moneda" : "Error changing currency");
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      {/* Country */}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50">
        <span>{flag}</span>
        <span className="font-medium">{countryName}</span>
      </span>

      {/* Currency — Editable */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50 hover:bg-primary/10 hover:border-primary/20 transition-colors cursor-pointer">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{currentCurrency}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          <p className="text-[10px] text-muted-foreground px-2 py-1.5 font-medium">
            {l ? "Selecciona tu moneda" : "Select your currency"}
          </p>
          {AVAILABLE_CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              disabled={saving}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/80 transition-colors text-left"
            >
              <span>{c.flag}</span>
              <span className="flex-1">{c.label}</span>
              {c.code === currentCurrency && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Language */}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50">
        <Languages className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{language === "es" ? "Español" : "English"}</span>
      </span>

      {/* Entity */}
      {currentEntity && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Building2 className="h-3 w-3 text-primary" />
          <span className="font-medium text-primary">{currentEntity.name}</span>
        </span>
      )}

      {/* Multi-country */}
      {isMultiCountry && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/50 border border-accent">
          <Globe className="h-3 w-3" />
          <span className="font-medium">
            {activeCountries.map(c => COUNTRY_FLAGS[c] || c).join(" ")} {l ? "Multi-país" : "Multi-country"}
          </span>
        </span>
      )}
    </div>
  );
}
