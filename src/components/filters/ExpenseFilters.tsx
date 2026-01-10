import { ExpenseFilters as Filters, ExpenseCategory, ExpenseStatus, ReimbursementType } from '@/types/expense.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Clock, FileCheck, Landmark, Ban, Building2, XCircle, AlertCircle, CheckCircle2, Filter, Receipt, AlertTriangle, User, Tag } from 'lucide-react';
import { useClients } from '@/hooks/data/useClients';
import { useTags } from '@/hooks/data/useTags';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const QUICK_STATUS_FILTERS = [
  { value: 'all', label: 'Todos', labelEn: 'All', icon: Filter, color: 'bg-muted text-muted-foreground' },
  { value: 'pending', label: 'Pendiente', labelEn: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' },
  { value: 'classified', label: 'Clasificado', labelEn: 'Classified', icon: FileCheck, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500' },
  { value: 'deductible', label: 'Deducible Fiscal', labelEn: 'Tax Deductible', icon: Landmark, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' },
  { value: 'reimbursable', label: 'Reembolsable', labelEn: 'Reimbursable', icon: Building2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500' },
  { value: 'non_deductible', label: 'No Deducible', labelEn: 'Non Deductible', icon: Ban, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500' },
  { value: 'under_review', label: 'En Revisión', labelEn: 'Under Review', icon: AlertCircle, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500' },
  { value: 'finalized', label: 'Finalizado', labelEn: 'Finalized', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
] as const;

const REIMBURSEMENT_FILTERS = [
  { value: 'all', label: 'Todos', labelEn: 'All', icon: Filter, color: 'bg-muted text-muted-foreground' },
  { value: 'pending_classification', label: 'Sin clasificar', labelEn: 'Unclassified', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' },
  { value: 'client_reimbursable', label: 'Cliente', labelEn: 'Client', icon: Building2, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500' },
  { value: 'cra_deductible', label: 'CRA', labelEn: 'CRA', icon: Landmark, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' },
  { value: 'personal', label: 'Personal', labelEn: 'Personal', icon: User, color: 'bg-muted text-muted-foreground' },
] as const;

interface ExpenseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ExpenseFilters({ filters, onChange }: ExpenseFiltersProps) {
  const { language } = useLanguage();
  const { data: clients } = useClients();
  const { data: tags } = useTags();
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onChange({ ...filters, searchQuery: value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, category: value === 'all' ? undefined : (value as ExpenseCategory) });
  };

  const handleClientChange = (value: string) => {
    onChange({ 
      ...filters, 
      clientIds: value === 'all' ? undefined : [value] 
    });
  };

  const handleStatusChange = (value: string) => {
    onChange({ 
      ...filters, 
      statuses: value === 'all' ? undefined : [value as ExpenseStatus] 
    });
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    onChange({ ...filters, tagIds: newTags.length > 0 ? newTags : undefined });
  };

  const handleTagFilterModeToggle = () => {
    const newMode = filters.tagFilterMode === 'AND' ? 'OR' : 'AND';
    onChange({ ...filters, tagFilterMode: newMode });
  };

  const handleReceiptFilterToggle = () => {
    onChange({ ...filters, hasReceipt: filters.hasReceipt ? undefined : true });
  };

  const handleIncompleteFilterToggle = () => {
    onChange({ ...filters, onlyIncomplete: filters.onlyIncomplete ? undefined : true });
  };

  const handleReimbursementTypeChange = (value: string) => {
    onChange({ 
      ...filters, 
      reimbursementType: value === 'all' ? undefined : (value as ReimbursementType) 
    });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.searchQuery || filters.category || filters.clientIds?.length || filters.statuses?.length || filters.tagIds?.length || filters.hasReceipt || filters.onlyIncomplete || filters.reimbursementType;

  const handleQuickStatusFilter = (value: string) => {
    onChange({ 
      ...filters, 
      statuses: value === 'all' ? undefined : [value as ExpenseStatus] 
    });
  };

  const activeStatus = filters.statuses?.[0] || 'all';
  const selectedTags = tags?.filter(t => filters.tagIds?.includes(t.id)) || [];
  const tagFilterMode = filters.tagFilterMode || 'OR';

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Incomplete Filter - Prominent */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleIncompleteFilterToggle}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
            filters.onlyIncomplete 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700 ring-2 ring-offset-2 ring-offset-background ring-red-500/50' 
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{language === 'es' ? 'Incompletos para Reportes' : 'Incomplete for Reports'}</span>
        </button>

        {/* Reimbursement Type Filter - Including "All" */}
        {REIMBURSEMENT_FILTERS.map((type) => {
          const Icon = type.icon;
          const isActive = (filters.reimbursementType || 'all') === type.value;
          return (
            <button
              key={type.value}
              onClick={() => handleReimbursementTypeChange(type.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                isActive 
                  ? `${type.color} ring-2 ring-offset-2 ring-offset-background ring-primary/50` 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{language === 'es' ? type.label : type.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Status Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_STATUS_FILTERS.map((status) => {
          const Icon = status.icon;
          const isActive = activeStatus === status.value;
          return (
            <button
              key={status.value}
              onClick={() => handleQuickStatusFilter(status.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                isActive 
                  ? `${status.color} ring-2 ring-offset-2 ring-offset-background ring-primary/50` 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{language === 'es' ? status.label : status.labelEn}</span>
            </button>
          );
        })}
        
        {/* Receipt Filter */}
        <button
          onClick={handleReceiptFilterToggle}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            filters.hasReceipt 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-2 ring-offset-2 ring-offset-background ring-primary/50' 
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>{language === 'es' ? 'Con Recibo' : 'With Receipt'}</span>
        </button>
      </div>

      {/* Other Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vendedor, descripción..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Categorías</SelectItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.clientIds?.[0] || 'all'} 
          onValueChange={handleClientChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Clientes</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>
                  {filters.tagIds?.length 
                    ? `${filters.tagIds.length} ${language === 'es' ? 'etiquetas' : 'tags'}` 
                    : language === 'es' ? 'Etiquetas' : 'Tags'}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder={language === 'es' ? 'Buscar etiquetas...' : 'Search tags...'} />
              <CommandEmpty>{language === 'es' ? 'No se encontraron etiquetas.' : 'No tags found.'}</CommandEmpty>
              
              {/* AND/OR Toggle */}
              {(filters.tagIds?.length || 0) > 0 && (
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      {language === 'es' ? 'Modo de filtro:' : 'Filter mode:'}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", tagFilterMode === 'OR' && "text-primary")}>OR</span>
                    <Switch 
                      checked={tagFilterMode === 'AND'}
                      onCheckedChange={handleTagFilterModeToggle}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className={cn("text-xs font-medium", tagFilterMode === 'AND' && "text-primary")}>AND</span>
                  </div>
                </div>
              )}

              {/* Help Text */}
              {(filters.tagIds?.length || 0) > 1 && (
                <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30 border-b">
                  {tagFilterMode === 'AND' 
                    ? (language === 'es' ? '✓ Muestra gastos con TODAS las etiquetas seleccionadas' : '✓ Shows expenses with ALL selected tags')
                    : (language === 'es' ? '✓ Muestra gastos con CUALQUIERA de las etiquetas' : '✓ Shows expenses with ANY of the selected tags')
                  }
                </div>
              )}

              <CommandGroup>
                {tags?.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleTagToggle(tag.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        filters.tagIds?.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Badge
                      style={{ backgroundColor: tag.color || '#3B82F6' }}
                      className="text-white"
                    >
                      {tag.name}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Selected Tags Display with AND/OR indicator */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {language === 'es' ? 'Filtrado por:' : 'Filtered by:'}
          </span>
          {selectedTags.map((tag, idx) => (
            <div key={tag.id} className="flex items-center gap-1">
              {idx > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  tagFilterMode === 'AND' 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" 
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                )}>
                  {tagFilterMode}
                </span>
              )}
              <Badge
                style={{ backgroundColor: tag.color || '#3B82F6' }}
                className="text-white text-xs cursor-pointer hover:opacity-80"
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
