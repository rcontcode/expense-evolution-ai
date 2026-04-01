import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, useBillPayments, useCreateBill, useUpdateBill, useDeleteBill, useMarkBillPaid, type RecurringBill, type BillInsert } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, PAYMENT_METHOD_CONFIG, type BillCategory, type PaymentMethodType, getBillCategoryLabel, getBillFrequencyLabel, getPaymentMethodLabel } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BillFormDialog } from './BillFormDialog';
import { BillSparkline } from './BillSparkline';

function BillStatusBadge({ bill }: { bill: RecurringBill }) {
  const { language } = useLanguage();
  const l = language === 'es';
  const daysUntil = differenceInDays(parseISO(bill.next_due_date), new Date());

  if (daysUntil < 0)
    return <Badge variant="destructive" className="text-xs">⚠️ {l ? 'Vencido' : 'Overdue'}</Badge>;
  if (daysUntil <= 3)
    return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-xs">⏰ {daysUntil}d</Badge>;
  if (daysUntil <= 7)
    return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">📅 {daysUntil}d</Badge>;
  return <Badge variant="secondary" className="text-xs">{daysUntil}d</Badge>;
}

function PaymentMethodBadge({ method, bankName }: { method: string; bankName?: string | null }) {
  const cfg = PAYMENT_METHOD_CONFIG[method as PaymentMethodType];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span>{cfg.icon}</span>
      {bankName && <span className="font-medium">{bankName}</span>}
    </span>
  );
}

interface BillsManagerProps {
  selectedMonth?: Date;
}

export function BillsManager({ selectedMonth }: BillsManagerProps) {
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
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
  const [markPaidBill, setMarkPaidBill] = useState<RecurringBill | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const openNew = () => { setEditingBill(null); setDialogOpen(true); };
  const openEdit = (bill: RecurringBill) => { setEditingBill(bill); setDialogOpen(true); };

  const handleSave = async (form: BillInsert, editId?: string) => {
    if (editId) {
      await updateBill.mutateAsync({ id: editId, ...form });
    } else {
      await createBill.mutateAsync(form);
    }
  };

  const activeBills = bills?.filter(b => b.status === 'active') || [];
  const filtered = filter === 'all' ? activeBills : activeBills.filter(b => b.category === filter);

  const grouped = filtered.reduce<Record<string, RecurringBill[]>>((acc, bill) => {
    (acc[bill.category] = acc[bill.category] || []).push(bill);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
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

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">{l ? 'Cargando...' : 'Loading...'}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">{l ? 'No hay pagos recurrentes' : 'No recurring bills'}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {l ? 'Agrega tus cuentas y pagos mensuales para organizarlos y nunca olvidar un vencimiento.' : 'Add your bills and monthly payments to organize them and never miss a due date.'}
            </p>
            <Button onClick={openNew} size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> {l ? 'Agregar pago fijo' : 'Add fixed payment'}
            </Button>
            <div className="mt-5 p-3 rounded-lg bg-muted/50 border border-border/50 text-left max-w-sm">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">
                💡 {l ? 'Otras formas de registrar:' : 'Other ways to add:'}
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span>📸</span>
                  <span>{l ? 'Captura inteligente: toma foto de un recibo o factura recurrente' : 'Smart capture: take a photo of a recurring receipt or bill'}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>🏦</span>
                  <a href="/banking" className="underline underline-offset-2 hover:text-foreground transition-colors">
                    {l ? 'Importar extracto bancario → detecta pagos automáticamente' : 'Import bank statement → detects payments automatically'}
                  </a>
                </li>
                <li className="flex items-start gap-1.5">
                  <span>💳</span>
                  <a href="/expenses" className="underline underline-offset-2 hover:text-foreground transition-colors">
                    {l ? 'Registrar gastos → se detectan patrones recurrentes' : 'Record expenses → recurring patterns are detected'}
                  </a>
                </li>
              </ul>
            </div>
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
                    style={bill.color ? { borderLeftWidth: 3, borderLeftColor: bill.color } : undefined}
                  >
                    <div className="text-2xl">{cfg?.icon || '📋'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{bill.name}</span>
                        <BillStatusBadge bill={bill} />
                        {bill.auto_pay && <Badge variant="outline" className="text-xs">Auto</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        <span>{formatCurrency(bill.amount)}</span>
                        <span>·</span>
                        <span>{getBillFrequencyLabel(bill.frequency, l ? 'es' : 'en')}</span>
                        {bill.frequency === 'custom' && bill.frequency_months && (
                          <>
                            <span>·</span>
                            <span className="text-primary text-[10px]">
                              ({l ? `c/${bill.frequency_months} meses` : `every ${bill.frequency_months} mo`})
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{format(parseISO(bill.next_due_date), 'dd MMM yyyy', { locale: l ? es : undefined })}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <PaymentMethodBadge method={bill.payment_method_type} bankName={bill.bank_name} />
                        {bill.beneficiary && (
                          <span className="text-xs text-muted-foreground">👤 {bill.beneficiary}</span>
                        )}
                      </div>
                    </div>
                    {/* Sparkline: payment trend */}
                    <div className="hidden sm:block">
                      <BillSparkline billId={bill.id} currentAmount={bill.amount} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-500/10"
                            onClick={() => setMarkPaidBill(bill)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{l ? 'Marcar pagado' : 'Mark paid'}</TooltipContent>
                      </Tooltip>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteBillId(bill.id)}
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

      <BillFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingBill={editingBill}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteBillId} onOpenChange={() => setDeleteBillId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {l ? '¿Eliminar gasto recurrente?' : 'Delete recurring bill?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {l ? 'Esta acción no se puede deshacer. Se eliminará el gasto recurrente y su historial de pagos.' 
                 : 'This action cannot be undone. The recurring bill and its payment history will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{l ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { if (deleteBillId) { deleteBill.mutate(deleteBillId); setDeleteBillId(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {l ? 'Eliminar' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
