import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, useCreateBill, useUpdateBill, useDeleteBill, useMarkBillPaid, type RecurringBill, type BillInsert } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, BILL_FREQUENCY_CONFIG, BILL_PRIORITIES, type BillCategory, type BillFrequency, getBillCategoryLabel, getBillFrequencyLabel } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

const emptyBill: BillInsert = {
  name: '',
  description: null,
  amount: 0,
  currency: 'CAD',
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
};

function BillStatusBadge({ bill }: { bill: RecurringBill }) {
  const daysUntil = differenceInDays(parseISO(bill.next_due_date), new Date());

  if (daysUntil < 0)
    return <Badge variant="destructive" className="text-xs">⚠️ Vencido</Badge>;
  if (daysUntil <= 3)
    return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-xs">⏰ {daysUntil}d</Badge>;
  if (daysUntil <= 7)
    return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">📅 {daysUntil}d</Badge>;
  return <Badge variant="secondary" className="text-xs">{daysUntil}d</Badge>;
}

export function BillsManager() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills, isLoading } = useRecurringBills();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();
  const markPaid = useMarkBillPaid();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [form, setForm] = useState<BillInsert>(emptyBill);
  const [filter, setFilter] = useState<string>('all');

  const openNew = () => { setEditingBill(null); setForm(emptyBill); setDialogOpen(true); };
  const openEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setForm({
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
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount) return;
    if (editingBill) {
      await updateBill.mutateAsync({ id: editingBill.id, ...form });
    } else {
      await createBill.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const activeBills = bills?.filter(b => b.status === 'active') || [];
  const filtered = filter === 'all' ? activeBills : activeBills.filter(b => b.category === filter);

  // Group by category
  const grouped = filtered.reduce<Record<string, RecurringBill[]>>((acc, bill) => {
    (acc[bill.category] = acc[bill.category] || []).push(bill);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={l ? 'Todas las categorías' : 'All categories'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{l ? 'Todas' : 'All'}</SelectItem>
            {Object.entries(BILL_CATEGORY_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.icon} {cfg[l ? 'es' : 'en']}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {l ? 'Nuevo Pago' : 'New Bill'}
        </Button>
      </div>

      {/* Bills list grouped */}
      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">{l ? 'Cargando...' : 'Loading...'}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">{l ? 'No hay pagos recurrentes' : 'No recurring bills'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {l ? 'Agrega tus cuentas y pagos mensuales para organizarlos' : 'Add your bills and monthly payments to organize them'}
            </p>
            <Button onClick={openNew} size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> {l ? 'Agregar primero' : 'Add first'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {Object.entries(grouped).map(([cat, catBills]) => {
            const cfg = BILL_CATEGORY_CONFIG[cat as BillCategory];
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  {cfg?.icon} {getBillCategoryLabel(cat, l ? 'es' : 'en')}
                  <Badge variant="outline" className="text-xs">{catBills.length}</Badge>
                </h4>
                {catBills.map(bill => (
                  <motion.div
                    key={bill.id}
                    layout
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="text-2xl">{cfg?.icon || '📋'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{bill.name}</span>
                        <BillStatusBadge bill={bill} />
                        {bill.auto_pay && <Badge variant="outline" className="text-xs">Auto</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                        <span>{formatCurrency(bill.amount)}</span>
                        <span>·</span>
                        <span>{getBillFrequencyLabel(bill.frequency, l ? 'es' : 'en')}</span>
                        <span>·</span>
                        <span>{format(parseISO(bill.next_due_date), 'dd MMM yyyy', { locale: l ? es : undefined })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:bg-green-500/10"
                        onClick={() => markPaid.mutate({ billId: bill.id, amount: bill.amount })}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteBill.mutate(bill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBill
                ? (l ? 'Editar Pago Recurrente' : 'Edit Recurring Bill')
                : (l ? 'Nuevo Pago Recurrente' : 'New Recurring Bill')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{l ? 'Nombre' : 'Name'}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={l ? 'Ej: Agua Potable' : 'E.g. Water Bill'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{l ? 'Monto' : 'Amount'}</Label>
                <Input type="number" min={0} step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
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
            <div className="flex items-center gap-2">
              <Switch checked={form.auto_pay} onCheckedChange={v => setForm(f => ({ ...f, auto_pay: v }))} />
              <Label>{l ? 'Pago automático' : 'Auto-pay'}</Label>
            </div>
            <div>
              <Label>{l ? 'Notas' : 'Notes'}</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{l ? 'Cancelar' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.amount}>
              {editingBill ? (l ? 'Guardar' : 'Save') : (l ? 'Crear' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
