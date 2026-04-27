import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase } from 'lucide-react';
import { InvestmentRiskProfiler } from '@/components/investments/InvestmentRiskProfiler';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTabLayout, type MobileTab } from '@/components/mobile';

const FIRECalculatorCard = lazy(() => import('@/components/dashboard/FIRECalculatorCard').then(m => ({ default: m.FIRECalculatorCard })));
const DebtManagerCard = lazy(() => import('@/components/dashboard/DebtManagerCard').then(m => ({ default: m.DebtManagerCard })));
const PortfolioTrackerCard = lazy(() => import('@/components/dashboard/PortfolioTrackerCard').then(m => ({ default: m.PortfolioTrackerCard })));
const PersonalizedInvestmentTips = lazy(() => import('@/components/investments/PersonalizedInvestmentTips').then(m => ({ default: m.PersonalizedInvestmentTips })));

export default function Investments() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const tabs: MobileTab[] = [
    { id: 'perfil', label: language === 'es' ? 'Perfil' : 'Profile', emoji: '🧭', content: <InvestmentRiskProfiler /> },
    { id: 'fire', label: 'FIRE', emoji: '🔥', content: <FIRECalculatorCard /> },
    { id: 'portfolio', label: language === 'es' ? 'Portfolio' : 'Portfolio', emoji: '📈', content: <PortfolioTrackerCard /> },
    { id: 'deuda', label: language === 'es' ? 'Deuda' : 'Debt', emoji: '💳', content: <DebtManagerCard /> },
    { id: 'tips', label: 'Tips', emoji: '💡', content: <><PersonalizedInvestmentTips /><LegalDisclaimer variant="investment" size="compact" /></> },
  ];

  return (
    <Layout>
      <div className="page-container section-gap mobile-compact">
        <div className="flex items-center gap-3 mb-2 sm:mb-6">
          <div className="p-2 rounded-lg bg-primary/10 shadow-md">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">
              {language === 'es' ? 'Inversiones & FIRE' : 'Investments & FIRE'}
            </h1>
            <p className="hidden sm:block text-sm text-muted-foreground">
              {language === 'es' ? 'Portfolio, deuda, libertad financiera y tips personalizados' : 'Portfolio, debt, financial freedom & personalized tips'}
            </p>
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          {isMobile ? <MobileTabLayout tabs={tabs} paramKey="inv" defaultTab="perfil" /> : (
            <div className="space-y-6">
              <InvestmentRiskProfiler />
              <FIRECalculatorCard />
              <div className="grid gap-6 lg:grid-cols-2">
                <PortfolioTrackerCard />
                <DebtManagerCard />
              </div>
              <PersonalizedInvestmentTips />
              <LegalDisclaimer variant="investment" size="compact" />
            </div>
          )}
        </Suspense>
      </div>
    </Layout>
  );
}
