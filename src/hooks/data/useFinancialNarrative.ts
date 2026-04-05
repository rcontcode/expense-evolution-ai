import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useIncome } from './useIncome';
import { useRecurringBills } from './useRecurringBills';
import { useBankTransactions } from './useBankTransactions';
import { useDashboardStats } from './useDashboardStats';

export interface IncomeStream {
  source: string;
  type: string;
  amount: number;
  dayOfMonth?: number;
  clientName?: string;
}

export interface FinancialNarrative {
  userName: string;
  workTypes: string[];
  country: string;
  clients: { name: string; totalIncome: number }[];
  incomeStreams: IncomeStream[];
  totalMonthlyIncome: number;
  fixedExpenses: { name: string; amount: number; category: string }[];
  totalFixedExpenses: number;
  bankingSummary: {
    total: number;
    matched: number;
    pending: number;
    banks: string[];
    lastImport?: string;
  };
  documentSources: { receipts: number; contracts: number; bankSessions: number };
  monthlyExpenses: number;
  balance: number;
  savingsRate: number;
  isLoading: boolean;
  hasData: boolean;
}

function detectDayOfMonth(dates: string[]): number | undefined {
  if (dates.length < 2) return undefined;
  const days = dates.map(d => new Date(d).getDate());
  const freq: Record<number, number> = {};
  days.forEach(d => { freq[d] = (freq[d] || 0) + 1; });
  const [bestDay, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return count >= 2 ? Number(bestDay) : undefined;
}

export function useFinancialNarrative(): FinancialNarrative {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: allIncome, isLoading: incomeLoading } = useIncome();
  const { data: bills, isLoading: billsLoading } = useRecurringBills();
  const { data: bankTx, isLoading: bankLoading } = useBankTransactions();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Lightweight counts for documents and import sessions
  const { data: docCounts, isLoading: docsLoading } = useQuery({
    queryKey: ['financial-narrative-docs', user?.id],
    queryFn: async () => {
      const [receiptsRes, contractsRes, sessionsRes, clientsRes] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).is('deleted_at', null),
        supabase.from('bank_import_sessions').select('imported_at', { count: 'exact' }).eq('user_id', user!.id).order('imported_at', { ascending: false }).limit(1),
        supabase.from('clients').select('id, name').eq('user_id', user!.id).is('deleted_at', null),
      ]);
      return {
        receipts: receiptsRes.count || 0,
        contracts: contractsRes.count || 0,
        bankSessions: sessionsRes.count || 0,
        lastImport: sessionsRes.data?.[0]?.imported_at || undefined,
        clients: (clientsRes.data || []) as { id: string; name: string }[],
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const isLoading = profileLoading || incomeLoading || billsLoading || bankLoading || statsLoading || docsLoading;

    const userName = profile?.full_name || '';
    const workTypes = (profile?.work_types as string[]) || [];
    const country = profile?.country || 'CA';

    // Group income by type+source and detect recurring day
    const now = new Date();
    const thisYear = now.getFullYear();
    const incomeRecords = allIncome || [];

    // Calculate average monthly income from last 3 months
    const threeMonthsAgo = new Date(thisYear, now.getMonth() - 3, 1);
    const recentIncome = incomeRecords.filter(i => new Date(i.date) >= threeMonthsAgo);

    // Group by income_type + client
    const groupMap: Record<string, { amounts: number[]; dates: string[]; type: string; clientName?: string }> = {};
    recentIncome.forEach((inc: any) => {
      const key = `${inc.income_type}-${inc.client_id || 'none'}`;
      if (!groupMap[key]) {
        groupMap[key] = { amounts: [], dates: [], type: inc.income_type, clientName: inc.client?.name };
      }
      groupMap[key].amounts.push(Number(inc.amount));
      groupMap[key].dates.push(inc.date);
    });

    const incomeStreams: IncomeStream[] = Object.entries(groupMap).map(([, g]) => {
      const avg = g.amounts.reduce((a, b) => a + b, 0) / Math.max(g.amounts.length / 3, 1);
      return {
        source: g.clientName || g.type,
        type: g.type,
        amount: Math.round(avg),
        dayOfMonth: detectDayOfMonth(g.dates),
        clientName: g.clientName,
      };
    });

    const totalMonthlyIncome = stats?.monthlyIncome || incomeStreams.reduce((s, i) => s + i.amount, 0);

    // Clients with income
    const clientsData = docCounts?.clients || [];
    const clientIncomeMap: Record<string, number> = {};
    recentIncome.forEach((inc: any) => {
      if (inc.client_id) {
        clientIncomeMap[inc.client_id] = (clientIncomeMap[inc.client_id] || 0) + Number(inc.amount);
      }
    });
    const clients = clientsData
      .map(c => ({ name: c.name, totalIncome: Math.round((clientIncomeMap[c.id] || 0) / 3) }))
      .sort((a, b) => b.totalIncome - a.totalIncome);

    // Fixed expenses from recurring bills
    const activeBills = (bills || []).filter(b => b.status === 'active');
    const fixedExpenses = activeBills.map(b => ({
      name: b.name,
      amount: b.amount,
      category: b.category,
    }));
    const totalFixedExpenses = fixedExpenses.reduce((s, e) => s + e.amount, 0);

    // Banking summary
    const txList = bankTx || [];
    const matched = txList.filter(t => t.matched_expense_id || t.matched_income_id).length;
    const banksSet = new Set(txList.map(t => t.bank_name).filter(Boolean));

    const bankingSummary = {
      total: txList.length,
      matched,
      pending: txList.length - matched,
      banks: Array.from(banksSet) as string[],
      lastImport: docCounts?.lastImport,
    };

    const monthlyExpenses = stats?.monthlyTotal || 0;
    const balance = totalMonthlyIncome - monthlyExpenses;
    const savingsRate = totalMonthlyIncome > 0 ? Math.round((balance / totalMonthlyIncome) * 100) : 0;

    const hasData = totalMonthlyIncome > 0 || monthlyExpenses > 0 || txList.length > 0 || (docCounts?.receipts || 0) > 0;

    return {
      userName,
      workTypes,
      country,
      clients,
      incomeStreams,
      totalMonthlyIncome,
      fixedExpenses,
      totalFixedExpenses,
      bankingSummary,
      documentSources: {
        receipts: docCounts?.receipts || 0,
        contracts: docCounts?.contracts || 0,
        bankSessions: docCounts?.bankSessions || 0,
      },
      monthlyExpenses,
      balance,
      savingsRate,
      isLoading,
      hasData,
    };
  }, [profile, allIncome, bills, bankTx, stats, docCounts, profileLoading, incomeLoading, billsLoading, bankLoading, statsLoading, docsLoading]);
}
