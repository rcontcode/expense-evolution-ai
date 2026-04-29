import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquareText, Phone, DollarSign, Loader2,
  Copy, Check, TrendingDown, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAIErrorHandler } from '@/hooks/utils/useAIErrorHandler';

interface NegotiableItem {
  vendor: string;
  monthlyAmount: number;
  yearlyAmount: number;
  potentialSavings: number;
  category: string;
}

export function NegotiationScriptGenerator() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const bankInsights = useBankInsights();

  const [selectedVendor, setSelectedVendor] = useState<NegotiableItem | null>(null);
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { handleAIError } = useAIErrorHandler();

  // Find negotiable items from recurring payments
  const negotiableItems: NegotiableItem[] = bankInsights.recurringPayments
    .filter(rp => rp.amount > 20)
    .map(rp => {
      const desc = rp.description.toLowerCase();
      let potentialPct = 0.15; // default 15%
      if (desc.includes('insurance') || desc.includes('seguro')) potentialPct = 0.20;
      if (desc.includes('internet') || desc.includes('phone') || desc.includes('telecom')) potentialPct = 0.25;
      if (desc.includes('gym') || desc.includes('fitness')) potentialPct = 0.30;

      return {
        vendor: rp.description,
        monthlyAmount: rp.amount,
        yearlyAmount: rp.amount * 12,
        potentialSavings: rp.amount * potentialPct,
        category: rp.category,
      };
    })
    .sort((a, b) => b.potentialSavings - a.potentialSavings)
    .slice(0, 8);

  const totalPotential = negotiableItems.reduce((s, n) => s + n.potentialSavings, 0);

  const generateScript = async (item: NegotiableItem) => {
    setSelectedVendor(item);
    setIsGenerating(true);
    setScript('');

    try {
      const { data, error } = await supabase.functions.invoke('app-assistant', {
        body: {
          messages: [
            {
              role: 'system',
              content: l
                ? `Eres un experto en negociación de facturas y servicios. Genera un guión de negociación telefónica breve y efectivo. Incluye:
1. Saludo y presentación
2. Contexto (cuánto paga, cuánto tiempo lleva como cliente)
3. La solicitud específica de descuento
4. Argumentos clave (competencia, fidelidad, mercado)
5. Respuesta a posibles objeciones
6. Cierre firme pero amable
Sé directo, práctico y breve. Máximo 200 palabras.`
                : `You are a bill negotiation expert. Generate a brief, effective phone negotiation script. Include:
1. Greeting and intro
2. Context (how much they pay, how long they've been a customer)
3. Specific discount request
4. Key arguments (competition, loyalty, market rates)
5. Response to objections
6. Firm but friendly close
Be direct, practical and brief. Max 200 words.`,
            },
            {
              role: 'user',
              content: l
                ? `Genera un guión para negociar con "${item.vendor}". Pago actual: ${fc(item.monthlyAmount)}/mes (${fc(item.yearlyAmount)}/año). Quiero conseguir al menos ${fc(item.potentialSavings)}/mes de descuento.`
                : `Generate a script to negotiate with "${item.vendor}". Current payment: ${fc(item.monthlyAmount)}/mo (${fc(item.yearlyAmount)}/yr). I want to get at least ${fc(item.potentialSavings)}/mo discount.`,
            },
          ],
          intent: 'negotiation_script',
        },
      });

      if (error) {
        if (handleAIError(error, { feature: 'ai_credits', requiredPlan: 'pro' })) return;
        throw error;
      }
      if (data?.error && handleAIError(data, { feature: 'ai_credits', requiredPlan: 'pro' })) return;
      setScript(data?.response || data?.message || (l ? 'No se pudo generar el guión.' : 'Could not generate script.'));
    } catch (err) {
      console.error('Script generation error:', err);
      toast.error(l ? 'Error generando el guión' : 'Error generating script');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success(l ? 'Guión copiado' : 'Script copied');
    setTimeout(() => setCopied(false), 2000);
  };

  if (negotiableItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquareText className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {l
              ? 'Importa estados bancarios para detectar servicios negociables'
              : 'Import bank statements to detect negotiable services'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-5/5 via-transparent to-primary/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-chart-5 to-primary shadow-lg"
          >
            <MessageSquareText className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {l ? '🎯 Negociador de Facturas' : '🎯 Bill Negotiator'}
              <Badge variant="secondary" className="text-xs">Smart</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {l
                ? `Potencial de ahorro: ${fc(totalPotential)}/mes`
                : `Savings potential: ${fc(totalPotential)}/mo`}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {/* Negotiable Items */}
        {!script && (
          <ScrollArea className="max-h-[280px]">
            <div className="space-y-2 pr-2">
              {negotiableItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-primary/40 hover:bg-primary/5",
                    selectedVendor?.vendor === item.vendor && isGenerating
                      ? "border-primary/40 bg-primary/5"
                      : "border-border"
                  )}
                  onClick={() => !isGenerating && generateScript(item)}
                >
                  <div className="p-2 rounded-lg bg-chart-5/10">
                    <Phone className="h-4 w-4 text-chart-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.vendor}</p>
                    <p className="text-xs text-muted-foreground">
                      {fc(item.monthlyAmount)}/{l ? 'mes' : 'mo'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-chart-4 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      -{fc(item.potentialSavings)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{l ? 'potencial' : 'potential'}</p>
                  </div>
                  {isGenerating && selectedVendor?.vendor === item.vendor ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Generated Script */}
        <AnimatePresence>
          {script && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-chart-5" />
                  <span className="text-sm font-bold">{selectedVendor?.vendor}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copyScript}>
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? (l ? 'Copiado' : 'Copied') : (l ? 'Copiar' : 'Copy')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setScript(''); setSelectedVendor(null); }}
                  >
                    {l ? 'Volver' : 'Back'}
                  </Button>
                </div>
              </div>

              <ScrollArea className="max-h-[300px]">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{script}</p>
                </div>
              </ScrollArea>

              <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/20">
                <p className="text-xs text-chart-4 font-medium">
                  💡 {l
                    ? `Si logras este descuento, ahorrarás ${fc((selectedVendor?.potentialSavings || 0) * 12)}/año`
                    : `If you get this discount, you'll save ${fc((selectedVendor?.potentialSavings || 0) * 12)}/year`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
