import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { supabase } from '@/integrations/supabase/client';
import { useUpsertCategoryBudget } from '@/hooks/data/useCategoryBudgets';
import { useCreateBill } from '@/hooks/data/useRecurringBills';
import { toast } from 'sonner';
import { HistoricalInsightPanel } from './HistoricalInsightPanel';
import { 
  BILL_CATEGORY_CONFIG, 
  BILL_FREQUENCY_CONFIG,
  type BillCategory, 
  type BillFrequency 
} from '@/lib/constants/bill-categories';

export interface RecurringBillCandidate {
  name: string;
  amount: number;
  currency: string;
  category: string;
  frequency: string;
  auto_pay: boolean;
  next_due_date: string | null;
}

interface RecurringBillConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  candidate: RecurringBillCandidate | null;
  onCreated?: () => void;
}

export function RecurringBillConfirmDialog({ open, onClose, candidate, onCreated }: RecurringBillConfirmDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentEntity } = useEntity();
  const l = language === 'es';

  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string>('utilities');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [frequencyMonths, setFrequencyMonths] = useState<number | null>(null);
  const [autoPay, setAutoPay] = useState(false);
  const [nextDueDate, setNextDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [linkToBudget, setLinkToBudget] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showVigencia, setShowVigencia] = useState(false);
  const [backfillPayments, setBackfillPayments] = useState(false);
  const upsertBudget = useUpsertCategoryBudget();
  const createBill = useCreateBill();

  // Sync state when candidate changes
  const [lastCandidate, setLastCandidate] = useState<RecurringBillCandidate | null>(null);
  if (candidate && candidate !== lastCandidate) {
    setLastCandidate(candidate);
    setName(candidate.name);
    setAmount(candidate.amount);
    setCategory(candidate.category || 'utilities');
    setFrequency(candidate.frequency || 'monthly');
    setAutoPay(candidate.auto_pay);
    setNextDueDate(candidate.next_due_date || new Date().toISOString().split('T')[0]);
  }

  const handleApplyAverage = (avg: number) => setAmount(avg);
  
  const handleApplySuggestedDay = (day: number) => {
    if (nextDueDate) {
      const d = new Date(nextDueDate);
      d.setDate(day);
      if (d < new Date()) d.setMonth(d.getMonth() + 1);
      setNextDueDate(d.toISOString().split('T')[0]);
    }
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      await createBill.mutateAsync({
        name: name.trim(),
        amount,
        category,
        frequency,
        frequency_months: frequency === 'custom' ? frequencyMonths : null,
        next_due_date: nextDueDate || new Date().toISOString().split('T')[0],
        auto_pay: autoPay,
        is_active: true,
        currency: currentEntity?.default_currency || 'CAD',
      } as any);
      
      if (linkToBudget) {
        try {
          const { data: existingBudgets } = await supabase
            .from('category_budgets')
            .select('monthly_budget')
            .eq('user_id', user.id)
            .eq('category', category)
            .maybeSingle();
          
          const currentBudget = existingBudgets?.monthly_budget || 0;
          const newMinBudget = Number(currentBudget) + amount;
          
          upsertBudget.mutate({
            category,
            monthly_budget: newMinBudget,
            entity_id: currentEntity?.id || null,
          });
          
          toast.info(l 
            ? `📊 Presupuesto de ${category} actualizado a $${newMinBudget.toFixed(0)} (+$${amount.toFixed(0)} del pago fijo)`
            : `📊 ${category} budget updated to $${newMinBudget.toFixed(0)} (+$${amount.toFixed(0)} from recurring bill)`
          );
        } catch {
          // Non-critical
        }
      }
      
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Error creating recurring bill:', err);
      toast.error(l ? 'Error al crear pago fijo' : 'Error creating recurring bill');
    } finally {
      setCreating(false);
    }
  };

  const categoryEntries = Object.entries(BILL_CATEGORY_CONFIG) as [BillCategory, typeof BILL_CATEGORY_CONFIG[BillCategory]][];
  const frequencyEntries = Object.entries(BILL_FREQUENCY_CONFIG) as [BillFrequency, typeof BILL_FREQUENCY_CONFIG[BillFrequency]][];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {l ? '¿Crear pago recurrente?' : 'Create recurring bill?'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 border border-accent">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            {l 
              ? 'Detectamos que este gasto podría ser recurrente. Revisa los detalles y confirma para incluirlo en tu presupuesto.'
              : 'We detected this might be a recurring payment. Review the details and confirm to include it in your budget.'}
          </p>
        </div>

        {/* Extracted Historical Insight Panel */}
        <HistoricalInsightPanel
          candidateName={candidate?.name || null}
          open={open}
          onApplyAverage={handleApplyAverage}
          onApplySuggestedDay={handleApplySuggestedDay}
        />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{l ? 'Nombre' : 'Name'}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{l ? 'Monto' : 'Amount'}</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>{l ? 'Próximo vencimiento' : 'Next due date'}</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{l ? 'Categoría' : 'Category'}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categoryEntries.map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.icon} {l ? cfg.es : cfg.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{l ? 'Frecuencia' : 'Frequency'}</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyEntries.map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {l ? cfg.es : cfg.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom frequency months */}
          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label>{l ? 'Cada X meses' : 'Every X months'}</Label>
              <Input
                type="number" min={1} max={60}
                value={frequencyMonths || ''}
                onChange={(e) => setFrequencyMonths(parseInt(e.target.value) || null)}
                placeholder="3"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">{l ? 'Pago automático' : 'Auto-pay'}</p>
              <p className="text-xs text-muted-foreground">
                {l ? 'Se cobra automáticamente' : 'Charged automatically'}
              </p>
            </div>
            <Switch checked={autoPay} onCheckedChange={setAutoPay} />
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/30 transition-colors">
            <Checkbox 
              checked={linkToBudget} 
              onCheckedChange={(v) => setLinkToBudget(v === true)} 
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">{l ? 'Incluir en presupuesto' : 'Include in budget'}</p>
              <p className="text-xs text-muted-foreground">
                {l 
                  ? 'Suma este monto al presupuesto mensual de la categoría automáticamente'
                  : 'Automatically adds this amount to the category monthly budget'}
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {l ? 'No, gracias' : 'No, thanks'}
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {l ? 'Crear Pago Fijo' : 'Create Bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
