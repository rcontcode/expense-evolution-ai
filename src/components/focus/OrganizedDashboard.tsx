import { lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AreaSection } from './AreaSection';
import { FOCUS_AREA_ORDER, FocusAreaId } from '@/lib/constants/focus-areas';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
import { useMileageSummary } from '@/hooks/data/useMileage';
import { Settings2 } from 'lucide-react';

// Lazy load all the same components as Dashboard
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const MileageTabContent = lazy(() => import('@/components/dashboard/MileageTabContent').then(m => ({ default: m.MileageTabContent })));
const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));
const TaxOptimizerCard = lazy(() => import('@/components/dashboard/TaxOptimizerCard').then(m => ({ default: m.TaxOptimizerCard })));
const RrspTfsaOptimizerCard = lazy(() => import('@/components/dashboard/RrspTfsaOptimizerCard').then(m => ({ default: m.RrspTfsaOptimizerCard })));
const FIRECalculatorCard = lazy(() => import('@/components/dashboard/FIRECalculatorCard').then(m => ({ default: m.FIRECalculatorCard })));
const DebtManagerCard = lazy(() => import('@/components/dashboard/DebtManagerCard').then(m => ({ default: m.DebtManagerCard })));
const PortfolioTrackerCard = lazy(() => import('@/components/dashboard/PortfolioTrackerCard').then(m => ({ default: m.PortfolioTrackerCard })));
const PersonalizedInvestmentTips = lazy(() => import('@/components/investments/PersonalizedInvestmentTips').then(m => ({ default: m.PersonalizedInvestmentTips })));
const TaxSummaryCards = lazy(() => import('@/components/dashboard/TaxSummaryCards').then(m => ({ default: m.TaxSummaryCards })));
const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));
const CategoryBudgetsCard = lazy(() => import('@/components/dashboard/CategoryBudgetsCard').then(m => ({ default: m.CategoryBudgetsCard })));
const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
const CashflowQuadrantCard = lazy(() => import('@/components/mentorship/CashflowQuadrantCard').then(m => ({ default: m.CashflowQuadrantCard })));
const FinancialFreedomCard = lazy(() => import('@/components/mentorship/FinancialFreedomCard').then(m => ({ default: m.FinancialFreedomCard })));
const PayYourselfFirstCard = lazy(() => import('@/components/mentorship/PayYourselfFirstCard').then(m => ({ default: m.PayYourselfFirstCard })));
const DebtClassificationCard = lazy(() => import('@/components/mentorship/DebtClassificationCard').then(m => ({ default: m.DebtClassificationCard })));
const FinancialJournalCard = lazy(() => import('@/components/mentorship/FinancialJournalCard').then(m => ({ default: m.FinancialJournalCard })));
const FinancialHabitsCard = lazy(() => import('@/components/mentorship/FinancialHabitsCard').then(m => ({ default: m.FinancialHabitsCard })));
const FinancialEducationCard = lazy(() => import('@/components/mentorship/FinancialEducationCard').then(m => ({ default: m.FinancialEducationCard })));
const SMARTGoalsCard = lazy(() => import('@/components/mentorship/SMARTGoalsCard').then(m => ({ default: m.SMARTGoalsCard })));

// Skeletons
const SectionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-[200px]" />
    <Skeleton className="h-[200px]" />
  </div>
);

