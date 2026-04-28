import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { BillsDashboard } from '@/components/bills/BillsDashboard';
import { BillOptimizationEngine } from '@/components/bills/BillOptimizationEngine';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTabLayout, type MobileTab } from '@/components/mobile';

function BillsAdvanced() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const tabs: MobileTab[] = [
    { id: 'pagos', label: language === 'es' ? 'Pagos' : 'Bills', emoji: '📅', content: <BillsDashboard /> },
    { id: 'optimizar', label: language === 'es' ? 'Optimizar' : 'Optimize', emoji: '⚡', content: <BillOptimizationEngine /> },
  ];

  return (
    <Layout>
      <div className="page-container section-gap mobile-compact">
        <PageHeader
          title={language === 'es' ? 'Pagos Fijos' : 'Fixed Payments'}
          description={!isMobile ? (language === 'es' ? 'Gestiona tus pagos recurrentes' : 'Manage your recurring payments') : undefined}
        />
        <MobileTabLayout tabs={tabs} paramKey="bills" defaultTab="pagos" />
      </div>
    </Layout>
  );
}
