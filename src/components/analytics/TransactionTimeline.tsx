import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Star,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  isImportant: boolean;
  importance?: 'high_income' | 'high_expense' | 'milestone' | 'unusual';
}

export function TransactionTimeline() {
  const { language, t } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();

  const { events, stats, milestones } = useMemo(() => {
    const allEvents: TimelineEvent[] = [];
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);

    // Calculate averages for importance detection
    const expenseAmounts = expenses?.map(e => e.amount) || [];
    const incomeAmounts = income?.map(i => i.amount) || [];
    const avgExpense = expenseAmounts.length > 0 ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length : 0;
    const avgIncome = incomeAmounts.length > 0 ? incomeAmounts.reduce((a, b) => a + b, 0) / incomeAmounts.length : 0;

    // Process expenses
    expenses?.forEach(expense => {
      const date = parseISO(expense.date);
      if (date >= threeMonthsAgo) {
        const isHighExpense = expense.amount > avgExpense * 2;
        allEvents.push({
          id: expense.id,
          date,
          type: 'expense',
          amount: expense.amount,
          description: expense.description || expense.vendor || t('expenses.expense'),
          category: expense.category || undefined,
          isImportant: isHighExpense,
          importance: isHighExpense ? 'high_expense' : undefined
        });
      }
    });

    // Process income
    income?.forEach(inc => {
      const date = parseISO(inc.date);
      if (date >= threeMonthsAgo) {
        const isHighIncome = inc.amount > avgIncome * 1.5;
        allEvents.push({
          id: inc.id,
          date,
          type: 'income',
          amount: inc.amount,
          description: inc.description || inc.source || t('income.income'),
          category: inc.income_type,
          isImportant: isHighIncome,
          importance: isHighIncome ? 'high_income' : undefined
        });
      }
    });

    // Sort by date descending
    allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate stats
    const totalIncome = allEvents.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = allEvents.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

    // Identify milestones
    const foundMilestones: { date: Date; description: string; type: string }[] = [];
    
    // Find first income of each month
    const monthlyFirstIncome = new Map<string, TimelineEvent>();
    allEvents.filter(e => e.type === 'income').forEach(e => {
      const monthKey = format(e.date, 'yyyy-MM');
      if (!monthlyFirstIncome.has(monthKey)) {
        monthlyFirstIncome.set(monthKey, e);
      }
    });

    // Mark highest transaction
    const highestIncome = allEvents.filter(e => e.type === 'income').sort((a, b) => b.amount - a.amount)[0];
    const highestExpense = allEvents.filter(e => e.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
    
    if (highestIncome) {
      foundMilestones.push({
        date: highestIncome.date,
        description: language === 'es' ? 'Mayor ingreso del período' : 'Highest income of period',
        type: 'income'
      });
    }
    
    if (highestExpense) {
      foundMilestones.push({
        date: highestExpense.date,
        description: language === 'es' ? 'Mayor gasto del período' : 'Highest expense of period',
        type: 'expense'
      });
    }

    return {
      events: allEvents,
      stats: {
        totalIncome,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
        transactionCount: allEvents.length,
        importantCount: allEvents.filter(e => e.isImportant).length
      },
      milestones: foundMilestones
    };
  }, [expenses, income, language, t]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    events.forEach(event => {
      const monthKey = format(event.date, 'MMMM yyyy', { locale });
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(event);
    });
    return groups;
  }, [events, locale]);

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'es' ? 'Timeline de Transacciones' : 'Transaction Timeline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {language === 'es' ? 'No hay transacciones para mostrar' : 'No transactions to display'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {language === 'es' ? 'Timeline de Transacciones' : 'Transaction Timeline'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Total Ingresos' : 'Total Income'}</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Total Gastos' : 'Total Expenses'}</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
          </div>
          <div className={`${stats.netFlow >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-lg p-3 text-center`}>
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Flujo Neto' : 'Net Flow'}</p>
            <p className={`text-lg font-bold ${stats.netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(stats.netFlow)}
            </p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{language === 'es' ? 'Eventos Importantes' : 'Important Events'}</p>
            <p className="text-lg font-bold text-amber-600">{stats.importantCount}</p>
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {milestones.map((milestone, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className={`${milestone.type === 'income' ? 'border-emerald-500 text-emerald-600' : 'border-red-500 text-red-600'}`}
              >
                <Star className="h-3 w-3 mr-1" />
                {milestone.description} - {format(milestone.date, 'dd MMM', { locale })}
              </Badge>
            ))}
          </div>
        )}

        {/* Timeline */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Array.from(groupedEvents.entries()).map(([month, monthEvents]) => (
              <div key={month}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-card py-1 capitalize">
                  {month}
                </h3>
                <div className="space-y-2">
                  {monthEvents.map(event => (
                    <div 
                      key={event.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        event.isImportant 
                          ? 'border-amber-500/50 bg-amber-500/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        event.type === 'income' 
                          ? 'bg-emerald-500/20 text-emerald-600' 
                          : 'bg-red-500/20 text-red-600'
                      }`}>
                        {event.type === 'income' 
                          ? <ArrowUpCircle className="h-4 w-4" />
                          : <ArrowDownCircle className="h-4 w-4" />
                        }
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{event.description}</p>
                          {event.isImportant && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(event.date, 'dd MMM yyyy', { locale })}</span>
                          {event.category && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                              {event.category}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className={`font-bold ${
                        event.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {event.type === 'income' ? '+' : '-'}{formatCurrency(event.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
