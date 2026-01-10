import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { BankAnalysisDashboard } from '@/components/banking/BankAnalysisDashboard';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MiniWorkflow } from '@/components/guidance/WorkflowVisualizer';
import { BankingIntegrationGuide } from '@/components/banking/BankingIntegrationGuide';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Search, AlertTriangle, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export default function Banking() {
  const { language } = useLanguage();
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <PageHeader
          title={language === 'es' ? 'Análisis Bancario' : 'Bank Analysis'}
          description={language === 'es' 
            ? 'Importa tus estados de cuenta y obtén insights inteligentes'
            : 'Import your bank statements and get smart insights'}
        />

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

        {/* Workflow Visualizer - Bank Reconciliation Flow */}
        <MiniWorkflow workflowId="bank-reconciliation" />

        {/* Banking Integration Guide with Tooltips */}
        <div data-highlight="bank-import-guide">
          <BankingIntegrationGuide onImportClick={() => setImportDialogOpen(true)} />
        </div>
        
        <div data-highlight="bank-analysis-dashboard">
          <BankAnalysisDashboard />
        </div>

        {/* Import Dialog */}
        <BankImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
      </div>
    </Layout>
  );
}
