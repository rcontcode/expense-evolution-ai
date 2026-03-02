import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase } from 'lucide-react';

const FIRECalculatorCard = lazy(() => import('@/components/dashboard/FIRECalculatorCard').then(m => ({ default: m.FIRECalculatorCard })));
const DebtManagerCard = lazy(() => import('@/components/dashboard/DebtManagerCard').then(m => ({ default: m.DebtManagerCard })));
const PortfolioTrackerCard = lazy(() => import('@/components/dashboard/PortfolioTrackerCard').then(m => ({ default: m.PortfolioTrackerCard })));
const PersonalizedInvestmentTips = lazy(() => import('@/components/investments/PersonalizedInvestmentTips').then(m => ({ default: m.PersonalizedInvestmentTips })));

export default function Investments() {
  const { language } = useLanguage();

  return (
    <Layout>
      <div className="page-container section-gap">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'es' ? 'Inversiones & FIRE' : 'Investments & FIRE'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Portfolio, deuda, libertad financiera y tips personalizados' : 'Portfolio, debt, financial freedom & personalized tips'}
            </p>
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <div className="space-y-6">
            <FIRECalculatorCard />
            <div className="grid gap-6 lg:grid-cols-2">
              <PortfolioTrackerCard />
              <DebtManagerCard />
            </div>
            <PersonalizedInvestmentTips />
          </div>
        </Suspense>
      </div>
    </Layout>
  );
}
