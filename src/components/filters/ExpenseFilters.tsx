import { ExpenseFilters as Filters, ExpenseCategory, ExpenseStatus } from '@/types/expense.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Clock, FileCheck, Landmark, Ban, Building2, XCircle, AlertCircle, CheckCircle2, Filter, Receipt } from 'lucide-react';
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

const QUICK_STATUS_FILTERS = [
  { value: 'all', label: 'Todos', icon: Filter, color: 'bg-muted text-muted-foreground' },
  { value: 'pending', label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' },
  { value: 'classified', label: 'Clasificado', icon: FileCheck, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500' },
  { value: 'deductible', label: 'Deducible CRA', icon: Landmark, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' },
  { value: 'reimbursable', label: 'Reembolsable', icon: Building2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500' },
  { value: 'non_deductible', label: 'No Deducible', icon: Ban, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500' },
  { value: 'under_review', label: 'En Revisión', icon: AlertCircle, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500' },
  { value: 'finalized', label: 'Finalizado', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
] as const;

interface ExpenseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ExpenseFilters({ filters, onChange }: ExpenseFiltersProps) {
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

  const handleReceiptFilterToggle = () => {
    onChange({ ...filters, hasReceipt: filters.hasReceipt ? undefined : true });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.searchQuery || filters.category || filters.clientIds?.length || filters.statuses?.length || filters.tagIds?.length || filters.hasReceipt;

  const handleQuickStatusFilter = (value: string) => {
    onChange({ 
      ...filters, 
      statuses: value === 'all' ? undefined : [value as ExpenseStatus] 
    });
  };

  const activeStatus = filters.statuses?.[0] || 'all';

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Quick Status Filters */}
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
              <span>{status.label}</span>
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
          <span>Con Recibo</span>
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
            <Button variant="outline" className="w-[180px] justify-between">
              <span>
                {filters.tagIds?.length ? `${filters.tagIds.length} etiquetas` : 'Etiquetas'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar etiquetas..." />
              <CommandEmpty>No se encontraron etiquetas.</CommandEmpty>
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
    </div>
  );
}
