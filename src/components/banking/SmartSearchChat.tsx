import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, Sparkles, Loader2, HelpCircle, TrendingUp, TrendingDown, DollarSign, RefreshCw,
  History, Trash2, RotateCcw, ChevronRight, Zap, Bot, User
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useAIErrorHandler } from '@/hooks/utils/useAIErrorHandler';
import { parseISO, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
}

const SMART_SUGGESTIONS = {
  es: [
    { icon: '💳', text: '¿Cuánto gasto en suscripciones?', category: 'subs' },
    { icon: '📊', text: '¿Cuál es mi gasto promedio diario?', category: 'avg' },
    { icon: '🏪', text: '¿Dónde gasto más dinero?', category: 'vendors' },
    { icon: '⚠️', text: '¿Hay cobros duplicados?', category: 'anomaly' },
    { icon: '📈', text: '¿Cómo ha cambiado mi gasto este mes?', category: 'trend' },
    { icon: '🔄', text: '¿Cuáles son mis pagos recurrentes?', category: 'recurring' },
  ],
  en: [
    { icon: '💳', text: 'How much do I spend on subscriptions?', category: 'subs' },
    { icon: '📊', text: 'What is my average daily spending?', category: 'avg' },
    { icon: '🏪', text: 'Where do I spend the most?', category: 'vendors' },
    { icon: '⚠️', text: 'Are there duplicate charges?', category: 'anomaly' },
    { icon: '📈', text: 'How has my spending changed this month?', category: 'trend' },
    { icon: '🔄', text: 'What are my recurring payments?', category: 'recurring' },
  ]
};

