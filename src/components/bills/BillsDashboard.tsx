import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Calendar, KanbanSquare, ListChecks, TrendingUp, CalendarCheck, Plus, Sparkles, Info } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';

export function BillsDashboard() {
  const { language } = useLanguage();
  const l = language === 'es';
  const [view, setView] = useState('overview');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { data: bills } = useRecurringBills();
  const { formatCurrency } = useFormatCurrency();

  const activeBills = bills?.filter(b => b.status === 'active') || [];
  const now = new Date();
  const overdue = activeBills.filter(b => differenceInDays(parseISO(b.next_due_date), now) < 0).length;
  const dueSoon = activeBills.filter(b => {
    const d = differenceInDays(parseISO(b.next_due_date), now);
    return d >= 0 && d <= 7;
  }).length;
  const hasBills = activeBills.length > 0;

  const tabs = [
    { value: 'overview', icon: LayoutGrid, label: l ? 'Lista' : 'List', desc: l ? 'Todos tus pagos' : 'All your bills', color: 'bg-primary text-primary-foreground' },
    { value: 'calendar', icon: Calendar, label: l ? 'Calendario' : 'Calendar', desc: l ? 'Vista mensual' : 'Monthly view', color: 'bg-chart-4 text-white' },
    { value: 'kanban', icon: KanbanSquare, label: 'Kanban', desc: l ? 'Arrastra y paga' : 'Drag & pay', color: 'bg-chart-2 text-white' },
    { value: 'checklist', icon: ListChecks, label: 'Checklist', desc: l ? 'Marca completados' : 'Mark as done', color: 'bg-chart-3 text-white' },
    { value: 'projection', icon: TrendingUp, label: l ? 'Proyección' : 'Projection', desc: l ? 'Flujo de caja' : 'Cash flow', color: 'bg-chart-1 text-white' },
  ];

  return (
    <div className="space-y-6">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/15 border border-primary/20 shrink-0">
              <CalendarCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {l ? 'Pagos Fijos' : 'Recurring Bills'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {l 
                  ? 'Controla tus compromisos mensuales: servicios, suscripciones, seguros y más. Nunca pierdas una fecha de pago.'
                  : 'Manage your monthly commitments: utilities, subscriptions, insurance and more. Never miss a payment date.'}
              </p>
              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className="gap-1 text-xs">
                  <span className="text-primary font-semibold">{activeBills.length}</span> {l ? 'activos' : 'active'}
                </Badge>
                {overdue > 0 && (
                  <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
                    🚨 {overdue} {l ? 'vencidos' : 'overdue'}
                  </Badge>
                )}
                {dueSoon > 0 && (
                  <Badge className="gap-1 text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    ⏰ {dueSoon} {l ? 'próximos' : 'due soon'}
                  </Badge>
                )}
                {overdue === 0 && dueSoon === 0 && hasBills && (
                  <Badge className="gap-1 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
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

      {/* ═══ ONBOARDING / QUICK SETUP ═══ */}
      {!hasBills && showOnboarding && (
        <BillsQuickOnboarding onComplete={() => setShowOnboarding(false)} />
      )}

      {/* ═══ VIEW TABS — PROMINENT AT TOP ═══ */}
      <Tabs value={view} onValueChange={setView} className="space-y-4">
        <Card className="overflow-hidden border-primary/10">
          <CardContent className="p-2">
            <TabsList className="grid w-full grid-cols-5 h-auto p-0 bg-transparent gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = view === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs transition-all duration-200 border border-transparent",
                      "data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]",
                      isActive ? tab.color + " border-transparent" : "hover:bg-muted/60 border-border/40"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold text-[11px] leading-tight">{tab.label}</span>
                    <span className={cn(
                      "text-[9px] leading-tight hidden sm:block",
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

        {/* ═══ SUMMARY SECTION (always visible) ═══ */}
        {hasBills && view === 'overview' && <BillsSummaryCards />}

        {/* ═══ TAB CONTENT ═══ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                <BillsManager />
                {hasBills && <NetCashFlowCard />}
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <PaymentCalendar />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <BillsKanban />
            </TabsContent>
            <TabsContent value="checklist" className="mt-0">
              <PaymentChecklist />
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
