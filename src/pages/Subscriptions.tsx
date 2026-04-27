import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw, TrendingDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));

export default function Subscriptions() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const isEs = language === 'es';

  return (
    <Layout>
      <div className="page-container section-gap mobile-compact">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-warning/10 border border-warning/20 p-3 sm:p-6 mb-2 sm:mb-6"
        >
          {/* Decorative elements */}
          {!isMobile && (
            <>
              <div className="absolute top-0 right-0 w-40 h-40 bg-warning/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-warning/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            </>
          )}

          <div className="relative flex items-start gap-3 sm:gap-4">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-2 sm:p-3 rounded-xl bg-warning/15 shadow-lg shadow-warning/10"
            >
              <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            </motion.div>
            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                {isEs ? 'Suscripciones' : 'Subscriptions'}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-semibold">
                  <Zap className="h-3 w-3" />
                  Smart
                </span>
              </h1>
              <p className="hidden sm:block text-sm text-muted-foreground mt-1 max-w-lg">
                {isEs
                  ? 'Detecta, rastrea y optimiza todos tus pagos recurrentes automáticamente. Identifica oportunidades de ahorro y toma control de tu dinero.'
                  : 'Detect, track, and optimize all your recurring payments automatically. Identify savings opportunities and take control of your money.'}
              </p>
              <div className="hidden sm:flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full border border-border/50">
                  <RefreshCw className="h-3 w-3 text-warning" />
                  {isEs ? 'Detección automática' : 'Auto-detection'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full border border-border/50">
                  <TrendingDown className="h-3 w-3 text-success" />
                  {isEs ? 'Optimización' : 'Optimization'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <Suspense fallback={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
            </div>
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        }>
          <SubscriptionTracker />
        </Suspense>
      </div>
    </Layout>
  );
}
