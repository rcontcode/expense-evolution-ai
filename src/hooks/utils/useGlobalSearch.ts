import { useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useIncome } from '@/hooks/data/useIncome';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useContracts } from '@/hooks/data/useContracts';
import { useMileage } from '@/hooks/data/useMileage';
import { useTags } from '@/hooks/data/useTags';

export interface SearchResult {
  id: string;
  type: 'expense' | 'client' | 'project' | 'income' | 'bill' | 'contract' | 'mileage' | 'tag';
  title: string;
  subtitle?: string;
  path: string;
  score: number;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function scoreMatch(searchTerm: string, text: string): number {
  const normalizedSearch = normalize(searchTerm);
  const normalizedText = normalize(text);
  if (normalizedText === normalizedSearch) return 100;
  if (normalizedText.startsWith(normalizedSearch)) return 80;
  if (normalizedText.includes(normalizedSearch)) return 60;
  const searchWords = normalizedSearch.split(/\s+/);
  if (searchWords.every(word => normalizedText.includes(word))) return 40;
  return 0;
}

export function useGlobalSearch(query: string, maxResults = 5) {
  const debouncedQuery = useDebounce(query.trim(), 150);

  const { data: expenses, isLoading: l1 } = useExpenses();
  const { data: clients, isLoading: l2 } = useClients();
  const { data: projects, isLoading: l3 } = useProjects();
  const { data: income, isLoading: l4 } = useIncome();
  const { data: bills, isLoading: l5 } = useRecurringBills();
  const { data: contracts, isLoading: l6 } = useContracts();
  const { data: mileage, isLoading: l7 } = useMileage();
  const { data: tags, isLoading: l8 } = useTags();

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

  const results = useMemo(() => {
    const empty = {
      expenses: [] as SearchResult[], clients: [] as SearchResult[],
      projects: [] as SearchResult[], income: [] as SearchResult[],
      bills: [] as SearchResult[], contracts: [] as SearchResult[],
      mileage: [] as SearchResult[], tags: [] as SearchResult[],
    };
    if (!debouncedQuery || debouncedQuery.length < 2) return empty;

    const search = (items: any[] | undefined | null, cfg: {
      type: SearchResult['type'];
      fields: (item: any) => string[];
      title: (item: any) => string;
      subtitle?: (item: any) => string | undefined;
      pathPrefix: string;
    }) => {
      return (items || [])
        .map(item => {
          const texts = cfg.fields(item);
          const maxScore = Math.max(...texts.map(t => t ? scoreMatch(debouncedQuery, t) : 0));
          if (maxScore === 0) return null;
          return {
            id: item.id, type: cfg.type, title: cfg.title(item),
            subtitle: cfg.subtitle?.(item), path: `${cfg.pathPrefix}?highlight=${item.id}`, score: maxScore,
          } as SearchResult;
        })
        .filter((r): r is SearchResult => r !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    };

    return {
      expenses: search(expenses, {
        type: 'expense', fields: e => [e.vendor, e.description, e.notes],
        title: e => e.vendor || 'Sin proveedor',
        subtitle: e => e.amount ? `$${e.amount.toFixed(2)} - ${e.date}` : e.date,
        pathPrefix: '/expenses',
      }),
      clients: search(clients, {
        type: 'client', fields: c => [c.name, c.contact_email, c.notes],
        title: c => c.name, subtitle: c => c.contact_email || undefined,
        pathPrefix: '/clients',
      }),
      projects: search(projects, {
        type: 'project', fields: p => [p.name, p.description, p.client?.name],
        title: p => p.name, subtitle: p => p.client?.name || p.status,
        pathPrefix: '/projects',
      }),
      income: search(income, {
        type: 'income', fields: i => [i.source, i.description, i.notes],
        title: i => i.source || i.description || 'Ingreso',
        subtitle: i => i.amount ? `$${Number(i.amount).toFixed(2)} - ${i.date}` : i.date,
        pathPrefix: '/income',
      }),
      bills: search(bills, {
        type: 'bill', fields: b => [b.name, b.vendor, b.notes],
        title: b => b.name || b.vendor || 'Factura',
        subtitle: b => b.amount ? `$${Number(b.amount).toFixed(2)} - ${b.frequency}` : b.frequency,
        pathPrefix: '/bills',
      }),
      contracts: search(contracts, {
        type: 'contract', fields: c => [c.title, c.file_name, c.description],
        title: c => c.title || c.file_name,
        subtitle: c => c.status || undefined,
        pathPrefix: '/contracts',
      }),
      mileage: search(mileage, {
        type: 'mileage', fields: m => [m.purpose, m.origin, m.destination],
        title: m => m.purpose || 'Viaje',
        subtitle: m => m.kilometers ? `${m.kilometers} km - ${m.date}` : m.date,
        pathPrefix: '/mileage',
      }),
      tags: search(tags, {
        type: 'tag', fields: t => [t.name],
        title: t => t.name, subtitle: () => undefined,
        pathPrefix: '/tags',
      }),
    };
  }, [debouncedQuery, expenses, clients, projects, income, bills, contracts, mileage, tags, maxResults]);

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return { ...results, isLoading: isLoading && debouncedQuery.length >= 2, hasResults, query: debouncedQuery };
}
