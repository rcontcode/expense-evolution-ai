import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { type RecurringBill, type BillInsert } from '@/hooks/data/useRecurringBills';
import {
  BILL_CATEGORY_CONFIG, BILL_FREQUENCY_CONFIG, BILL_PRIORITIES,
  PAYMENT_METHOD_CONFIG, COMMON_BANKS,
  type BillCategory, type BillFrequency, type PaymentMethodType,
} from '@/lib/constants/bill-categories';

const createEmptyBill = (currency: string): BillInsert => ({
  name: '',
  description: null,
  amount: 0,
  currency,
  category: 'other',
  frequency: 'monthly',
  frequency_months: null,
  due_day: null,
  next_due_date: new Date().toISOString().split('T')[0],
  last_paid_date: null,
  auto_pay: false,
  status: 'active',
  priority: 'medium',
  color: null,
  icon: null,
  notes: null,
  reminder_days_before: 3,
  entity_id: null,
  payment_method_type: 'manual_online',
  bank_account: null,
  bank_name: null,
  payment_details: null,
  payee_name: null,
  payee_account: null,
  beneficiary: null,
});

interface BillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBill: RecurringBill | null;
  onSave: (bill: BillInsert, editId?: string) => Promise<void>;
}

export function BillFormDialog({ open, onOpenChange, editingBill, onSave }: BillFormDialogProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { currentCurrency } = useFormatCurrency();

  const [form, setForm] = useState<BillInsert>(() => {
    if (editingBill) return billToForm(editingBill);
    return createEmptyBill(currentCurrency);
  });
  const [step, setStep] = useState(0);

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(editingBill ? billToForm(editingBill) : createEmptyBill(currentCurrency));
      setStep(0);
    }
    onOpenChange(v);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount) return;
    await onSave(form, editingBill?.id);
    onOpenChange(false);
  };

  const paymentMethod = form.payment_method_type as PaymentMethodType;
  const showBankFields = ['automatic', 'manual_online', 'etransfer'].includes(paymentMethod);
  const showPayeeFields = ['manual_online', 'etransfer'].includes(paymentMethod);

  const steps = [
    { label: l ? '📋 Básico' : '📋 Basic', key: 'basic' },
    { label: l ? '💳 Pago' : '💳 Payment', key: 'payment' },
    { label: l ? '⚙️ Detalles' : '⚙️ Details', key: 'details' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingBill
              ? (l ? 'Editar Pago Recurrente' : 'Edit Recurring Bill')
              : (l ? 'Nuevo Pago Recurrente' : 'New Recurring Bill')}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 mb-2">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors font-medium ${
                step === i
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Step 0: Basic */}
          {step === 0 && (
            <>
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                💡 {l
                  ? 'Paso 1 de 3: Describe el pago. Los 3 pasos construyen UN SOLO pago recurrente — primero los datos básicos, luego cómo lo pagas, y finalmente detalles opcionales.'
                  : 'Step 1 of 3: Describe the bill. The 3 steps build ONE recurring payment — first the basics, then how you pay it, and finally optional details.'}
              </div>
              <div>
                <Label>{l ? 'Nombre *' : 'Name *'}</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={l ? 'Ej: Agua Potable, Internet, Guardería' : 'E.g. Water Bill, Internet, Daycare'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{l ? 'Monto *' : 'Amount *'}</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>{l ? 'Categoría' : 'Category'}</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(BILL_CATEGORY_CONFIG).map(([k, c]) => (
                        <SelectItem key={k} value={k}>{c.icon} {c[l ? 'es' : 'en']}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{l ? 'Frecuencia' : 'Frequency'}</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(BILL_FREQUENCY_CONFIG).map(([k, c]) => (
                        <SelectItem key={k} value={k}>{c[l ? 'es' : 'en']}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.frequency === 'custom' && (
                  <div>
                    <Label>{l ? 'Cada X meses' : 'Every X months'}</Label>
                    <Input
                      type="number" min={1}
                      value={form.frequency_months || ''}
                      onChange={e => setForm(f => ({ ...f, frequency_months: parseInt(e.target.value) || null }))}
                      placeholder="3"
                    />
                  </div>
                )}
                <div>
                  <Label>{l ? 'Prioridad' : 'Priority'}</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(BILL_PRIORITIES).map(([k, c]) => (
                        <SelectItem key={k} value={k}>{c[l ? 'es' : 'en']}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{l ? 'Próximo Vencimiento' : 'Next Due Date'}</Label>
                <Input type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{l ? 'Desde (inicio)' : 'From (start)'}</Label>
                  <Input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value || null }))} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {l ? '¿Desde cuándo pagas esto?' : 'When did you start paying this?'}
                  </p>
                </div>
                <div>
                  <Label>{l ? 'Hasta (fin, opcional)' : 'Until (end, optional)'}</Label>
                  <Input type="date" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value || null }))} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {l ? 'Ej: fin de contrato' : 'E.g. contract end'}
                  </p>
                </div>
              </div>
              <div>
                <Label>{l ? 'Beneficiario (quién usa/recibe)' : 'Beneficiary (who uses/receives)'}</Label>
                <Input
                  value={form.beneficiary || ''}
                  onChange={e => setForm(f => ({ ...f, beneficiary: e.target.value || null }))}
                  placeholder={l ? 'Ej: Familia, Hija, Personal' : 'E.g. Family, Daughter, Personal'}
                />
              </div>
            </>
          )}

          {/* Step 1: Payment Method */}
          {step === 1 && (
            <>
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                💳 {l
                  ? 'Paso 2 de 3: ¿Cómo pagas esta cuenta? Elige el método y opcionalmente indica desde qué banco se paga. Esto te ayudará a rastrear tus pagos.'
                  : 'Step 2 of 3: How do you pay this bill? Pick the method and optionally note which bank pays it. This helps you track your payments.'}
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">{l ? 'Método de Pago' : 'Payment Method'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PAYMENT_METHOD_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, payment_method_type: key, auto_pay: key === 'automatic' ? true : f.auto_pay }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        form.payment_method_type === key
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{cfg.icon}</div>
                      <div className="text-sm font-medium">{cfg[l ? 'es' : 'en']}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{cfg[l ? 'description_es' : 'description_en']}</div>
                    </button>
                  ))}
                </div>
              </div>

              {showBankFields && (
                <>
                  <Separator />
                  <div>
                    <Label>{l ? 'Banco / Institución' : 'Bank / Institution'}</Label>
                    <Select value={form.bank_name || ''} onValueChange={v => setForm(f => ({ ...f, bank_name: v || null }))}>
                      <SelectTrigger><SelectValue placeholder={l ? 'Seleccionar banco' : 'Select bank'} /></SelectTrigger>
                      <SelectContent>
                        {COMMON_BANKS.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{l ? 'Cuenta (últimos 4 dígitos)' : 'Account (last 4 digits)'}</Label>
                    <Input
                      value={form.bank_account || ''}
                      onChange={e => setForm(f => ({ ...f, bank_account: e.target.value || null }))}
                      placeholder="****1234"
                      maxLength={20}
                    />
                  </div>
                </>
              )}

              {showPayeeFields && (
                <>
                  <Separator />
                  <div>
                    <Label>{l ? 'Nombre del Beneficiario / Payee' : 'Payee Name'}</Label>
                    <Input
                      value={form.payee_name || ''}
                      onChange={e => setForm(f => ({ ...f, payee_name: e.target.value || null }))}
                      placeholder={l ? 'Ej: City of Toronto Water' : 'E.g. City of Toronto Water'}
                    />
                  </div>
                  <div>
                    <Label>{l ? 'Cuenta / Número de Cliente' : 'Account / Customer Number'}</Label>
                    <Input
                      value={form.payee_account || ''}
                      onChange={e => setForm(f => ({ ...f, payee_account: e.target.value || null }))}
                      placeholder={l ? 'Número de cuenta del proveedor' : 'Provider account number'}
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'automatic' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-600">🔄</span>
                  <span className="text-sm text-green-700 dark:text-green-400">
                    {l ? 'Este pago se marca como automático. Se registrará como pagado automáticamente.' : 'This bill is set to auto-pay. It will be recorded as paid automatically.'}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                ⚙️ {l
                  ? 'Paso 3 de 3: Detalles opcionales. Agrega recordatorios, instrucciones de pago o notas personales. Todo es opcional — puedes crear el pago ahora y completar esto después.'
                  : 'Step 3 of 3: Optional details. Add reminders, payment instructions, or personal notes. Everything here is optional — you can create the bill now and fill this in later.'}
              </div>
              <div>
                <Label>{l ? 'Descripción' : 'Description'}</Label>
                <Input
                  value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
                  placeholder={l ? 'Descripción corta' : 'Short description'}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.auto_pay} onCheckedChange={v => setForm(f => ({ ...f, auto_pay: v }))} />
                <Label>{l ? 'Pago automático' : 'Auto-pay'}</Label>
              </div>
              <div>
                <Label>{l ? 'Recordar X días antes' : 'Remind X days before'}</Label>
                <Input
                  type="number" min={0} max={30}
                  value={form.reminder_days_before}
                  onChange={e => setForm(f => ({ ...f, reminder_days_before: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>{l ? 'Instrucciones de Pago' : 'Payment Instructions'}</Label>
                <Textarea
                  value={form.payment_details || ''}
                  onChange={e => setForm(f => ({ ...f, payment_details: e.target.value || null }))}
                  rows={2}
                  placeholder={l ? 'Detalles adicionales, URLs, instrucciones...' : 'Additional details, URLs, instructions...'}
                />
              </div>
              <div>
                <Label>{l ? 'Notas' : 'Notes'}</Label>
                <Textarea
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              {l ? '← Anterior' : '← Back'}
            </Button>
          )}
          <div className="flex-1" />
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && (!form.name || !form.amount)}>
              {l ? 'Siguiente →' : 'Next →'}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!form.name || !form.amount}>
              {editingBill ? (l ? 'Guardar' : 'Save') : (l ? 'Crear' : 'Create')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function billToForm(bill: RecurringBill): BillInsert {
  return {
    name: bill.name,
    description: bill.description,
    amount: bill.amount,
    currency: bill.currency,
    category: bill.category,
    frequency: bill.frequency,
    frequency_months: bill.frequency_months,
    due_day: bill.due_day,
    next_due_date: bill.next_due_date,
    last_paid_date: bill.last_paid_date,
    auto_pay: bill.auto_pay,
    status: bill.status,
    priority: bill.priority,
    color: bill.color,
    icon: bill.icon,
    notes: bill.notes,
    reminder_days_before: bill.reminder_days_before,
    entity_id: bill.entity_id,
    payment_method_type: bill.payment_method_type,
    bank_account: bill.bank_account,
    bank_name: bill.bank_name,
    payment_details: bill.payment_details,
    payee_name: bill.payee_name,
    payee_account: bill.payee_account,
    beneficiary: bill.beneficiary,
    start_date: bill.start_date,
    end_date: bill.end_date,
  };
}
