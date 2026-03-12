import { lazy, Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw, TrendingDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const SubscriptionTracker = lazy(() => import('@/components/subscriptions/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));

export default function Subscriptions() {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <Layout>
      <div className="page-container section-gap">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-500/20 p-6 mb-6"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-400/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
            >
              <RefreshCw className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {isEs ? 'Suscripciones' : 'Subscriptions'}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Zap className="h-3 w-3" />
                  Smart
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                {isEs
                  ? 'Detecta, rastrea y optimiza todos tus pagos recurrentes automáticamente. Identifica oportunidades de ahorro y toma control de tu dinero.'
                  : 'Detect, track, and optimize all your recurring payments automatically. Identify savings opportunities and take control of your money.'}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full border border-border/50">
                  <RefreshCw className="h-3 w-3 text-amber-500" />
                  {isEs ? 'Detección automática' : 'Auto-detection'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full border border-border/50">
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
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
