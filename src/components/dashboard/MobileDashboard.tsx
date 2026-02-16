import { useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ChevronDown, 
  ChevronUp,
  BarChart3,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { NextActionBanner } from '@/components/dashboard/NextActionBanner';
import { YearTimelineChart } from '@/components/dashboard/YearTimelineChart';
import { MonthDetailPanel } from '@/components/dashboard/MonthDetailPanel';
import { ProgressiveOnboarding } from '@/components/onboarding/ProgressiveOnboarding';
import { BetaReminderBanner } from '@/components/beta/BetaReminderBanner';
import { AlertStack } from '@/components/mobile/AlertStack';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const OrganizedDashboard = lazy(() => import('@/components/focus').then(m => ({ default: m.OrganizedDashboard })));

interface MobileDashboardProps {
  onQuickCapture?: () => void;
}

export function MobileDashboard({ onQuickCapture }: MobileDashboardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { pendingDocuments, incompleteExpenses, totalClients, totalIncomes } = useNudgeSystem();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const handleAddIncome = useCallback(() => navigate('/income'), [navigate]);
  const handleAddExpense = useCallback(() => navigate('/expenses'), [navigate]);

  // Format currency compactly for mobile
  const formatCompact = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Use monthly total from stats (expenses this month) and estimate income
  const monthlyIncome = stats?.billableExpenses || 0;
  const monthlyExpenses = stats?.monthlyTotal || 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const isPositive = monthlyBalance >= 0;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

  // Unified alert stack for mobile
  const alerts = useMemo(() => {
    const items: Array<{ id: string; content: React.ReactNode; type: 'info' | 'warning' | 'success'; dismissible: boolean }> = [];
    
    if (pendingDocuments > 0 && !dismissedAlerts.includes('pending-docs')) {
      items.push({
        id: 'pending-docs',
        content: (
          <span className="flex items-center gap-2" onClick={() => navigate('/chaos')}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {pendingDocuments} {language === 'es' ? 'documentos pendientes' : 'pending documents'}
            </span>
          </span>
        ),
        type: 'warning',
        dismissible: true,
      });
    }
    
    if (incompleteExpenses > 0 && !dismissedAlerts.includes('incomplete-expenses')) {
      items.push({
        id: 'incomplete-expenses',
        content: (
          <span className="flex items-center gap-2" onClick={() => navigate('/expenses')}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {incompleteExpenses} {language === 'es' ? 'gastos incompletos' : 'incomplete expenses'}
            </span>
          </span>
        ),
        type: 'warning',
        dismissible: true,
      });
    }
    
    return items;
  }, [pendingDocuments, incompleteExpenses, dismissedAlerts, language, navigate]);

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  return (
    <div className="mobile-page mobile-gap">
      {/* Unified Alert Stack - replaces multiple banners */}
      <AlertStack 
        alerts={alerts}
        onDismiss={handleDismissAlert}
        maxVisible={1}
      />
      
      {/* Beta Reminder - compact */}
      <BetaReminderBanner />
      
      {/* Progressive Onboarding - only for new users */}
      <ProgressiveOnboarding />
      
      {/* 2x2 Stats Grid - Optimized for mobile */}
      <div className="stats-grid-2x2">
        {isLoading ? (
          <>
            <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
            <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
            <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
            <Skeleton className="h-[72px] rounded-xl skeleton-shimmer" />
          </>
        ) : (
          <>
            {/* Income */}
            <Card 
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={handleAddIncome}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {formatCompact(monthlyIncome)}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {language === 'es' ? 'Ingresos' : 'Income'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Expenses */}
            <Card 
              className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={handleAddExpense}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 truncate">
                    {formatCompact(monthlyExpenses)}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {language === 'es' ? 'Gastos' : 'Expenses'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Balance */}
            <Card className={cn(
              "border cursor-pointer active:scale-[0.98] transition-transform",
              isPositive 
                ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20"
                : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
            )}
            onClick={() => navigate('/net-worth')}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isPositive ? "bg-blue-500/20" : "bg-amber-500/20"
                )}>
                  <Wallet className={cn(
                    "h-5 w-5",
                    isPositive ? "text-blue-500" : "text-amber-500"
                  )} />
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "text-lg font-bold truncate",
                    isPositive 
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}>
                    {isPositive ? '+' : ''}{formatCompact(monthlyBalance)}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {language === 'es' ? 'Balance' : 'Balance'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Savings Rate */}
            <Card 
              className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate('/banking')}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <PiggyBank className="h-5 w-5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate">
                    {savingsRate.toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {language === 'es' ? 'Ahorro' : 'Savings'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Nudge Banner - Inline style */}
      {(pendingDocuments > 0 || incompleteExpenses > 0 || totalClients === 0) && (
        <NextActionBanner 
          pendingDocuments={pendingDocuments}
          incompleteExpenses={incompleteExpenses}
          totalClients={totalClients}
          totalIncomes={totalIncomes}
          totalExpenses={stats?.totalExpenses || 0}
        />
      )}
      
      {/* Timeline Chart (scrollable) */}
      <div className="overflow-x-auto -mx-4 px-4">
        <YearTimelineChart
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>
      
      {/* Month Detail */}
      <MonthDetailPanel
        year={selectedYear}
        month={selectedMonth}
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
      />
      
      {/* Advanced Tools Toggle */}
      <Button
        variant="outline"
        className="w-full gap-2 border-dashed"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <BarChart3 className="h-4 w-4" />
        {language === 'es' ? 'Herramientas Avanzadas' : 'Advanced Tools'}
      </Button>
      
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<Skeleton className="h-96" />}>
              <OrganizedDashboard />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* FABs removed - Capture is in bottom nav, + is redundant */}
    </div>
  );
}
