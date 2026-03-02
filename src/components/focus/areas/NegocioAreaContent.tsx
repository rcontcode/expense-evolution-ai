import { lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useMileageSummary } from '@/hooks/data/useMileage';
import { AreaTabsLayout, type AreaTab } from '../AreaTabsLayout';

const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const MileageTabContent = lazy(() => import('@/components/dashboard/MileageTabContent').then(m => ({ default: m.MileageTabContent })));

export const NegocioAreaContent = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats({});
  const { data: mileageSummary, isLoading: mileageLoading } = useMileageSummary();

  const es = language === 'es';

  const tabs: AreaTab[] = [
    {
      id: 'charts',
      label: es ? 'Gráficos' : 'Charts',
      emoji: '📊',
      content: (
        <DashboardCharts
          categoryBreakdown={stats?.categoryBreakdown || []}
          clientBreakdown={stats?.clientBreakdown || []}
          monthlyTrends={stats?.monthlyTrends || []}
          isLoading={isLoading}
        />
      ),
    },
    {
      id: 'mileage',
      label: es ? 'Kilometraje' : 'Mileage',
      emoji: '🚗',
      content: <MileageTabContent mileageSummary={mileageSummary} isLoading={mileageLoading} />,
    },
  ];

  const footer = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
        {es ? '→ Ver Clientes' : '→ View Clients'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/contracts')}>
        {es ? '→ Ver Contratos' : '→ View Contracts'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/mileage')}>
        {es ? '→ Registrar Kilometraje' : '→ Log Mileage'}
      </Button>
    </div>
  );

  return <AreaTabsLayout areaKey="negocio" tabs={tabs} footer={footer} />;
});

NegocioAreaContent.displayName = 'NegocioAreaContent';
