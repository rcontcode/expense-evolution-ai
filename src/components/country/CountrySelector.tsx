import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CountryFlag } from '@/components/ui/country-flag';
import { useCountryContext } from '@/hooks/utils/useCountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryConfig, type CountryCode } from '@/lib/constants/country-tax-config';
import { Globe } from 'lucide-react';

interface CountrySelectorProps {
  /** Currently selected country */
  value?: CountryCode;
  /** Called when country changes */
  onChange: (country: CountryCode) => void;
  /** Optional label to display */
  label?: string;
  /** Whether to show as compact badge or full select */
  variant?: 'select' | 'badge' | 'dialog';
  /** Custom prompt for dialog variant */
  dialogPrompt?: string;
  /** Class name for styling */
  className?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Country selector that only shows countries the user has entities for.
 * 
 * Variants:
 * - 'select': Standard dropdown (default)
 * - 'badge': Compact badge that opens dropdown
 * - 'dialog': Full dialog for important selections
 * 
 * Auto-hides when user only has one country.
 */
export function CountrySelector({
  value,
  onChange,
  label,
  variant = 'select',
  dialogPrompt,
  className,
  disabled,
}: CountrySelectorProps) {
  const { activeCountries, isMultiCountry, getCountryText } = useCountryContext();
  const { language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't render if user only has one country
  if (!isMultiCountry) {
    return null;
  }

  const selectedCountry = value || activeCountries[0];
  const config = getCountryConfig(selectedCountry);

  // Badge variant - compact inline display
  if (variant === 'badge') {
    return (
      <Select value={selectedCountry} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={`w-auto h-7 gap-1 px-2 border-0 bg-primary/10 ${className}`}>
          <CountryFlag code={selectedCountry} size="sm" />
          <span className="text-xs font-medium">{config.code}</span>
        </SelectTrigger>
        <SelectContent>
          {activeCountries.map(code => {
            const countryConfig = getCountryConfig(code);
            return (
              <SelectItem key={code} value={code}>
                <div className="flex items-center gap-2">
                  <CountryFlag code={code} size="sm" />
                  <span>{getCountryText(countryConfig.name)}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  // Dialog variant - for important decisions
  if (variant === 'dialog') {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setDialogOpen(true)}
          className={className}
          disabled={disabled}
        >
          <Globe className="h-4 w-4 mr-2" />
          {label || (language === 'es' ? 'Seleccionar país' : 'Select country')}
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Seleccionar Jurisdicción' : 'Select Jurisdiction'}
              </DialogTitle>
              <DialogDescription>
                {dialogPrompt || (language === 'es' 
                  ? '¿Para cuál país deseas realizar esta acción?' 
                  : 'Which country do you want to perform this action for?')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {activeCountries.map(code => {
                const countryConfig = getCountryConfig(code);
                const isSelected = code === selectedCountry;
                
                return (
                  <button
                    key={code}
                    onClick={() => {
                      onChange(code);
                      setDialogOpen(false);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <CountryFlag code={code} size="lg" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {getCountryText(countryConfig.name)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {countryConfig.taxAuthority.name}
                        </Badge>
                        <span>{countryConfig.currency}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default: Standard select
  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <Select value={selectedCountry} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              <CountryFlag code={selectedCountry} size="sm" />
              <span>{getCountryText(config.name)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {activeCountries.map(code => {
            const countryConfig = getCountryConfig(code);
            return (
              <SelectItem key={code} value={code}>
                <div className="flex items-center gap-2">
                  <CountryFlag code={code} size="sm" />
                  <span>{getCountryText(countryConfig.name)}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {countryConfig.taxAuthority.name}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
