import React, { useState, useEffect } from 'react';
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
import { Building2, Globe, FileText, DollarSign, Calendar, Palette, HelpCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Visual flag components with colors
const CountryFlag = ({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-6 h-4 text-xs',
    md: 'w-8 h-6 text-sm',
    lg: 'w-10 h-7 text-base',
  };
  
  const flags: Record<string, { bg: string; content: React.ReactNode }> = {
    CA: {
      bg: 'bg-gradient-to-r from-red-600 via-white to-red-600',
      content: <span className="text-red-600 font-bold">🍁</span>,
    },
    CL: {
      bg: 'bg-gradient-to-b from-white to-red-600',
      content: (
        <div className="absolute left-0 top-0 w-1/3 h-1/2 bg-blue-700 flex items-center justify-center">
          <span className="text-white text-[8px]">★</span>
        </div>
      ),
    },
    US: {
      bg: 'bg-gradient-to-b from-blue-800 via-white to-red-600',
      content: <span className="text-white text-[6px]">★</span>,
    },
    MX: {
      bg: 'bg-gradient-to-r from-green-600 via-white to-red-600',
      content: <span className="text-green-800 text-[8px]">🦅</span>,
    },
  };

  const flag = flags[code] || { bg: 'bg-gray-300', content: '?' };

  return (
    <div 
      className={`${sizeClasses[size]} ${flag.bg} rounded-sm shadow-md border border-black/10 flex items-center justify-center relative overflow-hidden`}
    >
      {flag.content}
    </div>
  );
};

// Country card with visual flag and colors
const COUNTRY_STYLES: Record<string, { gradient: string; border: string; icon: string }> = {
  CA: { 
    gradient: 'from-red-500/20 to-white/20', 
    border: 'border-red-500/30',
    icon: '🍁'
  },
  CL: { 
    gradient: 'from-blue-600/20 to-red-500/20', 
    border: 'border-blue-500/30',
    icon: '⭐'
  },
  US: { 
    gradient: 'from-blue-700/20 to-red-600/20', 
    border: 'border-blue-600/30',
    icon: '🗽'
  },
  MX: { 
    gradient: 'from-green-600/20 to-red-500/20', 
    border: 'border-green-500/30',
    icon: '🦅'
  },
};

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
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      {language === 'es' ? 'País' : 'Country'} *
                    </FormLabel>
                    <Select value={field.value} onValueChange={handleCountryChange}>
                      <FormControl>
                        <SelectTrigger className={`h-14 bg-gradient-to-r ${COUNTRY_STYLES[field.value]?.gradient || ''} ${COUNTRY_STYLES[field.value]?.border || ''} border-2`}>
                          <SelectValue>
                            <span className="flex items-center gap-3">
                              <CountryFlag code={field.value} size="lg" />
                              <div className="flex flex-col items-start">
                                <span className="font-semibold flex items-center gap-2">
                                  {countries.find(c => c.code === field.value)?.name[language as 'es' | 'en']}
                                  <span className="text-lg">{COUNTRY_STYLES[field.value]?.icon}</span>
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">{field.value}</span>
                              </div>
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-2">
                        {countries.map(c => {
                          const style = COUNTRY_STYLES[c.code];
                          return (
                            <SelectItem 
                              key={c.code} 
                              value={c.code} 
                              className={`py-3 my-1 rounded-md bg-gradient-to-r ${style?.gradient || ''} hover:scale-[1.02] transition-transform`}
                            >
                              <span className="flex items-center gap-3">
                                <CountryFlag code={c.code} size="md" />
                                <div className="flex flex-col">
                                  <span className="font-semibold flex items-center gap-2">
                                    {c.name[language as 'es' | 'en']}
                                    <span className="text-base">{style?.icon}</span>
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {c.code === 'CA' && (language === 'es' ? '🏛️ CRA • 💵 Dólar Canadiense' : '🏛️ CRA • 💵 Canadian Dollar')}
                                    {c.code === 'CL' && (language === 'es' ? '🏛️ SII • 💵 Peso Chileno' : '🏛️ SII • 💵 Chilean Peso')}
                                  </span>
                                </div>
                              </span>
                            </SelectItem>
                          );
                        })}
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
                    <FormLabel className="flex items-center gap-2">
                      <CountryFlag code={selectedCountry} size="sm" />
                      <span className="font-medium">
                        {selectedCountry === 'CA' 
                          ? (language === 'es' ? 'Provincia' : 'Province')
                          : (language === 'es' ? 'Región' : 'Region')
                        }
                      </span>
                      <span>{COUNTRY_STYLES[selectedCountry]?.icon}</span>
                    </FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-72 bg-popover">
                        {countryConfig.regions.map(r => (
                          <SelectItem key={r.code} value={r.code}>
                            {selectedCountry === 'CL' ? (
                              <span className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs min-w-[40px]">
                                  {r.name.split(' - ')[0]}
                                </span>
                                <span>{r.name.split(' - ')[1]}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-mono">{r.code}</span>
                                <span>{r.name}</span>
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCountry === 'CL' && (
                      <FormDescription className="text-xs flex items-center gap-1">
                        <span>📍</span>
                        <span>{language === 'es' 
                          ? 'Chile tiene 16 regiones numeradas con números romanos' 
                          : 'Chile has 16 regions numbered with Roman numerals'}</span>
                      </FormDescription>
                    )}
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
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {countryConfig.businessIdConfig.name[language as 'es' | 'en']}
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {language === 'es' ? 'Opcional' : 'Optional'}
                      </span>
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
                    
                    {/* Colorful explanation box */}
                    <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 rounded-full bg-blue-500/20">
                          <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-xs space-y-1.5">
                          <p className="text-foreground/80 flex items-center gap-2">
                            <span className="text-base">📋</span>
                            {language === 'es' 
                              ? `Este campo es solo para tu referencia personal dentro de la aplicación.`
                              : `This field is for your personal reference within the app only.`}
                          </p>
                          <p className="text-green-600 dark:text-green-400 flex items-center gap-2">
                            <span className="text-base">✅</span>
                            {language === 'es' 
                              ? `Puedes dejarlo en blanco sin afectar ninguna funcionalidad.`
                              : `You can leave it blank without affecting any functionality.`}
                          </p>
                          <p className="text-muted-foreground italic flex items-center gap-2">
                            <span className="text-base">📝</span>
                            {language === 'es' 
                              ? `Formato: ${countryConfig.businessIdConfig.format}`
                              : `Format: ${countryConfig.businessIdConfig.format}`}
                          </p>
                        </div>
                      </div>
                    </div>
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
                      <FormLabel className="flex items-center gap-2">
                        <span className="text-lg">🇨🇱</span>
                        {language === 'es' ? 'Régimen Tributario' : 'Tax Regime'}
                      </FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover">
                          {CHILE_TAX_REGIMES.map(r => (
                            <SelectItem key={r.value} value={r.value}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{r.label[language as 'es' | 'en']}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                  {(r.rate * 100).toFixed(0)}%
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        {language === 'es' 
                          ? '💡 Consulta tu carpeta tributaria en sii.cl si no estás seguro' 
                          : '💡 Check your tax folder at sii.cl if unsure'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

              {/* Fiscal Year End - shown for both countries with EXPANDED help */}
              <FormField
                control={form.control}
                name="fiscal_year_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {language === 'es' ? 'Fin de Año Fiscal' : 'Fiscal Year End'}
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {language === 'es' ? 'Opcional' : 'Optional'}
                      </span>
                    </FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'es' ? 'Seleccionar mes...' : 'Select month...'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {['01-31', '02-28', '03-31', '04-30', '05-31', '06-30', '07-31', '08-31', '09-30', '10-31', '11-30', '12-31'].map((date, i) => (
                          <SelectItem key={date} value={date}>
                            <div className="flex items-center gap-2">
                              <span>{new Date(2024, i, 1).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })}</span>
                              {date === '12-31' && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">
                                  {language === 'es' ? 'Más común' : 'Most common'}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Expanded help section - visible, not tooltip */}
                    <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-3 text-sm">
                          {selectedCountry === 'CA' ? (
                            <>
                              <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <CountryFlag code="CA" size="md" />
                                <span>🍁</span>
                                {language === 'es' ? '¿Cómo saber mi fin de año fiscal en Canadá?' : 'How to find your fiscal year end in Canada?'}
                              </p>
                              <ul className="space-y-2 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500">✓</span>
                                  <span>{language === 'es' 
                                    ? <><strong>Propietarios únicos / Partnerships:</strong> Generalmente es el 31 de diciembre</>
                                    : <><strong>Sole proprietors / Partnerships:</strong> Usually December 31</>}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500">📄</span>
                                  <span>{language === 'es' 
                                    ? <><strong>Corporaciones:</strong> Revisa tu "Notice of Assessment" del CRA o el formulario <strong>RC59</strong></>
                                    : <><strong>Corporations:</strong> Check your CRA "Notice of Assessment" or form <strong>RC59</strong></>}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-purple-500">📞</span>
                                  <span>{language === 'es' 
                                    ? <>También puedes llamar al <strong>CRA: 1-800-959-5525</strong></>
                                    : <>You can also call <strong>CRA: 1-800-959-5525</strong></>}</span>
                                </li>
                              </ul>
                              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 italic bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded">
                                💡 {language === 'es' 
                                  ? 'Si no estás seguro, usa el 31 de diciembre (es el más común para la mayoría de negocios)'
                                  : 'If unsure, use December 31 (most common for majority of businesses)'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <CountryFlag code="CL" size="md" />
                                <span>⭐</span>
                                {language === 'es' ? '¿Cómo saber mi fin de año fiscal en Chile?' : 'How to find your fiscal year end in Chile?'}
                              </p>
                              <ul className="space-y-2 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500">✓</span>
                                  <span>{language === 'es' 
                                    ? <><strong>En Chile SIEMPRE es el 31 de diciembre.</strong> El año tributario va del 1 de enero al 31 de diciembre.</>
                                    : <><strong>In Chile it's ALWAYS December 31.</strong> The tax year runs January 1 to December 31.</>}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500">🌐</span>
                                  <span>{language === 'es' 
                                    ? <>Puedes verificar tu situación en tu <strong>Carpeta Tributaria</strong> en <strong>sii.cl</strong></>
                                    : <>You can verify your status in your <strong>Tax Folder</strong> at <strong>sii.cl</strong></>}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-500">📅</span>
                                  <span>{language === 'es' 
                                    ? <>La declaración anual (<strong>Formulario 22</strong>) se presenta en abril del año siguiente</>
                                    : <>The annual return (<strong>Form 22</strong>) is filed in April of the following year</>}</span>
                                </li>
                              </ul>
                              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 italic bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded">
                                💡 {language === 'es' 
                                  ? 'Para todos los contribuyentes chilenos, simplemente selecciona diciembre'
                                  : 'For all Chilean taxpayers, simply select December'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
