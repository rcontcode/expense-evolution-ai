import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';
import { Building2, Landmark, User, Receipt, Calculator, Info } from 'lucide-react';
import { getCategoryLabel } from '@/lib/constants/expense-categories';

interface ExpenseSummaryProps {
  expenses: ExtractedExpenseData[];
}

const HST_RATE = 0.13; // 13% HST for BC/Ontario

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
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

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Resumen de Gastos Detectados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Itemized by Category */}
        <div className="space-y-3">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {getCategoryLabel(category as any)}
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(items.reduce((sum, i) => sum + (i.amount || 0), 0))}
                </span>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pl-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{item.description || item.vendor}</span>
                    <div className="flex gap-1">
                      {item.typically_reimbursable && (
                        <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200">
                          <Building2 className="h-2.5 w-2.5 mr-0.5" />Cliente
                        </Badge>
                      )}
                      {item.cra_deductible && (
                        <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                          <Landmark className="h-2.5 w-2.5 mr-0.5" />{item.cra_deduction_rate}%
                        </Badge>
                      )}
                      {!item.typically_reimbursable && !item.cra_deductible && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <User className="h-2.5 w-2.5 mr-0.5" />Personal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span>{formatCurrency(item.amount || 0)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals by Destination */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4" />
              Total Gastos
            </span>
            <span className="font-bold">{formatCurrency(totals.total)}</span>
          </div>

          {totals.clientReimbursable > 0 && (
            <div className="flex justify-between items-center pl-4">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <Building2 className="h-3.5 w-3.5" />
                Reembolsable por Cliente
              </span>
              <span className="font-medium text-green-700">{formatCurrency(totals.clientReimbursable)}</span>
            </div>
          )}

          {totals.craDeductible > 0 && (
            <div className="flex justify-between items-center pl-4">
              <span className="flex items-center gap-2 text-sm text-blue-700">
                <Landmark className="h-3.5 w-3.5" />
                Deducible CRA (neto)
              </span>
              <span className="font-medium text-blue-700">{formatCurrency(totals.craDeductible)}</span>
            </div>
          )}

          {totals.hstClaimable > 0 && (
            <div className="flex justify-between items-center pl-6">
              <span className="text-xs text-muted-foreground">
                HST/GST Recuperable (ITC)
              </span>
              <span className="text-xs text-muted-foreground">{formatCurrency(totals.hstClaimable)}</span>
            </div>
          )}

          {totals.craOnly > 0 && (
            <div className="flex justify-between items-center pl-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                Solo CRA (no reembolsable)
              </span>
              <span className="text-sm">{formatCurrency(totals.craOnly)}</span>
            </div>
          )}

          {totals.personal > 0 && (
            <div className="flex justify-between items-center pl-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Gasto Personal
              </span>
              <span className="text-sm">{formatCurrency(totals.personal)}</span>
            </div>
          )}
        </div>

        {/* Notes/Justifications */}
        {expenses.some(e => e.typically_reimbursable !== expenses[0]?.typically_reimbursable) && (
          <>
            <Separator />
            <div className="flex gap-2 p-2 bg-amber-50 rounded-md border border-amber-200">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Nota:</strong> Este recibo contiene gastos mixtos. 
                Los ítems marcados con <span className="text-green-700 font-medium">Cliente</span> son reembolsables según acuerdos típicos de contratistas. 
                Los marcados con <span className="text-blue-700 font-medium">CRA %</span> son deducibles de impuestos. 
                Revisa tu contrato para confirmar los términos específicos.
              </p>
            </div>
          </>
        )}

        {/* Tip for personal users */}
        {totals.personal > 0 && totals.clientReimbursable === 0 && totals.craDeductible === 0 && (
          <div className="flex gap-2 p-2 bg-slate-50 rounded-md border">
            <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              <strong>Tip:</strong> Aunque este gasto es personal, registrarlo te ayuda a 
              llevar control de tus finanzas. Puedes ver reportes mensuales, 
              identificar patrones de gasto y establecer presupuestos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
