import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  PiggyBank,
  RefreshCw,
  Scissors,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankTransactions } from '@/hooks/data/useBankTransactions';
import { useBankInsights, CATEGORY_LABELS } from '@/hooks/data/useBankAnalysis';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Opportunity {
  id: string;
  type: 'reduce' | 'cancel' | 'negotiate' | 'switch';
  priority: 'high' | 'medium' | 'low';
  vendor: string;
  category: string;
  currentCost: number;
  potentialSavings: number;
  savingsPercent: number;
  suggestion: { es: string; en: string };
  actionLabel: { es: string; en: string };
}

export function SavingsOpportunityFinder() {
  const { language } = useLanguage();
  const { data: transactions } = useBankTransactions();
  const insights = useBankInsights();
  const { formatCurrency: fc } = useFormatCurrency();
  const [expanded, setExpanded] = useState(false);
  const [dismissedOpportunities, setDismissedOpportunities] = useState<Set<string>>(new Set());
  const [implementedOpportunities, setImplementedOpportunities] = useState<Set<string>>(new Set());
  
  const opportunities = useMemo<Opportunity[]>(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const result: Opportunity[] = [];
    
    insights.recurringPayments.forEach((payment, idx) => {
      const desc = payment.description.toLowerCase();
      
      if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('hbo') || 
          desc.includes('disney') || desc.includes('amazon prime') || desc.includes('youtube')) {
        result.push({
          id: `sub-${idx}`,
          type: 'cancel',
          priority: payment.amount > 15 ? 'high' : 'medium',
          vendor: payment.description,
          category: 'subscriptions',
          currentCost: payment.amount * 12,
          potentialSavings: payment.amount * 12,
          savingsPercent: 100,
          suggestion: {
            es: `¿Usas ${payment.description} frecuentemente? Podrías ahorrar ${fc(payment.amount * 12)}/año si lo cancelas.`,
            en: `Do you use ${payment.description} often? You could save ${fc(payment.amount * 12)}/year if you cancel.`
          },
          actionLabel: { es: 'Revisar uso', en: 'Review usage' }
        });
      }
      
      if (desc.includes('insurance') || desc.includes('seguro')) {
        result.push({
          id: `ins-${idx}`,
          type: 'negotiate',
          priority: 'medium',
          vendor: payment.description,
          category: 'insurance',
          currentCost: payment.amount * 12,
          potentialSavings: payment.amount * 12 * 0.15,
          savingsPercent: 15,
          suggestion: {
            es: `Negocia con ${payment.description}. Muchos logran 10-20% de descuento al llamar.`,
            en: `Negotiate with ${payment.description}. Many get 10-20% off by calling.`
          },
          actionLabel: { es: 'Negociar', en: 'Negotiate' }
        });
      }
      
      if (desc.includes('phone') || desc.includes('mobile') || desc.includes('internet') || 
          desc.includes('telecom') || desc.includes('at&t') || desc.includes('verizon')) {
        result.push({
          id: `tel-${idx}`,
          type: 'switch',
          priority: payment.amount > 80 ? 'high' : 'medium',
          vendor: payment.description,
          category: 'telecommunications',
          currentCost: payment.amount * 12,
          potentialSavings: payment.amount * 12 * 0.2,
          savingsPercent: 20,
          suggestion: {
            es: `Compara planes de competidores. Podrías ahorrar hasta 20% cambiando de proveedor.`,
            en: `Compare competitor plans. You could save up to 20% by switching providers.`
          },
          actionLabel: { es: 'Comparar', en: 'Compare' }
        });
      }
    });
    
    insights.topVendors.slice(0, 5).forEach((vendor, idx) => {
      const desc = vendor.vendor.toLowerCase();
      
      if (desc.includes('uber eats') || desc.includes('doordash') || desc.includes('grubhub') ||
          desc.includes('rappi') || desc.includes('pedidos ya')) {
        result.push({
          id: `food-${idx}`,
          type: 'reduce',
          priority: vendor.total > 100 ? 'high' : 'medium',
          vendor: vendor.vendor,
          category: 'restaurants',
          currentCost: vendor.total,
          potentialSavings: vendor.total * 0.5,
          savingsPercent: 50,
          suggestion: {
            es: `Gastas ${fc(vendor.total)} en delivery. Cocinar en casa podría ahorrarte ${fc(vendor.total * 0.5)}.`,
            en: `You spend ${fc(vendor.total)} on delivery. Cooking at home could save you ${fc(vendor.total * 0.5)}.`
          },
          actionLabel: { es: 'Plan de comidas', en: 'Meal plan' }
        });
      }
      
      if (desc.includes('starbucks') || desc.includes('coffee') || desc.includes('café')) {
        result.push({
          id: `coffee-${idx}`,
          type: 'reduce',
          priority: vendor.total > 50 ? 'medium' : 'low',
          vendor: vendor.vendor,
          category: 'restaurants',
          currentCost: vendor.total,
          potentialSavings: vendor.total * 0.8,
          savingsPercent: 80,
          suggestion: {
            es: `${fc(vendor.total)} en café. Prepararlo en casa te ahorraría ~${fc(vendor.total * 0.8)}.`,
            en: `${fc(vendor.total)} on coffee. Making it at home would save you ~${fc(vendor.total * 0.8)}.`
          },
          actionLabel: { es: 'Calcular', en: 'Calculate' }
        });
      }
    });
    
    return result
      .filter(o => !dismissedOpportunities.has(o.id))
      .sort((a, b) => b.potentialSavings - a.potentialSavings);
  }, [transactions, insights, dismissedOpportunities, language, fc]);
  
  const totalPotentialSavings = opportunities.reduce((sum, o) => sum + o.potentialSavings, 0);
  const totalImplemented = opportunities.filter(o => implementedOpportunities.has(o.id)).reduce((sum, o) => sum + o.potentialSavings, 0);
  const visibleOpportunities = expanded ? opportunities : opportunities.slice(0, 3);
  
  if (opportunities.length === 0) return null;
  
  const l = language === 'es';
  
  const getTypeIcon = (type: Opportunity['type']) => {
    switch (type) {
      case 'cancel': return Scissors;
      case 'reduce': return TrendingDown;
      case 'negotiate': return DollarSign;
      case 'switch': return RefreshCw;
    }
  };
  
  const getPriorityStyles = (priority: Opportunity['priority'], implemented: boolean) => {
    if (implemented) return 'border-chart-4/40 bg-chart-4/10';
    switch (priority) {
      case 'high': return 'border-chart-4/30 bg-chart-4/5';
      case 'medium': return 'border-chart-1/30 bg-chart-1/5';
      case 'low': return 'border-muted';
    }
  };
  
  const handleImplement = (id: string) => {
    setImplementedOpportunities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-4/5 via-transparent to-chart-1/5" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-chart-4 to-chart-1 shadow-lg shadow-chart-4/25"
            >
              <PiggyBank className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {l ? '💰 Oportunidades de Ahorro' : '💰 Savings Opportunities'}
                <Badge variant="secondary" className="text-xs">{opportunities.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {l ? 'Detectadas automáticamente de tus gastos' : 'Auto-detected from your spending'}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{l ? 'Ahorro anual' : 'Annual savings'}</p>
            <p className="text-xl font-bold text-chart-4">{fc(totalPotentialSavings)}</p>
            <p className="text-[10px] text-muted-foreground">{fc(totalPotentialSavings / 12)}/{l ? 'mes' : 'mo'}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 relative">
        {/* Implemented savings tracker */}
        {implementedOpportunities.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-chart-4/10 border border-chart-4/30"
          >
            <Trophy className="h-4 w-4 text-chart-4" />
            <span className="text-xs font-medium text-chart-4">
              {l ? `${implementedOpportunities.size} implementadas = ${fc(totalImplemented)} ahorrados` 
                 : `${implementedOpportunities.size} implemented = ${fc(totalImplemented)} saved`}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {visibleOpportunities.map((opp, idx) => {
            const Icon = getTypeIcon(opp.type);
            const categoryInfo = CATEGORY_LABELS[opp.category] || CATEGORY_LABELS.other;
            const isImplemented = implementedOpportunities.has(opp.id);
            
            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all",
                  getPriorityStyles(opp.priority, isImplemented)
                )}
              >
                <div className={cn("p-2 rounded-lg", isImplemented ? 'bg-chart-4/20' : 'bg-chart-4/10')}>
                  {isImplemented ? <CheckCircle2 className="h-4 w-4 text-chart-4" /> : <Icon className="h-4 w-4 text-chart-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{categoryInfo.icon}</span>
                    <span className={cn("font-medium text-sm truncate", isImplemented && 'line-through opacity-60')}>{opp.vendor}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">-{opp.savingsPercent}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {l ? opp.suggestion.es : opp.suggestion.en}
                  </p>
                </div>
                
                <div className="text-right shrink-0 flex flex-col gap-1">
                  <p className="text-sm font-bold text-chart-4">+{fc(opp.potentialSavings)}</p>
                  <Button 
                    size="sm" variant="ghost" 
                    className={cn("h-6 text-xs px-2", isImplemented && 'text-chart-4')}
                    onClick={() => handleImplement(opp.id)}
                  >
                    {isImplemented ? (l ? '✓ Hecho' : '✓ Done') : (l ? 'Aplicar' : 'Apply')}
                  </Button>
                  {!isImplemented && (
                    <Button 
                      size="sm" variant="ghost" 
                      className="h-6 text-xs px-2 text-muted-foreground"
                      onClick={() => setDismissedOpportunities(prev => new Set([...prev, opp.id]))}
                    >
                      {l ? 'Ignorar' : 'Dismiss'}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {opportunities.length > 3 && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <><ChevronUp className="h-4 w-4 mr-2" />{l ? 'Ver menos' : 'Show less'}</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-2" />{l ? `Ver ${opportunities.length - 3} más` : `Show ${opportunities.length - 3} more`}</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}