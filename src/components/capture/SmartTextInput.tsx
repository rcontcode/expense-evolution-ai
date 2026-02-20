import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, Sparkles, Check, X, Mic, MicOff, Send, 
  Receipt, DollarSign, CreditCard, Edit2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateExpense } from '@/hooks/data/useExpenses';
import { useVoiceInput } from '@/hooks/utils/useVoiceInput';
import { useEntity } from '@/contexts/EntityContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RecurringBillConfirmDialog, type RecurringBillCandidate } from '@/components/bills/RecurringBillConfirmDialog';

interface SmartTextInputProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ParsedResult {
  type: 'expense' | 'recurring_bill' | 'income';
  confidence: 'high' | 'medium' | 'low';
  data: {
    amount: number;
    date: string;
    description: string;
    currency: string;
    vendor?: string;
    category?: string;
    cra_deductible?: boolean;
    typically_reimbursable?: boolean;
    name?: string;
    frequency?: string;
    auto_pay?: boolean;
    source?: string;
    income_type?: string;
    is_taxable?: boolean;
  };
  suggestion: string;
}

const TYPE_CONFIG = {
  expense: { icon: Receipt, label_es: 'Gasto', label_en: 'Expense', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
  recurring_bill: { icon: CreditCard, label_es: 'Pago Fijo', label_en: 'Fixed Bill', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
  income: { icon: DollarSign, label_es: 'Ingreso', label_en: 'Income', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
};

export function SmartTextInput({ onSuccess, onCancel }: SmartTextInputProps) {
  const { language } = useLanguage();
  const { currentEntity } = useEntity();
  const l = language === 'es';
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createExpense = useCreateExpense();
  const [pendingBillCandidate, setPendingBillCandidate] = useState<RecurringBillCandidate | null>(null);
  const [showBillConfirm, setShowBillConfirm] = useState(false);

  const { isListening, transcript, isSupported: voiceSupported, toggleListening, setTranscript } = useVoiceInput({
    onResult: () => {}
  });

  // Sync voice transcript to text
  useEffect(() => {
    if (transcript) {
      setText(prev => prev ? `${prev} ${transcript}` : transcript);
      setTranscript('');
    }
  }, [transcript, setTranscript]);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleParse = async () => {
    if (!text.trim() || text.trim().length < 3) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-smart-input', {
        body: { text: text.trim(), language },
      });

      if (error) {
        console.error('Smart input error:', error);
        if (error.message?.includes('429')) {
          toast.error(l ? 'Demasiadas solicitudes, espera un momento' : 'Too many requests, please wait');
        } else if (error.message?.includes('402')) {
          toast.error(l ? 'Créditos de AI agotados' : 'AI credits depleted');
        } else {
          toast.error(l ? 'Error al procesar' : 'Processing error');
        }
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as ParsedResult);
    } catch (err) {
      console.error('Smart input failed:', err);
      toast.error(l ? 'Error al procesar el texto' : 'Error processing text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);

    try {
      if (result.type === 'expense') {
        await createExpense.mutateAsync({
          vendor: result.data.vendor || 'Unknown',
          amount: result.data.amount,
          date: result.data.date,
          category: result.data.category || 'other',
          description: result.data.description,
          status: 'pending',
          reimbursement_type: 'pending_classification',
          currency: currentEntity?.default_currency || 'CAD',
          entity_id: currentEntity?.id || null,
        } as any);
        toast.success(l ? '✅ Gasto registrado' : '✅ Expense recorded');
      } else if (result.type === 'recurring_bill') {
        // Open confirmation dialog instead of inserting directly
        setPendingBillCandidate({
          name: result.data.name || result.data.description,
          amount: result.data.amount,
          currency: currentEntity?.default_currency || 'CAD',
          category: result.data.category || 'utilities',
          frequency: result.data.frequency || 'monthly',
          auto_pay: result.data.auto_pay || false,
          next_due_date: result.data.date || new Date().toISOString().split('T')[0],
        });
        setShowBillConfirm(true);
        setIsSaving(false);
        return; // Don't call onSuccess yet - wait for dialog
      } else if (result.type === 'income') {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');
        
        // Map parsed income_type to valid DB enum values
        const incomeTypeMap: Record<string, string> = {
          salary: 'salary', freelance: 'freelance', investment: 'investment_stocks',
          rental: 'passive_rental', refund: 'refund', bonus: 'bonus', gift: 'gift', other: 'other',
        };
        type IncomeType = "salary" | "client_payment" | "bonus" | "gift" | "refund" | "investment_stocks" | "investment_crypto" | "investment_funds" | "passive_rental" | "passive_royalties" | "online_business" | "freelance" | "other";
        const mappedType = (incomeTypeMap[result.data.income_type || 'other'] || 'other') as IncomeType;
        
        const { error } = await supabase.from('income').insert({
          user_id: userData.user.id,
          amount: result.data.amount,
          date: result.data.date,
          description: result.data.description,
          source: result.data.source || null,
          income_type: mappedType,
          is_taxable: result.data.is_taxable !== false,
          currency: currentEntity?.default_currency || 'CAD',
          entity_id: currentEntity?.id || null,
        });
        if (error) throw error;
        toast.success(l ? '✅ Ingreso registrado' : '✅ Income recorded');
      }
      
      onSuccess?.();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(l ? 'Error al guardar' : 'Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (result) handleSave();
      else handleParse();
    }
  };

  const typeConfig = result ? TYPE_CONFIG[result.type] : null;
  const TypeIcon = typeConfig?.icon || Receipt;

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {l 
            ? '✍️ Describe tu transacción en lenguaje natural:' 
            : '✍️ Describe your transaction in natural language:'}
        </p>
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); }}
            onKeyDown={handleKeyDown}
            placeholder={l 
              ? 'Ej: "Pagué $120 de agua ayer", "Netflix $15.99 mensual", "Me pagaron $3000 de sueldo"...'
              : 'E.g.: "Paid $120 for water yesterday", "Netflix $15.99 monthly", "Got paid $3000 salary"...'}
            className="min-h-[80px] resize-none"
            disabled={isProcessing}
          />
          <div className="flex flex-col gap-1">
            {voiceSupported && (
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                className="shrink-0 h-[38px] w-10"
                onClick={toggleListening}
              >
                {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              className="shrink-0 h-[38px] w-10"
              onClick={handleParse}
              disabled={isProcessing || !text.trim() || text.trim().length < 3}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {isListening && (
          <p className="text-xs text-destructive animate-pulse">
            {l ? '🎙️ Escuchando... habla ahora' : '🎙️ Listening... speak now'}
          </p>
        )}
      </div>

      {/* Result preview */}
      <AnimatePresence>
        {result && typeConfig && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4 space-y-3">
                {/* Type badge + confidence */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", typeConfig.color)}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <span className={cn("font-semibold text-sm", typeConfig.textColor)}>
                      {l ? typeConfig.label_es : typeConfig.label_en}
                    </span>
                  </div>
                  <Badge variant={result.confidence === 'high' ? 'default' : result.confidence === 'low' ? 'destructive' : 'secondary'}>
                    {result.confidence === 'high' ? (l ? 'Alta' : 'High') : result.confidence === 'medium' ? (l ? 'Media' : 'Med') : (l ? 'Baja' : 'Low')}
                  </Badge>
                </div>

                {/* Parsed data */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">{l ? 'Monto' : 'Amount'}</p>
                    <p className="font-bold text-base">${result.data.amount.toFixed(2)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">{l ? 'Fecha' : 'Date'}</p>
                    <p className="font-medium">{result.data.date}</p>
                  </div>
                  {result.data.vendor && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{l ? 'Proveedor' : 'Vendor'}</p>
                      <p className="font-medium truncate">{result.data.vendor}</p>
                    </div>
                  )}
                  {result.data.name && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{l ? 'Nombre' : 'Name'}</p>
                      <p className="font-medium truncate">{result.data.name}</p>
                    </div>
                  )}
                  {result.data.source && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{l ? 'Fuente' : 'Source'}</p>
                      <p className="font-medium truncate">{result.data.source}</p>
                    </div>
                  )}
                  {result.data.category && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{l ? 'Categoría' : 'Category'}</p>
                      <p className="font-medium capitalize">{result.data.category.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {result.data.frequency && (
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-[11px] text-muted-foreground">{l ? 'Frecuencia' : 'Frequency'}</p>
                      <p className="font-medium capitalize">{result.data.frequency}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {result.data.description && (
                  <p className="text-xs text-muted-foreground italic">"{result.data.description}"</p>
                )}

                {/* AI suggestion */}
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm">💡 {result.suggestion}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setResult(null); setText(''); }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    {l ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setResult(null)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    {l ? 'Editar' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    {l ? 'Guardar' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples */}
      {!result && !isProcessing && !text && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{l ? 'Ejemplos:' : 'Examples:'}</p>
          <div className="flex flex-wrap gap-1.5">
            {(l ? [
              '💳 "Pagué $120 de luz ayer"',
              '🛒 "Costco $85.50 supermercado"',
              '🔄 "Netflix $15.99 mensual"',
              '💰 "Me pagaron $3000 de sueldo"',
              '⛽ "Cargué $60 de bencina"',
              '🏠 "Arriendo $800 el 1ro"',
            ] : [
              '💳 "Paid $120 water bill yesterday"',
              '🛒 "Costco $85.50 groceries"',
              '🔄 "Netflix $15.99 monthly"',
              '💰 "Got paid $3000 salary"',
              '⛽ "Gas $60 at Shell"',
              '🏠 "Rent $800 on the 1st"',
            ]).map((example) => (
              <button
                key={example}
                onClick={() => setText(example.replace(/^[^\s]+ "/, '').replace(/"$/, ''))}
                className="text-xs px-2.5 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cancel button at bottom if provided */}
      {onCancel && !result && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onCancel}>
          {l ? 'Cancelar' : 'Cancel'}
        </Button>
      )}

      {/* Recurring Bill Confirmation Dialog */}
      <RecurringBillConfirmDialog
        open={showBillConfirm}
        onClose={() => {
          setShowBillConfirm(false);
          setPendingBillCandidate(null);
        }}
        candidate={pendingBillCandidate}
        onCreated={() => {
          setShowBillConfirm(false);
          setPendingBillCandidate(null);
          setText('');
          setResult(null);
          onSuccess?.();
        }}
      />
    </div>
  );
}
