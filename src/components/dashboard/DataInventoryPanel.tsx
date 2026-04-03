import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, Database, FileText, Receipt, DollarSign, FileCheck, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  label_es: string;
  label_en: string;
  count: number;
  icon: React.ElementType;
  firstDate?: string | null;
  lastDate?: string | null;
}

function useDataInventory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['data-inventory', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [docs, expenses, income, contracts, clients] = await Promise.all([
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
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

export function DataInventoryPanel() {
  const { language } = useLanguage();
  const { data, isLoading } = useDataInventory();
  const [open, setOpen] = useState(false);
  const isEs = language === 'es';

  if (isLoading || !data) return null;

  const totalItems = data.documents.count + data.expenses.count + data.income.count + data.contracts.count + data.clients.count;

  const items: InventoryItem[] = [
    { label_es: 'Documentos', label_en: 'Documents', count: data.documents.count, icon: FileText, firstDate: data.documents.first, lastDate: data.documents.last },
    { label_es: 'Gastos', label_en: 'Expenses', count: data.expenses.count, icon: Receipt, firstDate: data.expenses.first, lastDate: data.expenses.last },
    { label_es: 'Ingresos', label_en: 'Income', count: data.income.count, icon: DollarSign, firstDate: data.income.first, lastDate: data.income.last },
    { label_es: 'Contratos', label_en: 'Contracts', count: data.contracts.count, icon: FileCheck, firstDate: data.contracts.first, lastDate: data.contracts.last },
    { label_es: 'Clientes', label_en: 'Clients', count: data.clients.count, icon: Users, firstDate: data.clients.first, lastDate: data.clients.last },
  ];

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(isEs ? 'es-CL' : 'en-CA', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
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
          <CardContent className="pt-0 pb-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {items.map((item) => (
                <div key={item.label_en} className="rounded-lg border bg-muted/20 p-2 text-center space-y-0.5">
                  <item.icon className="h-4 w-4 mx-auto text-muted-foreground" />
                  <p className="text-lg font-bold">{item.count}</p>
                  <p className="text-[10px] text-muted-foreground">{isEs ? item.label_es : item.label_en}</p>
                  {item.count > 0 && (
                    <p className="text-[9px] text-muted-foreground/60">
                      {formatDate(item.firstDate)} → {formatDate(item.lastDate)}
                    </p>
                  )}
                </div>
              ))}
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
