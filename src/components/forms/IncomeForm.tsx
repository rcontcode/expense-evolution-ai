import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { INCOME_CATEGORIES, INCOME_GROUPS, RECURRENCE_OPTIONS } from '@/lib/constants/income-categories';
import { IncomeWithRelations, IncomeFormData, IncomeType, RecurrenceType } from '@/types/income.types';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon, DollarSign } from 'lucide-react';

const incomeSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().default('CAD'),
  date: z.date(),
  income_type: z.string(),
  description: z.string().optional(),
  source: z.string().optional(),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
  recurrence: z.string().default('one_time'),
  recurrence_end_date: z.date().optional().nullable(),
  is_taxable: z.boolean().default(true),
  notes: z.string().optional(),
});

interface IncomeFormProps {
  income?: IncomeWithRelations;
  onSubmit: (data: IncomeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IncomeForm({ income, onSubmit, onCancel, isLoading }: IncomeFormProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  const { data: clients } = useClients();
  const { data: projects } = useProjects('active');

  const form = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: income?.amount || 0,
      currency: income?.currency || 'CAD',
      date: income?.date ? new Date(income.date) : new Date(),
      income_type: income?.income_type || 'salary',
      description: income?.description || '',
      source: income?.source || '',
      client_id: income?.client_id || '',
      project_id: income?.project_id || '',
      recurrence: income?.recurrence || 'one_time',
      recurrence_end_date: income?.recurrence_end_date ? new Date(income.recurrence_end_date) : null,
      is_taxable: income?.is_taxable ?? true,
      notes: income?.notes || '',
    },
  });

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      income_type: data.income_type as IncomeType,
      recurrence: data.recurrence as RecurrenceType,
      client_id: data.client_id || undefined,
      project_id: data.project_id || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('income.amount')} *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('income.date')} *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t('income.selectDate')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={dateLocale}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Income Type */}
        <FormField
          control={form.control}
          name="income_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('income.type')} *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INCOME_GROUPS.map(group => (
                    <div key={group.key}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {language === 'es' ? group.label : group.labelEn}
                      </div>
                      {INCOME_CATEGORIES.filter(c => c.group === group.key).map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{language === 'es' ? cat.label : cat.labelEn}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Source and Description */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('income.source')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('income.sourcePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('income.client')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('income.selectClient')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">{t('common.none')}</SelectItem>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Project */}
        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('income.project')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('income.selectProject')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">{t('common.none')}</SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recurrence */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('income.recurrence')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {language === 'es' ? opt.label : opt.labelEn}
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
            name="is_taxable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-6">
                <div className="space-y-0.5">
                  <FormLabel>{t('income.taxable')}</FormLabel>
                  <FormDescription className="text-xs">
                    {t('income.taxableDescription')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('income.descriptionLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('income.descriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('income.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('income.notesPlaceholder')}
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : income ? t('common.update') : t('common.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
