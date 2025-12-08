import { useForm } from 'react-hook-form';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormValues } from '@/lib/validations/expense.schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CalendarIcon, AlertTriangle, Building2, FileText, FolderKanban, Landmark, User, CheckCircle2, ArrowRight, Plus, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useContracts } from '@/hooks/data/useContracts';
import { ExpenseWithRelations } from '@/types/expense.types';
import { TagSelect } from '@/components/forms/TagSelect';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpenseFormProps {
  expense?: ExpenseWithRelations;
  onSubmit: (data: ExpenseFormValues & { tagIds?: string[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const REIMBURSEMENT_TYPES = [
  { value: 'pending_classification', label: 'Pendiente de clasificar', labelEn: 'Pending classification', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'client_reimbursable', label: 'Reembolsable por cliente', labelEn: 'Client reimbursable', icon: Building2, color: 'text-blue-500' },
  { value: 'cra_deductible', label: 'Deducible CRA', labelEn: 'CRA Deductible', icon: Landmark, color: 'text-green-500' },
  { value: 'personal', label: 'Personal (sin reembolso)', labelEn: 'Personal (no reimbursement)', icon: User, color: 'text-muted-foreground' },
];

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: contracts } = useContracts();
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
      project_id: expense?.project_id || undefined,
      contract_id: expense?.contract_id || undefined,
      status: expense?.status || 'pending',
      reimbursement_type: (expense?.reimbursement_type as any) || 'pending_classification',
    },
  });

  const selectedClientId = form.watch('client_id');
  const selectedReimbursementType = form.watch('reimbursement_type');

  // Filter projects and contracts by selected client
  const filteredProjects = useMemo(() => {
    if (!selectedClientId || selectedClientId === '__none__') return projects || [];
    return projects?.filter(p => p.client_id === selectedClientId) || [];
  }, [projects, selectedClientId]);

  const filteredContracts = useMemo(() => {
    if (!selectedClientId || selectedClientId === '__none__') return contracts || [];
    return contracts?.filter(c => c.client_id === selectedClientId) || [];
  }, [contracts, selectedClientId]);

  // Completeness validation for report generation
  const completenessIssues = useMemo(() => {
    const issues: string[] = [];
    
    if (selectedReimbursementType === 'client_reimbursable') {
      if (!selectedClientId || selectedClientId === '__none__') {
        issues.push(language === 'es' 
          ? 'Para reembolso de cliente se requiere seleccionar un cliente' 
          : 'Client reimbursement requires selecting a client');
      }
      if (filteredContracts.length === 0 && selectedClientId && selectedClientId !== '__none__') {
        issues.push(language === 'es' 
          ? 'Este cliente no tiene contratos registrados. Agregue un contrato con términos de reembolso.' 
          : 'This client has no contracts registered. Add a contract with reimbursement terms.');
      }
    }
    
    if (selectedReimbursementType === 'pending_classification') {
      issues.push(language === 'es' 
        ? 'Clasifique el tipo de reembolso para poder generar reportes' 
        : 'Classify the reimbursement type to generate reports');
    }
    
    return issues;
  }, [selectedReimbursementType, selectedClientId, filteredContracts, language]);

  const handleSubmit = (data: ExpenseFormValues) => {
    // Clear project and contract if no client selected
    const cleanedData = {
      ...data,
      client_id: data.client_id === '__none__' ? null : data.client_id,
      project_id: data.project_id === '__none__' ? null : data.project_id,
      contract_id: data.contract_id === '__none__' ? null : data.contract_id,
    };
    onSubmit({ ...cleanedData, tagIds: selectedTags });
  };

  // Reset project and contract when client changes
  const handleClientChange = (value: string) => {
    form.setValue('client_id', value);
    form.setValue('project_id', undefined);
    form.setValue('contract_id', undefined);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Completeness Tips - Non-blocking */}
        {completenessIssues.length > 0 && (
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">
                {language === 'es' ? 'Sugerencias para reportes (opcional):' : 'Suggestions for reports (optional):'}
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {completenessIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
              <p className="text-xs mt-2 opacity-75">
                {language === 'es' 
                  ? 'Puedes guardar ahora y completar esta información después.' 
                  : 'You can save now and complete this information later.'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Info Row */}
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
            name="reimbursement_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {language === 'es' ? 'Tipo de Reembolso' : 'Reimbursement Type'} *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'pending_classification'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REIMBURSEMENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', type.color)} />
                            <span>{language === 'es' ? type.label : type.labelEn}</span>
                          </div>
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

        {/* Client, Project, Contract Section */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {language === 'es' ? 'Asociación con Cliente' : 'Client Association'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {t('expenses.clientLabel')}
                  </FormLabel>
                  <Select onValueChange={handleClientChange} value={field.value || '__none__'}>
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

            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {language === 'es' ? 'Proyecto' : 'Project'}
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || '__none__'}
                    disabled={!selectedClientId || selectedClientId === '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar proyecto' : 'Select project'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('expenses.none')}</SelectItem>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredProjects.length === 0 && selectedClientId && selectedClientId !== '__none__' && (
                    <div className="flex items-center gap-2 mt-1.5 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                      <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                        {language === 'es' ? 'No hay proyectos para este cliente' : 'No projects for this client'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                        onClick={() => navigate('/settings?tab=projects')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Crear' : 'Create'}
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {language === 'es' ? 'Contrato' : 'Contract'}
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || '__none__'}
                    disabled={!selectedClientId || selectedClientId === '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar contrato' : 'Select contract'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('expenses.none')}</SelectItem>
                      {filteredContracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.title || contract.file_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredContracts.length === 0 && selectedClientId && selectedClientId !== '__none__' && (
                    <div className="flex items-center gap-2 mt-1.5 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                      <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                        {language === 'es' 
                          ? 'Sin contrato no se pueden verificar términos de reembolso' 
                          : 'Without contract, reimbursement terms cannot be verified'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                        onClick={() => navigate('/contracts')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {language === 'es' ? 'Subir' : 'Upload'}
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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

        {/* Report Readiness Indicator */}
        {completenessIssues.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            {language === 'es' 
              ? 'Este gasto tiene toda la información necesaria para generar reportes' 
              : 'This expense has all the information needed to generate reports'}
          </div>
        )}

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