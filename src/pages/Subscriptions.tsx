import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw } from 'lucide-react';

const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));

export default function Subscriptions() {
  const { language } = useLanguage();

  return (
    <Layout>
      <div className="page-container section-gap">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'es' ? 'Suscripciones' : 'Subscriptions'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Pagos recurrentes, optimización y seguimiento' : 'Recurring payments, optimization & tracking'}
            </p>
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-[400px]" />}>
          <SubscriptionTracker />
        </Suspense>
      </div>
    </Layout>
  );
}
