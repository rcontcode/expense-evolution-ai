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
import { DashboardNotificationHub } from '@/components/dashboard/DashboardNotificationHub';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { DashboardGamificationWidget } from '@/components/gamification';
import { MissionControl } from '@/components/dashboard/MissionControl';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { ProfileExtenderDialog } from '@/components/profile/ProfileExtenderDialog';
import { LifeProfileSection } from '@/hooks/data/useLifeProfile';
import { EcosystemSection } from '@/components/ecosystem/EcosystemSection';
import { DashboardNavigator } from '@/components/dashboard/DashboardNavigator';
import { useDashboardDeepLinks } from '@/hooks/utils/useDashboardDeepLinks';
import { DataInventoryPanel } from '@/components/dashboard/DataInventoryPanel';
import { SimpleDashboard } from '@/components/dashboard/SimpleDashboard';
import { UiModeWelcomeDialog } from '@/components/onboarding/UiModeWelcomeDialog';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { MoneyMomentumScore } from '@/components/dashboard/MoneyMomentumScore';
import { useIncome } from '@/hooks/data/useIncome';
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

  // Context for QuickActions: drives which buttons get highlighted
  const quickActionContext = (() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const expensesThisMonth = (allExpenses ?? []).filter((e: any) =>
      typeof e.date === 'string' && e.date.startsWith(ym)
    ).length;
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 3);
    const billsDueSoon = (bills ?? []).filter((b: any) => {
      if (!b?.next_due_date) return false;
      const d = new Date(b.next_due_date);
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && d <= limit;
    }).length;
    return {
      noClients: (clients?.length ?? 0) === 0,
      noExpensesThisMonth: expensesThisMonth === 0,
      billsDueSoon,
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

  // SIMPLE MODE — ultra-minimal dashboard for both mobile and desktop
  if (uiMode === 'simple') {
    return (
      <Layout>
        <div className="page-container section-gap">
          <SimpleDashboard onQuickCapture={() => setQuickCaptureOpen(true)} />
        </div>
        <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        <QuickCaptureDialog open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
        <UiModeWelcomeDialog open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      </Layout>
    );
  }

  // Mobile-optimized dashboard (Advanced mode)
  if (isMobile) {
    return (
      <Layout>
        <div className="page-container section-gap mobile-compact">
          <MobileDashboard onQuickCapture={() => setQuickCaptureOpen(true)} />
        </div>
        <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} expenses={allExpenses || []} />
        <QuickCaptureDialog open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
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
          {/* ZONE 1 — HOY (today): clock, alerts, quick actions          */}
          {/* ========================================================== */}
          <div className="flex items-center justify-between gap-2">
            <SectionHeader
              title={language === 'es' ? 'Hoy' : 'Today'}
              subtitle={language === 'es' ? 'Lo que pasa ahora mismo' : "What's happening right now"}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDensity}
              className="h-7 text-[11px] gap-1 shrink-0"
              title={language === 'es' ? 'Cambiar densidad de la vista' : 'Change view density'}
            >
              {density === 'compact'
                ? (language === 'es' ? '▭ Cómodo' : '▭ Comfortable')
                : (language === 'es' ? '▬ Compacto' : '▬ Compact')}
            </Button>
          </div>

          <LiveClock />

          {/* Next single most important action — reduces decision paralysis */}
          <NextActionBanner
            pendingDocuments={0}
            incompleteExpenses={(allExpenses ?? []).filter((e: any) => !e?.category || !e?.merchant).length}
            totalClients={clients?.length ?? 0}
            totalIncomes={allIncome?.length ?? 0}
            totalExpenses={allExpenses?.length ?? 0}
          />

          {/* Notification Hub — THE ONLY alert center */}
          <DashboardNotificationHub />

          {/* Onboarding (only for new users, auto-hides) */}
          <ProgressiveOnboarding />

          {/* Interactive Guide (first visit only) */}
          {showGuide && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <InteractiveWelcome />
            </div>
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
          {/* ZONE 2 — TU MES (your month): timeline, narrative, banking  */}
          {/* ========================================================== */}
          <SectionHeader
            title={language === 'es' ? 'Tu mes' : 'Your month'}
            subtitle={language === 'es' ? 'Resumen, narrativa y movimientos' : 'Summary, narrative and movements'}
          />

          {/* Data Inventory */}
          <DataInventoryPanel />

          {/* Mission Control */}
          <MissionControl />

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
