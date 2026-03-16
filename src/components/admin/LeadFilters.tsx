import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, MessageSquare, Flame, ThermometerSun, Snowflake, Globe, Calendar, Tag, Target, MapPin, Zap } from 'lucide-react';
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
  allTags?: string[];
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
  allTags = [],
}: LeadFiltersProps) {
  const updateFilter = <K extends keyof LeadFiltersType>(
    key: K,
    value: LeadFiltersType[K]
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  // Compute active filter chips
  const activeFilters = useMemo(() => {
    const chips: { key: keyof LeadFiltersType; label: string; value: string }[] = [];
    if (filters.priority) chips.push({ key: 'priority', label: '🔥 Prioridad', value: filters.priority.toUpperCase() });
    if (filters.level) chips.push({ key: 'level', label: '📊 Nivel', value: filters.level });
    if (filters.country) chips.push({ key: 'country', label: '🌍 País', value: filters.country });
    if (filters.contacted) chips.push({ key: 'contacted', label: '📞 Contacto', value: filters.contacted === 'yes' ? 'Contactados' : 'Sin contactar' });
    if (filters.converted) chips.push({ key: 'converted', label: '✅ Conversión', value: filters.converted === 'yes' ? 'Convertidos' : 'No convertidos' });
    if (filters.hasComments) chips.push({ key: 'hasComments', label: '💬 Comentarios', value: filters.hasComments === 'yes' ? 'Con comentarios' : 'Sin comentarios' });
    if (filters.source) chips.push({ key: 'source', label: '🌐 Fuente', value: filters.source });
    if (filters.situation) chips.push({ key: 'situation', label: '📋 Situación', value: filters.situation });
    if (filters.goal) chips.push({ key: 'goal', label: '🎯 Meta', value: filters.goal });
    if (filters.obstacle) chips.push({ key: 'obstacle', label: '🚧 Obstáculo', value: filters.obstacle });
    if (filters.tag) chips.push({ key: 'tag', label: '🏷️ Tag', value: filters.tag });
    if (filters.dateFrom) chips.push({ key: 'dateFrom', label: '📅 Desde', value: filters.dateFrom });
    if (filters.dateTo) chips.push({ key: 'dateTo', label: '📅 Hasta', value: filters.dateTo });
    return chips;
  }, [filters]);

  const hasActiveFilters = activeFilters.length > 0 || !!filters.search;

  const removeFilter = (key: keyof LeadFiltersType) => {
    setFilters({ ...filters, [key]: '' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {activeFilters.length + (filters.search ? 1 : 0)} activos
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">
            <X className="mr-1 h-3 w-3" />
            Limpiar todo
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((chip) => (
            <Badge
              key={chip.key}
              variant="default"
              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer text-xs gap-1 pr-1"
              onClick={() => removeFilter(chip.key)}
            >
              {chip.label}: {chip.value}
              <X className="h-3 w-3 ml-0.5" />
            </Badge>
          ))}
        </div>
      )}

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

      {/* Row 1 — Key filters with labels */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3" /> Prioridad
          </Label>
          <Select value={filters.priority || 'all'} onValueChange={(v) => updateFilter('priority', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="hot">
                <span className="flex items-center gap-2"><Flame className="h-3 w-3 text-red-500" /> HOT (80-100)</span>
              </SelectItem>
              <SelectItem value="warm">
                <span className="flex items-center gap-2"><ThermometerSun className="h-3 w-3 text-orange-500" /> WARM (50-79)</span>
              </SelectItem>
              <SelectItem value="cool">
                <span className="flex items-center gap-2"><Snowflake className="h-3 w-3 text-blue-500" /> COOL (25-49)</span>
              </SelectItem>
              <SelectItem value="cold">COLD (0-24)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" /> Nivel del Quiz
          </Label>
          <Select value={filters.level || 'all'} onValueChange={(v) => updateFilter('level', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> País
          </Label>
          <Select value={filters.country || 'all'} onValueChange={(v) => updateFilter('country', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" /> Fuente
          </Label>
          <Select value={filters.source || 'all'} onValueChange={(v) => updateFilter('source', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="evofinz">
                <span className="flex items-center gap-2"><Globe className="h-3 w-3 text-emerald-500" /> EvoFinz</span>
              </SelectItem>
              <SelectItem value="fokuspark">
                <span className="flex items-center gap-2"><Globe className="h-3 w-3 text-violet-500" /> Fokuspark</span>
              </SelectItem>
              <SelectItem value="universmind">
                <span className="flex items-center gap-2"><Globe className="h-3 w-3 text-pink-500" /> Universmind</span>
              </SelectItem>
              <SelectItem value="trustlyconnect">
                <span className="flex items-center gap-2"><Globe className="h-3 w-3 text-sky-500" /> TrustlyConnect</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2 — Status filters */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">📞 Estado de contacto</Label>
          <Select value={filters.contacted || 'all'} onValueChange={(v) => updateFilter('contacted', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">✅ Contactados</SelectItem>
              <SelectItem value="no">⏳ Sin contactar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">✅ Conversión</Label>
          <Select value={filters.converted || 'all'} onValueChange={(v) => updateFilter('converted', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">✅ Convertidos</SelectItem>
              <SelectItem value="no">❌ No convertidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">💬 Comentarios</Label>
          <Select value={filters.hasComments || 'all'} onValueChange={(v) => updateFilter('hasComments', v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">
                <span className="flex items-center gap-2"><MessageSquare className="h-3 w-3 text-amber-500" /> Con comentarios</span>
              </SelectItem>
              <SelectItem value="no">Sin comentarios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3 — Quiz context filters */}
      {(situations.length > 0 || goals.length > 0 || obstacles.length > 0 || allTags.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {situations.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">📋 Situación</Label>
              <Select value={filters.situation || 'all'} onValueChange={(v) => updateFilter('situation', v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {situations.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {goals.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Meta
              </Label>
              <Select value={filters.goal || 'all'} onValueChange={(v) => updateFilter('goal', v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {obstacles.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">🚧 Obstáculo</Label>
              <Select value={filters.obstacle || 'all'} onValueChange={(v) => updateFilter('obstacle', v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {obstacles.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {allTags.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Etiqueta
              </Label>
              <Select value={filters.tag || 'all'} onValueChange={(v) => updateFilter('tag', v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>🏷️ {tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Desde
          </Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="w-auto h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Hasta
          </Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="w-auto h-9"
          />
        </div>
      </div>
    </div>
  );
}
