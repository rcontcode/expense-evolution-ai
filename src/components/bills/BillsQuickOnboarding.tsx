import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronRight, Plus, Sparkles, X, CalendarCheck, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useCreateBill, type BillInsert } from '@/hooks/data/useRecurringBills';
import { BILL_FREQUENCY_CONFIG, BILL_PRIORITIES, type BillFrequency } from '@/lib/constants/bill-categories';
import { cn } from '@/lib/utils';

interface BillPreset {
  key: string;
  icon: string;
  name_es: string;
  name_en: string;
  desc_es: string;
  desc_en: string;
  category: string;
  frequency: string;
  priority: string;
  typical_amount?: number;
  auto_pay_default?: boolean;
}

const BILL_PRESETS: BillPreset[] = [
  { key: 'electricity', icon: '💡', name_es: 'Electricidad / Luz', name_en: 'Electricity', desc_es: 'Factura mensual de energía eléctrica', desc_en: 'Monthly electric bill', category: 'utilities', frequency: 'monthly', priority: 'critical' },
  { key: 'water', icon: '💧', name_es: 'Agua', name_en: 'Water', desc_es: 'Servicio de agua potable', desc_en: 'Water utility service', category: 'utilities', frequency: 'monthly', priority: 'critical' },
  { key: 'gas', icon: '🔥', name_es: 'Gas', name_en: 'Gas / Heating', desc_es: 'Gas natural o calefacción', desc_en: 'Natural gas or heating', category: 'utilities', frequency: 'monthly', priority: 'critical' },
  { key: 'internet', icon: '📡', name_es: 'Internet', name_en: 'Internet', desc_es: 'Servicio de internet residencial', desc_en: 'Home internet service', category: 'telecommunications', frequency: 'monthly', priority: 'high' },
  { key: 'phone', icon: '📱', name_es: 'Teléfono / Celular', name_en: 'Phone / Mobile', desc_es: 'Plan de telefonía celular', desc_en: 'Cell phone plan', category: 'telecommunications', frequency: 'monthly', priority: 'high' },
  { key: 'rent', icon: '🏠', name_es: 'Alquiler / Renta', name_en: 'Rent', desc_es: 'Pago mensual de alquiler', desc_en: 'Monthly rent payment', category: 'housing', frequency: 'monthly', priority: 'critical', auto_pay_default: true },
  { key: 'mortgage', icon: '🏦', name_es: 'Hipoteca', name_en: 'Mortgage', desc_es: 'Pago de hipoteca', desc_en: 'Mortgage payment', category: 'housing', frequency: 'monthly', priority: 'critical', auto_pay_default: true },
  { key: 'car_insurance', icon: '🚗', name_es: 'Seguro de Auto', name_en: 'Car Insurance', desc_es: 'Póliza de seguro vehicular', desc_en: 'Vehicle insurance policy', category: 'insurance', frequency: 'monthly', priority: 'high' },
  { key: 'health_insurance', icon: '🏥', name_es: 'Seguro Médico', name_en: 'Health Insurance', desc_es: 'Plan de salud o seguro médico', desc_en: 'Health plan or medical insurance', category: 'insurance', frequency: 'monthly', priority: 'high' },
  { key: 'home_insurance', icon: '🛡️', name_es: 'Seguro de Hogar', name_en: 'Home Insurance', desc_es: 'Seguro de propiedad o arrendatario', desc_en: 'Home or renter insurance', category: 'insurance', frequency: 'monthly', priority: 'medium' },
  { key: 'netflix', icon: '🎬', name_es: 'Netflix / Streaming', name_en: 'Netflix / Streaming', desc_es: 'Suscripción de entretenimiento', desc_en: 'Entertainment subscription', category: 'subscriptions', frequency: 'monthly', priority: 'low' },
  { key: 'spotify', icon: '🎵', name_es: 'Spotify / Música', name_en: 'Spotify / Music', desc_es: 'Suscripción de música', desc_en: 'Music subscription', category: 'subscriptions', frequency: 'monthly', priority: 'low' },
  { key: 'gym', icon: '🏋️', name_es: 'Gimnasio', name_en: 'Gym Membership', desc_es: 'Membresía de gimnasio', desc_en: 'Gym membership fee', category: 'health', frequency: 'monthly', priority: 'low' },
  { key: 'daycare', icon: '👶', name_es: 'Guardería', name_en: 'Daycare', desc_es: 'Cuidado infantil', desc_en: 'Childcare service', category: 'childcare', frequency: 'monthly', priority: 'critical' },
  { key: 'credit_card', icon: '💳', name_es: 'Tarjeta de Crédito', name_en: 'Credit Card', desc_es: 'Pago mínimo o total de tarjeta', desc_en: 'Credit card minimum or full payment', category: 'debt_payments', frequency: 'monthly', priority: 'high' },
  { key: 'car_payment', icon: '🚙', name_es: 'Pago de Auto', name_en: 'Car Payment', desc_es: 'Financiamiento vehicular', desc_en: 'Vehicle financing', category: 'debt_payments', frequency: 'monthly', priority: 'high', auto_pay_default: true },
  { key: 'property_tax', icon: '🏛️', name_es: 'Impuesto Predial', name_en: 'Property Tax', desc_es: 'Impuesto sobre la propiedad', desc_en: 'Property tax payment', category: 'housing', frequency: 'annual', priority: 'critical' },
  { key: 'tv_cable', icon: '📺', name_es: 'Cable / TV', name_en: 'Cable / TV', desc_es: 'Servicio de televisión por cable', desc_en: 'Cable television service', category: 'telecommunications', frequency: 'monthly', priority: 'low' },
];

