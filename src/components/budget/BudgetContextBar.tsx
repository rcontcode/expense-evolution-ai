import { useEntity } from "@/contexts/EntityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFormatCurrency } from "@/hooks/utils/useFormatCurrency";
import { Globe, DollarSign, Languages, Building2 } from "lucide-react";

const COUNTRY_FLAGS: Record<string, string> = {
  CA: "🇨🇦",
  CL: "🇨🇱",
};

const COUNTRY_NAMES: Record<string, { es: string; en: string }> = {
  CA: { es: "Canadá", en: "Canada" },
  CL: { es: "Chile", en: "Chile" },
};

const CURRENCY_LABELS: Record<string, string> = {
  CAD: "CAD $",
  CLP: "CLP $",
  USD: "USD $",
};

export function BudgetContextBar() {
  const { currentCountry, currentCurrency, currentEntity, activeCountries, isMultiCountry } = useEntity();
  const { language } = useLanguage();
  const l = language === "es";

  const flag = COUNTRY_FLAGS[currentCountry] || "🌎";
  const countryName = COUNTRY_NAMES[currentCountry]?.[language] || currentCountry;
  const currLabel = CURRENCY_LABELS[currentCurrency] || currentCurrency;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      {/* Country */}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50">
        <span>{flag}</span>
        <span className="font-medium">{countryName}</span>
      </span>

      {/* Currency */}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50">
        <DollarSign className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{currLabel}</span>
      </span>

      {/* Language */}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/50">
        <Languages className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{language === "es" ? "Español" : "English"}</span>
      </span>

      {/* Entity (if exists) */}
      {currentEntity && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Building2 className="h-3 w-3 text-primary" />
          <span className="font-medium text-primary">{currentEntity.name}</span>
        </span>
      )}

      {/* Multi-country indicator */}
      {isMultiCountry && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <Globe className="h-3 w-3" />
          <span className="font-medium">
            {activeCountries.map(c => COUNTRY_FLAGS[c] || c).join(" ")} {l ? "Multi-país" : "Multi-country"}
          </span>
        </span>
      )}
    </div>
  );
}
