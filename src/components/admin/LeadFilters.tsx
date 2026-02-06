import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import type { LeadFilters as LeadFiltersType } from '@/hooks/admin/useLeadsManagement';

interface LeadFiltersProps {
  filters: LeadFiltersType;
  setFilters: (filters: LeadFiltersType) => void;
  resetFilters: () => void;
  countries: string[];
  levels: string[];
}

export function LeadFilters({
  filters,
  setFilters,
  resetFilters,
  countries,
  levels,
}: LeadFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.level ||
    filters.country ||
    filters.converted ||
    filters.dateFrom ||
    filters.dateTo;

  const updateFilter = <K extends keyof LeadFiltersType>(
    key: K,
    value: LeadFiltersType[K]
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtros</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Level */}
        <Select
          value={filters.level}
          onValueChange={(value) => updateFilter('level', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nivel del quiz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Country */}
        <Select
          value={filters.country}
          onValueChange={(value) => updateFilter('country', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los países</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Converted */}
        <Select
          value={filters.converted}
          onValueChange={(value) => updateFilter('converted', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado de conversión" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Convertidos</SelectItem>
            <SelectItem value="no">No convertidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Desde:</span>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hasta:</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="w-auto"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="mr-1 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
