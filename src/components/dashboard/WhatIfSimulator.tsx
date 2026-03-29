import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Beaker, TrendingUp, Scissors, DollarSign, PiggyBank,
  ArrowRight, RotateCcw, Sparkles, Calculator
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useBankInsights } from '@/hooks/data/useBankAnalysis';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { ProjectionDisclaimer, type DataSource } from '@/components/projections/ProjectionDisclaimer';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface Scenario {
  id: string;
  label: string;
  type: 'cancel' | 'reduce' | 'invest';
  monthlyAmount: number;
  enabled: boolean;
  reductionPct: number; // 0-100
  source: string;
}

export function WhatIfSimulator() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();

  const now = new Date();
  const m3Start = startOfMonth(subMonths(now, 3));
  const mEnd = endOfMonth(now);
  const { data: expenses } = useExpenses({ dateRange: { start: m3Start, end: mEnd } });
  const { data: income } = useIncome();
  const bankInsights = useBankInsights();
  const { data: recurringBills } = useRecurringBills();

  const [investReturnPct, setInvestReturnPct] = useState(7);
  const [projectionYears, setProjectionYears] = useState(5);

  // Build scenarios from real data
  const initialScenarios = useMemo<Scenario[]>(() => {
    const scenarios: Scenario[] = [];

    // From recurring payments (bank-detected)
    bankInsights.recurringPayments.slice(0, 6).forEach((rp, i) => {
      scenarios.push({
        id: `recurring-${i}`,
        label: rp.description,
        type: 'cancel',
        monthlyAmount: rp.amount,
        enabled: false,
        reductionPct: 100,
        source: l ? 'Pago recurrente' : 'Recurring payment',
      });
    });

    // From expense categories (top spending)
    if (expenses?.length) {
      const catTotals: Record<string, number> = {};
      const months = new Set<string>();
      expenses.forEach(e => {
        const cat = e.category || 'other';
        catTotals[cat] = (catTotals[cat] || 0) + Number(e.amount);
        months.add(e.date.substring(0, 7));
      });
      const monthCount = Math.max(months.size, 1);

      const topCats = Object.entries(catTotals)
        .map(([cat, total]) => ({ cat, monthly: total / monthCount }))
        .sort((a, b) => b.monthly - a.monthly)
        .slice(0, 4);

      topCats.forEach(({ cat, monthly }) => {
        if (monthly > 50) {
          scenarios.push({
            id: `cat-${cat}`,
            label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
            type: 'reduce',
            monthlyAmount: monthly,
            enabled: false,
            reductionPct: 20,
            source: l ? 'Categoría de gasto' : 'Expense category',
          });
        }
      });
    }

    // From system recurring bills (not detected by bank)
    const activeBills = (recurringBills || []).filter(b => b.status === 'active');
    const bankDescriptions = new Set(bankInsights.recurringPayments.map(rp => rp.description.toLowerCase()));
    activeBills.forEach((bill, i) => {
      if (!bankDescriptions.has(bill.name.toLowerCase()) && scenarios.length < 12) {
        const monthlyAmt = Number(bill.amount);
        if (monthlyAmt > 10) {
          scenarios.push({
            id: `bill-${i}`,
            label: bill.name,
            type: 'cancel',
            monthlyAmount: monthlyAmt,
            enabled: false,
            reductionPct: 100,
            source: l ? 'Pago fijo registrado' : 'Registered fixed payment',
          });
        }
      }
    });

    return scenarios;
  }, [bankInsights.recurringPayments, expenses, recurringBills, l]);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Lazy init
  if (scenarios.length === 0 && initialScenarios.length > 0) {
    setScenarios(initialScenarios);
  }

  const toggleScenario = (id: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const updateReduction = (id: string, pct: number) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, reductionPct: pct } : s));
  };

  const resetAll = () => {
    setScenarios(prev => prev.map(s => ({ ...s, enabled: false, reductionPct: s.type === 'cancel' ? 100 : 20 })));
  };

  // Calculate projections
  const activeScenarios = scenarios.filter(s => s.enabled);
  const monthlySavings = activeScenarios.reduce((sum, s) => {
    return sum + (s.monthlyAmount * s.reductionPct / 100);
  }, 0);

  const yearlySavings = monthlySavings * 12;

  // Compound interest projection
  const projectedWealth = useMemo(() => {
    const monthlyRate = investReturnPct / 100 / 12;
    let total = 0;
    for (let m = 0; m < projectionYears * 12; m++) {
      total = (total + monthlySavings) * (1 + monthlyRate);
    }
    return total;
  }, [monthlySavings, investReturnPct, projectionYears]);

  const totalContributed = monthlySavings * projectionYears * 12;
  const investmentGain = projectedWealth - totalContributed;

  // Monthly income for context
  const monthlyIncome = useMemo(() => {
    if (!income?.length) return 0;
    const recent = income.filter(i => {
      const d = new Date(i.date);
      return d >= startOfMonth(subMonths(now, 3));
    });
    const months = new Set(recent.map(i => i.date.substring(0, 7)));
    const total = recent.reduce((s, i) => s + Number(i.amount), 0);
    return total / Math.max(months.size, 1);
  }, [income, now]);

  const savingsImpactPct = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Beaker className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {l ? 'Agrega gastos o importa estados bancarios para simular escenarios' : 'Add expenses or import bank statements to simulate scenarios'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-4/5" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="p-2.5 rounded-xl bg-gradient-to-br from-chart-1 to-chart-4 shadow-lg"
            >
              <Beaker className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {l ? '🧪 Simulador ¿Qué Pasaría Si...?' : '🧪 What-If Simulator'}
                <Badge variant="secondary" className="text-xs">{l ? 'Único' : 'Unique'}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {l ? 'Simula cambios y ve el impacto real en tu futuro' : 'Simulate changes and see real impact on your future'}
              </p>
            </div>
          </div>
          {activeScenarios.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Scenarios List */}
        <ScrollArea className="max-h-[250px]">
          <div className="space-y-2 pr-2">
            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                layout
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  scenario.enabled
                    ? "border-chart-4/40 bg-chart-4/5"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={scenario.enabled}
                    onCheckedChange={() => toggleScenario(scenario.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {scenario.type === 'cancel' ? (
                        <Scissors className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-chart-1" />
                      )}
                      <span className="text-sm font-medium truncate">{scenario.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{scenario.source}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      {fc(scenario.monthlyAmount * scenario.reductionPct / 100)}
                      <span className="text-xs text-muted-foreground font-normal">/{l ? 'mes' : 'mo'}</span>
                    </p>
                  </div>
                </div>

                {/* Reduction slider for 'reduce' type */}
                <AnimatePresence>
                  {scenario.enabled && scenario.type === 'reduce' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-2 border-t border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">
                          {l ? 'Reducir' : 'Reduce'}: {scenario.reductionPct}%
                        </span>
                        <Slider
                          value={[scenario.reductionPct]}
                          onValueChange={([v]) => updateReduction(scenario.id, v)}
                          min={5}
                          max={80}
                          step={5}
                          className="flex-1"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Investment controls */}
        <div className="p-3 rounded-xl border border-chart-1/30 bg-chart-1/5 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-chart-1" />
            <span className="text-sm font-medium">{l ? 'Si invierto lo ahorrado:' : 'If I invest the savings:'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">{l ? 'Retorno anual' : 'Annual return'}</span>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[investReturnPct]}
                  onValueChange={([v]) => setInvestReturnPct(v)}
                  min={3}
                  max={15}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-10">{investReturnPct}%</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{l ? 'Horizonte' : 'Horizon'}</span>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[projectionYears]}
                  onValueChange={([v]) => setProjectionYears(v)}
                  min={1}
                  max={30}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-12">{projectionYears} {l ? 'años' : 'yrs'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {monthlySavings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-chart-4/10 via-chart-1/5 to-primary/10 border border-chart-4/30 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-chart-4" />
                <span className="text-sm font-bold">{l ? 'Impacto de tus cambios' : 'Impact of your changes'}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-black text-chart-4">{fc(monthlySavings)}</p>
                  <p className="text-xs text-muted-foreground">{l ? '/mes ahorrado' : '/mo saved'}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-chart-1">{fc(yearlySavings)}</p>
                  <p className="text-xs text-muted-foreground">{l ? '/año ahorrado' : '/yr saved'}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-primary">{fc(projectedWealth)}</p>
                  <p className="text-xs text-muted-foreground">
                    {l ? `en ${projectionYears} años` : `in ${projectionYears} yrs`}
                  </p>
                </div>
              </div>

              {investmentGain > 0 && (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">
                    {l ? 'Contribución total' : 'Total contributed'}: {fc(totalContributed)}
                  </span>
                  <span className="text-chart-4 font-bold">
                    + {fc(investmentGain)} {l ? 'ganancia' : 'gains'}
                  </span>
                </div>
              )}

              {savingsImpactPct > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {l
                    ? `Esto representa el ${savingsImpactPct.toFixed(1)}% de tus ingresos mensuales`
                    : `This represents ${savingsImpactPct.toFixed(1)}% of your monthly income`
                  }
                </p>
              )}
            </motion.div>
            )}
        </AnimatePresence>

        <ProjectionDisclaimer
          dataSources={[
            { name: { es: 'Gastos (3 meses)', en: 'Expenses (3 months)' }, available: (expenses?.length || 0) > 0, count: expenses?.length, tip: { es: 'Registra gastos para generar escenarios de reducción', en: 'Log expenses to generate reduction scenarios' } },
            { name: { es: 'Pagos recurrentes (banco)', en: 'Recurring payments (bank)' }, available: bankInsights.recurringPayments.length > 0, count: bankInsights.recurringPayments.length, tip: { es: 'Importa tu estado de cuenta bancario', en: 'Import your bank statement' } },
            { name: { es: 'Pagos fijos registrados', en: 'Registered fixed payments' }, available: (recurringBills || []).filter(b => b.status === 'active').length > 0, count: (recurringBills || []).filter(b => b.status === 'active').length, tip: { es: 'Agrega tus pagos fijos en la sección de Bills', en: 'Add your fixed payments in the Bills section' } },
            { name: { es: 'Ingresos', en: 'Income' }, available: (income?.length || 0) > 0, count: income?.length, tip: { es: 'Registra tus ingresos para ver el impacto como % del ingreso', en: 'Log your income to see impact as % of income' } },
          ]}
          methodology={{
            es: 'Simula el efecto de cancelar o reducir gastos y pagos recurrentes. El cálculo de inversión usa interés compuesto mensual sobre el ahorro proyectado.',
            en: 'Simulates the effect of canceling or reducing expenses and recurring payments. Investment calculation uses monthly compound interest on projected savings.'
          }}
          assumptions={[
            { es: 'El retorno de inversión es constante (sin volatilidad)', en: 'Investment return is constant (no volatility)' },
            { es: 'Los ahorros se invierten inmediatamente cada mes', en: 'Savings are invested immediately each month' },
          ]}
        />
      </CardContent>
    </Card>
  );
}
