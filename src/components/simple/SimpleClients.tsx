import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { ClientDialog } from '@/components/dialogs/ClientDialog';
import type { Client } from '@/types/expense.types';

export function SimpleClients() {
  const { language } = useLanguage();
  const { data: clients } = useClients();
  const { data: income } = useIncome();
  const { formatCurrency } = useFormatCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();

  // Sum income per client (this year)
  const totalsByClient = useMemo(() => {
    const map = new Map<string, number>();
    const yyyy = new Date().getFullYear().toString();
    for (const i of (income ?? [])) {
      if (!i.client_id) continue;
      if (typeof i.date === 'string' && !i.date.startsWith(yyyy)) continue;
      map.set(i.client_id, (map.get(i.client_id) || 0) + Number(i.amount || 0));
    }
    return map;
  }, [income]);

  const sortedClients = useMemo(() => {
    return [...(clients ?? [])].sort((a, b) => (totalsByClient.get(b.id) || 0) - (totalsByClient.get(a.id) || 0));
  }, [clients, totalsByClient]);

  return (
    <SimplePageShell
      title={language === 'es' ? 'Clientes' : 'Clients'}
      subtitle={language === 'es' ? `${clients?.length ?? 0} clientes` : `${clients?.length ?? 0} clients`}
      primaryAction={
        <Button size="sm" onClick={() => { setEditing(undefined); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {language === 'es' ? 'Agregar cliente' : 'Add client'}
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {sortedClients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {language === 'es' ? 'Sin clientes todavía.' : 'No clients yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {sortedClients.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { setEditing(c); setDialogOpen(true); }}
                    className="w-full flex items-center justify-between gap-3 py-3 px-4 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(c as any).contact_email || (c as any).contact_phone || (language === 'es' ? 'Sin contacto' : 'No contact')}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalsByClient.get(c.id) || 0)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ClientDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(undefined); }}
        client={editing}
      />
    </SimplePageShell>
  );
}
