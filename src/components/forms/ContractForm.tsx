import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { contractFormSchema, type ContractFormSchema, CONTRACT_TYPES } from '@/lib/validations/contract.schema';
import { useClients } from '@/hooks/data/useClients';
import { Upload, CalendarIcon, FileText, DollarSign, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContractFormProps {
  onSubmit: (data: ContractFormSchema) => void;
  isSubmitting?: boolean;
}

export function ContractForm({ onSubmit, isSubmitting }: ContractFormProps) {
  const { t, language } = useLanguage();
  const { data: clients } = useClients();

  const form = useForm<ContractFormSchema>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contract_type: 'services',
      auto_renew: false,
      renewal_notice_days: 30,
      files: [],
    },
  });

  const selectedFiles = form.watch('files') || [];

  const handleFilesChange = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const currentFiles = form.getValues('files') || [];
    const filesArray = Array.from(newFiles);
    form.setValue('files', [...currentFiles, ...filesArray], { shouldValidate: true });
  };

  const removeFile = (index: number) => {
    const currentFiles = form.getValues('files') || [];
    const updated = currentFiles.filter((_, i) => i !== index);
    form.setValue('files', updated, { shouldValidate: true });
  };

  const dateLocale = language === 'es' ? es : enUS;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('contracts.contractFile')}
          </h3>

          <FormField
            control={form.control}
            name="files"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>{t('contracts.file')} *</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                      onChange={(e) => handleFilesChange(e.target.files)}
                      className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      {...field}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {t('contracts.fileFormats')} - {language === 'es' ? 'Puedes subir múltiples archivos' : 'You can upload multiple files'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contract Details Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('contracts.contractDetails')}
          </h3>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('contracts.formTitle')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('contracts.titlePlaceholder')} 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contract_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contracts.contractType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'services'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{language === 'es' ? type.label : type.labelEn}</span>
                          </span>
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
                  <FormLabel>{t('contracts.client')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('contracts.selectClient')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('contracts.startDate')}</FormLabel>
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
                            <span>{t('contracts.selectDate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('contracts.endDate')}</FormLabel>
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
                            <span>{t('contracts.indefinite')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
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
        </div>

        {/* Value & Renewal Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('contracts.valueRenewal')}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contracts.contractValue')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-7"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t('contracts.optional')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="renewal_notice_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contracts.noticeDays')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      value={field.value || 30}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('contracts.daysBeforeExpiry')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="auto_renew"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {t('contracts.autoRenewal')}
                  </FormLabel>
                  <FormDescription>
                    {t('contracts.autoRenewalDescription')}
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

        {/* Description Section */}
        <div className="space-y-4 border-t pt-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('contracts.descriptionTerms')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('contracts.descriptionPlaceholder')}
                    className="resize-none"
                    rows={4}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t('common.uploading') : t('contracts.upload')}
        </Button>
      </form>
    </Form>
  );
}