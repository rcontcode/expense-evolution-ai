import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LayoutGrid, Calendar, KanbanSquare, ListChecks, TrendingUp, CalendarCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { BillsSummaryCards } from './BillsSummaryCards';
import { BillsManager } from './BillsManager';
import { PaymentCalendar } from './PaymentCalendar';
import { BillsKanban } from './BillsKanban';
import { PaymentChecklist } from './PaymentChecklist';
import { CashFlowProjection } from './CashFlowProjection';
import { NetCashFlowCard } from './NetCashFlowCard';
import { BillsExportButtons } from './BillsExportButtons';
import { BillsQuickOnboarding } from './BillsQuickOnboarding';
import { BillHealthScore } from './BillHealthScore';
import { BillSmartInsights } from './BillSmartInsights';
import { BillStreakTracker } from './BillStreakTracker';
import { MonthNavigator } from './MonthNavigator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';

export function BillsDashboard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const [view, setView] = useState('overview');
  const { data: bills } = useRecurringBills();
  const { formatCurrency } = useFormatCurrency();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const activeBills = bills?.filter(b => b.status === 'active') || [];
  const now = new Date();
  const overdue = activeBills.filter(b => differenceInDays(parseISO(b.next_due_date), now) < 0).length;
  const dueSoon = activeBills.filter(b => {
    const d = differenceInDays(parseISO(b.next_due_date), now);
    return d >= 0 && d <= 7;
  }).length;
  const hasBills = activeBills.length > 0;

  const [onboardingOpen, setOnboardingOpen] = useState(!hasBills);

  const tabs = [
    { value: 'overview', icon: LayoutGrid, label: l ? 'Lista' : 'List', desc: l ? 'Todos tus pagos' : 'All your bills' },
    { value: 'calendar', icon: Calendar, label: l ? 'Calendario' : 'Calendar', desc: l ? 'Vista mensual' : 'Monthly view' },
    { value: 'kanban', icon: KanbanSquare, label: 'Kanban', desc: l ? 'Arrastra y paga' : 'Drag & pay' },
    { value: 'checklist', icon: ListChecks, label: 'Checklist', desc: l ? 'Marca completados' : 'Mark as done' },
    { value: 'projection', icon: TrendingUp, label: l ? 'Proyección' : 'Projection', desc: l ? 'Flujo de caja' : 'Cash flow' },
  ];

  return (
    <div className="space-y-4">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20 shrink-0">
              <CalendarCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {l ? 'Pagos Fijos' : 'Recurring Bills'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                {l 
                  ? 'Controla servicios, suscripciones, seguros y más. Nunca pierdas una fecha de pago.'
                  : 'Manage utilities, subscriptions, insurance and more. Never miss a payment.'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="outline" className="gap-1 text-[10px] h-5">
                  <span className="text-primary font-semibold">{activeBills.length}</span> {l ? 'activos' : 'active'}
                </Badge>
                {overdue > 0 && (
                  <Badge variant="destructive" className="gap-1 text-[10px] h-5 animate-pulse">
                    🚨 {overdue} {l ? 'vencidos' : 'overdue'}
                  </Badge>
                )}
                {dueSoon > 0 && (
                  <Badge className="gap-1 text-[10px] h-5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    ⏰ {dueSoon} {l ? 'próximos' : 'due soon'}
                  </Badge>
                )}
                {overdue === 0 && dueSoon === 0 && hasBills && (
                  <Badge className="gap-1 text-[10px] h-5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    ✅ {l ? 'Al día' : 'On track'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BillsExportButtons />
          </div>
        </div>
      </div>

      {/* ═══ HEALTH SCORE + STREAK ═══ */}
      {hasBills && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BillHealthScore />
          <BillStreakTracker />
        </div>
      )}

      {/* ═══ SMART INSIGHTS ═══ */}
      {hasBills && <BillSmartInsights />}

      {/* ═══ COLLAPSIBLE ONBOARDING ═══ */}
      <Collapsible open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/15">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">
                  {l ? '⚡ Agregar pagos típicos rápidamente' : '⚡ Quickly add common bills'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {l 
                    ? 'Selecciona servicios como luz, agua, internet, seguros y más'
                    : 'Select services like electricity, water, internet, insurance and more'}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              onboardingOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <BillsQuickOnboarding onComplete={() => setOnboardingOpen(false)} />
        </CollapsibleContent>
      </Collapsible>

      {/* ═══ VIEW TABS ═══ */}
      <Tabs value={view} onValueChange={setView} className="space-y-3">
        <Card className="overflow-hidden border-primary/10">
          <CardContent className="p-1.5">
            <TabsList className="grid w-full grid-cols-5 h-auto p-0 bg-transparent gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = view === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl text-xs transition-all duration-200",
                      "border-2 font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] scale-[1.04] -translate-y-0.5"
                        : "bg-secondary text-secondary-foreground border-border/60 shadow-[0_2px_4px_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_3px_8px_-1px_rgba(0,0,0,0.15)] hover:-translate-y-[3px] active:translate-y-0.5 active:shadow-[0_1px_2px_0_rgba(0,0,0,0.1)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-bold text-[10px] leading-tight">{tab.label}</span>
                    <span className={cn(
                      "text-[8px] leading-tight hidden sm:block",
                      isActive ? "opacity-80" : "text-muted-foreground"
                    )}>
                      {tab.desc}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardContent>
        </Card>

        {/* ═══ MONTH NAVIGATOR (not shown for projection) ═══ */}
        {view !== 'projection' && (
          <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} />
        )}

        {hasBills && view === 'overview' && <BillsSummaryCards selectedMonth={selectedMonth} />}

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                <BillsManager selectedMonth={selectedMonth} />
                {hasBills && <NetCashFlowCard selectedMonth={selectedMonth} />}
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <PaymentCalendar selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <BillsKanban selectedMonth={selectedMonth} />
            </TabsContent>
            <TabsContent value="checklist" className="mt-0">
              <PaymentChecklist selectedMonth={selectedMonth} />
            </TabsContent>
            <TabsContent value="projection" className="mt-0">
              <CashFlowProjection />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
