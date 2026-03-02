import { lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useMileageSummary } from '@/hooks/data/useMileage';
import { AreaTabsLayout, type AreaTab } from '../AreaTabsLayout';
import { Users, FileText, Car } from 'lucide-react';

const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.DashboardCharts })));
const MileageTabContent = lazy(() => import('@/components/dashboard/MileageTabContent').then(m => ({ default: m.MileageTabContent })));

export const NegocioAreaContent = memo(({ forcedTab }: { forcedTab?: string | null }) => {
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
      description: es ? 'Distribución de gastos por categoría, cliente y tendencias mensuales' : 'Expense breakdown by category, client and monthly trends',
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
      description: es ? 'Registro de viajes de negocios y deducciones por kilometraje' : 'Business trip logs and mileage deductions',
      content: <MileageTabContent mileageSummary={mileageSummary} isLoading={mileageLoading} />,
    },
  ];

  const footer = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/clients')}>
        <Users className="h-3.5 w-3.5" />
        {es ? 'Clientes' : 'Clients'}
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/contracts')}>
        <FileText className="h-3.5 w-3.5" />
        {es ? 'Contratos' : 'Contracts'}
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/mileage')}>
        <Car className="h-3.5 w-3.5" />
        {es ? 'Kilometraje' : 'Mileage'}
      </Button>
    </div>
  );

  return <AreaTabsLayout areaKey="negocio" tabs={tabs} footer={footer} />;
});

NegocioAreaContent.displayName = 'NegocioAreaContent';
