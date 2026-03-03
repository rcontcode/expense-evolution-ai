import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { BillsDashboard } from '@/components/bills/BillsDashboard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Bills() {
  const { language } = useLanguage();
  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={language === 'es' ? 'Pagos Fijos' : 'Fixed Payments'}
          description={language === 'es' ? 'Gestiona tus pagos recurrentes' : 'Manage your recurring payments'}
        />
        <BillsDashboard />
      </div>
    </Layout>
  );
}
