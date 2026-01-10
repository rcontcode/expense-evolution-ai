import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ArrowRight,
  Globe
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { useCurrencyConversion } from '@/hooks/data/useCurrencyConversion';
import { EntityViewToggle } from './EntityViewToggle';
import { cn } from '@/lib/utils';
import { PhoenixLogo, PhoenixState } from '@/components/ui/phoenix-logo';
import { useMemo } from 'react';

interface DashboardHeroProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  isLoading?: boolean;
  onOpenGuide: () => void;
  hasInteracted?: boolean;
}

export function DashboardHero({ 
  totalIncome, 
  totalExpenses, 
  netBalance,
  isLoading,
  onOpenGuide,
  hasInteracted = true
}: DashboardHeroProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { isMultiEntity, showAllEntities, setShowAllEntities, currentCurrency } = useEntity();
  const { formatCurrency } = useCurrencyConversion();

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const isPositive = netBalance >= 0;

  // Dynamic phoenix state based on financial health
  const phoenixState: PhoenixState = useMemo(() => {
    if (isLoading) return 'default';
    if (netBalance < 0) return 'flames'; // Financial crisis - working through it
    if (netBalance === 0 || (totalIncome === 0 && totalExpenses === 0)) return 'smoke'; // Neutral/transitioning
    return 'rebirth'; // Positive balance - thriving!
  }, [netBalance, totalIncome, totalExpenses, isLoading]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'es') {
      if (hour < 12) return 'Buenos días';
      if (hour < 19) return 'Buenas tardes';
      return 'Buenas noches';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 19) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-4">
      {/* Main Hero Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/10 via-card to-accent/10">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
        </div>
        
        <CardContent className="relative p-6 md:p-8">
          {/* Entity View Toggle for multi-entity users */}
          {isMultiEntity && (
            <div className="absolute top-4 right-4 z-10">
              <EntityViewToggle 
                showAllEntities={showAllEntities}
                onToggle={setShowAllEntities}
              />
            </div>
          )}

          {/* Consolidated indicator */}
          {isMultiEntity && showAllEntities && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/20 text-xs font-medium text-accent-foreground">
              <Globe className="h-3 w-3" />
              {language === 'es' ? `Consolidado (${currentCurrency})` : `Consolidated (${currentCurrency})`}
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mt-6 lg:mt-0">
            {/* Left: Phoenix Badge + Greeting */}
            <div className="flex items-center gap-4">
              {/* Dynamic Phoenix Badge */}
              <div className="hidden sm:block">
                <PhoenixLogo variant="mini" state={phoenixState} showEffects={true} />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {getGreeting()}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {firstName ? `${firstName} 👋` : '👋'}
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  {language === 'es'
                    ? 'Aquí tienes el resumen de tus finanzas'
                    : 'Here\'s your financial summary'
                  }
                </p>
              </div>
            </div>

            {/* Center: Balance Cards */}
            <div className="flex flex-wrap items-stretch gap-3 flex-1 justify-center lg:justify-end max-w-2xl">
              {/* Income Card */}
              <div className="flex-1 min-w-[140px] max-w-[180px] p-4 rounded-xl bg-success/10 border border-success/20 transition-all hover:shadow-md hover:border-success/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-success/20">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-xs font-medium text-success/80">
                    {language === 'es' ? 'Ingresos' : 'Income'}
                  </span>
                </div>
                <p className="text-lg font-bold text-success">
                  {isLoading ? '...' : formatCurrency(totalIncome, currentCurrency, { decimals: 0 })}
                </p>
              </div>

              {/* Expenses Card */}
              <div className="flex-1 min-w-[140px] max-w-[180px] p-4 rounded-xl bg-destructive/10 border border-destructive/20 transition-all hover:shadow-md hover:border-destructive/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-destructive/20">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-xs font-medium text-destructive/80">
                    {language === 'es' ? 'Gastos' : 'Expenses'}
                  </span>
                </div>
                <p className="text-lg font-bold text-destructive">
                  {isLoading ? '...' : formatCurrency(totalExpenses, currentCurrency, { decimals: 0 })}
                </p>
              </div>

              {/* Net Balance Card - Prominent */}
              <div className={cn(
                "flex-1 min-w-[160px] max-w-[200px] p-4 rounded-xl border-2 transition-all",
                isPositive 
                  ? "bg-gradient-to-br from-success/15 to-success/5 border-success/40 shadow-[0_0_20px_hsl(var(--success)/0.15)]" 
                  : "bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/40 shadow-[0_0_20px_hsl(var(--destructive)/0.15)]"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    isPositive ? "bg-success/25" : "bg-destructive/25"
                  )}>
                    <Scale className={cn("h-4 w-4", isPositive ? "text-success" : "text-destructive")} />
                  </div>
                  <span className={cn(
                    "text-xs font-semibold",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {language === 'es' ? 'Balance' : 'Balance'}
                  </span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isLoading ? '...' : formatCurrency(netBalance, currentCurrency, { decimals: 0 })}
                </p>
              </div>
            </div>

            {/* Right: Guide Button */}
            <div className="flex flex-col items-center gap-2 lg:ml-4">
              <Button
                size="lg"
                onClick={onOpenGuide}
                className={cn(
                  "relative px-6 py-5 h-auto text-base font-semibold rounded-xl",
                  "bg-gradient-to-r from-primary via-primary to-primary/90",
                  "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                  "transition-all duration-300 hover:-translate-y-0.5",
                  !hasInteracted && "animate-guide-pulse ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                )}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {language === 'es' ? '¿Qué hacer?' : 'What to do?'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <span className="text-[10px] text-muted-foreground text-center">
                {language === 'es' ? 'Tu guía financiera' : 'Your financial guide'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