export function SmartSearchChat() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: transactions } = useBankTransactions();
  const { data: expenses } = useExpenses();
  const insights = useBankInsights();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Quick insight stats
  const quickStats = useMemo(() => {
    const now = new Date();
    const ms = startOfMonth(now);
    const me = endOfMonth(now);
    const prevMs = startOfMonth(subMonths(now, 1));
    const prevMe = endOfMonth(subMonths(now, 1));

    const items: { date: string; amount: number; vendor: string }[] = [];
    (expenses || []).forEach(e => {
      if (!e.deleted_at) items.push({ date: e.date, amount: Math.abs(Number(e.amount)), vendor: e.vendor || e.description || '' });
    });
    (transactions || []).forEach(t => {
      if (!t.matched_expense_id) items.push({ date: t.transaction_date, amount: Math.abs(Number(t.amount)), vendor: t.description || '' });
    });

    const thisMonth = items.filter(i => { const d = parseISO(i.date); return d >= ms && d <= me; });
    const lastMonth = items.filter(i => { const d = parseISO(i.date); return d >= prevMs && d <= prevMe; });
    const thisTotal = thisMonth.reduce((s, i) => s + i.amount, 0);
    const lastTotal = lastMonth.reduce((s, i) => s + i.amount, 0);
    const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;
    const dailyAvg = thisMonth.length > 0 ? thisTotal / new Date().getDate() : 0;
    const recurringTotal = insights.recurringPayments.reduce((s, p) => s + p.amount, 0);

    return { thisTotal, change, dailyAvg, recurringTotal, txCount: thisMonth.length };
  }, [transactions, expenses, insights.recurringPayments]);

  const processQuestion = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const transactionContext = transactions?.map(t => ({
        date: t.transaction_date, amount: t.amount, description: t.description, status: t.status,
      })) || [];

      const recurringContext = insights.recurringPayments.map(p => ({
        description: p.description, amount: p.amount, frequency: p.frequency, category: p.category,
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
        role: 'assistant', content: answer, data: data?.transactions?.slice(0, 5), timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Search error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: l ? 'Error procesando tu pregunta. Intenta de nuevo.' : 'Error processing your question. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuestion(input);
  };

  const clearChat = () => {
    setMessages([]);
    setShowHistory(false);
  };

  const suggestions = l ? SMART_SUGGESTIONS.es : SMART_SUGGESTIONS.en;

  // Follow-up suggestions based on last assistant message
  const followUpSuggestions = useMemo(() => {
    if (messages.length === 0) return [];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return [];
    
    const content = lastMsg.content.toLowerCase();
    const followUps: string[] = [];
    
    if (content.includes('recurrent') || content.includes('suscripci') || content.includes('subscript')) {
      followUps.push(l ? '¿Cuánto puedo ahorrar cancelando alguna?' : 'How much can I save by canceling some?');
    }
    if (content.includes('gast') || content.includes('spend')) {
      followUps.push(l ? '¿Cómo se compara con el mes pasado?' : 'How does it compare to last month?');
    }
    if (content.includes('restaurant') || content.includes('comida') || content.includes('food')) {
      followUps.push(l ? '¿Cuánto gasto en comida al año?' : 'How much do I spend on food per year?');
    }
    
    followUps.push(l ? '¿Qué más puedes analizar?' : 'What else can you analyze?');
    return followUps.slice(0, 3);
  }, [messages, l]);

  return (
    <Card className="relative overflow-hidden border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            {l ? 'Asistente Financiero Inteligente' : 'Smart Financial Assistant'}
          </CardTitle>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        {quickStats.txCount > 0 && messages.length === 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
            <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-muted/50 shrink-0 text-xs">
              <DollarSign className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">{l ? 'Este mes' : 'This month'}:</span>
              <span className="font-bold">{fc(quickStats.thisTotal)}</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-muted/50 shrink-0 text-xs">
              {quickStats.change > 0 ? <TrendingUp className="h-3 w-3 text-destructive" /> : <TrendingDown className="h-3 w-3 text-emerald-600" />}
              <span className={cn("font-bold", quickStats.change > 0 ? 'text-destructive' : 'text-emerald-600')}>
                {quickStats.change > 0 ? '+' : ''}{quickStats.change.toFixed(0)}%
              </span>
            </div>
            {quickStats.recurringTotal > 0 && (
              <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-muted/50 shrink-0 text-xs">
                <RefreshCw className="h-3 w-3 text-amber-600" />
                <span className="font-bold">{fc(quickStats.recurringTotal)}</span>
                <span className="text-muted-foreground">/{l ? 'mes' : 'mo'}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 relative">
        {/* Messages Area */}
        <ScrollArea className="min-h-[220px] max-h-[340px]" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  <span className="text-sm">
                    {l ? 'Pregúntame sobre tus finanzas:' : 'Ask me about your finances:'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => processQuestion(s.text)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all text-left group border border-transparent hover:border-primary/20"
                    >
                      <span className="text-base">{s.icon}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1">{s.text}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3 pr-2">
                {messages.map((message, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl p-3",
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    )}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.data && message.data.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/30 space-y-1.5">
                          <p className="text-[10px] font-medium opacity-60 uppercase tracking-wider">
                            {l ? 'Transacciones' : 'Transactions'}
                          </p>
                          {message.data.map((t: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs py-0.5">
                              <span className="truncate max-w-[60%] opacity-80">{t.description}</span>
                              <span className="font-mono font-medium">{fc(Number(t.amount))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] opacity-40 mt-1.5">
                        {format(message.timestamp, 'HH:mm')}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                        <User className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md p-3">
                      <div className="flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-primary/50" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary/50" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary/50" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Follow-up suggestions */}
                {!isLoading && followUpSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {followUpSuggestions.map((s, i) => (
                      <Badge key={i} variant="outline"
                        className="cursor-pointer hover:bg-primary/10 transition-colors text-[10px] py-0.5"
                        onClick={() => processQuestion(s)}>
                        <Zap className="h-2.5 w-2.5 mr-1" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={l ? 'Pregunta sobre tus finanzas...' : 'Ask about your finances...'}
            disabled={isLoading} className="flex-1 rounded-full bg-muted/50 border-muted" />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="rounded-full shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
