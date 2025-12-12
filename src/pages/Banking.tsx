import { Layout } from '@/components/Layout';
import { BankAnalysisDashboard } from '@/components/banking/BankAnalysisDashboard';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Search, AlertTriangle, TrendingDown } from 'lucide-react';

export default function Banking() {
  const { language } = useLanguage();

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'es' ? 'Análisis Bancario' : 'Bank Analysis'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'es' 
              ? 'Importa tus estados de cuenta y obtén insights inteligentes'
              : 'Import your bank statements and get smart insights'}
          </p>
        </div>

        <MentorQuoteBanner context="dashboard" className="mb-2" />
        
        {/* Contextual Page Guide */}
        <PageContextGuide
          {...PAGE_GUIDES.banking}
          actions={[
            { icon: Upload, title: { es: 'Importar Estado', en: 'Import Statement' }, description: { es: 'CSV o foto', en: 'CSV or photo' }, action: () => {} },
            { icon: Search, title: { es: 'Buscar', en: 'Search' }, description: { es: 'En transacciones', en: 'In transactions' }, action: () => {} },
            { icon: AlertTriangle, title: { es: 'Ver Anomalías', en: 'View Anomalies' }, description: { es: 'Cobros sospechosos', en: 'Suspicious charges' }, action: () => {} },
            { icon: TrendingDown, title: { es: 'Suscripciones', en: 'Subscriptions' }, description: { es: 'Detectadas', en: 'Detected' }, path: '/dashboard' }
          ]}
        />
        
        <BankAnalysisDashboard />
      </div>
    </Layout>
  );
}
