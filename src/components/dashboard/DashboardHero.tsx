import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const isPositive = netBalance >= 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-CA', {
      style: 'currency',
      currency: profile?.country === 'CL' ? 'CLP' : 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/30">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Greeting & Balance */}
          <div className="flex-1 space-y-4">
            {/* Personalized Greeting */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {language === 'es' 
                  ? `¡Hola${firstName ? `, ${firstName}` : ''}! 👋`
                  : `Hello${firstName ? `, ${firstName}` : ''}! 👋`
                }
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'es'
                  ? 'Tu resumen financiero de un vistazo'
                  : 'Your financial summary at a glance'
                }
              </p>
            </div>

            {/* Balance Summary - Compact */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Net Balance - Main Focus */}
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                isPositive 
                  ? "bg-success/10 border-success/30 text-success" 
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}>
                <Scale className="h-5 w-5" />
                <div>
                  <p className="text-xs font-medium opacity-80">
                    {language === 'es' ? 'Balance Neto' : 'Net Balance'}
                  </p>
                  <p className="text-xl font-bold">
                    {isLoading ? '...' : formatCurrency(netBalance)}
                  </p>
                </div>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 opacity-60" />
                ) : (
                  <TrendingDown className="h-5 w-5 opacity-60" />
                )}
              </div>

              {/* Income/Expense Pills */}
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  {isLoading ? '...' : formatCurrency(totalIncome)}
                </span>
                <span className="text-muted-foreground">−</span>
                <span className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive font-medium">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  {isLoading ? '...' : formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Guide Button - Pulsing when not interacted */}
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              onClick={onOpenGuide}
              className={cn(
                "relative px-6 py-6 h-auto text-base font-semibold",
                "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "transition-all duration-300",
                !hasInteracted && "animate-guide-pulse"
              )}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {language === 'es' ? '¿Qué quieres hacer?' : 'What do you want to do?'}
              <ArrowRight className="h-4 w-4 ml-2" />
              
              {/* Pulse ring effect when not interacted */}
              {!hasInteracted && (
                <>
                  <span className="absolute inset-0 rounded-md bg-primary/20 animate-ping" />
                  <span className="absolute -inset-1 rounded-lg bg-primary/10 animate-pulse" />
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {language === 'es' ? 'Tu asistente financiero' : 'Your financial assistant'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
