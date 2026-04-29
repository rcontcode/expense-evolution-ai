import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useTaxCalculations } from '@/hooks/data/useTaxCalculations';
import { TaxSummaryCards } from '@/components/dashboard/TaxSummaryCards';
import { TaxDeadlineCountdown } from '@/components/tax/TaxDeadlineCountdown';
import { TaxDocumentChecklist } from '@/components/tax/TaxDocumentChecklist';
import { Receipt } from 'lucide-react';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { FeatureGate } from '@/components/FeatureGate';

const TaxOptimizerCard = lazy(() => import('@/components/dashboard/TaxOptimizerCard').then(m => ({ default: m.TaxOptimizerCard })));
const SavingsOptimizerSection = lazy(() => import('@/components/tax/SavingsOptimizerSection').then(m => ({ default: m.SavingsOptimizerSection })));

export default function TaxOptimizer() {
  const { language } = useLanguage();
  const { data: allExpenses } = useExpenses();
  const { taxSummary } = useTaxCalculations(allExpenses || []);

  return (
    <Layout>
      <div className="page-container section-gap">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'es' ? 'Optimizador Fiscal' : 'Tax Optimizer'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Resumen fiscal, deducciones y estrategias de ahorro' : 'Tax summary, deductions & savings strategies'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <TaxDeadlineCountdown />
          <TaxSummaryCards taxSummary={taxSummary} />
          <TaxDocumentChecklist />
          <Suspense fallback={<Skeleton className="h-[300px]" />}>
            <TaxOptimizerCard />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[300px]" />}>
            <SavingsOptimizerSection />
          </Suspense>
          <LegalDisclaimer variant="tax" size="compact" />
        </div>
      </div>
    </Layout>
  );
}
