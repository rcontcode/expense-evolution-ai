import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateFiscalEntity, useUpdateFiscalEntity, type FiscalEntity } from '@/hooks/data/useFiscalEntities';
import { getCountryConfig, getAvailableCountries, CHILE_TAX_REGIMES, type CountryCode } from '@/lib/constants/country-tax-config';
import { Building2, Globe, FileText, DollarSign, Calendar, Palette } from 'lucide-react';

const fiscalEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  country: z.string().min(2).max(2),
  province: z.string().optional().nullable(),
  entity_type: z.string().min(1, 'Entity type is required').default('sole_proprietor'),
  tax_id: z.string().optional().nullable(),
  tax_id_type: z.string().optional().nullable(),
  tax_regime: z.string().optional().nullable(),
  default_currency: z.string().min(3).max(3).default('CAD'),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  fiscal_year_end: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

type FormData = z.infer<typeof fiscalEntitySchema>;

interface FiscalEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: FiscalEntity | null;
  isFirstEntity?: boolean;
}

const ENTITY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const ENTITY_ICONS = ['🏢', '🏠', '💼', '🏪', '🏭', '🏦', '🎯', '⭐', '🌟', '💎'];

export function FiscalEntityDialog({ open, onOpenChange, entity, isFirstEntity = false }: FiscalEntityDialogProps) {
  const { language } = useLanguage();
  const createEntity = useCreateFiscalEntity();
  const updateEntity = useUpdateFiscalEntity();
  const isEditing = !!entity;

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('CA');
  const countryConfig = getCountryConfig(selectedCountry);
  const countries = getAvailableCountries();

  const form = useForm<FormData>({
    resolver: zodResolver(fiscalEntitySchema),
    defaultValues: {
      name: '',
      country: 'CA',
      province: null,
      entity_type: '',
      tax_id: null,
      tax_id_type: null,
      tax_regime: null,
      default_currency: 'CAD',
      is_primary: isFirstEntity,
      is_active: true,
      fiscal_year_end: null,
      notes: null,
      color: ENTITY_COLORS[0],
      icon: ENTITY_ICONS[0],
    },
  });

  useEffect(() => {
    if (entity) {
      form.reset({
        name: entity.name,
        country: entity.country,
        province: entity.province,
        entity_type: entity.entity_type,
        tax_id: entity.tax_id,
        tax_id_type: entity.tax_id_type,
        tax_regime: entity.tax_regime,
        default_currency: entity.default_currency || 'CAD',
        is_primary: entity.is_primary || false,
        is_active: entity.is_active !== false,
        fiscal_year_end: entity.fiscal_year_end,
        notes: entity.notes,
        color: entity.color || ENTITY_COLORS[0],
        icon: entity.icon || ENTITY_ICONS[0],
      });
      setSelectedCountry(entity.country as CountryCode);
    } else {
      form.reset({
        name: '',
        country: 'CA',
        province: null,
        entity_type: '',
        tax_id: null,
        tax_id_type: null,
        tax_regime: null,
        default_currency: 'CAD',
        is_primary: isFirstEntity,
        is_active: true,
        fiscal_year_end: null,
        notes: null,
        color: ENTITY_COLORS[Math.floor(Math.random() * ENTITY_COLORS.length)],
        icon: ENTITY_ICONS[0],
      });
      setSelectedCountry('CA');
    }
  }, [entity, form, isFirstEntity, open]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && entity) {
        await updateEntity.mutateAsync({ id: entity.id, ...data });
      } else {
        // Ensure required fields for insert
        await createEntity.mutateAsync({
          ...data,
          name: data.name,
          country: data.country,
          entity_type: data.entity_type || 'sole_proprietor',
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving entity:', error);
    }
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country as CountryCode);
    const config = getCountryConfig(country as CountryCode);
    form.setValue('country', country);
    form.setValue('default_currency', config.currency);
    form.setValue('entity_type', '');
    form.setValue('province', null);
    form.setValue('tax_regime', null);
    form.setValue('tax_id_type', config.businessIdConfig.name[language as 'es' | 'en']);
  };

  const isPending = createEntity.isPending || updateEntity.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing 
              ? (language === 'es' ? 'Editar Entidad Fiscal' : 'Edit Fiscal Entity')
              : (language === 'es' ? 'Nueva Entidad Fiscal' : 'New Fiscal Entity')
            }
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? 'Configure los detalles de su entidad fiscal para gestionar ingresos y gastos por jurisdicción.'
              : 'Configure your fiscal entity details to manage income and expenses by jurisdiction.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'es' ? 'Nombre' : 'Name'} *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'es' ? 'Ej: Mi Empresa Chile' : 'E.g: My Business Canada'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {language === 'es' ? 'País' : 'Country'} *
                    </FormLabel>
                    <Select value={field.value} onValueChange={handleCountryChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code === 'CA' ? '🇨🇦' : '🇨🇱'} {c.name[language as 'es' | 'en']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Region & Entity Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedCountry === 'CA' 
                        ? (language === 'es' ? 'Provincia' : 'Province')
                        : (language === 'es' ? 'Región' : 'Region')
                      }
                    </FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryConfig.regions.map(r => (
                          <SelectItem key={r.code} value={r.code}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'es' ? 'Tipo de Entidad' : 'Entity Type'} *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryConfig.workTypes.map(wt => (
                          <SelectItem key={wt.value} value={wt.value}>
                            {wt.label[language as 'es' | 'en']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      {countryConfig.workTypes.find(wt => wt.value === field.value)?.description[language as 'es' | 'en']}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tax ID & Regime */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {countryConfig.businessIdConfig.name[language as 'es' | 'en']}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        placeholder={countryConfig.businessIdConfig.placeholder}
                        onChange={(e) => {
                          const formatted = countryConfig.businessIdConfig.formatFunction?.(e.target.value) || e.target.value;
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {language === 'es' ? 'Formato:' : 'Format:'} {countryConfig.businessIdConfig.format}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCountry === 'CL' && (
                <FormField
                  control={form.control}
                  name="tax_regime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'es' ? 'Régimen Tributario' : 'Tax Regime'}</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CHILE_TAX_REGIMES.map(r => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label[language as 'es' | 'en']} ({(r.rate * 100).toFixed(0)}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedCountry === 'CA' && (
                <FormField
                  control={form.control}
                  name="fiscal_year_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {language === 'es' ? 'Fin Año Fiscal' : 'Fiscal Year End'}
                      </FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['01-31', '02-28', '03-31', '04-30', '05-31', '06-30', '07-31', '08-31', '09-30', '10-31', '11-30', '12-31'].map((date, i) => (
                            <SelectItem key={date} value={date}>
                              {new Date(2024, i, 1).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Currency */}
            <FormField
              control={form.control}
              name="default_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {language === 'es' ? 'Moneda Predeterminada' : 'Default Currency'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CAD">🇨🇦 CAD - Dólar Canadiense</SelectItem>
                      <SelectItem value="CLP">🇨🇱 CLP - Peso Chileno</SelectItem>
                      <SelectItem value="USD">🇺🇸 USD - Dólar Estadounidense</SelectItem>
                      <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color & Icon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      {language === 'es' ? 'Color' : 'Color'}
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {ENTITY_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            field.value === color ? 'border-foreground ring-2 ring-offset-2' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'es' ? 'Icono' : 'Icon'}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {ENTITY_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => field.onChange(icon)}
                          className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-transform hover:scale-110 ${
                            field.value === icon ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switches */}
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="is_primary"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {language === 'es' ? 'Entidad Principal' : 'Primary Entity'}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {language === 'es' 
                          ? 'Se usará por defecto al crear transacciones'
                          : 'Will be used by default when creating transactions'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        {language === 'es' ? 'Activa' : 'Active'}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {language === 'es' 
                          ? 'Las entidades inactivas no aparecen en selectores'
                          : 'Inactive entities don\'t appear in selectors'}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'es' ? 'Notas' : 'Notes'}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      value={field.value || ''}
                      placeholder={language === 'es' 
                        ? 'Notas adicionales sobre esta entidad fiscal...'
                        : 'Additional notes about this fiscal entity...'}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending 
                  ? (language === 'es' ? 'Guardando...' : 'Saving...')
                  : isEditing 
                    ? (language === 'es' ? 'Actualizar' : 'Update')
                    : (language === 'es' ? 'Crear Entidad' : 'Create Entity')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
