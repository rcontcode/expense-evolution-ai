import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useDebtClassification, useUpdateDebtType, ClassifiedDebt } from '@/hooks/data/useDebtClassification';
import { useLanguage } from '@/contexts/LanguageContext';
import { Scale, ThumbsUp, ThumbsDown, DollarSign, Lightbulb, Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

export function DebtClassificationCard() {
  const { language } = useLanguage();
  const [editingDebt, setEditingDebt] = useState<ClassifiedDebt | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const {
    goodDebt,
    badDebt,
    totalGoodDebt,
    totalBadDebt,
    totalDebt,
    goodDebtRatio,
    totalMonthlyFromGoodDebt,
    netMonthlyCostBadDebt,
    recommendations,
    isLoading,
  } = useDebtClassification();

  const updateDebtType = useUpdateDebtType();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(amount);

  const handleUpdateDebt = () => {
    if (editingDebt) {
      updateDebtType.mutate({
        id: editingDebt.id,
        debt_type: editingDebt.debt_type,
        generates_income: editingDebt.generates_income,
        monthly_income_generated: parseFloat(monthlyIncome) || 0,
      });
      setEditingDebt(null);
      setMonthlyIncome('');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Deuda Buena vs Mala' : 'Good vs Bad Debt'}
          </CardTitle>
          <Badge variant="outline" className="text-xs" title={language === 'es' ? 'Inspirado en obra de Robert Kiyosaki. No afiliado.' : 'Inspired by Robert Kiyosaki\'s work. Not affiliated.'}>
            📖 Kiyosaki*
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground italic">
          "{language === 'es' 
            ? 'La deuda buena pone dinero en tu bolsillo; la mala lo saca' 
            : 'Good debt puts money in your pocket; bad debt takes it out'}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Balance */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-green-600">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                {language === 'es' ? 'Buena' : 'Good'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm font-medium">
                {language === 'es' ? 'Mala' : 'Bad'}
              </span>
            </div>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden bg-muted">
            <div 
              className="bg-green-500 transition-all flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${goodDebtRatio}%` }}
            >
              {goodDebtRatio > 20 && `${goodDebtRatio.toFixed(0)}%`}
            </div>
            <div 
              className="bg-destructive transition-all flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${100 - goodDebtRatio}%` }}
            >
              {(100 - goodDebtRatio) > 20 && `${(100 - goodDebtRatio).toFixed(0)}%`}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Deuda Buena' : 'Good Debt'}
            </p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalGoodDebt)}
            </p>
            {totalMonthlyFromGoodDebt > 0 && (
              <p className="text-xs text-green-600">
                +{formatCurrency(totalMonthlyFromGoodDebt)}/mes
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Deuda Mala' : 'Bad Debt'}
            </p>
            <p className="text-lg font-semibold text-destructive">
              {formatCurrency(totalBadDebt)}
            </p>
            {netMonthlyCostBadDebt > 0 && (
              <p className="text-xs text-destructive">
                -{formatCurrency(netMonthlyCostBadDebt)}/mes
              </p>
            )}
          </div>
        </div>

        {/* Debt List */}
        {(goodDebt.length > 0 || badDebt.length > 0) && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[...goodDebt, ...badDebt].slice(0, 5).map((debt) => (
              <Dialog key={debt.id}>
                <DialogTrigger asChild>
                  <div 
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      debt.debt_type === 'good' ? 'border-l-2 border-green-500' : 'border-l-2 border-destructive'
                    }`}
                    onClick={() => {
                      setEditingDebt(debt);
                      setMonthlyIncome(debt.monthly_income_generated.toString());
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {debt.debt_type === 'good' ? (
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{debt.name}</p>
                        <p className="text-xs text-muted-foreground">{debt.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(debt.current_balance)}</p>
                      <Edit2 className="h-3 w-3 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'es' ? 'Clasificar Deuda' : 'Classify Debt'}
                    </DialogTitle>
                  </DialogHeader>
                  {editingDebt && (
                    <div className="space-y-4 py-4">
                      <div>
                        <p className="font-medium">{editingDebt.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(editingDebt.current_balance)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          {language === 'es' ? '¿Esta deuda genera ingresos?' : 'Does this debt generate income?'}
                        </label>
                        <Switch
                          checked={editingDebt.generates_income}
                          onCheckedChange={(checked) => 
                            setEditingDebt({
                              ...editingDebt,
                              generates_income: checked,
                              debt_type: checked ? 'good' : 'bad',
                            })
                          }
                        />
                      </div>

                      {editingDebt.generates_income && (
                        <div>
                          <label className="text-sm font-medium">
                            {language === 'es' ? 'Ingreso mensual que genera' : 'Monthly income generated'}
                          </label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      )}

                      <div className={`p-3 rounded-lg ${
                        editingDebt.generates_income ? 'bg-green-500/10' : 'bg-destructive/10'
                      }`}>
                        <p className="text-sm">
                          {editingDebt.generates_income ? (
                            <>
                              {language === 'es' ? '✓ Deuda Buena: ' : '✓ Good Debt: '}
                              {language === 'es' 
                                ? 'Esta deuda pone dinero en tu bolsillo'
                                : 'This debt puts money in your pocket'}
                            </>
                          ) : (
                            <>
                              {language === 'es' ? '✗ Deuda Mala: ' : '✗ Bad Debt: '}
                              {language === 'es'
                                ? 'Esta deuda saca dinero de tu bolsillo'
                                : 'This debt takes money from your pocket'}
                            </>
                          )}
                        </p>
                      </div>

                      <Button onClick={handleUpdateDebt} className="w-full">
                        {language === 'es' ? 'Guardar Clasificación' : 'Save Classification'}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {language === 'es' ? 'Recomendaciones' : 'Recommendations'}
            </div>
            <ul className="space-y-1">
              {recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <LegalDisclaimer variant="education" size="compact" />
      </CardContent>
    </Card>
  );
}
