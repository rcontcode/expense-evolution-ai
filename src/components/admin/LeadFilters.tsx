import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, MessageSquare, Flame, ThermometerSun, Snowflake, Globe } from 'lucide-react';
import type { LeadFilters as LeadFiltersType } from '@/hooks/admin/useLeadsManagement';

interface LeadFiltersProps {
  filters: LeadFiltersType;
  setFilters: (filters: LeadFiltersType) => void;
  resetFilters: () => void;
  countries: string[];
  levels: string[];
  situations?: string[];
  goals?: string[];
  obstacles?: string[];
}

export function LeadFilters({
  filters,
  setFilters,
  resetFilters,
  countries,
  levels,
  situations = [],
  goals = [],
  obstacles = [],
}: LeadFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.level ||
    filters.country ||
    filters.converted ||
    filters.hasComments ||
    filters.priority ||
    filters.situation ||
    filters.goal ||
    filters.obstacle ||
    filters.contacted ||
    filters.source ||
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
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 px-2">
            <X className="mr-1 h-3 w-3" />
            Limpiar
          </Button>
        )}
      </div>

      {/* First row - Main filters */}
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

        {/* Priority */}
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) => updateFilter('priority', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="hot">
              <span className="flex items-center gap-2">
                <Flame className="h-3 w-3 text-red-500" />
                HOT (80-100)
              </span>
            </SelectItem>
            <SelectItem value="warm">
              <span className="flex items-center gap-2">
                <ThermometerSun className="h-3 w-3 text-orange-500" />
                WARM (50-79)
              </span>
            </SelectItem>
            <SelectItem value="cool">
              <span className="flex items-center gap-2">
                <Snowflake className="h-3 w-3 text-blue-500" />
                COOL (25-49)
              </span>
            </SelectItem>
            <SelectItem value="cold">COLD (0-24)</SelectItem>
          </SelectContent>
        </Select>

        {/* Level */}
        <Select
          value={filters.level || 'all'}
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
          value={filters.country || 'all'}
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
      </div>

      {/* Second row - Status filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Contacted */}
        <Select
          value={filters.contacted || 'all'}
          onValueChange={(value) => updateFilter('contacted', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado de contacto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Contactados</SelectItem>
            <SelectItem value="no">Sin contactar</SelectItem>
          </SelectContent>
        </Select>

        {/* Converted */}
        <Select
          value={filters.converted || 'all'}
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

        {/* Has Comments */}
        <Select
          value={filters.hasComments || 'all'}
          onValueChange={(value) => updateFilter('hasComments', value === 'all' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Comentarios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-amber-500" />
                Con comentarios
              </span>
            </SelectItem>
            <SelectItem value="no">Sin comentarios</SelectItem>
          </SelectContent>
        </Select>

        {/* Situation */}
        {situations.length > 0 && (
          <Select
            value={filters.situation || 'all'}
            onValueChange={(value) => updateFilter('situation', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Situación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las situaciones</SelectItem>
              {situations.map((situation) => (
                <SelectItem key={situation} value={situation}>
                  {situation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Third row - Goals and Obstacles */}
      {(goals.length > 0 || obstacles.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.length > 0 && (
            <Select
              value={filters.goal || 'all'}
              onValueChange={(value) => updateFilter('goal', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las metas</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal} value={goal}>
                    {goal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {obstacles.length > 0 && (
            <Select
              value={filters.obstacle || 'all'}
              onValueChange={(value) => updateFilter('obstacle', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Obstáculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los obstáculos</SelectItem>
                {obstacles.map((obstacle) => (
                  <SelectItem key={obstacle} value={obstacle}>
                    {obstacle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

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
      </div>
    </div>
  );
}
