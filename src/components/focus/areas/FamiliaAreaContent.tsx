import { lazy, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AreaTabsLayout, type AreaTab } from '../AreaTabsLayout';

const FamilyMonthlyAnalysis = lazy(() => import('@/components/dashboard/FamilyMonthlyAnalysis').then(m => ({ default: m.FamilyMonthlyAnalysis })));
const IncomeAnalyticsDashboard = lazy(() => import('@/components/analytics/IncomeAnalyticsDashboard').then(m => ({ default: m.IncomeAnalyticsDashboard })));
const GlobalBudgetCard = lazy(() => import('@/components/dashboard/GlobalBudgetCard').then(m => ({ default: m.GlobalBudgetCard })));
const CategoryBudgetsCard = lazy(() => import('@/components/dashboard/CategoryBudgetsCard').then(m => ({ default: m.CategoryBudgetsCard })));
const BudgetAlertsCard = lazy(() => import('@/components/dashboard/BudgetAlertsCard').then(m => ({ default: m.BudgetAlertsCard })));
const DebtManagerCard = lazy(() => import('@/components/dashboard/DebtManagerCard').then(m => ({ default: m.DebtManagerCard })));
const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));

export const FamiliaAreaContent = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const now = new Date();
  const es = language === 'es';

  const tabs: AreaTab[] = [
    {
      id: 'analysis',
      label: es ? 'Análisis' : 'Analysis',
      emoji: '📊',
      content: (
        <div className="space-y-6">
          <FamilyMonthlyAnalysis year={now.getFullYear()} month={now.getMonth()} />
          <IncomeAnalyticsDashboard year={now.getFullYear()} month={now.getMonth()} />
        </div>
      ),
    },
    {
      id: 'budget',
      label: es ? 'Presupuesto' : 'Budget',
      emoji: '💰',
      content: (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlobalBudgetCard />
            <CategoryBudgetsCard />
          </div>
          <BudgetAlertsCard />
        </div>
      ),
    },
    {
      id: 'debts',
      label: es ? 'Deudas' : 'Debts',
      emoji: '🏦',
      content: <DebtManagerCard />,
    },
    {
      id: 'subscriptions',
      label: es ? 'Suscripciones' : 'Subscriptions',
      emoji: '🔄',
      content: <SubscriptionTracker />,
    },
  ];

  const footer = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => navigate('/net-worth')}>
        {es ? '→ Ver Patrimonio Neto' : '→ View Net Worth'}
      </Button>
    </div>
  );

  return <AreaTabsLayout areaKey="familia" tabs={tabs} footer={footer} />;
});

FamiliaAreaContent.displayName = 'FamiliaAreaContent';
