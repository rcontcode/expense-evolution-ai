import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, Database, FileText, Receipt, DollarSign, FileCheck, Users, ShieldCheck, ArrowRight, Landmark, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface InventoryItem {
  label_es: string;
  label_en: string;
  count: number;
  icon: React.ElementType;
  colorKey: string;
  firstDate?: string | null;
  lastDate?: string | null;
  suggestion_es?: string;
  suggestion_en?: string;
  link?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  documents: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  expenses: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  income: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  contracts: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
  clients: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: 'text-orange-500' },
  bank: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', icon: 'text-teal-500' },
  bills: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
};

function useDataInventory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['data-inventory', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [docs, expenses, income, contracts, clients, bankTx, bills] = await Promise.all([
        supabase.from('documents').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('expenses').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('income').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('contracts').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('clients').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: true }),
        supabase.from('bank_transactions').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('recurring_bills').select('created_at', { count: 'exact', head: false })
          .eq('user_id', user.id).order('created_at', { ascending: true }),
      ]);

      const extract = (res: typeof docs) => ({
        count: res.count || 0,
        first: res.data?.[0]?.created_at || null,
        last: res.data?.length ? res.data[res.data.length - 1]?.created_at : null,
      });

      return {
        documents: extract(docs),
        expenses: extract(expenses),
        income: extract(income),
        contracts: extract(contracts),
        clients: extract(clients),
        bankTransactions: extract(bankTx),
        recurringBills: extract(bills),
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

interface DataInventoryPanelProps {
  onExpandedChange?: (expanded: boolean) => void;
}

export function DataInventoryPanel({ onExpandedChange }: DataInventoryPanelProps = {}) {
  const { language } = useLanguage();
  const { data, isLoading } = useDataInventory();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isEs = language === 'es';

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onExpandedChange?.(next);
  };

  if (isLoading || !data) return null;

  const totalItems = data.documents.count + data.expenses.count + data.income.count + data.contracts.count + data.clients.count + data.bankTransactions.count + data.recurringBills.count;

  const items: InventoryItem[] = [
    { label_es: 'Documentos', label_en: 'Documents', count: data.documents.count, icon: FileText, colorKey: 'documents', firstDate: data.documents.first, lastDate: data.documents.last, suggestion_es: 'Sube boletas en la Bandeja del Caos', suggestion_en: 'Upload receipts in the Chaos Inbox', link: '/chaos-inbox' },
    { label_es: 'Gastos', label_en: 'Expenses', count: data.expenses.count, icon: Receipt, colorKey: 'expenses', firstDate: data.expenses.first, lastDate: data.expenses.last, suggestion_es: 'Registra tus gastos manualmente o sube boletas', suggestion_en: 'Log expenses manually or upload receipts', link: '/chaos-inbox' },
    { label_es: 'Ingresos', label_en: 'Income', count: data.income.count, icon: DollarSign, colorKey: 'income', firstDate: data.income.first, lastDate: data.income.last, suggestion_es: 'Registra tus ingresos', suggestion_en: 'Log your income', link: '/income' },
    { label_es: 'Contratos', label_en: 'Contracts', count: data.contracts.count, icon: FileCheck, colorKey: 'contracts', firstDate: data.contracts.first, lastDate: data.contracts.last, suggestion_es: 'Sube tus contratos', suggestion_en: 'Upload your contracts', link: '/contracts' },
    { label_es: 'Clientes', label_en: 'Clients', count: data.clients.count, icon: Users, colorKey: 'clients', firstDate: data.clients.first, lastDate: data.clients.last, suggestion_es: 'Agrega tus clientes', suggestion_en: 'Add your clients', link: '/clients' },
    { label_es: 'Transacciones Banco', label_en: 'Bank Transactions', count: data.bankTransactions.count, icon: Landmark, colorKey: 'bank', firstDate: data.bankTransactions.first, lastDate: data.bankTransactions.last, suggestion_es: 'Importa tu estado de cuenta', suggestion_en: 'Import your bank statement', link: '/banking' },
    { label_es: 'Pagos Recurrentes', label_en: 'Recurring Bills', count: data.recurringBills.count, icon: CalendarCheck, colorKey: 'bills', firstDate: data.recurringBills.first, lastDate: data.recurringBills.last, suggestion_es: 'Configura tus pagos fijos', suggestion_en: 'Set up your fixed payments', link: '/bills' },
  ];

  const categoriesWithData = items.filter(i => i.count > 0).length;
  const completeness = Math.round((categoriesWithData / items.length) * 100);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(isEs ? 'es-CL' : 'en-CA', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <CardContent className="py-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {isEs ? 'Mi Inventario de Datos' : 'My Data Inventory'}
                </span>
                <Badge variant="secondary" className="text-xs">{totalItems}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5">
                  <Progress value={completeness} className="w-16 h-1.5" />
                  <span className="text-[10px] text-muted-foreground">{categoriesWithData}/{items.length}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Solo tus datos' : 'Your data only'}</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {items.map((item) => {
                const colors = CATEGORY_COLORS[item.colorKey] || CATEGORY_COLORS.documents;
                return (
                  <div key={item.label_en} className="rounded-xl border bg-muted/20 p-3 text-center space-y-1.5 hover:bg-muted/40 transition-colors">
                    <div className={cn('mx-auto w-10 h-10 rounded-full flex items-center justify-center', colors.bg)}>
                      <item.icon className={cn('h-5 w-5', colors.icon)} />
                    </div>
                    <p className={cn('text-2xl font-bold leading-none', colors.text)}>{item.count}</p>
                    <p className="text-xs font-medium text-foreground/80 leading-tight">{isEs ? item.label_es : item.label_en}</p>
                    {item.count > 0 ? (
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {formatDate(item.firstDate)} → {formatDate(item.lastDate)}
                      </p>
                    ) : item.link ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px] text-primary gap-0.5"
                        onClick={(e) => { e.stopPropagation(); navigate(item.link!); }}
                      >
                        {isEs ? item.suggestion_es : item.suggestion_en}
                        <ArrowRight className="h-2.5 w-2.5" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Completeness bar */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {isEs ? 'Completitud de datos' : 'Data completeness'}
                </span>
                <span className="text-xs font-medium">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
            </div>

            <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
              {isEs
                ? 'La seguridad garantiza que solo tú puedes ver tus registros financieros'
                : 'Security ensures only you can see your financial records'}
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
