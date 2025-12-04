import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { mileageSchema, MileageFormValues } from '@/lib/validations/mileage.schema';
import { useClients } from '@/hooks/data/useClients';
import { useLanguage } from '@/contexts/LanguageContext';
import { MileageWithClient, calculateMileageDeduction, CRA_MILEAGE_RATES } from '@/hooks/data/useMileage';

interface MileageFormProps {
  initialData?: MileageWithClient | null;
  yearToDateKm?: number;
  onSubmit: (data: MileageFormValues) => void;
  isLoading?: boolean;
}

export const MileageForm = ({ initialData, yearToDateKm = 0, onSubmit, isLoading }: MileageFormProps) => {
  const { t } = useLanguage();
  const { data: clients } = useClients();

  const form = useForm<MileageFormValues>({
    resolver: zodResolver(mileageSchema),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      kilometers: initialData?.kilometers ? parseFloat(initialData.kilometers.toString()) : undefined,
      route: initialData?.route || '',
      purpose: initialData?.purpose || '',
      client_id: initialData?.client_id || undefined,
    },
  });

  const watchKilometers = form.watch('kilometers');
  const estimatedDeduction = watchKilometers 
    ? calculateMileageDeduction(watchKilometers, yearToDateKm)
    : { deductible: 0, rate: CRA_MILEAGE_RATES.first5000 };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('mileage.date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('mileage.pickDate')}</span>
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
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kilometers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('mileage.kilometers')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mileage.route')}</FormLabel>
              <FormControl>
                <Input placeholder={t('mileage.routePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mileage.purpose')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('mileage.purposePlaceholder')} 
                  className="resize-none"
                  {...field} 
                />
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
              <FormLabel>{t('mileage.client')}</FormLabel>
              <Select
                value={field.value || 'none'}
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('mileage.selectClient')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t('common.none')}</SelectItem>
                  {clients?.map((client) => (
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

        {/* Deduction Preview */}
        {watchKilometers > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm">{t('mileage.deductionPreview')}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t('mileage.estimatedDeduction')}</span>
              <span className="font-bold text-chart-1">${estimatedDeduction.deductible.toFixed(2)}</span>
              <span className="text-muted-foreground">{t('mileage.rateApplied')}</span>
              <span>${estimatedDeduction.rate.toFixed(2)}/km</span>
              <span className="text-muted-foreground">{t('mileage.yearToDateKm')}</span>
              <span>{yearToDateKm.toFixed(1)} km</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('mileage.craRateNote')}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
