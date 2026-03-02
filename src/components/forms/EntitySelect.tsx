import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useFiscalEntities } from '@/hooks/data/useFiscalEntities';
import { useEntity } from '@/contexts/EntityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Building2, User, Briefcase, Home } from 'lucide-react';
import { Control } from 'react-hook-form';
import { Skeleton } from '@/components/ui/skeleton';
import { CountryFlag } from '@/components/ui/country-flag';

interface EntitySelectProps {
  control: Control<any>;
  name?: string;
  required?: boolean;
  showDescription?: boolean;
}

const entityTypeIcons: Record<string, typeof Building2> = {
  personal: User,
  sole_proprietorship: Briefcase,
  corporation: Building2,
  partnership: Building2,
  llc: Building2,
  other: Globe,
};


export function EntitySelect({ control, name = 'entity_id', required = false, showDescription = true }: EntitySelectProps) {
  const { language } = useLanguage();
  const { data: entities, isLoading } = useFiscalEntities();
  const { currentEntity, isMultiEntity } = useEntity();
  
  // Only show selector if user has multiple entities
  if (!isMultiEntity && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const activeEntities = entities?.filter(e => e.is_active !== false) || [];

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      personal: { es: 'Personal', en: 'Personal' },
      sole_proprietorship: { es: 'Trabajo Independiente', en: 'Sole Proprietorship' },
      corporation: { es: 'Corporación', en: 'Corporation' },
      partnership: { es: 'Sociedad', en: 'Partnership' },
      llc: { es: 'LLC', en: 'LLC' },
      other: { es: 'Otro', en: 'Other' },
    };
    return labels[type]?.[language] || type;
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {language === 'es' ? 'Jurisdicción' : 'Jurisdiction'}
            {required && ' *'}
          </FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || currentEntity?.id || ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={language === 'es' ? 'Seleccionar jurisdicción' : 'Select jurisdiction'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {activeEntities.map((entity) => {
                const Icon = entityTypeIcons[entity.entity_type] || Globe;
                const flag = countryFlags[entity.country] || '🌍';
                
                return (
                  <SelectItem key={entity.id} value={entity.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{flag}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{entity.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({getEntityTypeLabel(entity.entity_type)})
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {entity.default_currency}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {showDescription && (
            <FormDescription className="text-xs">
              {language === 'es' 
                ? 'Asocia esta transacción a una jurisdicción fiscal específica' 
                : 'Associate this transaction with a specific tax jurisdiction'}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
