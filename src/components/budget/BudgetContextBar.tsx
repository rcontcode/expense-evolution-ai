import { useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CountryFlag } from "@/components/ui/country-flag";
import { toast } from "sonner";
import { motion } from "framer-motion";

const COUNTRY_NAMES: Record<string, { es: string; en: string }> = {
  CA: { es: "Canadá", en: "Canada" },
  CL: { es: "Chile", en: "Chile" },
};

const COUNTRY_DEFAULT_CURRENCY: Record<string, string> = { CA: "CAD", CL: "CLP" };

const AVAILABLE_COUNTRIES = [
  { code: "CA", emoji: "🍁" },
  { code: "CL", emoji: "⭐" },
];

const CURRENCY_CONFIG: Record<string, { emoji: string; gradient: string; shadow: string }> = {
  CAD: { emoji: "🇨🇦", gradient: "from-red-500/20 to-red-600/10", shadow: "shadow-red-500/20" },
  CLP: { emoji: "🇨🇱", gradient: "from-blue-500/20 to-red-500/10", shadow: "shadow-blue-500/20" },
  USD: { emoji: "🇺🇸", gradient: "from-emerald-500/20 to-emerald-600/10", shadow: "shadow-emerald-500/20" },
};

const AVAILABLE_CURRENCIES = [
  { code: "CAD", label: "CAD — Dólar Canadiense" },
  { code: "CLP", label: "CLP — Peso Chileno" },
  { code: "USD", label: "USD — Dólar Americano" },
];

const COUNTRY_GRADIENT: Record<string, { gradient: string; shadow: string }> = {
  CA: { gradient: "from-red-500/20 via-white/10 to-red-500/20", shadow: "shadow-red-500/25" },
  CL: { gradient: "from-blue-600/20 via-white/10 to-red-500/20", shadow: "shadow-blue-500/25" },
};

export function BudgetContextBar() {
  const { currentCountry, currentCurrency, currentEntity, activeCountries, isMultiCountry } = useEntity();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const l = language === "es";
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const countryName = COUNTRY_NAMES[currentCountry]?.[language] || currentCountry;
  const countryStyle = COUNTRY_GRADIENT[currentCountry] || COUNTRY_GRADIENT.CA;
  const currencyStyle = CURRENCY_CONFIG[currentCurrency] || CURRENCY_CONFIG.CAD;

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
      setCurrencyOpen(false);
    }
  };

  const handleCountryChange = async (newCountry: string) => {
    if (newCountry === currentCountry || !user) return;
    setSaving(true);
    try {
      const defaultCurrency = COUNTRY_DEFAULT_CURRENCY[newCountry] || "CAD";
      const { error } = await supabase
        .from("profiles")
        .update({ country: newCountry, display_currency: defaultCurrency })
        .eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(l ? `País cambiado a ${COUNTRY_NAMES[newCountry]?.es || newCountry}` : `Country changed to ${COUNTRY_NAMES[newCountry]?.en || newCountry}`);
    } catch {
      toast.error(l ? "Error al cambiar país" : "Error changing country");
    } finally {
      setSaving(false);
      setCountryOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
      {/* Country — Vibrant */}
      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r ${countryStyle.gradient} border border-red-500/30 hover:border-red-500/50 shadow-md ${countryStyle.shadow} transition-all cursor-pointer`}
          >
            <CountryFlag code={currentCountry} size="xs" />
            <span className="font-semibold text-foreground">{countryName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1.5" align="start">
          <p className="text-[10px] text-muted-foreground px-2 py-1.5 font-medium">
            {l ? "🌎 Selecciona tu país" : "🌎 Select your country"}
          </p>
          {AVAILABLE_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCountryChange(c.code)}
              disabled={saving}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-muted/80 transition-colors text-left"
            >
              <CountryFlag code={c.code} size="sm" />
              <span className="flex-1 font-medium">{COUNTRY_NAMES[c.code]?.[language] || c.code}</span>
              {c.code === currentCountry && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Currency — Colorful */}
      <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r ${currencyStyle.gradient} border border-amber-500/30 hover:border-amber-500/50 shadow-md ${currencyStyle.shadow} transition-all cursor-pointer`}
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-sm"
            >
              {currencyStyle.emoji}
            </motion.span>
            <span className="font-bold text-amber-700 dark:text-amber-400">{currentCurrency}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-1.5" align="start">
          <p className="text-[10px] text-muted-foreground px-2 py-1.5 font-medium">
            {l ? "💰 Selecciona tu moneda" : "💰 Select your currency"}
          </p>
          {AVAILABLE_CURRENCIES.map((c) => {
            const cfg = CURRENCY_CONFIG[c.code] || CURRENCY_CONFIG.CAD;
            return (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                disabled={saving}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-muted/80 transition-colors text-left"
              >
                <span className="text-base">{cfg.emoji}</span>
                <span className="flex-1 font-medium">{c.label}</span>
                {c.code === currentCurrency && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {/* Language — Colorful */}
      <motion.span
        whileHover={{ scale: 1.05 }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-500/30 shadow-md shadow-violet-500/15"
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          className="text-sm"
        >
          {language === "es" ? "🇪🇸" : "🇬🇧"}
        </motion.span>
        <span className="font-semibold text-violet-700 dark:text-violet-400">
          {language === "es" ? "Español" : "English"}
        </span>
      </motion.span>

      {/* Entity */}
      {currentEntity && (
        <motion.span
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 shadow-md shadow-primary/15"
        >
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="text-sm"
          >
            🏢
          </motion.span>
          <span className="font-semibold text-primary">{currentEntity.name}</span>
        </motion.span>
      )}

      {/* Multi-country */}
      {isMultiCountry && (
        <motion.span
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 shadow-md shadow-emerald-500/15"
        >
          <span className="text-sm">🌍</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {activeCountries.map(c => {
              const n = COUNTRY_NAMES[c];
              return n ? n[language] : c;
            }).join(" · ")}
          </span>
        </motion.span>
      )}
    </div>
  );
}
