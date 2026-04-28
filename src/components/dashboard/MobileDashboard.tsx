import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, DollarSign, PieChart, Receipt, Building2, Sparkles, Mic, PenLine } from 'lucide-react';
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
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';


const LazyEcosystemWidgets = lazy(() => import('@/components/ecosystem/EcosystemDashboardWidgets'));
const LazyBankingSummaryCard = lazy(() => import('@/components/banking/BankingSummaryCard').then(m => ({ default: m.BankingSummaryCard })));
const LazyFinancialNarrative = lazy(() => import('@/components/dashboard/FinancialNarrativeCard'));
const OrganizedDashboard = lazy(() => import('@/components/focus').then(m => ({ default: m.OrganizedDashboard })));

interface MobileDashboardProps {
  onQuickCapture?: (initialTab?: 'photo' | 'text') => void;
}

export function MobileDashboard({ onQuickCapture }: MobileDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { setUiMode } = useDisplayPreferences();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);
  const openCapture = useCallback((tab: 'photo' | 'text' = 'photo') => {
    if (onQuickCapture) onQuickCapture(tab);
    else navigate('/mobile-capture');
  }, [onQuickCapture, navigate]);

  const monthlyIncome = stats?.monthlyIncome || 0;
  const monthlyExpenses = stats?.monthlyTotal || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

  const quickActions = [
    { icon: Camera, label: language === 'es' ? 'Capturar' : 'Capture', onClick: () => openCapture('photo'), variant: 'default' as const },
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
          <Suspense fallback={<Skeleton className="h-40" />}>
            <LazyFinancialNarrative />
          </Suspense>
          <MonthDetailPanel
            year={selectedYear}
            month={selectedMonth}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
            compact
          />
          <DashboardNotificationHub />
          <ProfileCompletionNudge />
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
    <div className="mobile-compact space-y-2 pb-20">
      <LiveClock />
      <MobileTabLayout tabs={tabs} paramKey="dash" defaultTab="resumen" />
      <div className="text-center pt-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => {
            setUiMode('simple');
            navigate('/', { replace: true });
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {language === 'es' ? '¿Demasiado? Cambiar a Modo Simple' : 'Too much? Switch to Simple Mode'}
        </Button>
      </div>

      {/* Floating quick-capture bar — fixed above bottom nav, one tap from any scroll position */}
      <div
        className="fixed left-0 right-0 z-30 px-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}
      >
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] p-1.5 flex items-center justify-around gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/mobile-capture')}
            className="flex-1 flex flex-col items-center gap-0.5 h-auto py-1.5 text-[10px] font-semibold"
            aria-label={language === 'es' ? 'Capturar foto' : 'Capture photo'}
          >
            <Camera className="h-4 w-4 text-primary" />
            {language === 'es' ? 'Foto' : 'Photo'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openCapture('photo')}
            className="flex-1 flex flex-col items-center gap-0.5 h-auto py-1.5 text-[10px] font-semibold"
            aria-label={language === 'es' ? 'Captura por voz' : 'Voice capture'}
          >
            <Mic className="h-4 w-4 text-violet-500" />
            {language === 'es' ? 'Voz' : 'Voice'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openCapture('text')}
            className="flex-1 flex flex-col items-center gap-0.5 h-auto py-1.5 text-[10px] font-semibold"
            aria-label={language === 'es' ? 'Añadir manualmente' : 'Add manually'}
          >
            <PenLine className="h-4 w-4 text-emerald-500" />
            {language === 'es' ? 'Manual' : 'Manual'}
          </Button>
        </div>
      </div>
    </div>
  );
}
