import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';
import { 
  Building2, Landmark, User, Receipt, Calculator, Info, Lightbulb,
  Utensils, Plane, Monitor, Code, Paperclip, Briefcase, Zap, Home, Car, HelpCircle,
  TrendingDown, PiggyBank, Target, AlertCircle
} from 'lucide-react';
import { getCategoryLabel } from '@/lib/constants/expense-categories';

interface ExpenseSummaryProps {
  expenses: ExtractedExpenseData[];
  hasClients?: boolean;
  clientCount?: number;
}

const HST_RATE = 0.13;

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  meals: Utensils,
  travel: Plane,
  equipment: Monitor,
  software: Code,
  office_supplies: Paperclip,
  professional_services: Briefcase,
  utilities: Zap,
  home_office: Home,
  mileage: Car,
  other: HelpCircle,
};

// Savings tips based on expense patterns
const getSavingsTips = (expenses: ExtractedExpenseData[], totals: any): string[] => {
  const tips: string[] = [];
  
  const mealExpenses = expenses.filter(e => e.category === 'meals');
  const fuelExpenses = expenses.filter(e => e.category === 'mileage');
  const softwareExpenses = expenses.filter(e => e.category === 'software');
  
  if (mealExpenses.length > 0) {
    const mealTotal = mealExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    if (mealTotal > 50) {
      tips.push('💡 Preparar comida en casa puede ahorrarte hasta 70% vs comer afuera. Considera meal prep los domingos.');
    }
    if (!mealExpenses.some(e => e.typically_reimbursable)) {
      tips.push('🍽️ Las comidas de trabajo solo son 50% deducibles en CRA. Documenta siempre el propósito de negocio.');
    }
  }
  
  if (fuelExpenses.length > 0) {
    tips.push('⛽ Usa apps como GasBuddy para encontrar el combustible más barato. Diferencias de $0.10/L suman $500+/año.');
    tips.push('🚗 Registra cada viaje de trabajo en Kilometraje para maximizar tu deducción CRA ($0.70/km primeros 5,000 km).');
  }
  
  if (softwareExpenses.length > 0) {
    tips.push('💻 Revisa suscripciones anuales vs mensuales - el pago anual suele ahorrar 15-20%.');
  }
  
  if (totals.clientReimbursable > 0 && totals.craOnly > 0) {
    tips.push('📋 Separa facturas de gastos reembolsables vs personales para facilitar reportes a tu cliente.');
  }
  
  if (totals.hstClaimable > 10) {
    tips.push(`🧾 No olvides reclamar el ITC de $${totals.hstClaimable.toFixed(2)} en tu próxima declaración de HST/GST.`);
  }
  
  if (totals.personal > totals.total * 0.5 && totals.total > 100) {
    tips.push('📊 Más del 50% de estos gastos son personales. Considera crear un presupuesto mensual por categoría.');
  }
  
  // Generic tips if no specific ones apply
  if (tips.length === 0) {
    tips.push('✨ Buen trabajo registrando tus gastos. La consistencia es clave para el control financiero.');
  }
  
  return tips.slice(0, 3); // Max 3 tips
};

