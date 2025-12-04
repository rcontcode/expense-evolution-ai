import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Calculator, TrendingDown, TrendingUp, AlertCircle, Receipt, BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaxSummary, TAX_DEDUCTION_RULES } from '@/hooks/data/useTaxCalculations';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaxSummaryCardsProps {
  taxSummary: TaxSummary;
}

export const TaxSummaryCards = ({ taxSummary }: TaxSummaryCardsProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      {/* Resumen General */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('taxAnalysis.totalDeductible')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              ${taxSummary.deductibleAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.totalExpenses > 0 ? ((taxSummary.deductibleAmount / taxSummary.totalExpenses) * 100).toFixed(1) : '0.0'}% {t('taxAnalysis.ofTotal')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('taxAnalysis.totalReimbursable')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              ${taxSummary.reimbursableAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.totalExpenses > 0 ? ((taxSummary.reimbursableAmount / taxSummary.totalExpenses) * 100).toFixed(1) : '0.0'}% {t('taxAnalysis.ofTotal')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('taxAnalysis.nonDeductible')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${taxSummary.nonDeductibleAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {taxSummary.totalExpenses > 0 ? ((taxSummary.nonDeductibleAmount / taxSummary.totalExpenses) * 100).toFixed(1) : '0.0'}% {t('taxAnalysis.ofTotal')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HST/GST & ITC Summary */}
      <Card className="border-chart-4/30 bg-chart-4/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-chart-4" />
            {t('taxAnalysis.hstGstSummary')}
          </CardTitle>
          <CardDescription>
            {t('taxAnalysis.itcDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('taxAnalysis.totalHstGstPaid')}</span>
                <span className="font-semibold">${taxSummary.hstGstPaid.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('taxAnalysis.itcClaimable')}</span>
                <span className="font-bold text-chart-4 text-lg">${taxSummary.itcClaimable.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('taxAnalysis.itcRate')}</span>
                <span>{taxSummary.hstGstPaid > 0 ? ((taxSummary.itcClaimable / taxSummary.hstGstPaid) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>
            <div className="space-y-2 border-l pl-4">
              <p className="text-xs text-muted-foreground">{t('taxAnalysis.itcNote1')}</p>
              <p className="text-xs text-muted-foreground">{t('taxAnalysis.itcNote2')}</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => window.open('https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/complete-file-input-tax-credit.html', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t('taxAnalysis.itcGuide')}
              </Button>
            </div>
          </div>
          
          {/* ITC by Category */}
          {taxSummary.categoryBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">{t('taxAnalysis.itcByCategory')}</h4>
              <div className="space-y-2">
                {taxSummary.categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{item.category.replace('_', ' ')}</span>
                    <div className="text-right">
                      <span className="font-medium">${item.itc.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(item.rate * 100).toFixed(0)}% {t('taxAnalysis.eligible')})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desglose por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('taxAnalysis.fiscalAnalysis')}
          </CardTitle>
          <CardDescription>
            {t('taxAnalysis.basedOnCRA')}
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
                      {t('taxAnalysis.deductionRate')}: {(item.rate * 100).toFixed(0)}%
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
            {t('taxAnalysis.importantInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>{t('taxAnalysis.estimatedDeductions')}</p>
          <p>{t('taxAnalysis.mealsPolicy')}</p>
          <p>{t('taxAnalysis.reimbursableNote')}</p>
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
              {t('taxAnalysis.fullGuide')}
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
