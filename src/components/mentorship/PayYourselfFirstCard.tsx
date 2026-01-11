import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { usePayYourselfFirst, useUpdatePayYourselfFirst, useRecordPayment } from '@/hooks/data/usePayYourselfFirst';
import { useLanguage } from '@/contexts/LanguageContext';
import { PiggyBank, Flame, Trophy, Settings, Plus, Check, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';

export function PayYourselfFirstCard() {
  const { language } = useLanguage();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [targetPercentage, setTargetPercentage] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const {
    settings,
    actualSavedThisMonth,
    targetSavedThisMonth,
    incomeThisMonth,
    percentageSaved,
    isOnTrack,
    streakMonths,
    bestStreak,
    hasPaidThisMonth,
    recommendations,
    isLoading,
  } = usePayYourselfFirst();

  const updateSettings = useUpdatePayYourselfFirst();
  const recordPayment = useRecordPayment();

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

  const handleSaveSettings = () => {
    updateSettings.mutate({ target_percentage: targetPercentage });
    setShowSettings(false);
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0) {
      recordPayment.mutate(amount);
      setPaymentAmount('');
      setShowPayment(false);
    }
  };

  return (
    <Card className={`overflow-hidden ${isOnTrack && hasPaidThisMonth ? 'ring-2 ring-green-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PiggyBank className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Págate Primero' : 'Pay Yourself First'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs" title={language === 'es' ? 'Inspirado en filosofía de Jim Rohn. No afiliado.' : 'Inspired by Jim Rohn\'s philosophy. Not affiliated.'}>
              📖 Rohn*
            </Badge>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {language === 'es' ? 'Configurar Meta de Ahorro' : 'Configure Savings Goal'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">
                      {language === 'es' ? 'Porcentaje del ingreso a ahorrar' : 'Percentage of income to save'}
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[targetPercentage]}
                        onValueChange={([val]) => setTargetPercentage(val)}
                        min={5}
                        max={50}
                        step={5}
                        className="flex-1"
                      />
                      <span className="font-bold text-lg w-16 text-right">{targetPercentage}%</span>
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings} className="w-full">
                    {language === 'es' ? 'Guardar' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">
          "{language === 'es' 
            ? 'No gastes lo que queda después de ahorrar; ahorra lo que queda después de pagar' 
            : "Don't spend what's left after saving; save what's left after paying"}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Display */}
        <div className="flex items-center justify-center gap-6 py-3">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className={`h-5 w-5 ${streakMonths > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className="text-2xl font-bold">{streakMonths}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Racha actual' : 'Current streak'}
            </p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{bestStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Mejor racha' : 'Best streak'}
            </p>
          </div>
        </div>

        {/* Progress this month */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{language === 'es' ? 'Progreso este mes' : 'Progress this month'}</span>
            <span className="font-semibold">
              {formatCurrency(actualSavedThisMonth)} / {formatCurrency(targetSavedThisMonth)}
            </span>
          </div>
          <Progress 
            value={targetSavedThisMonth > 0 ? Math.min((actualSavedThisMonth / targetSavedThisMonth) * 100, 100) : 0} 
            className="h-3"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{percentageSaved.toFixed(1)}% {language === 'es' ? 'ahorrado' : 'saved'}</span>
            <span>{language === 'es' ? 'Meta' : 'Target'}: {settings?.target_percentage || 20}%</span>
          </div>
        </div>

        {/* Status */}
        {hasPaidThisMonth && isOnTrack ? (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">
              {language === 'es' ? '¡Ya te pagaste primero este mes!' : 'You paid yourself first this month!'}
            </span>
          </div>
        ) : (
          <Dialog open={showPayment} onOpenChange={setShowPayment}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Registrar Pago a Ti Mismo' : 'Record Payment to Yourself'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'es' ? 'Págate Primero' : 'Pay Yourself First'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Monto ahorrado/invertido' : 'Amount saved/invested'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1"
                  />
                  {incomeThisMonth > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'es' ? 'Sugerido' : 'Suggested'}: {formatCurrency(targetSavedThisMonth)} ({settings?.target_percentage || 20}% {language === 'es' ? 'de' : 'of'} {formatCurrency(incomeThisMonth)})
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleRecordPayment} 
                  className="w-full"
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  <PiggyBank className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Registrar' : 'Record'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {language === 'es' ? 'Consejos' : 'Tips'}
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
