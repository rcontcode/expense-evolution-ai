import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, ExternalLink, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  getTaxInfoVersion,
  isTaxInfoPotentiallyOutdated,
  isNewTaxYearAvailable,
  type CountryCode,
} from '@/lib/constants/country-tax-config';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaxInfoVersionBadgeProps {
  country: CountryCode;
  compact?: boolean;
}

export function TaxInfoVersionBadge({ country, compact = false }: TaxInfoVersionBadgeProps) {
  const { language } = useLanguage();
  const version = getTaxInfoVersion(country);
  const isOutdated = isTaxInfoPotentiallyOutdated(country);
  const newYearAvailable = isNewTaxYearAvailable(country);
  
  const lastUpdatedDate = new Date(version.lastUpdated);
  const formattedDate = format(lastUpdatedDate, 'PPP', {
    locale: language === 'es' ? es : enUS,
  });

  const getStatusColor = () => {
    if (newYearAvailable) return 'bg-amber-500/20 text-amber-700 border-amber-300';
    if (isOutdated) return 'bg-yellow-500/20 text-yellow-700 border-yellow-300';
    return 'bg-emerald-500/20 text-emerald-700 border-emerald-300';
  };

  const getStatusIcon = () => {
    if (newYearAvailable || isOutdated) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return <CheckCircle className="h-3 w-3" />;
  };

  const labels = {
    es: {
      lastUpdated: 'Última actualización',
      taxYear: 'Año fiscal',
      verifiedBy: 'Verificado por',
      sources: 'Fuentes oficiales',
      notes: 'Notas',
      disclaimer: 'Esta información es de referencia. Consulte siempre con un contador profesional.',
      outdatedWarning: 'La información podría requerir actualización',
      newYearWarning: `Información del año fiscal ${version.taxYear}. El año ${new Date().getFullYear()} podría tener cambios.`,
      upToDate: 'Información actualizada',
    },
    en: {
      lastUpdated: 'Last updated',
      taxYear: 'Tax year',
      verifiedBy: 'Verified by',
      sources: 'Official sources',
      notes: 'Notes',
      disclaimer: 'This information is for reference only. Always consult with a professional accountant.',
      outdatedWarning: 'Information may need updating',
      newYearWarning: `Tax year ${version.taxYear} information. Year ${new Date().getFullYear()} may have changes.`,
      upToDate: 'Information up to date',
    },
  };

  const t = labels[language];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span>{version.taxYear}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.lastUpdated}: {formattedDate}</p>
            {(newYearAvailable || isOutdated) && (
              <p className="text-amber-600">{newYearAvailable ? t.newYearWarning : t.outdatedWarning}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`gap-2 h-auto py-1.5 px-3 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-xs font-medium">
            {t.taxYear} {version.taxYear} · {formattedDate}
          </span>
          <Info className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">
              {newYearAvailable || isOutdated 
                ? (newYearAvailable ? t.newYearWarning : t.outdatedWarning)
                : t.upToDate
              }
            </span>
          </div>
          
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.lastUpdated}:</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.taxYear}:</span>
              <span className="font-medium">{version.taxYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.verifiedBy}:</span>
              <span className="font-medium">{version.verifiedBy}</span>
            </div>
          </div>

          {version.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">{t.notes}:</span>
              <p className="mt-1">{version.notes}</p>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t.sources}:</span>
            {version.sourceUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {new URL(url).hostname}
              </a>
            ))}
          </div>

          <p className="text-xs text-muted-foreground border-t pt-2">
            {t.disclaimer}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
