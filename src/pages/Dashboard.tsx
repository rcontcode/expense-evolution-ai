import { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Receipt, Users, Download, Camera, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useExpensesRealtime } from '@/hooks/data/useExpensesRealtime';
import { useClients } from '@/hooks/data/useClients';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { ExportDialog } from '@/components/export/ExportDialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePageVisitTracker } from '@/hooks/data/useMissionAutoTracker';
import { InteractiveWelcome } from '@/components/guidance/InteractiveWelcome';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizedDashboard } from '@/components/focus';
import { DashboardViewTabs } from '@/components/dashboard/DashboardViewTabs';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { SystemStatusStrip } from '@/components/dashboard/SystemStatusStrip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { DashboardGamificationWidget } from '@/components/gamification';

import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { ProfileExtenderDialog } from '@/components/profile/ProfileExtenderDialog';
import { LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { EcosystemSection } from '@/components/ecosystem/EcosystemSection';
import { DashboardNavigator } from '@/components/dashboard/DashboardNavigator';
import { useDashboardDeepLinks } from '@/hooks/utils/useDashboardDeepLinks';

import { SimpleDashboard } from '@/components/dashboard/SimpleDashboard';
import { UiModeWelcomeDialog } from '@/components/onboarding/UiModeWelcomeDialog';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { MoneyMomentumScore } from '@/components/dashboard/MoneyMomentumScore';
import { useIncome } from '@/hooks/data/useIncome';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { cn } from '@/lib/utils';

// Lazy load only dashboard-specific components
const WorkflowSummaryWidget = lazy(() => import('@/components/dashboard/WorkflowSummaryWidget').then(m => ({ default: m.WorkflowSummaryWidget })));
const MonthlyBillsWidget = lazy(() => import('@/components/dashboard/MonthlyBillsWidget').then(m => ({ default: m.MonthlyBillsWidget })));

const FinancialAutopilot = lazy(() => import('@/components/dashboard/FinancialAutopilot').then(m => ({ default: m.FinancialAutopilot })));
const LazyBankingSummaryCard = lazy(() => import('@/components/banking/BankingSummaryCard').then(m => ({ default: m.BankingSummaryCard })));
const FinancialNarrativeCard = lazy(() => import('@/components/dashboard/FinancialNarrativeCard'));

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Timeline state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // UI state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    return (localStorage.getItem('dashboard-density') as 'compact' | 'comfortable') || 'comfortable';
  });
  const toggleDensity = () => {
    const next = density === 'compact' ? 'comfortable' : 'compact';
    setDensity(next);
    try { localStorage.setItem('dashboard-density', next); } catch { /* noop */ }
  };
  
  // Profile extension state
  const [profileExtenderOpen, setProfileExtenderOpen] = useState(false);
  const [selectedProfileSection, setSelectedProfileSection] = useState<LifeProfileSection>('family');
  
  const handleStartProfileSection = useCallback((section: LifeProfileSection) => {
    setSelectedProfileSection(section);
    setProfileExtenderOpen(true);
  }, []);

  const { viewMode, setViewMode, uiMode, setUiMode, isLoading: prefsLoading } = useDisplayPreferences();
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Show welcome dialog once for users who haven't picked a UI mode yet
  useEffect(() => {
    if (prefsLoading || !user) return;
    if (uiMode === 'unset') {
      // Don't auto-popup on first ever load if user already has data — give them a beat
      const t = setTimeout(() => setWelcomeOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [prefsLoading, uiMode, user]);

  // Deep-link & Stripe redirect handling (extracted)
  const { deepLinkArea, deepLinkTab, deepLinkKey } = useDashboardDeepLinks(viewMode, setViewMode);

  // Track dashboard visit for missions
  usePageVisitTracker('view_dashboard');

  // Enable real-time sync for expenses
  useExpensesRealtime();

  const { data: stats, isLoading } = useDashboardStats();
  const { data: allExpenses } = useExpenses();
  const { data: clients } = useClients();
  const { data: bills } = useRecurringBills();
  const { data: allIncome } = useIncome();

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);
  const { formatCurrency } = useFormatCurrency();

  // Context for QuickActions: drives which buttons get highlighted + header snapshot
  const quickActionContext = (() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const expensesThisMonth = (allExpenses ?? []).filter((e: any) =>
      typeof e.date === 'string' && e.date.startsWith(ym)
    ).length;
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 7);
    const billsDueWeek = (bills ?? []).filter((b: any) => {
      if (!b?.next_due_date) return false;
      const d = new Date(b.next_due_date);
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && d <= limit;
    }).length;
    const limit3 = new Date(now);
    limit3.setDate(limit3.getDate() + 3);
    const billsDueSoon = (bills ?? []).filter((b: any) => {
      if (!b?.next_due_date) return false;
      const d = new Date(b.next_due_date);
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && d <= limit3;
    }).length;
    const incompleteExpenses = (allExpenses ?? []).filter((e: any) => !e?.category || !e?.merchant).length;
    const balance = (stats?.monthlyIncome ?? 0) - (stats?.monthlyTotal ?? 0);
    return {
      noClients: (clients?.length ?? 0) === 0,
      noExpensesThisMonth: expensesThisMonth === 0,
      billsDueSoon,
      billsDueWeek,
      incompleteExpenses,
      balance,
    };
  })();

  // Check if first visit to show guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('dashboard-timeline-guide-seen');
    if (!hasSeenGuide && user) {
      setShowGuide(true);
      localStorage.setItem('dashboard-timeline-guide-seen', 'true');
    }
  }, [user]);

  // First-time-in-Advanced welcome (shown once after switching from Simple)
  useEffect(() => {
    if (!user || prefsLoading || uiMode !== 'advanced') return;
    const seen = localStorage.getItem('advanced-mode-first-visit');
    if (seen) return;
    localStorage.setItem('advanced-mode-first-visit', '1');
    // Soft delayed toast — non-blocking
    const id = setTimeout(() => {
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: language === 'es' ? '⚡ Bienvenido al Modo Avanzado' : '⚡ Welcome to Advanced Mode',
          description: language === 'es'
            ? 'Tienes 3 zonas: Hoy, Tu mes y Tu sistema. Cambia a Simple cuando quieras desde el header.'
            : 'Three zones: Today, Your month and Your system. Switch back to Simple anytime from the header.',
        });
      });
    }, 800);
    return () => clearTimeout(id);
  }, [user, prefsLoading, uiMode, language]);

  const isMobile = useIsMobile();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureTab, setQuickCaptureTab] = useState<'photo' | 'text'>('photo');
  const openQuickCapture = useCallback((tab: 'photo' | 'text' = 'photo') => {
    setQuickCaptureTab(tab);
    setQuickCaptureOpen(true);
  }, []);

  // SIMPLE MODE — ultra-minimal dashboard for both mobile and desktop
  if (uiMode === 'simple') {
    return (
      <Layout>
        <div className={cn('page-container section-gap w-full max-w-full min-w-0 overflow-x-hidden', isMobile && 'mobile-compact')}>
          <SimpleDashboard onQuickCapture={() => openQuickCapture('photo')} />
        </div>
        <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        <QuickCaptureDialog open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} defaultTab={quickCaptureTab} />
        <UiModeWelcomeDialog open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      </Layout>
    );
  }

  // Mobile-optimized dashboard (Advanced mode)
  if (isMobile) {
    return (
      <Layout>
        <div className="page-container section-gap mobile-compact">
          <MobileDashboard onQuickCapture={(tab) => openQuickCapture(tab ?? 'photo')} />
        </div>
        <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        <QuickCaptureDialog open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} defaultTab={quickCaptureTab} />
        <UiModeWelcomeDialog open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      </Layout>
    );
  }

  return (
    <Layout>
      <TooltipProvider delayDuration={200}>
        <div className={cn('page-container', density === 'compact' ? 'space-y-3' : 'section-gap')}>

          {/* Profile Extender Dialog (modal — placement neutral) */}
          <ProfileExtenderDialog
            open={profileExtenderOpen}
            onOpenChange={setProfileExtenderOpen}
            section={selectedProfileSection}
          />

          {/* ========================================================== */}
          {/* ZONE 1 — HOY (today): snapshot, alerts, quick actions       */}
          {/* ========================================================== */}
          <SectionHeader
            title={language === 'es' ? 'Hoy' : 'Today'}
            subtitle={language === 'es' ? 'Estado actual' : 'Current state'}
          />

          {/* Header Snapshot — 1-line state of the day */}
          <Card className="border-primary/15 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className={cn('flex items-center justify-between gap-3 flex-wrap', density === 'compact' ? 'py-2 px-3' : 'py-2.5 px-3.5')}>
              <LiveClock />
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="text-muted-foreground">{language === 'es' ? 'Balance' : 'Balance'}:</span>
                  <span className={cn(
                    'font-bold tabular-nums',
                    quickActionContext.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}>
                    {quickActionContext.balance >= 0 ? '+' : ''}{formatCurrency(quickActionContext.balance)}
                  </span>
                </span>
                {quickActionContext.incompleteExpenses > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/expenses?incomplete=true')}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <span className="font-bold tabular-nums">{quickActionContext.incompleteExpenses}</span>
                    <span>{language === 'es' ? 'sin clasificar' : 'unclassified'}</span>
                  </button>
                )}
                {quickActionContext.billsDueWeek > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/bills')}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <span className="font-bold tabular-nums">{quickActionContext.billsDueWeek}</span>
                    <span>{language === 'es' ? 'pagos esta semana' : 'bills this week'}</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Hub — moved into compact grid below alongside Inventory & Mission Control */}

          {/* Onboarding — only render when there's likely something to show (new users) */}
          {((allExpenses?.length ?? 0) < 5 || (clients?.length ?? 0) === 0) && (
            <>
              <ProgressiveOnboarding />
              {showGuide && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <InteractiveWelcome />
                </div>
              )}
            </>
          )}

          {/* Next action — only when there's something actionable beyond the snapshot chips */}
          {(quickActionContext.noClients || (allIncome?.length ?? 0) === 0) && (
            <NextActionBanner
              pendingDocuments={0}
              incompleteExpenses={0}
              totalClients={clients?.length ?? 0}
              totalIncomes={allIncome?.length ?? 0}
              totalExpenses={allExpenses?.length ?? 0}
            />
          )}

          {/* Quick Actions — context-aware */}
          <Card className="border-dashed" data-section="quick-actions">
            <CardContent className="py-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => navigate('/chaos')}
                  size="sm"
                  className={cn('gap-2', quickActionContext.noExpensesThisMonth && 'ring-2 ring-primary/40')}
                >
                  <Upload className="h-4 w-4" /> {t('dashboard.uploadDocument')}
                </Button>
                <Button
                  onClick={() => navigate('/expenses')}
                  variant={quickActionContext.noExpensesThisMonth ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  <Receipt className="h-4 w-4" /> {t('dashboard.addExpense')}
                </Button>
                <Button
                  onClick={() => navigate('/clients')}
                  variant={quickActionContext.noClients ? 'default' : 'outline'}
                  size="sm"
                  className={cn('gap-2', quickActionContext.noClients && 'ring-2 ring-primary/40')}
                >
                  <Users className="h-4 w-4" /> {t('dashboard.addClient')}
                </Button>
                {quickActionContext.billsDueSoon > 0 ? (
                  <Button
                    onClick={() => navigate('/bills')}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  >
                    <CalendarClock className="h-4 w-4" />
                    {language === 'es' ? 'Próximos pagos' : 'Upcoming bills'}
                    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {quickActionContext.billsDueSoon}
                    </span>
                  </Button>
                ) : (
                  <Button onClick={() => setExportDialogOpen(true)} variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> {t('export.exportButton')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ========================================================== */}
          {/* SYSTEM STATUS STRIP — compact 3-chip row (Avisos, Datos,    */}
          {/* Sistema). Each opens a side Sheet with the full panel.      */}
          {/* ========================================================== */}
          <SystemStatusStrip />

          {/* VIEW TABS */}
          <DashboardViewTabs
            activeTab={viewMode === 'organized' ? 'control' : 'resumen'}
            onTabChange={(tab) => setViewMode(tab === 'control' ? 'organized' : 'classic')}
          />

          {/* View Content */}
          <AnimatePresence mode="wait">
            {viewMode === 'organized' ? (
              <motion.div
                key="control"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <OrganizedDashboard deepLinkArea={deepLinkArea} deepLinkTab={deepLinkTab} deepLinkKey={deepLinkKey} />
              </motion.div>
            ) : (
              <motion.div
                key="resumen"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Timeline + Month Detail */}
                <div id="timeline" className="side-by-side" data-section="timeline" data-highlight="timeline-section">
                  <div data-highlight="timeline-chart" className="flex flex-col">
                    <YearTimelineChart
                      selectedMonth={selectedMonth}
                      onMonthSelect={setSelectedMonth}
                      selectedYear={selectedYear}
                      onYearChange={setSelectedYear}
                    />
                  </div>
                  <div data-highlight="balance-card">
                    <MonthDetailPanel
                      year={selectedYear}
                      month={selectedMonth}
                      onAddIncome={handleAddIncome}
                      onAddExpense={handleAddExpense}
                    />
                  </div>
                </div>

                {/* Banking Summary */}
                <div id="banking-summary" data-section="banking-summary">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <LazyBankingSummaryCard />
                  </Suspense>
                </div>

                {/* Financial Narrative */}
                <div id="financial-narrative" data-section="financial-narrative">
                  <Suspense fallback={<Skeleton className="h-[300px]" />}>
                    <FinancialNarrativeCard />
                  </Suspense>
                </div>

                {/* ========================================================== */}
                {/* ZONE 3 — TU SISTEMA (your system): ecosystem, autopilot   */}
                {/* ========================================================== */}
                <SectionHeader
                  title={language === 'es' ? 'Tu sistema' : 'Your system'}
                  subtitle={language === 'es' ? 'Ecosistema, automatizaciones y progreso' : 'Ecosystem, automations and progress'}
                />

                {/* Ecosystem */}
                <div id="ecosystem" data-section="ecosystem">
                  <EcosystemSection />
                </div>

                {/* Workflow Progress + Bills */}
                <div id="workflows" className="grid gap-4 lg:grid-cols-2" data-section="workflows">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <WorkflowSummaryWidget />
                  </Suspense>
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <MonthlyBillsWidget />
                  </Suspense>
                </div>

                {/* Smart Financial Autopilot */}
                <div id="autopilot" data-section="autopilot">
                  <Suspense fallback={<Skeleton className="h-[200px]" />}>
                    <FinancialAutopilot />
                  </Suspense>
                </div>

                {/* Money Momentum — single 0-100 health score */}
                <div id="momentum" data-section="momentum">
                  <MoneyMomentumScore />
                </div>

                {/* Gamification */}
                <div id="gamification" data-section="gamification">
                  <ProfileCompletionNudge onStartSection={handleStartProfileSection} />
                  <DashboardGamificationWidget compact={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Navigator */}
          <DashboardNavigator viewMode={viewMode === 'organized' ? 'control' : 'resumen'} />

          <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        </div>
      </TooltipProvider>
      <UiModeWelcomeDialog open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </Layout>
  );
}

/** Lightweight zone divider for the advanced dashboard. */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-3 pt-2">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      <div className="flex-1 border-t border-border/60 ml-2" />
    </div>
  );
}
