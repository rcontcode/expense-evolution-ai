import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, DollarSign, PieChart, Receipt, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { DashboardNotificationHub } from '@/components/dashboard/DashboardNotificationHub';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { MobileStatsGrid } from '@/components/dashboard/MobileStatsGrid';
import { MobileTabLayout, type MobileTab } from '@/components/mobile';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { DashboardGamificationWidget } from '@/components/gamification';
import { MissionControl } from '@/components/dashboard/MissionControl';
import { UiModeToggle } from '@/components/layout/UiModeToggle';

const LazyEcosystemWidgets = lazy(() => import('@/components/ecosystem/EcosystemDashboardWidgets'));
const LazyBankingSummaryCard = lazy(() => import('@/components/banking/BankingSummaryCard').then(m => ({ default: m.BankingSummaryCard })));
const LazyFinancialNarrative = lazy(() => import('@/components/dashboard/FinancialNarrativeCard'));
const OrganizedDashboard = lazy(() => import('@/components/focus').then(m => ({ default: m.OrganizedDashboard })));

interface MobileDashboardProps {
  onQuickCapture?: () => void;
}

export function MobileDashboard({ onQuickCapture }: MobileDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);

  const monthlyIncome = stats?.monthlyIncome || 0;
  const monthlyExpenses = stats?.monthlyTotal || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

  const quickActions = [
    { icon: Camera, label: language === 'es' ? 'Capturar' : 'Capture', onClick: onQuickCapture ?? (() => navigate('/mobile-capture')), variant: 'default' as const },
    { icon: Receipt, label: language === 'es' ? '+ Gasto' : '+ Expense', onClick: handleAddExpense, variant: 'outline' as const },
    { icon: DollarSign, label: language === 'es' ? '+ Ingreso' : '+ Income', onClick: handleAddIncome, variant: 'outline' as const },
    { icon: PieChart, label: language === 'es' ? 'Budget' : 'Budget', onClick: () => navigate('/budget'), variant: 'outline' as const },
    { icon: Building2, label: language === 'es' ? 'Banco' : 'Bank', onClick: () => navigate('/banking'), variant: 'outline' as const },
  ];

  const tabs: MobileTab[] = [
    {
      id: 'resumen',
      label: language === 'es' ? 'Resumen' : 'Summary',
      emoji: '📊',
      content: (
        <div className="space-y-2">
          <MobileStatsGrid
            isLoading={isLoading}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            monthlyBalance={monthlyBalance}
            savingsRate={savingsRate}
          />
          <MonthDetailPanel
            year={selectedYear}
            month={selectedMonth}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
            compact
          />
        </div>
      ),
    },
    {
      id: 'timeline',
      label: language === 'es' ? 'Año' : 'Year',
      emoji: '📅',
      content: (
        <div className="space-y-2" data-section="timeline">
          <YearTimelineChart
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            compact
          />
        </div>
      ),
    },
    {
      id: 'acciones',
      label: language === 'es' ? 'Acciones' : 'Actions',
      emoji: '⚡',
      content: (
        <div className="space-y-2">
          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(({ icon: Icon, label, onClick, variant }) => (
                  <Button key={label} variant={variant} onClick={onClick} className="h-9 justify-start gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Suspense fallback={null}>
            <LazyBankingSummaryCard compact />
          </Suspense>
        </div>
      ),
    },
    {
      id: 'sistema',
      label: language === 'es' ? 'Sistema' : 'System',
      emoji: '🎛️',
      content: (
        <div className="space-y-2">
          <MissionControl compact />
          <DashboardNotificationHub />
          <ProgressiveOnboarding />
          <div data-section="gamification" className="space-y-2">
            <ProfileCompletionNudge />
            <DashboardGamificationWidget compact={true} />
          </div>
        </div>
      ),
    },
    {
      id: 'ecosistema',
      label: language === 'es' ? 'Ecosistema' : 'Ecosystem',
      emoji: '🌐',
      content: (
        <div className="space-y-2" data-section="ecosystem">
          <Suspense fallback={null}>
            <LazyEcosystemWidgets />
          </Suspense>
          <Suspense fallback={null}>
            <LazyFinancialNarrative />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-72" />}>
            <OrganizedDashboard />
          </Suspense>
        </div>
      ),
    },
  ];

  return (
    <div className="mobile-compact space-y-2">
      {/* Vista actual: toggle prominente y siempre visible */}
      <div className="flex items-center justify-between gap-2 px-1 py-1">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {language === 'es' ? 'Vista' : 'View'}
        </span>
        <UiModeToggle />
      </div>
      <LiveClock />
      <MobileTabLayout tabs={tabs} paramKey="dash" defaultTab="resumen" />
    </div>
  );
}
