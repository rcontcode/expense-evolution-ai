import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2, FolderKanban, FileText, Sparkles, CheckCircle2, AlertTriangle, Loader2, Filter, Calendar, X } from 'lucide-react';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useContracts } from '@/hooks/data/useContracts';
import { useUpdateExpense } from '@/hooks/data/useExpenses';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { getCategoryLabel, EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { cn } from '@/lib/utils';

interface BulkAssignDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: ExpenseWithRelations[];
}

export function BulkAssignDialog({ open, onClose, expenses }: BulkAssignDialogProps) {
  const { language } = useLanguage();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: contracts } = useContracts();
  const updateExpense = useUpdateExpense();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [contractId, setContractId] = useState<string>('');
  const [reimbursementType, setReimbursementType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Get unique categories from expenses
  const availableCategories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [expenses]);

  // Filter unassigned or pending expenses with category and date filters
  const unassignedExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Must be unassigned or pending
      if (e.client_id && (e as any).reimbursement_type !== 'pending_classification') {
        return false;
      }
      
      // Category filter
      if (categoryFilter && categoryFilter !== '__all__' && e.category !== categoryFilter) {
        return false;
      }
      
      // Date range filter
      if (dateFrom || dateTo) {
        const expenseDate = parseISO(e.date);
        if (dateFrom && dateTo) {
          if (!isWithinInterval(expenseDate, { start: parseISO(dateFrom), end: parseISO(dateTo) })) {
            return false;
          }
        } else if (dateFrom && expenseDate < parseISO(dateFrom)) {
          return false;
        } else if (dateTo && expenseDate > parseISO(dateTo)) {
          return false;
        }
      }
      
      return true;
    });
  }, [expenses, categoryFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = (categoryFilter && categoryFilter !== '__all__') || dateFrom || dateTo;

  // Filter projects and contracts by selected client
  const filteredProjects = useMemo(() => {
    if (!clientId) return [];
    return projects?.filter(p => p.client_id === clientId) || [];
  }, [projects, clientId]);

  const filteredContracts = useMemo(() => {
    if (!clientId) return [];
    return contracts?.filter(c => c.client_id === clientId) || [];
  }, [contracts, clientId]);

  const toggleExpense = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === unassignedExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unassignedExpenses.map(e => e.id)));
    }
  };

  const handleApply = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: language === 'es' ? 'Selecciona gastos' : 'Select expenses',
        description: language === 'es' ? 'Debes seleccionar al menos un gasto.' : 'You must select at least one expense.',
        variant: 'destructive',
      });
      return;
    }

    if (!clientId && !reimbursementType) {
      toast({
        title: language === 'es' ? 'Selecciona asignación' : 'Select assignment',
        description: language === 'es' ? 'Debes seleccionar cliente o tipo de reembolso.' : 'You must select a client or reimbursement type.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const updates: Record<string, any> = {};
      if (clientId) updates.client_id = clientId;
      if (projectId) updates.project_id = projectId;
      if (contractId) updates.contract_id = contractId;
      if (reimbursementType) updates.reimbursement_type = reimbursementType;

      // Update each selected expense
      for (const id of selectedIds) {
        await updateExpense.mutateAsync({ id, updates });
      }

      toast({
        title: language === 'es' ? 'Gastos actualizados' : 'Expenses updated',
        description: language === 'es' 
          ? `${selectedIds.size} gastos asignados correctamente.`
          : `${selectedIds.size} expenses assigned successfully.`,
      });

      // Reset and close
      setSelectedIds(new Set());
      setClientId('');
      setProjectId('');
      setContractId('');
      setReimbursementType('');
      onClose();
    } catch (error) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Error al actualizar gastos.' : 'Error updating expenses.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setClientId('');
    setProjectId('');
    setContractId('');
    setReimbursementType('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Asignación Masiva' : 'Bulk Assignment'}
          </DialogTitle>
          <DialogDescription>
            {language === 'es' 
              ? 'Asigna cliente, proyecto y contrato a múltiples gastos a la vez.'
              : 'Assign client, project, and contract to multiple expenses at once.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Assignment Options */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="col-span-2">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {language === 'es' ? 'Asignar a:' : 'Assign to:'}
              </h4>
            </div>

            <div className="space-y-2">
              <Label>{language === 'es' ? 'Cliente' : 'Client'}</Label>
              <Select value={clientId} onValueChange={(v) => {
                setClientId(v);
                setProjectId('');
                setContractId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar cliente...' : 'Select client...'} />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'es' ? 'Tipo de Reembolso' : 'Reimbursement Type'}</Label>
              <Select value={reimbursementType} onValueChange={setReimbursementType}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar tipo...' : 'Select type...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_reimbursable">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      {language === 'es' ? 'Reembolsable por cliente' : 'Client reimbursable'}
                    </div>
                  </SelectItem>
                  <SelectItem value="cra_deductible">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      {language === 'es' ? 'Deducible CRA' : 'CRA Deductible'}
                    </div>
                  </SelectItem>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      {language === 'es' ? 'Personal' : 'Personal'}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clientId && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {language === 'es' ? 'Proyecto' : 'Project'}
                  </Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'es' ? 'Opcional...' : 'Optional...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {language === 'es' ? 'Sin proyectos' : 'No projects'}
                        </div>
                      ) : (
                        filteredProjects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {language === 'es' ? 'Contrato' : 'Contract'}
                  </Label>
                  <Select value={contractId} onValueChange={setContractId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'es' ? 'Opcional...' : 'Optional...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredContracts.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {language === 'es' ? 'Sin contratos' : 'No contracts'}
                        </div>
                      ) : (
                        filteredContracts.map(contract => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.title || contract.file_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Contract Suggestion Alert */}
          {clientId && filteredContracts.some(c => c.user_notes) && (
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <Sparkles className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <strong>{language === 'es' ? 'Sugerencia del contrato:' : 'Contract suggestion:'}</strong>{' '}
                {filteredContracts.find(c => c.user_notes)?.user_notes}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Filters */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {language === 'es' ? 'Filtros rápidos' : 'Quick Filters'}
              </h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Limpiar' : 'Clear'}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{language === 'es' ? 'Categoría' : 'Category'}</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={language === 'es' ? 'Todas...' : 'All...'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{language === 'es' ? 'Todas las categorías' : 'All categories'}</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryLabel(cat as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === 'es' ? 'Desde' : 'From'}
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === 'es' ? 'Hasta' : 'To'}
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {categoryFilter && categoryFilter !== '__all__' && (
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(categoryFilter as any)}
                    <button onClick={() => setCategoryFilter('__all__')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="text-xs">
                    {language === 'es' ? 'Desde:' : 'From:'} {format(parseISO(dateFrom), 'PP')}
                    <button onClick={() => setDateFrom('')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="text-xs">
                    {language === 'es' ? 'Hasta:' : 'To:'} {format(parseISO(dateTo), 'PP')}
                    <button onClick={() => setDateTo('')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Expense List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {language === 'es' ? 'Gastos sin asignar' : 'Unassigned Expenses'} ({unassignedExpenses.length})
                {hasActiveFilters && (
                  <span className="text-muted-foreground ml-1">
                    ({language === 'es' ? 'filtrados' : 'filtered'})
                  </span>
                )}
              </h4>
              <Button variant="outline" size="sm" onClick={selectAll} disabled={unassignedExpenses.length === 0}>
                {selectedIds.size === unassignedExpenses.length && unassignedExpenses.length > 0
                  ? (language === 'es' ? 'Deseleccionar todo' : 'Deselect all')
                  : (language === 'es' ? 'Seleccionar todo' : 'Select all')
                }
              </Button>
            </div>

            {unassignedExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>{language === 'es' ? '¡Todos los gastos están asignados!' : 'All expenses are assigned!'}</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                {unassignedExpenses.map(expense => (
                  <div 
                    key={expense.id} 
                    className={cn(
                      "flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      selectedIds.has(expense.id) && "bg-primary/10"
                    )}
                    onClick={() => toggleExpense(expense.id)}
                  >
                    <Checkbox 
                      checked={selectedIds.has(expense.id)} 
                      onCheckedChange={() => toggleExpense(expense.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{expense.vendor}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {getCategoryLabel(expense.category as any)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(expense.date + 'T12:00:00'), 'PP')}
                        {expense.description && ` • ${expense.description}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-medium">${Number(expense.amount).toFixed(2)}</span>
                      {!expense.client_id && (
                        <div className="text-xs text-yellow-600">
                          {language === 'es' ? 'Sin cliente' : 'No client'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} {language === 'es' ? 'gastos seleccionados' : 'expenses selected'}
              </span>
              <span className="font-bold">
                ${unassignedExpenses
                  .filter(e => selectedIds.has(e.id))
                  .reduce((sum, e) => sum + Number(e.amount), 0)
                  .toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={selectedIds.size === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'es' ? 'Aplicando...' : 'Applying...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Aplicar a seleccionados' : 'Apply to selected'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}