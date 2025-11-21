import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Calculator, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaxSummary, TAX_DEDUCTION_RULES } from '@/hooks/data/useTaxCalculations';

interface TaxSummaryCardsProps {
  taxSummary: TaxSummary;
}

export const TaxSummaryCards = ({ taxSummary }: TaxSummaryCardsProps) => {
  return (
    <div className="space-y-4">
      {/* Resumen General */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deducible</CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              ${taxSummary.deductibleAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((taxSummary.deductibleAmount / taxSummary.totalExpenses) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reembolsable</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              ${taxSummary.reimbursableAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((taxSummary.reimbursableAmount / taxSummary.totalExpenses) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Deducible</CardTitle>
            <AlertCircle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${taxSummary.nonDeductibleAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((taxSummary.nonDeductibleAmount / taxSummary.totalExpenses) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Análisis Fiscal por Categoría
          </CardTitle>
          <CardDescription>
            Basado en las reglas de CRA (Canada Revenue Agency)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taxSummary.categoryBreakdown.map((item) => {
              const rule = TAX_DEDUCTION_RULES.find((r) => r.category === item.category);
              return (
                <div key={item.category} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium capitalize">{item.category.replace('_', ' ')}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule?.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold">${item.deductible.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        de ${item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="bg-chart-1 h-2 rounded-full"
                      style={{ width: `${(item.deductible / item.total) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Tasa de deducción: {(item.rate * 100).toFixed(0)}%
                    </span>
                    {rule && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => window.open(rule.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {rule.source}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Las deducciones mostradas son estimadas según las reglas generales de CRA para contractors.
          </p>
          <p>
            • Comidas y entretenimiento tienen una deducción del 50% según la política estándar de CRA.
          </p>
          <p>
            • Los montos reembolsables no son deducibles de impuestos ya que son reembolsados por el cliente.
          </p>
          <p className="pt-2 font-medium">
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() =>
                window.open(
                  'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses.html',
                  '_blank'
                )
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver guía completa de gastos de negocio - CRA
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
