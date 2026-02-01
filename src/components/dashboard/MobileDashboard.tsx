import { useState, useCallback, lazy, Suspense } from 'react';
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
  const { pendingDocuments, incompleteExpenses, totalClients } = useNudgeSystem();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  return (
    <div className="space-y-4 pb-24">
      {/* Beta Reminder */}
      <BetaReminderBanner />
      
      {/* Progressive Onboarding for new users */}
      <ProgressiveOnboarding />
      
      {/* Compact Stats Header */}
      <div className="grid grid-cols-3 gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </>
        ) : (
          <>
            {/* Income */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCompact(monthlyIncome)}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {language === 'es' ? 'Ingresos' : 'Income'}
                </p>
              </CardContent>
            </Card>
            
            {/* Expenses */}
            <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20">
              <CardContent className="p-3 text-center">
                <TrendingDown className="h-4 w-4 mx-auto mb-1 text-rose-500" />
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {formatCompact(monthlyExpenses)}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {language === 'es' ? 'Gastos' : 'Expenses'}
                </p>
              </CardContent>
            </Card>
            
            {/* Balance */}
            <Card className={cn(
              "border",
              isPositive 
                ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20"
                : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
            )}>
              <CardContent className="p-3 text-center">
                <Wallet className={cn(
                  "h-4 w-4 mx-auto mb-1",
                  isPositive ? "text-blue-500" : "text-amber-500"
                )} />
                <p className={cn(
                  "text-lg font-bold",
                  isPositive 
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                )}>
                  {isPositive ? '+' : ''}{formatCompact(monthlyBalance)}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {language === 'es' ? 'Balance' : 'Balance'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Nudge Banner */}
      <NextActionBanner 
        pendingDocuments={pendingDocuments}
        incompleteExpenses={incompleteExpenses}
        totalClients={totalClients}
      />
      
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
      
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            onClick={onQuickCapture}
          >
            <Camera className="h-5 w-5" />
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={() => navigate('/expenses')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