export function ExpenseSummary({ expenses, hasClients = false, clientCount = 0 }: ExpenseSummaryProps) {
  if (!expenses.length) return null;

  // Group by category
  const byCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exp);
    return acc;
  }, {} as Record<string, ExtractedExpenseData[]>);

  // Calculate totals
  const totals = expenses.reduce((acc, exp) => {
    const amount = exp.amount || 0;
    acc.total += amount;
    
    if (exp.typically_reimbursable) {
      acc.clientReimbursable += amount;
    }
    
    if (exp.cra_deductible) {
      const deductibleAmount = amount * (exp.cra_deduction_rate / 100);
      acc.craDeductible += deductibleAmount;
      acc.hstClaimable += (amount * HST_RATE) * (exp.cra_deduction_rate / 100);
    }
    
    if (!exp.typically_reimbursable && !exp.cra_deductible) {
      acc.personal += amount;
    } else if (!exp.typically_reimbursable && exp.cra_deductible) {
      acc.craOnly += amount;
    }
    
    return acc;
  }, {
    total: 0,
    clientReimbursable: 0,
    craDeductible: 0,
    craOnly: 0,
    personal: 0,
    hstClaimable: 0,
  });

  const savingsTips = getSavingsTips(expenses, totals);
  const hasReimbursableExpenses = expenses.some(e => e.typically_reimbursable);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Resumen de Gastos Detectados ({expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Info Alert */}
        {hasReimbursableExpenses && !hasClients && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>⚠️ Sin clientes configurados:</strong> Hay gastos potencialmente reembolsables, pero no tienes clientes registrados para verificar acuerdos de reembolso. 
              Agrega clientes en la sección "Clientes" para cálculos precisos.
            </AlertDescription>
          </Alert>
        )}

        {hasClients && hasReimbursableExpenses && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Building2 className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>✓ {clientCount} cliente(s) configurado(s):</strong> Los gastos reembolsables se pueden asociar a tus clientes para generar reportes de facturación.
            </AlertDescription>
          </Alert>
        )}

        {/* Itemized by Category */}
        <div className="space-y-3">
          {Object.entries(byCategory).map(([category, items]) => {
            const CategoryIcon = CATEGORY_ICONS[category] || HelpCircle;
            const categoryTotal = items.reduce((sum, i) => sum + (i.amount || 0), 0);
            return (
              <div key={category} className="space-y-1">
                <div className="flex justify-between items-center bg-muted/50 rounded px-2 py-1.5">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4 text-primary" />
                    {getCategoryLabel(category as any)}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(categoryTotal)}
                  </span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pl-8 pr-2 py-1 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">•</span>
                      <span className="truncate max-w-[140px]">{item.description || item.vendor || 'Sin descripción'}</span>
                      <div className="flex gap-1">
                        {item.typically_reimbursable && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                            <Building2 className="h-3 w-3 mr-1" />Cliente
                          </Badge>
                        )}
                        {item.cra_deductible && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                            <Landmark className="h-3 w-3 mr-1" />CRA {item.cra_deduction_rate}%
                          </Badge>
                        )}
                        {!item.typically_reimbursable && !item.cra_deductible && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-slate-50">
                            <User className="h-3 w-3 mr-1" />Personal
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(item.amount || 0)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Totals by Destination */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Receipt className="h-4 w-4" />
              Total Gastos
            </span>
            <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
          </div>

          {totals.clientReimbursable > 0 && (
            <div className="flex justify-between items-center pl-4 py-1 bg-green-50 rounded">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <Building2 className="h-4 w-4" />
                Reembolsable por Cliente
                {!hasClients && <span className="text-xs">(verificar)</span>}
              </span>
              <span className="font-semibold text-green-700">{formatCurrency(totals.clientReimbursable)}</span>
            </div>
          )}

          {totals.craDeductible > 0 && (
            <div className="flex justify-between items-center pl-4 py-1 bg-blue-50 rounded">
              <span className="flex items-center gap-2 text-sm text-blue-700">
                <Landmark className="h-4 w-4" />
                Deducible CRA (neto)
              </span>
              <span className="font-semibold text-blue-700">{formatCurrency(totals.craDeductible)}</span>
            </div>
          )}

          {totals.hstClaimable > 0 && (
            <div className="flex justify-between items-center pl-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                HST/GST Recuperable (ITC)
              </span>
              <span>{formatCurrency(totals.hstClaimable)}</span>
            </div>
          )}

          {totals.craOnly > 0 && (
            <div className="flex justify-between items-center pl-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                Solo CRA (no reembolsable)
              </span>
              <span className="text-sm">{formatCurrency(totals.craOnly)}</span>
            </div>
          )}

          {totals.personal > 0 && (
            <div className="flex justify-between items-center pl-4 py-1 bg-slate-50 rounded">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                Gasto Personal
              </span>
              <span className="font-medium text-slate-600">{formatCurrency(totals.personal)}</span>
            </div>
          )}
        </div>

        {/* Savings Tips */}
        {savingsTips.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <Lightbulb className="h-4 w-4" />
                Consejos de Ahorro
              </div>
              <div className="space-y-2">
                {savingsTips.map((tip, idx) => (
                  <div key={idx} className="flex gap-2 p-2 bg-amber-50 rounded-md border border-amber-100">
                    <PiggyBank className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes/Justifications for Mixed Expenses */}
        {expenses.length > 1 && expenses.some(e => e.typically_reimbursable) && expenses.some(e => !e.typically_reimbursable) && (
          <>
            <Separator />
            <div className="flex gap-2 p-2 bg-slate-50 rounded-md border">
              <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                <strong>Nota:</strong> Este recibo contiene gastos mixtos con diferentes destinos:
                <span className="inline-flex items-center gap-1 mx-1"><Building2 className="h-3 w-3 text-green-600"/>Cliente</span> = tu cliente te reembolsa,
                <span className="inline-flex items-center gap-1 mx-1"><Landmark className="h-3 w-3 text-blue-600"/>CRA</span> = reduces tus impuestos,
                <span className="inline-flex items-center gap-1 mx-1"><User className="h-3 w-3"/>Personal</span> = gasto personal sin beneficios fiscales.
              </p>
            </div>
          </>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-green-600"/>= Tu cliente te devuelve</span>
          <span className="flex items-center gap-1"><Landmark className="h-3 w-3 text-blue-600"/>= Reduces impuestos CRA</span>
          <span className="flex items-center gap-1"><User className="h-3 w-3"/>= Gasto personal</span>
        </div>
      </CardContent>
    </Card>
  );
}
