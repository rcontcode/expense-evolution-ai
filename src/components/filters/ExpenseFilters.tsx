import { ExpenseFilters as Filters, ExpenseCategory, ExpenseStatus } from '@/types/expense.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useClients } from '@/hooks/data/useClients';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';

interface ExpenseFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ExpenseFilters({ filters, onChange }: ExpenseFiltersProps) {
  const { data: clients } = useClients();

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

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.searchQuery || filters.category || filters.clientIds?.length || filters.statuses?.length;

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
