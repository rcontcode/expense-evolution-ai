import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Sparkles,
  Loader2,
  HelpCircle,
  Building2,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights, CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: transactions } = useBankTransactions();
  const insights = useBankInsights();

  const processQuestion = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from transactions
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

      // Use the insights array as the answer
      const answer = data?.insights?.[0] || 
        (language === 'es' 
          ? 'No pude encontrar información específica. Intenta con otra pregunta.'
          : 'Could not find specific information. Try another question.');

      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: answer,
        data: data?.transactions?.slice(0, 5),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Search error:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: language === 'es' 
          ? 'Hubo un error procesando tu pregunta. Intenta de nuevo.'
          : 'There was an error processing your question. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuestion(input);
  };

  const examples = language === 'es' ? EXAMPLE_QUESTIONS.es : EXAMPLE_QUESTIONS.en;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {language === 'es' ? 'Pregunta sobre tus Finanzas' : 'Ask About Your Finances'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] pr-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">
                  {language === 'es' 
                    ? 'Pregúntame cualquier cosa sobre tus transacciones:'
                    : 'Ask me anything about your transactions:'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                    onClick={() => processQuestion(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Show related transactions if any */}
                    {message.data && message.data.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <p className="text-xs font-medium opacity-70">
                          {language === 'es' ? 'Transacciones relacionadas:' : 'Related transactions:'}
                        </p>
                        {message.data.map((t: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="truncate max-w-[60%]">{t.description}</span>
                            <span className="font-mono">${Number(t.amount).toFixed(2)}</span>
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

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'es' 
                ? '¿Cuánto pago de internet?' 
                : 'How much do I pay for internet?'
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
