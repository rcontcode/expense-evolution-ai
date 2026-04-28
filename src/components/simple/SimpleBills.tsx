import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus } from 'lucide-react';
import { SimplePageShell } from './SimplePageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';

export function SimpleBills() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: bills } = useRecurringBills();
  const { formatCurrency } = useFormatCurrency();

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...(bills ?? [])]
      .filter((b: any) => b.next_due_date && new Date(b.next_due_date) >= today)
      .sort((a: any, b: any) => (a.next_due_date < b.next_due_date ? -1 : 1))
      .slice(0, 10);
  }, [bills]);

  // We deep-link into the advanced Bills view to add — keeps logic simple.
  const goAdd = () => navigate('/bills');

  return (
    <SimplePageShell
      title={language === 'es' ? 'Próximos pagos' : 'Upcoming bills'}
      subtitle={language === 'es' ? 'Tus cuentas por pagar' : 'Bills coming up'}
      primaryAction={
        <Button size="sm" onClick={goAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {language === 'es' ? 'Agregar pago' : 'Add bill'}
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {upcoming.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {language === 'es' ? 'No tienes pagos próximos.' : 'No upcoming bills.'}
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {upcoming.map((b: any) => {
                const due = new Date(b.next_due_date);
                const days = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const soon = days <= 3;
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                        soon ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                      )}>
                        <CalendarClock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{b.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {due.toLocaleDateString(language === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {days === 0
                            ? (language === 'es' ? 'hoy' : 'today')
                            : (language === 'es' ? `en ${days} días` : `in ${days} days`)}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold tabular-nums">
                      {formatCurrency(Number(b.amount || 0))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </SimplePageShell>
  );
}
