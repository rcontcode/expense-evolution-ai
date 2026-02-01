import { useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';

export interface SearchResult {
  id: string;
  type: 'expense' | 'client' | 'project';
  title: string;
  subtitle?: string;
  path: string;
  score: number;
}

// Normalize text for accent-insensitive matching
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Score a match (higher = better)
function scoreMatch(searchTerm: string, text: string): number {
  const normalizedSearch = normalize(searchTerm);
  const normalizedText = normalize(text);
  
  if (normalizedText === normalizedSearch) return 100; // Exact match
  if (normalizedText.startsWith(normalizedSearch)) return 80; // Starts with
  if (normalizedText.includes(normalizedSearch)) return 60; // Contains
  
  // Check if all words match
  const searchWords = normalizedSearch.split(/\s+/);
  const allWordsMatch = searchWords.every(word => normalizedText.includes(word));
  if (allWordsMatch) return 40;
  
  return 0;
}

export function useGlobalSearch(query: string, maxResults = 5) {
  const debouncedQuery = useDebounce(query.trim(), 150);
  
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  const isLoading = expensesLoading || clientsLoading || projectsLoading;
  
  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return {
        expenses: [] as SearchResult[],
        clients: [] as SearchResult[],
        projects: [] as SearchResult[],
      };
    }
    
    // Search expenses
    const expenseResults: SearchResult[] = (expenses || [])
      .map(expense => {
        const vendorScore = expense.vendor ? scoreMatch(debouncedQuery, expense.vendor) : 0;
        const descScore = expense.description ? scoreMatch(debouncedQuery, expense.description) : 0;
        const notesScore = expense.notes ? scoreMatch(debouncedQuery, expense.notes) : 0;
        const maxScore = Math.max(vendorScore, descScore, notesScore);
        
        if (maxScore === 0) return null;
        
        const result: SearchResult = {
          id: expense.id,
          type: 'expense',
          title: expense.vendor || 'Sin proveedor',
          subtitle: expense.amount ? `$${expense.amount.toFixed(2)} - ${expense.date}` : expense.date,
          path: `/expenses?highlight=${expense.id}`,
          score: maxScore,
        };
        return result;
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    // Search clients
    const clientResults: SearchResult[] = (clients || [])
      .map(client => {
        const nameScore = scoreMatch(debouncedQuery, client.name);
        const emailScore = client.contact_email ? scoreMatch(debouncedQuery, client.contact_email) : 0;
        const notesScore = client.notes ? scoreMatch(debouncedQuery, client.notes) : 0;
        const maxScore = Math.max(nameScore, emailScore, notesScore);
        
        if (maxScore === 0) return null;
        
        const result: SearchResult = {
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: client.contact_email || undefined,
          path: `/clients?highlight=${client.id}`,
          score: maxScore,
        };
        return result;
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    // Search projects
    const projectResults: SearchResult[] = (projects || [])
      .map(project => {
        const nameScore = scoreMatch(debouncedQuery, project.name);
        const descScore = project.description ? scoreMatch(debouncedQuery, project.description) : 0;
        const clientName = project.client?.name || '';
        const clientScore = clientName ? scoreMatch(debouncedQuery, clientName) : 0;
        const maxScore = Math.max(nameScore, descScore, clientScore);
        
        if (maxScore === 0) return null;
        
        const result: SearchResult = {
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: project.client?.name || project.status,
          path: `/projects?highlight=${project.id}`,
          score: maxScore,
        };
        return result;
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    return {
      expenses: expenseResults,
      clients: clientResults,
      projects: projectResults,
    };
  }, [debouncedQuery, expenses, clients, projects, maxResults]);
  
  const hasResults = results.expenses.length > 0 || 
                     results.clients.length > 0 || 
                     results.projects.length > 0;
  
  return {
    ...results,
    isLoading: isLoading && debouncedQuery.length >= 2,
    hasResults,
    query: debouncedQuery,
  };
}
