import { ExpenseFilters as Filters, ExpenseCategory, ExpenseStatus, ReimbursementType } from '@/types/expense.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Clock, FileCheck, Landmark, Ban, Building2, XCircle, AlertCircle, CheckCircle2, Filter, Receipt, AlertTriangle, User, Tag, ChevronDown, SlidersHorizontal } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Count active filters for mobile badge
  const activeFilterCount = [
    filters.onlyIncomplete,
    filters.reimbursementType,
    filters.statuses?.length,
    filters.hasReceipt,
    filters.category,
    filters.clientIds?.length,
    filters.tagIds?.length
  ].filter(Boolean).length;

  // Mobile: Compact collapsible layout
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 mb-3">
        {/* Row 1: Search + Filter button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'es' ? 'Buscar vendedor...' : 'Search vendor...'}
              value={filters.searchQuery || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Collapsible open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 relative shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="h-10 w-10 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Row 2: Quick filters - Incomplete only always visible + category select */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handleIncompleteFilterToggle}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border-2 shrink-0 min-h-[36px]',
              filters.onlyIncomplete 
                ? 'bg-destructive/10 text-destructive border-destructive/30 shadow-sm shadow-destructive/10' 
                : 'bg-secondary/60 text-muted-foreground border-border/40 hover:bg-secondary'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{language === 'es' ? 'Incompletos' : 'Incomplete'}</span>
          </button>
          
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="flex-1 h-9 text-xs">
              <SelectValue placeholder={language === 'es' ? 'Todas' : 'All'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'es' ? 'Todas las categorías' : 'All categories'}</SelectItem>
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
            <SelectTrigger className="flex-1 h-9 text-xs">
              <SelectValue placeholder={language === 'es' ? 'Todos' : 'All'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'es' ? 'Todos los clientes' : 'All clients'}</SelectItem>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collapsible: Advanced filters */}
        <Collapsible open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Reimbursement Type */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{language === 'es' ? 'Tipo Reembolso' : 'Reimb. Type'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {REIMBURSEMENT_FILTERS.map((type) => {
                  const Icon = type.icon;
                  const isActive = (filters.reimbursementType || 'all') === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleReimbursementTypeChange(type.value)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
                        isActive 
                          ? `${type.color} ring-1 ring-offset-1 ring-offset-background ring-primary/50` 
                          : 'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{language === 'es' ? type.label : type.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{language === 'es' ? 'Estado' : 'Status'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_STATUS_FILTERS.slice(0, 5).map((status) => {
                  const Icon = status.icon;
                  const isActive = activeStatus === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => handleQuickStatusFilter(status.value)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
                        isActive 
                          ? `${status.color} ring-1 ring-offset-1 ring-offset-background ring-primary/50` 
                          : 'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{language === 'es' ? status.label : status.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Receipt filter */}
            <div className="flex items-center gap-2">
              <Switch 
                checked={!!filters.hasReceipt} 
                onCheckedChange={handleReceiptFilterToggle}
              />
              <Label className="text-xs">{language === 'es' ? 'Solo con recibo' : 'With receipt only'}</Label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color || '#3B82F6' }}
                className="text-white text-xs cursor-pointer"
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Full layout
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={handleIncompleteFilterToggle}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 whitespace-nowrap shrink-0 shadow-sm',
            filters.onlyIncomplete 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-400 dark:border-red-600 shadow-md shadow-red-500/20 scale-[1.04]' 
              : 'bg-red-50/80 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200/60 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/30 hover:shadow-md hover:-translate-y-0.5'
          )}
        >
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{language === 'es' ? 'Incompletos para Reportes' : 'Incomplete for Reports'}</span>
          <span className="sm:hidden">{language === 'es' ? 'Incompletos' : 'Incomplete'}</span>
        </button>

        {/* Reimbursement Type Filter - Horizontal scroll on mobile */}
        {REIMBURSEMENT_FILTERS.map((type) => {
          const Icon = type.icon;
          const isActive = (filters.reimbursementType || 'all') === type.value;
          return (
            <button
              key={type.value}
              onClick={() => handleReimbursementTypeChange(type.value)}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 border-2',
                isActive 
                  ? `${type.color} border-current/30 shadow-md shadow-current/10 scale-[1.04]` 
                  : 'bg-secondary/60 text-muted-foreground border-border/40 hover:bg-secondary hover:shadow-sm hover:-translate-y-0.5'
              )}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{language === 'es' ? type.label : type.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Status Quick Filters - Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {QUICK_STATUS_FILTERS.map((status) => {
          const Icon = status.icon;
          const isActive = activeStatus === status.value;
          return (
            <button
              key={status.value}
              onClick={() => handleQuickStatusFilter(status.value)}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 border-2',
                isActive 
                  ? `${status.color} border-current/30 shadow-md shadow-current/10 scale-[1.04]` 
                  : 'bg-secondary/60 text-muted-foreground border-border/40 hover:bg-secondary hover:shadow-sm hover:-translate-y-0.5'
              )}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{language === 'es' ? status.label : status.labelEn}</span>
            </button>
          );
        })}
        
        {/* Receipt Filter */}
        <button
          onClick={handleReceiptFilterToggle}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 border-2',
            filters.hasReceipt 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-400/30 shadow-md shadow-purple-500/10 scale-[1.04]' 
              : 'bg-secondary/60 text-muted-foreground border-border/40 hover:bg-secondary hover:shadow-sm hover:-translate-y-0.5'
          )}
        >
          <Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>{language === 'es' ? 'Con Recibo' : 'With Receipt'}</span>
        </button>
      </div>

      {/* Row 3: Search + Dropdown Filters - Responsive layout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search - Full width on mobile */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'es' ? 'Buscar vendedor...' : 'Search vendor...'}
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Dropdown filters - Row on mobile, inline on desktop */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[130px] sm:w-[160px] h-9 shrink-0">
              <SelectValue placeholder={language === 'es' ? 'Categoría' : 'Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'es' ? 'Todas' : 'All'}</SelectItem>
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
            <SelectTrigger className="w-[130px] sm:w-[160px] h-9 shrink-0">
              <SelectValue placeholder={language === 'es' ? 'Cliente' : 'Client'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[130px] sm:w-[160px] h-9 justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm truncate">
                    {filters.tagIds?.length 
                      ? `${filters.tagIds.length} ${language === 'es' ? 'tags' : 'tags'}` 
                      : language === 'es' ? 'Etiquetas' : 'Tags'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 shrink-0">
              <X className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{language === 'es' ? 'Limpiar' : 'Clear'}</span>
            </Button>
          )}
        </div>
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