interface BillsQuickOnboardingProps {
  onComplete?: () => void;
}

export function BillsQuickOnboarding({ onComplete }: BillsQuickOnboardingProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { currentCurrency } = useFormatCurrency();
  const createBill = useCreateBill();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [configs, setConfigs] = useState<Record<string, { amount: number; auto_pay: boolean; frequency: string; next_due_date: string }>>({});
  const [saving, setSaving] = useState(false);

  const togglePreset = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const goToConfigure = () => {
    // Initialize configs for selected presets
    const newConfigs: typeof configs = {};
    selected.forEach(key => {
      const preset = BILL_PRESETS.find(p => p.key === key)!;
      newConfigs[key] = {
        amount: preset.typical_amount || 0,
        auto_pay: preset.auto_pay_default || false,
        frequency: preset.frequency,
        next_due_date: getNextFirstOfMonth(),
      };
    });
    setConfigs(newConfigs);
    setStep('configure');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const key of selected) {
        const preset = BILL_PRESETS.find(p => p.key === key)!;
        const cfg = configs[key];
        if (!cfg || cfg.amount <= 0) continue;

        const bill: BillInsert = {
          name: l ? preset.name_es : preset.name_en,
          description: l ? preset.desc_es : preset.desc_en,
          amount: cfg.amount,
          currency: currentCurrency,
          category: preset.category,
          frequency: cfg.frequency,
          frequency_months: null,
          due_day: null,
          next_due_date: cfg.next_due_date,
          last_paid_date: null,
          auto_pay: cfg.auto_pay,
          status: 'active',
          priority: preset.priority,
          color: null,
          icon: preset.icon,
          notes: null,
          reminder_days_before: 3,
          entity_id: null,
          payment_method_type: cfg.auto_pay ? 'automatic' : 'manual_online',
          bank_account: null,
          bank_name: null,
          payment_details: null,
          payee_name: null,
          payee_account: null,
          beneficiary: null,
        };
        await createBill.mutateAsync(bill);
      }
      onComplete?.();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const updateConfig = (key: string, field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const selectedPresets = BILL_PRESETS.filter(p => selected.has(p.key));
  const validCount = selectedPresets.filter(p => configs[p.key]?.amount > 0).length;

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {l ? '⚡ Configuración Rápida' : '⚡ Quick Setup'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step === 'select'
                  ? (l ? 'Selecciona los pagos que tienes y configúralos en segundos' : 'Select your bills and configure them in seconds')
                  : (l ? `Configura los ${selected.size} pagos seleccionados — solo necesitas el monto y fecha` : `Configure your ${selected.size} selected bills — just add amount and date`)}
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-4"
            >
              {/* Preset grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BILL_PRESETS.map(preset => {
                  const isSelected = selected.has(preset.key);
                  return (
                    <button
                      key={preset.key}
                      onClick={() => togglePreset(preset.key)}
                      className={cn(
                        "relative flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10 scale-[1.02]"
                          : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-2xl shrink-0 mt-0.5">{preset.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{l ? preset.name_es : preset.name_en}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                          {l ? preset.desc_es : preset.desc_en}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[9px] px-1 h-4">
                            {BILL_FREQUENCY_CONFIG[preset.frequency as BillFrequency]?.[l ? 'es' : 'en']}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-[9px] px-1 h-4"
                            style={{ 
                              borderColor: BILL_PRIORITIES[preset.priority]?.color + '60',
                              color: BILL_PRIORITIES[preset.priority]?.color,
                            }}
                          >
                            {BILL_PRIORITIES[preset.priority]?.[l ? 'es' : 'en']}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <p className="text-sm text-muted-foreground">
                  {selected.size > 0
                    ? (l ? `${selected.size} seleccionados` : `${selected.size} selected`)
                    : (l ? 'Toca los pagos que tienes' : 'Tap the bills you have')}
                </p>
                <div className="flex items-center gap-2">
                  {onComplete && (
                    <Button variant="ghost" size="sm" onClick={onComplete}>
                      {l ? 'Saltar' : 'Skip'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={goToConfigure}
                    className="gap-1.5"
                  >
                    {l ? 'Configurar' : 'Configure'} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-3"
            >
              {/* Info */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {l 
                    ? 'Ingresa el monto de cada pago y la próxima fecha de vencimiento. Puedes editarlos después con más detalle.'
                    : 'Enter the amount for each bill and the next due date. You can edit them later with more detail.'}
                </span>
              </div>

              {/* Configure each selected bill */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {selectedPresets.map((preset, i) => {
                  const cfg = configs[preset.key];
                  if (!cfg) return null;
                  return (
                    <motion.div
                      key={preset.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-3 rounded-xl border bg-card space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{preset.icon}</span>
                          <div>
                            <p className="text-sm font-semibold">{l ? preset.name_es : preset.name_en}</p>
                            <p className="text-[10px] text-muted-foreground">{l ? preset.desc_es : preset.desc_en}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const next = new Set(selected);
                            next.delete(preset.key);
                            setSelected(next);
                          }}
                          className="p-1 rounded hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px]">{l ? 'Monto *' : 'Amount *'}</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={cfg.amount || ''}
                            onChange={e => updateConfig(preset.key, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">{l ? 'Frecuencia' : 'Frequency'}</Label>
                          <Select value={cfg.frequency} onValueChange={v => updateConfig(preset.key, 'frequency', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(BILL_FREQUENCY_CONFIG).map(([k, c]) => (
                                <SelectItem key={k} value={k} className="text-xs">{c[l ? 'es' : 'en']}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px]">{l ? 'Próximo Vencimiento' : 'Next Due'}</Label>
                          <Input
                            type="date"
                            value={cfg.next_due_date}
                            onChange={e => updateConfig(preset.key, 'next_due_date', e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cfg.auto_pay}
                          onCheckedChange={v => updateConfig(preset.key, 'auto_pay', v)}
                          className="scale-75"
                        />
                        <span className="text-xs text-muted-foreground">{l ? 'Pago automático' : 'Auto-pay'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="gap-1">
                  ← {l ? 'Volver' : 'Back'}
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {validCount}/{selected.size} {l ? 'listos' : 'ready'}
                  </span>
                  <Button
                    size="sm"
                    disabled={validCount === 0 || saving}
                    onClick={handleSaveAll}
                    className="gap-1.5"
                  >
                    {saving 
                      ? (l ? 'Guardando...' : 'Saving...')
                      : (l ? `Crear ${validCount} pagos` : `Create ${validCount} bills`)}
                    <CalendarCheck className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function getNextFirstOfMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString().split('T')[0];
}
