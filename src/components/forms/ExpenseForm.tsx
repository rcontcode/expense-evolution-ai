import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormValues } from '@/lib/validations/expense.schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { useClients } from '@/hooks/data/useClients';
import { ExpenseWithRelations } from '@/types/expense.types';
import { TagSelect } from '@/components/forms/TagSelect';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpenseFormProps {
  expense?: ExpenseWithRelations;
  onSubmit: (data: ExpenseFormValues & { tagIds?: string[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const { t } = useLanguage();
  const { data: clients } = useClients();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    expense?.tags?.map(tag => tag.id) || []
  );

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: expense?.date ? new Date(expense.date) : new Date(),
      vendor: expense?.vendor || '',
      amount: expense?.amount ? Number(expense.amount) : 0,
      category: (expense?.category as any) || 'other',
      description: expense?.description || '',
      notes: expense?.notes || '',
      client_id: expense?.client_id || undefined,
      status: expense?.status || 'pending',
    },
  });

  const handleSubmit = (data: ExpenseFormValues) => {
    onSubmit({ ...data, tagIds: selectedTags });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('expenses.dateLabel')} *</FormLabel>
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
                        {field.value ? format(field.value, 'PPP') : <span>{t('expenses.pickDate')}</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.amountLabel')} *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t('expenses.amountPlaceholder')}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.vendorLabel')} *</FormLabel>
              <FormControl>
                <Input placeholder={t('expenses.vendorPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.categoryLabel')} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.selectCategory')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
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
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.clientLabel')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || '__none__'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.selectClient')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">{t('expenses.none')}</SelectItem>
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.descriptionLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('expenses.descriptionPlaceholder')}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.notesLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('expenses.notesPlaceholder')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('expenses.statusLabel')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'pending'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">{t('expenseStatuses.pending')}</SelectItem>
                    <SelectItem value="classified">{t('expenseStatuses.classified')}</SelectItem>
                    <SelectItem value="deductible">{t('expenseStatuses.deductible')}</SelectItem>
                    <SelectItem value="non_deductible">{t('expenseStatuses.non_deductible')}</SelectItem>
                    <SelectItem value="reimbursable">{t('expenseStatuses.reimbursable')}</SelectItem>
                    <SelectItem value="rejected">{t('expenseStatuses.rejected')}</SelectItem>
                    <SelectItem value="under_review">{t('expenseStatuses.under_review')}</SelectItem>
                    <SelectItem value="finalized">{t('expenseStatuses.finalized')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">{t('expenses.tagsLabel')}</label>
            <TagSelect value={selectedTags} onChange={setSelectedTags} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : expense ? t('common.update') : t('common.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
