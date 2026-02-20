import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills, useMarkBillPaid, type RecurringBill } from '@/hooks/data/useRecurringBills';
import { BILL_CATEGORY_CONFIG, type BillCategory, getBillFrequencyLabel } from '@/lib/constants/bill-categories';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

type KanbanStatus = 'overdue' | 'due_soon' | 'upcoming' | 'paid';

const COLUMNS: Record<KanbanStatus, { es: string; en: string; color: string }> = {
  overdue:  { es: '⚠️ Vencidos',     en: '⚠️ Overdue',     color: 'border-t-destructive' },
  due_soon: { es: '⏰ Próximos (7d)', en: '⏰ Due Soon (7d)', color: 'border-t-orange-500' },
  upcoming: { es: '📅 Por Venir',     en: '📅 Upcoming',     color: 'border-t-blue-500' },
  paid:     { es: '✅ Pagados',       en: '✅ Paid',         color: 'border-t-green-500' },
};

function DraggableBillCard({ bill, status, l, formatCurrency }: {
  bill: RecurringBill; status: KanbanStatus; l: boolean; formatCurrency: (n: number) => string;
}) {
  const markPaid = useMarkBillPaid();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: bill.id,
    data: { bill, fromStatus: status },
  });
  const cat = BILL_CATEGORY_CONFIG[bill.category as BillCategory];

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "p-2.5 rounded-lg border bg-background/50 space-y-1 touch-none",
        isDragging && "ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          {cat?.icon} {bill.name}
        </span>
        {status !== 'paid' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:bg-green-500/10"
            onClick={() => markPaid.mutate({ billId: bill.id, amount: bill.amount })}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{formatCurrency(bill.amount)}</span>
        <span>{format(parseISO(bill.next_due_date), 'dd MMM', { locale: l ? es : undefined })}</span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {getBillFrequencyLabel(bill.frequency, l ? 'es' : 'en')}
      </div>
    </motion.div>
  );
}

function DroppableColumn({ id, cfg, count, children, isOver, l }: {
  id: string; cfg: typeof COLUMNS[KanbanStatus]; count: number; children: React.ReactNode; isOver: boolean; l: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card ref={setNodeRef} className={cn('border-t-4 transition-all', cfg.color, isOver && 'ring-2 ring-primary/40 bg-primary/5')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          {cfg[l ? 'es' : 'en']}
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 min-h-[120px]">
        {children}
      </CardContent>
    </Card>
  );
}

function DragOverlayCard({ bill, l, formatCurrency }: { bill: RecurringBill; l: boolean; formatCurrency: (n: number) => string }) {
  const cat = BILL_CATEGORY_CONFIG[bill.category as BillCategory];
  return (
    <div className="p-2.5 rounded-lg border bg-card shadow-lg space-y-1 w-[220px] opacity-90">
      <div className="text-sm font-medium flex items-center gap-1.5">
        {cat?.icon} {bill.name}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{formatCurrency(bill.amount)}</span>
        <span>{format(parseISO(bill.next_due_date), 'dd MMM', { locale: l ? es : undefined })}</span>
      </div>
    </div>
  );
}

export function BillsKanban() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { data: bills } = useRecurringBills();
  const markPaid = useMarkBillPaid();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns = useMemo(() => {
    const cols: Record<KanbanStatus, RecurringBill[]> = {
      overdue: [], due_soon: [], upcoming: [], paid: [],
    };
    if (!bills) return cols;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    bills.filter(b => b.status === 'active').forEach(bill => {
      const due = parseISO(bill.next_due_date);
      const days = differenceInDays(due, now);
      const lastPaid = bill.last_paid_date ? parseISO(bill.last_paid_date) : null;
      const paidThisMonth = lastPaid && lastPaid.getMonth() === thisMonth && lastPaid.getFullYear() === thisYear;

      if (paidThisMonth && days > 7) {
        cols.paid.push(bill);
      } else if (days < 0) {
        cols.overdue.push(bill);
      } else if (days <= 7) {
        cols.due_soon.push(bill);
      } else {
        cols.upcoming.push(bill);
      }
    });
    return cols;
  }, [bills]);

  const activeBill = activeId ? bills?.find(b => b.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragOver = (e: any) => setOverColumn(e.over?.id ? String(e.over.id) : null);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    setOverColumn(null);

    if (!over) return;
    const targetCol = String(over.id) as KanbanStatus;
    const fromStatus = (active.data.current as any)?.fromStatus as KanbanStatus;
    const bill = (active.data.current as any)?.bill as RecurringBill;

    if (!bill || fromStatus === targetCol) return;

    // Only support dragging TO "paid" column
    if (targetCol === 'paid' && fromStatus !== 'paid') {
      markPaid.mutate({ billId: bill.id, amount: bill.amount });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <p className="text-xs text-muted-foreground mb-2">
        {l ? '💡 Arrastra un pago a la columna "Pagados" para marcarlo como pagado' : '💡 Drag a bill to the "Paid" column to mark it as paid'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(COLUMNS) as [KanbanStatus, typeof COLUMNS[KanbanStatus]][]).map(([status, cfg]) => (
          <DroppableColumn
            key={status}
            id={status}
            cfg={cfg}
            count={columns[status].length}
            isOver={overColumn === status}
            l={l}
          >
            <AnimatePresence>
              {columns[status].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {l ? 'Sin pagos' : 'No bills'}
                </p>
              ) : (
                columns[status].map(bill => (
                  <DraggableBillCard
                    key={bill.id}
                    bill={bill}
                    status={status}
                    l={l}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </AnimatePresence>
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay>
        {activeBill ? <DragOverlayCard bill={activeBill} l={l} formatCurrency={formatCurrency} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
