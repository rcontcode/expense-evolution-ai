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
import { CashFlowRunwayCalculator } from '@/components/banking/CashFlowRunwayCalculator';
import { BankImportHistory } from '@/components/banking/BankImportHistory';
import { BankTransactionSummary } from '@/components/banking/BankTransactionSummary';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Search, AlertTriangle, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SimpleModePageBanner } from '@/components/dashboard/SimpleModePageBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { BankingInsightsSummary } from '@/components/banking/BankingInsightsSummary';
import { MobileTabLayout, type MobileTab } from '@/components/mobile';

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
        <SimpleModePageBanner
          pageId="banking"
          description={{
            es: 'Conecta o sube tus extractos bancarios y tus gastos se registrarán solos. Aquí ves todos los movimientos detectados.',
            en: 'Connect or upload your bank statements and expenses log themselves. Here you see every detected movement.',
          }}
        />
        {!isMobile && <MentorQuoteBanner context="dashboard" className="mb-2" />}
        
        {!isMobile && (
          <PageContextGuide
            {...PAGE_GUIDES.banking}
            actions={[
              { icon: Upload, title: { es: 'Importar Estado', en: 'Import Statement' }, description: { es: 'CSV o foto', en: 'CSV or photo' }, action: () => setImportDialogOpen(true) },
              { icon: Search, title: { es: 'Buscar', en: 'Search' }, description: { es: 'En transacciones', en: 'In transactions' }, action: () => document.querySelector('[data-section="smart-search"]')?.scrollIntoView({ behavior: 'smooth' }) },
              { icon: AlertTriangle, title: { es: 'Ver Anomalías', en: 'View Anomalies' }, description: { es: 'Cobros sospechosos', en: 'Suspicious charges' }, action: () => document.querySelector('[data-highlight="bank-analysis-dashboard"]')?.scrollIntoView({ behavior: 'smooth' }) },
              { icon: TrendingDown, title: { es: 'Suscripciones', en: 'Subscriptions' }, description: { es: 'Detectadas', en: 'Detected' }, path: '/subscriptions' }
            ]}
          />
        )}

        {!isMobile && <MiniWorkflow workflowId="bank-reconciliation" />}

        {!isMobile && (
          <div data-highlight="bank-import-guide">
            <BankingIntegrationGuide onImportClick={() => setImportDialogOpen(true)} />
          </div>
        )}

        {isMobile ? (
          <MobileTabLayout
            tabs={[
              {
                id: 'summary',
                label: language === 'es' ? 'Resumen' : 'Summary',
                emoji: '📊',
                content: (
                  <div className="space-y-3">
                    <BankingInsightsSummary />
                    <BankTransactionSummary />
                    <BankImportHistory />
                  </div>
                ),
              },
              {
                id: 'tools',
                label: language === 'es' ? 'Herramientas' : 'Tools',
                emoji: '🔧',
                content: (
                  <div className="space-y-3">
                    <SmartSearchChat />
                    <SpendingVelocityMonitor />
                    <CashFlowRunwayCalculator />
                    <WeeklySpendingDigest />
                    <MerchantIntelligence />
                    <BalanceDateLookup />
                  </div>
                ),
              },
              {
                id: 'analysis',
                label: language === 'es' ? 'Análisis' : 'Analysis',
                emoji: '📈',
                content: (
                  <div data-highlight="bank-analysis-dashboard">
                    <BankAnalysisDashboard onImportClick={() => setImportDialogOpen(true)} />
                  </div>
                ),
              },
            ] as MobileTab[]}
          />
        ) : (
          <>
            <BankingInsightsSummary />
            <BankTransactionSummary />
            <BankImportHistory />
            <div data-section="smart-search"><SmartSearchChat /></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <SpendingVelocityMonitor />
              <CashFlowRunwayCalculator />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <WeeklySpendingDigest />
              <MerchantIntelligence />
            </div>
            <BalanceDateLookup />
            <div data-highlight="bank-analysis-dashboard">
              <BankAnalysisDashboard onImportClick={() => setImportDialogOpen(true)} />
            </div>
          </>
        )}

        <BankImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} />
      </div>
    </Layout>
  );
}
