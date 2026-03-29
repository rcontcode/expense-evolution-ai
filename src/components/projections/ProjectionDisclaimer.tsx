import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Info, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface DataSource {
  name: { es: string; en: string };
  available: boolean;
  count?: number;
  tip?: { es: string; en: string };
  link?: string;
}

interface ProjectionDisclaimerProps {
  dataSources: DataSource[];
  methodology: { es: string; en: string };
  assumptions?: { es: string; en: string }[];
  className?: string;
}

export function ProjectionDisclaimer({ dataSources, methodology, assumptions, className }: ProjectionDisclaimerProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const [open, setOpen] = useState(false);

  const available = dataSources.filter(d => d.available).length;
  const total = dataSources.length;
  const ratio = total > 0 ? available / total : 0;

  const reliability = ratio >= 0.8 ? 'high' : ratio >= 0.5 ? 'medium' : 'low';
  const reliabilityConfig = {
    high: { label: { es: 'Alta', en: 'High' }, emoji: '🟢', color: 'text-emerald-600 dark:text-emerald-400' },
    medium: { label: { es: 'Media', en: 'Medium' }, emoji: '🟡', color: 'text-yellow-600 dark:text-yellow-400' },
    low: { label: { es: 'Baja', en: 'Low' }, emoji: '🔴', color: 'text-destructive' },
  };

  const r = reliabilityConfig[reliability];
  const missing = dataSources.filter(d => !d.available);

  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 text-xs", className)}>
      {/* Header - always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">
            {l ? '¿Cómo se calcula?' : 'How is this calculated?'}
          </span>
          {missing.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
              {missing.length} {l ? 'dato(s) faltante(s)' : 'missing source(s)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-medium", r.color)}>
            {r.emoji} {l ? r.label.es : r.label.en}
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-2">
          {/* Methodology */}
          <div>
            <p className="text-muted-foreground leading-relaxed">
              {l ? methodology.es : methodology.en}
            </p>
          </div>

          {/* Data sources checklist */}
          <div className="space-y-1.5">
            <p className="font-medium text-foreground">{l ? 'Fuentes de datos:' : 'Data sources:'}</p>
            {dataSources.map((ds, i) => (
              <div key={i} className="flex items-center gap-2">
                {ds.available ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                )}
                <span className={cn(ds.available ? "text-foreground" : "text-muted-foreground")}>
                  {l ? ds.name.es : ds.name.en}
                  {ds.available && ds.count !== undefined && (
                    <span className="text-muted-foreground ml-1">({ds.count})</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Missing data tips */}
          {missing.length > 0 && (
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 space-y-1">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                {l ? '⚡ Para mejorar esta proyección:' : '⚡ To improve this projection:'}
              </p>
              {missing.map((ds, i) => (
                <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                  <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{ds.tip ? (l ? ds.tip.es : ds.tip.en) : (l ? `Agrega ${ds.name.es.toLowerCase()}` : `Add ${ds.name.en.toLowerCase()}`)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Assumptions */}
          {assumptions && assumptions.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium text-foreground">{l ? 'Supuestos:' : 'Assumptions:'}</p>
              {assumptions.map((a, i) => (
                <p key={i} className="text-muted-foreground pl-2 border-l-2 border-border">
                  {l ? a.es : a.en}
                </p>
              ))}
            </div>
          )}

          {/* Reliability explanation */}
          <p className="text-[10px] text-muted-foreground/70 italic">
            {l
              ? `Confiabilidad ${r.label.es.toLowerCase()}: ${available}/${total} fuentes disponibles. Más datos = proyección más precisa.`
              : `${r.label.en} reliability: ${available}/${total} sources available. More data = more accurate projection.`}
          </p>
        </div>
      )}
    </div>
  );
}
