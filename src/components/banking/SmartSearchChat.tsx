import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Send, Sparkles, Loader2, HelpCircle, TrendingUp, TrendingDown, DollarSign, RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

const EXAMPLE_QUESTIONS = {
  es: [
    "¿De qué banco se cobra mi internet?",
    "¿Cuánto pago de luz mensualmente?",
    "¿Cuáles son mis suscripciones activas?",
    "¿Cuánto gasto en restaurantes?",
    "¿Hay cobros inusuales este mes?",
  ],
  en: [
    "Which bank charges my internet?",
    "How much do I pay for electricity monthly?",
    "What are my active subscriptions?",
    "How much do I spend on restaurants?",
    "Are there any unusual charges this month?",
  ]
};

export function SmartSearchChat() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();
  const insights = useBankInsights();

  // Quick insights auto-generated from data
  const quickInsights = useMemo(() => {
    const cards: { icon: typeof TrendingUp; label: string; value: string; color: string }[] = [];
    const now = new Date();
    const ms = startOfMonth(now);
    const me = endOfMonth(now);
    const prevMs = startOfMonth(subMonths(now, 1));
    const prevMe = endOfMonth(subMonths(now, 1));

    // Unify items
    const items: { date: string; amount: number; vendor: string }[] = [];
    (expenses || []).forEach(e => {
      if (!e.deleted_at) items.push({ date: e.date, amount: Math.abs(Number(e.amount)), vendor: e.vendor || e.description || '' });
    });
    (transactions || []).forEach(t => {
      if (!t.matched_expense_id) items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)), vendor: t.description || '' });
    });

    if (items.length === 0) return cards;

    // This month total
    const thisMonth = items.filter(i => { const d = parseISO(i.date); return d >= ms && d <= me; });
    const thisMonthTotal = thisMonth.reduce((s, i) => s + i.amount, 0);

    // Last month total
    const lastMonth = items.filter(i => { const d = parseISO(i.date); return d >= prevMs && d <= prevMe; });
    const lastMonthTotal = lastMonth.reduce((s, i) => s + i.amount, 0);

    const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    cards.push({
      icon: change > 0 ? TrendingUp : TrendingDown,
      label: l ? 'Este mes' : 'This month',
      value: fc(thisMonthTotal),
      color: change > 10 ? 'text-destructive' : 'text-emerald-600',
    });

    // Unique merchants
    const uniqueVendors = new Set(thisMonth.map(i => i.vendor.toLowerCase().trim())).size;
    cards.push({
      icon: DollarSign,
      label: l ? 'Comercios' : 'Merchants',
      value: `${uniqueVendors}`,
      color: 'text-primary',
    });

    // Recurring total
    const recurringTotal = insights.recurringPayments.reduce((s, p) => s + p.amount, 0);
    if (recurringTotal > 0) {
      cards.push({
        icon: RefreshCw,
        label: l ? 'Recurrentes' : 'Recurring',
        value: `${fc(recurringTotal)}/${l ? 'mes' : 'mo'}`,
        color: 'text-amber-600',
      });
    }

    return cards;
  }, [transactions, expenses, insights.recurringPayments, l, fc]);

  const processQuestion = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const transactionContext = transactions?.map(t => ({
        date: t.transaction_date,
        amount: t.amount,
        description: t.description,
        status: t.status,
      })) || [];

      const recurringContext = insights.recurringPayments.map(p => ({
        description: p.description,
        amount: p.amount,
        frequency: p.frequency,
        category: p.category,
      }));

      const { data, error } = await supabase.functions.invoke('analyze-bank-statement', {
        body: {
          content: JSON.stringify({
            question,
            transactions: transactionContext.slice(0, 100),
            recurringPayments: recurringContext,
            topVendors: insights.topVendors,
          }),
          contentType: 'question',
          bankName: 'all',
        }
      });

      if (error) throw error;

      const answer = data?.insights?.[0] || 
        (l ? 'No pude encontrar información específica. Intenta con otra pregunta.'
          : 'Could not find specific information. Try another question.');

      setMessages(prev => [...prev, { 
        role: 'assistant', content: answer, data: data?.transactions?.slice(0, 5) 
      }]);
    } catch (error) {
      console.error('Search error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: l ? 'Error procesando tu pregunta. Intenta de nuevo.' : 'Error processing your question. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuestion(input);
  };

  const examples = l ? EXAMPLE_QUESTIONS.es : EXAMPLE_QUESTIONS.en;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {l ? 'Pregunta sobre tus Finanzas' : 'Ask About Your Finances'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick insight cards */}
        {quickInsights.length > 0 && messages.length === 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickInsights.map((card, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 shrink-0">
                <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{card.label}</p>
                  <p className={cn("text-xs font-bold", card.color)}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] pr-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">
                  {l ? 'Pregúntame cualquier cosa sobre tus transacciones:' : 'Ask me anything about your transactions:'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Badge key={index} variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                    onClick={() => processQuestion(example)}>
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    "max-w-[85%] rounded-lg p-3",
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.data && message.data.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <p className="text-xs font-medium opacity-70">
                          {l ? 'Transacciones relacionadas:' : 'Related transactions:'}
                        </p>
                        {message.data.map((t: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="truncate max-w-[60%]">{t.description}</span>
                            <span className="font-mono">{fc(Number(t.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={l ? '¿Cuánto pago de internet?' : 'How much do I pay for internet?'}
            disabled={isLoading} className="flex-1" />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
