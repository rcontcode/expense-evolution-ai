import { ExpenseFilters as Filters, ExpenseCategory, ExpenseStatus } from '@/types/expense.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useClients } from '@/hooks/data/useClients';
import { useTags } from '@/hooks/data/useTags';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.searchQuery || filters.category || filters.clientIds?.length || filters.statuses?.length || filters.tagIds?.length;

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendor, description..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.statuses?.[0] || 'all'} 
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="classified">Classified</SelectItem>
            <SelectItem value="deductible">Deductible</SelectItem>
            <SelectItem value="non_deductible">Non-Deductible</SelectItem>
            <SelectItem value="reimbursable">Reimbursable</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              <span>
                {filters.tagIds?.length ? `${filters.tagIds.length} tags` : 'Tags'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandEmpty>No tags found.</CommandEmpty>
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
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