export const OrganizedDashboard = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { activeAreas, isAreaCollapsed, toggleCollapsed } = useDisplayPreferences();
  
  // Data fetching
  const { data: stats, isLoading } = useDashboardStats({});
  const { data: allExpenses } = useExpenses({});
  const { taxSummary } = useTaxCalculations(allExpenses || []);
  const { data: mileageSummary, isLoading: mileageLoading } = useMileageSummary();

  // Content for each area
  const areaContent: Record<FocusAreaId, React.ReactNode> = {
    negocio: (
      <div className="space-y-6">
        <Suspense fallback={<SectionSkeleton />}>
          <DashboardCharts
            categoryBreakdown={stats?.categoryBreakdown || []}
            clientBreakdown={stats?.clientBreakdown || []}
            monthlyTrends={stats?.monthlyTrends || []}
            isLoading={isLoading}
          />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[200px]" />}>
          <MileageTabContent
            mileageSummary={mileageSummary}
            isLoading={mileageLoading}
          />
        </Suspense>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
            {language === 'es' ? '→ Ver Clientes' : '→ View Clients'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
            {language === 'es' ? '→ Ver Contratos' : '→ View Contracts'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/mileage')}>
            {language === 'es' ? '→ Registrar Kilometraje' : '→ Log Mileage'}
          </Button>
        </div>
      </div>
    ),
    familia: (
      <div className="space-y-6">
        <Suspense fallback={<SectionSkeleton />}>
          <div className="grid gap-6 lg:grid-cols-2">
            <GlobalBudgetCard />
            <CategoryBudgetsCard />
          </div>
          <BudgetAlertsCard />
          <DebtManagerCard />
          <SubscriptionTracker />
        </Suspense>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/net-worth')}>
            {language === 'es' ? '→ Ver Patrimonio Neto' : '→ View Net Worth'}
          </Button>
        </div>
      </div>
    ),
    diadia: (
      <div className="space-y-6">
        <Suspense fallback={<Skeleton className="h-[200px]" />}>
          <DashboardCharts
            categoryBreakdown={stats?.categoryBreakdown || []}
            clientBreakdown={[]}
            monthlyTrends={stats?.monthlyTrends || []}
            isLoading={isLoading}
          />
        </Suspense>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/chaos')}>
            {language === 'es' ? '→ Chaos Inbox' : '→ Chaos Inbox'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/expenses')}>
            {language === 'es' ? '→ Agregar Gasto' : '→ Add Expense'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/mobile-capture')}>
            {language === 'es' ? '→ Captura Rápida' : '→ Quick Capture'}
          </Button>
        </div>
      </div>
    ),
    crecimiento: (
      <div className="space-y-6">
        <Suspense fallback={<SectionSkeleton />}>
          <FIRECalculatorCard />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioTrackerCard />
            </div>
            <div className="lg:col-span-1">
              <PersonalizedInvestmentTips />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <CashflowQuadrantCard />
            <FinancialFreedomCard />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PayYourselfFirstCard />
            <DebtClassificationCard />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SMARTGoalsCard />
            <FinancialJournalCard />
            <FinancialHabitsCard />
            <FinancialEducationCard />
          </div>
        </Suspense>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/mentorship')}>
            {language === 'es' ? '→ Página de Mentoría' : '→ Mentorship Page'}
          </Button>
        </div>
      </div>
    ),
    impuestos: (
      <div className="space-y-6">
        <Suspense fallback={<SectionSkeleton />}>
          <div className="grid gap-6 lg:grid-cols-2">
            <TaxOptimizerCard />
            <RrspTfsaOptimizerCard />
          </div>
          <TaxSummaryCards taxSummary={taxSummary} />
        </Suspense>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/tax-calendar')}>
            {language === 'es' ? '→ Calendario Fiscal' : '→ Tax Calendar'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/banking')}>
            {language === 'es' ? '→ Análisis Bancario' : '→ Banking Analysis'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reconciliation')}>
            {language === 'es' ? '→ Reconciliación' : '→ Reconciliation'}
          </Button>
        </div>
      </div>
    ),
  };

  const visibleAreas = FOCUS_AREA_ORDER.filter(areaId => activeAreas.includes(areaId));

  return (
    <div className="space-y-6">
      {/* Header with settings */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {language === 'es' ? '🎛️ Centro de Control por Áreas' : '🎛️ Control Center by Areas'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'es' 
              ? 'Haz clic en cada sección para colapsar/expandir'
              : 'Click each section to collapse/expand'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
          <Settings2 className="h-4 w-4 mr-2" />
          {language === 'es' ? 'Configurar Áreas' : 'Configure Areas'}
        </Button>
      </div>

      {/* Area Sections */}
      {visibleAreas.map(areaId => (
        <AreaSection
          key={areaId}
          areaId={areaId}
          isCollapsed={isAreaCollapsed(areaId)}
          onToggleCollapse={() => toggleCollapsed(areaId)}
        >
          {areaContent[areaId]}
        </AreaSection>
      ))}

      {/* Empty state */}
      {visibleAreas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{language === 'es' ? 'No hay áreas activas' : 'No active areas'}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/settings')}>
            {language === 'es' ? 'Activar Áreas' : 'Activate Areas'}
          </Button>
        </div>
      )}
    </div>
  );
});

OrganizedDashboard.displayName = 'OrganizedDashboard';
