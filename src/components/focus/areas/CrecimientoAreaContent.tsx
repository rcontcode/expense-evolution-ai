import { lazy, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AreaTabsLayout, type AreaTab } from '../AreaTabsLayout';

const FIRECalculatorCard = lazy(() => import('@/components/dashboard/FIRECalculatorCard').then(m => ({ default: m.FIRECalculatorCard })));
const PortfolioTrackerCard = lazy(() => import('@/components/dashboard/PortfolioTrackerCard').then(m => ({ default: m.PortfolioTrackerCard })));
const PersonalizedInvestmentTips = lazy(() => import('@/components/investments/PersonalizedInvestmentTips').then(m => ({ default: m.PersonalizedInvestmentTips })));
const CashflowQuadrantCard = lazy(() => import('@/components/mentorship/CashflowQuadrantCard').then(m => ({ default: m.CashflowQuadrantCard })));
const FinancialFreedomCard = lazy(() => import('@/components/mentorship/FinancialFreedomCard').then(m => ({ default: m.FinancialFreedomCard })));
const PayYourselfFirstCard = lazy(() => import('@/components/mentorship/PayYourselfFirstCard').then(m => ({ default: m.PayYourselfFirstCard })));
const DebtClassificationCard = lazy(() => import('@/components/mentorship/DebtClassificationCard').then(m => ({ default: m.DebtClassificationCard })));
const SMARTGoalsCard = lazy(() => import('@/components/mentorship/SMARTGoalsCard').then(m => ({ default: m.SMARTGoalsCard })));
const FinancialJournalCard = lazy(() => import('@/components/mentorship/FinancialJournalCard').then(m => ({ default: m.FinancialJournalCard })));
const FinancialHabitsCard = lazy(() => import('@/components/mentorship/FinancialHabitsCard').then(m => ({ default: m.FinancialHabitsCard })));
const FinancialEducationCard = lazy(() => import('@/components/mentorship/FinancialEducationCard').then(m => ({ default: m.FinancialEducationCard })));

export const CrecimientoAreaContent = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const es = language === 'es';

  const tabs: AreaTab[] = [
    {
      id: 'investments',
      label: es ? 'Inversiones' : 'Investments',
      emoji: '💼',
      content: (
        <div className="space-y-6">
          <FIRECalculatorCard />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioTrackerCard />
            </div>
            <div className="lg:col-span-1">
              <PersonalizedInvestmentTips />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'mentorship',
      label: es ? 'Mentoría' : 'Mentorship',
      emoji: '📖',
      content: (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <CashflowQuadrantCard />
            <FinancialFreedomCard />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PayYourselfFirstCard />
            <DebtClassificationCard />
          </div>
        </div>
      ),
    },
    {
      id: 'goals',
      label: es ? 'Metas' : 'Goals',
      emoji: '🎯',
      content: (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SMARTGoalsCard />
            <FinancialJournalCard />
            <FinancialHabitsCard />
          </div>
        </div>
      ),
    },
    {
      id: 'education',
      label: es ? 'Educación' : 'Education',
      emoji: '📚',
      content: <FinancialEducationCard />,
    },
  ];

  const footer = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => navigate('/mentorship')}>
        {es ? '→ Página de Mentoría' : '→ Mentorship Page'}
      </Button>
    </div>
  );

  return <AreaTabsLayout areaKey="crecimiento" tabs={tabs} footer={footer} />;
});

CrecimientoAreaContent.displayName = 'CrecimientoAreaContent';
