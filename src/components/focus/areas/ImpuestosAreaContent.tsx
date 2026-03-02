import { lazy, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
import { AreaTabsLayout, type AreaTab } from '../AreaTabsLayout';

const TaxOptimizerCard = lazy(() => import('@/components/dashboard/TaxOptimizerCard').then(m => ({ default: m.TaxOptimizerCard })));
const RrspTfsaOptimizerCard = lazy(() => import('@/components/dashboard/RrspTfsaOptimizerCard').then(m => ({ default: m.RrspTfsaOptimizerCard })));
const TaxSummaryCards = lazy(() => import('@/components/dashboard/TaxSummaryCards').then(m => ({ default: m.TaxSummaryCards })));

export const ImpuestosAreaContent = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: allExpenses } = useExpenses({});
  const { taxSummary } = useTaxCalculations(allExpenses || []);
  const es = language === 'es';

  const tabs: AreaTab[] = [
    {
      id: 'optimization',
      label: es ? 'Optimización' : 'Optimization',
      emoji: '🛡️',
      content: (
        <div className="grid gap-6 lg:grid-cols-2">
          <TaxOptimizerCard />
          <RrspTfsaOptimizerCard />
        </div>
      ),
    },
    {
      id: 'summary',
      label: es ? 'Resumen' : 'Summary',
      emoji: '📋',
      content: <TaxSummaryCards taxSummary={taxSummary} />,
    },
  ];

  const footer = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => navigate('/tax-calendar')}>
        {es ? '→ Calendario Fiscal' : '→ Tax Calendar'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/banking')}>
        {es ? '→ Análisis Bancario' : '→ Banking Analysis'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/reconciliation')}>
        {es ? '→ Reconciliación' : '→ Reconciliation'}
      </Button>
    </div>
  );

  return <AreaTabsLayout areaKey="impuestos" tabs={tabs} footer={footer} />;
});

ImpuestosAreaContent.displayName = 'ImpuestosAreaContent';
