import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { BankAnalysisDashboard } from '@/components/banking/BankAnalysisDashboard';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { MiniWorkflow } from '@/components/guidance/WorkflowVisualizer';
import { BankingIntegrationGuide } from '@/components/banking/BankingIntegrationGuide';
import { BankImportDialog } from '@/components/dialogs/BankImportDialog';
import { BalanceDateLookup } from '@/components/banking/BalanceDateLookup';
import { SpendingVelocityMonitor } from '@/components/banking/SpendingVelocityMonitor';
import { WeeklySpendingDigest } from '@/components/banking/WeeklySpendingDigest';
import { MerchantIntelligence } from '@/components/banking/MerchantIntelligence';
import { SmartSearchChat } from '@/components/banking/SmartSearchChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Search, AlertTriangle, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { BankingInsightsSummary } from '@/components/banking/BankingInsightsSummary';

export default function Banking() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={language === 'es' ? 'Análisis Bancario' : 'Bank Analysis'}
          description={!isMobile ? (language === 'es' 
            ? 'Importa tus estados de cuenta y obtén insights inteligentes'
            : 'Import your bank statements and get smart insights') : undefined}
        />

        {!isMobile && <MentorQuoteBanner context="dashboard" className="mb-2" />}
        
        {/* Contextual Page Guide - hidden on mobile */}
        {!isMobile && (
          <PageContextGuide
            {...PAGE_GUIDES.banking}
            actions={[
              { icon: Upload, title: { es: 'Importar Estado', en: 'Import Statement' }, description: { es: 'CSV o foto', en: 'CSV or photo' }, action: () => {} },
              { icon: Search, title: { es: 'Buscar', en: 'Search' }, description: { es: 'En transacciones', en: 'In transactions' }, action: () => {} },
              { icon: AlertTriangle, title: { es: 'Ver Anomalías', en: 'View Anomalies' }, description: { es: 'Cobros sospechosos', en: 'Suspicious charges' }, action: () => {} },
              { icon: TrendingDown, title: { es: 'Suscripciones', en: 'Subscriptions' }, description: { es: 'Detectadas', en: 'Detected' }, path: '/dashboard' }
            ]}
          />
        )}

        {/* Workflow Visualizer - hidden on mobile */}
        {!isMobile && <MiniWorkflow workflowId="bank-reconciliation" />}

        {/* Banking Integration Guide with Tooltips - collapsed by default on mobile */}
        {!isMobile && (
          <div data-highlight="bank-import-guide">
            <BankingIntegrationGuide onImportClick={() => setImportDialogOpen(true)} />
          </div>
        )}
        
        {/* Smart Search Chat - prominent standalone */}
        <SmartSearchChat />

        {/* Intelligence Cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          <SpendingVelocityMonitor />
          <WeeklySpendingDigest />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BalanceDateLookup />
          <MerchantIntelligence />
        </div>

        <div data-highlight="bank-analysis-dashboard">
          <BankAnalysisDashboard onImportClick={() => setImportDialogOpen(true)} />
        </div>

        {/* Import Dialog */}
        <BankImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
      </div>
    </Layout>
  );
}
