import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { motion } from 'framer-motion';
import { Zap, Layers, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Optimization {
  type: 'bundle' | 'timing' | 'downgrade' | 'negotiate';
  title: string;
  description: string;
  potentialSaving: number;
  affectedBills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const CATEGORY_GROUPS: Record<string, string[]> = {
  streaming: ['netflix', 'disney', 'hbo', 'prime', 'hulu', 'spotify', 'apple music', 'youtube', 'paramount', 'crunchyroll'],
  insurance: ['insurance', 'seguro', 'aseguradora'],
  telecom: ['phone', 'teléfono', 'internet', 'wifi', 'mobile', 'celular', 'cable'],
  cloud: ['icloud', 'google one', 'dropbox', 'onedrive', 'storage'],
  fitness: ['gym', 'gimnasio', 'fitness', 'peloton', 'yoga'],
};

function detectCategory(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_GROUPS)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return null;
}

export function BillOptimizationEngine() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: bills } = useRecurringBills();

  const optimizations = useMemo(() => {
    if (!bills || bills.length < 2) return [];

    const active = bills.filter((b: any) => b.is_active);
    const results: Optimization[] = [];

    // 1. Bundling opportunities (same category services)
    const categorized: Record<string, any[]> = {};
    active.forEach((b: any) => {
      const cat = detectCategory(b.name);
      if (cat) {
        if (!categorized[cat]) categorized[cat] = [];
        categorized[cat].push(b);
      }
    });

    Object.entries(categorized).forEach(([cat, group]) => {
      if (group.length >= 2) {
        const total = group.reduce((s: number, b: any) => s + Math.abs(Number(b.amount)), 0);
        const saving = total * 0.2; // Estimate 20% savings from bundling
        const catLabel: Record<string, { es: string; en: string }> = {
          streaming: { es: 'Streaming', en: 'Streaming' },
          insurance: { es: 'Seguros', en: 'Insurance' },
          telecom: { es: 'Telecomunicaciones', en: 'Telecom' },
          cloud: { es: 'Almacenamiento Cloud', en: 'Cloud Storage' },
          fitness: { es: 'Fitness', en: 'Fitness' },
        };
        results.push({
          type: 'bundle',
          title: l ? `Agrupar servicios de ${catLabel[cat]?.es || cat}` : `Bundle ${catLabel[cat]?.en || cat} services`,
          description: l
            ? `Tienes ${group.length} servicios de ${catLabel[cat]?.es || cat}. Considera consolidar con un plan familiar o eliminar uno.`
            : `You have ${group.length} ${catLabel[cat]?.en || cat} services. Consider consolidating with a family plan or dropping one.`,
          potentialSaving: saving,
          affectedBills: group.map((b: any) => b.name),
          difficulty: 'medium',
        });
      }
    });

    // 2. Annual vs monthly pricing opportunity
    active.forEach((b: any) => {
      if (b.frequency === 'monthly' && Math.abs(Number(b.amount)) >= 10) {
        const annualSaving = Math.abs(Number(b.amount)) * 12 * 0.17; // ~17% savings for annual
        results.push({
          type: 'timing',
          title: l ? `Cambiar ${b.name} a plan anual` : `Switch ${b.name} to annual`,
          description: l
            ? `Pagando anualmente podrías ahorrar ~17%. Costo anual estimado: ${fc(Math.abs(Number(b.amount)) * 12 * 0.83)}`
            : `Paying annually could save ~17%. Estimated annual cost: ${fc(Math.abs(Number(b.amount)) * 12 * 0.83)}`,
          potentialSaving: annualSaving,
          affectedBills: [b.name],
          difficulty: 'easy',
        });
      }
    });

    // 3. High-cost bills with negotiation potential
    const avgBillAmount = active.reduce((s: number, b: any) => s + Math.abs(Number(b.amount)), 0) / active.length;
    active.forEach((b: any) => {
      const amount = Math.abs(Number(b.amount));
      if (amount > avgBillAmount * 2 && amount > 50) {
        results.push({
          type: 'negotiate',
          title: l ? `Negociar ${b.name}` : `Negotiate ${b.name}`,
          description: l
            ? `Este pago es ${(amount / avgBillAmount).toFixed(1)}x mayor que tu promedio. Llama al proveedor y pide descuento de lealtad.`
            : `This bill is ${(amount / avgBillAmount).toFixed(1)}x your average. Call the provider and ask for a loyalty discount.`,
          potentialSaving: amount * 0.15,
          affectedBills: [b.name],
          difficulty: 'medium',
        });
      }
    });

    // 4. Payment date clustering (cash flow optimization)
    const dateGroups: Record<number, any[]> = {};
    active.forEach((b: any) => {
      if (b.due_day) {
        const week = Math.ceil(b.due_day / 7);
        if (!dateGroups[week]) dateGroups[week] = [];
        dateGroups[week].push(b);
      }
    });

    const heavyWeeks = Object.entries(dateGroups).filter(([_, group]) => group.length >= 3);
    if (heavyWeeks.length > 0) {
      const weekBills = heavyWeeks[0][1];
      results.push({
        type: 'timing',
        title: l ? 'Redistribuir fechas de pago' : 'Redistribute payment dates',
        description: l
          ? `Tienes ${weekBills.length} pagos en la misma semana. Redistribuirlos mejora tu flujo de caja.`
          : `You have ${weekBills.length} payments in the same week. Spreading them improves cash flow.`,
        potentialSaving: 0,
        affectedBills: weekBills.map((b: any) => b.name),
        difficulty: 'easy',
      });
    }

    return results.sort((a, b) => b.potentialSaving - a.potentialSaving).slice(0, 8);
  }, [bills, l, fc]);

  if (optimizations.length === 0) return null;

  const totalSavings = optimizations.reduce((s, o) => s + o.potentialSaving, 0);

  const typeIcons: Record<string, any> = { bundle: Layers, timing: Calendar, downgrade: DollarSign, negotiate: Zap };
  const difficultyLabels: Record<string, { es: string; en: string; color: string }> = {
    easy: { es: 'Fácil', en: 'Easy', color: 'text-emerald-600 bg-emerald-500/10' },
    medium: { es: 'Medio', en: 'Medium', color: 'text-amber-600 bg-amber-500/10' },
    hard: { es: 'Difícil', en: 'Hard', color: 'text-destructive bg-destructive/10' },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-amber-500" />
            {l ? 'Motor de Optimización' : 'Optimization Engine'}
          </CardTitle>
          {totalSavings > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
              {l ? 'Ahorro potencial:' : 'Potential savings:'} {fc(totalSavings)}{l ? '/año' : '/yr'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {l
            ? 'Análisis inteligente de tus pagos fijos para encontrar oportunidades de ahorro'
            : 'Smart analysis of your recurring bills to find savings opportunities'}
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        {optimizations.map((opt, i) => {
          const Icon = typeIcons[opt.type] || Zap;
          const diff = difficultyLabels[opt.difficulty];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg border bg-card hover:bg-accent/20 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{opt.title}</p>
                    <Badge variant="outline" className={cn("text-[8px] px-1 py-0", diff.color)}>
                      {l ? diff.es : diff.en}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                  {opt.potentialSaving > 0 && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1">
                      💰 ~{fc(opt.potentialSaving)}/{l ? 'año' : 'yr'}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {opt.affectedBills.map(name => (
                      <Badge key={name} variant="secondary" className="text-[8px]">{name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
