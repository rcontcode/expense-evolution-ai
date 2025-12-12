import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Flame, 
  Target, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Sparkles,
  AlertCircle,
  CheckCircle,
  PiggyBank,
  Umbrella,
  Rocket,
  RefreshCw,
  Info
} from 'lucide-react';
import { useFIRECalculator } from '@/hooks/data/useFIRECalculator';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { InfoTooltip } from '@/components/ui/info-tooltip';

const FIRE_TOOLTIP = {
  es: {
    title: 'Calculadora FIRE',
    description: 'Financial Independence, Retire Early - Calcula cuánto necesitas ahorrar para alcanzar la independencia financiera y retirarte temprano.',
    howToUse: 'Ajusta los parámetros según tu situación y ve las proyecciones en tiempo real.',
  },
  en: {
    title: 'FIRE Calculator',
    description: 'Financial Independence, Retire Early - Calculate how much you need to save to achieve financial independence and retire early.',
    howToUse: 'Adjust the parameters according to your situation and see projections in real time.',
  },
};

export function FIRECalculatorCard() {
  const { t } = useLanguage();
  const { inputs, results, actualFinancials, updateInputs, initializeFromData } = useFIRECalculator();
  const [activeTab, setActiveTab] = useState('calculator');

  useEffect(() => {
    // Auto-initialize from actual data on mount
    if (actualFinancials.netWorth > 0 || actualFinancials.avgMonthlyExpenses > 0) {
      initializeFromData();
    }
  }, [actualFinancials.netWorth, actualFinancials.avgMonthlyExpenses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYears = (years: number) => {
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);
    if (months === 0) return `${wholeYears} años`;
    return `${wholeYears} años, ${months} meses`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
            <CardTitle className="text-lg flex items-center gap-2">
                Calculadora FIRE
                <InfoTooltip content={FIRE_TOOLTIP} />
              </CardTitle>
              <CardDescription>Planifica tu independencia financiera</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={initializeFromData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Sincronizar datos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">Calculadora</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
            <TabsTrigger value="projections">Proyecciones</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6 mt-4">
            {/* Current Status Banner */}
            <div className={`p-4 rounded-lg border ${results.onTrack ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                {results.onTrack ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium">
                  {results.onTrack ? '¡Vas por buen camino!' : 'Necesitas ajustar tu plan'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {results.onTrack 
                  ? `A tu ritmo actual, alcanzarás FIRE a los ${results.projectedRetirementAge} años.`
                  : `Necesitas ahorrar ${formatCurrency(results.monthlySavingsNeeded)}/mes para retirarte a los ${inputs.targetRetirementAge}.`
                }
              </p>
            </div>

            {/* Input Sliders */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Age Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Edad actual</Label>
                    <span className="text-sm font-medium">{inputs.currentAge} años</span>
                  </div>
                  <Slider
                    value={[inputs.currentAge]}
                    onValueChange={([value]) => updateInputs({ currentAge: value })}
                    min={18}
                    max={70}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Edad objetivo de retiro</Label>
                    <span className="text-sm font-medium">{inputs.targetRetirementAge} años</span>
                  </div>
                  <Slider
                    value={[inputs.targetRetirementAge]}
                    onValueChange={([value]) => updateInputs({ targetRetirementAge: value })}
                    min={inputs.currentAge + 5}
                    max={80}
                    step={1}
                  />
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Gastos mensuales deseados</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={inputs.monthlyExpenses}
                      onChange={(e) => updateInputs({ monthlyExpenses: Number(e.target.value) })}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ahorros/Inversiones actuales</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={inputs.currentSavings}
                      onChange={(e) => updateInputs({ currentSavings: Number(e.target.value) })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Parámetros avanzados
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Retorno anual esperado</Label>
                    <span className="text-xs font-medium">{inputs.expectedAnnualReturn}%</span>
                  </div>
                  <Slider
                    value={[inputs.expectedAnnualReturn]}
                    onValueChange={([value]) => updateInputs({ expectedAnnualReturn: value })}
                    min={3}
                    max={12}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Inflación anual</Label>
                    <span className="text-xs font-medium">{inputs.inflationRate}%</span>
                  </div>
                  <Slider
                    value={[inputs.inflationRate]}
                    onValueChange={([value]) => updateInputs({ inflationRate: value })}
                    min={1}
                    max={6}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tasa de retiro</Label>
                    <span className="text-xs font-medium">{inputs.withdrawalRate}%</span>
                  </div>
                  <Slider
                    value={[inputs.withdrawalRate]}
                    onValueChange={([value]) => updateInputs({ withdrawalRate: value })}
                    min={2}
                    max={6}
                    step={0.5}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-4">
            {/* FIRE Number Display */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
              <div className="text-sm text-muted-foreground mb-1">Tu Número FIRE</div>
              <div className="text-4xl font-bold text-orange-500">
                {formatCurrency(results.fireNumber)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Necesitas esta cantidad para vivir de tus inversiones
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso hacia FIRE</span>
                <span className="font-medium">{results.progressPercentage}%</span>
              </div>
              <Progress value={results.progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(inputs.currentSavings)}</span>
                <span>{formatCurrency(results.fireNumber)}</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Tiempo hasta FIRE
                </div>
                <div className="text-2xl font-semibold">
                  {formatYears(results.yearsToFIRE)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Retiro proyectado a los {results.projectedRetirementAge} años
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <PiggyBank className="h-4 w-4" />
                  Ahorro mensual necesario
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(results.monthlySavingsNeeded)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Para retirarte a los {inputs.targetRetirementAge} años
                </div>
              </div>
            </div>

            {/* FIRE Variations */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Variaciones de FIRE
              </h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Umbrella className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Lean FIRE</span>
                  </div>
                  <div className="text-lg font-semibold">{formatCurrency(results.leanFIRENumber)}</div>
                  <div className="text-xs text-muted-foreground">50% de gastos, estilo frugal</div>
                </div>

                <div className="p-3 border rounded-lg border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">FIRE Estándar</span>
                  </div>
                  <div className="text-lg font-semibold">{formatCurrency(results.fireNumber)}</div>
                  <div className="text-xs text-muted-foreground">100% de tus gastos actuales</div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Fat FIRE</span>
                  </div>
                  <div className="text-lg font-semibold">{formatCurrency(results.fatFIRENumber)}</div>
                  <div className="text-xs text-muted-foreground">150% de gastos, vida lujosa</div>
                </div>
              </div>
            </div>

            {/* Coast FIRE */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Coast FIRE</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Si alcanzas {formatCurrency(results.coastFIRENumber)} en ahorros, podrías dejar de contribuir 
                y el interés compuesto te llevará a FIRE a los 65 años.
              </p>
              {inputs.currentSavings >= results.coastFIRENumber ? (
                <Badge variant="default" className="bg-green-500">
                  ¡Ya alcanzaste Coast FIRE!
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Te faltan {formatCurrency(results.coastFIRENumber - inputs.currentSavings)}
                </Badge>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projections" className="space-y-6 mt-4">
            {/* Projection Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.yearlyProjections}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="age" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value} años`}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">Edad: {data.age} años</p>
                            <p className="text-sm text-muted-foreground">Año: {data.year}</p>
                            <p className="text-primary font-medium">
                              Ahorros: {formatCurrency(data.savings)}
                            </p>
                            <p className="text-sm">
                              Progreso: {data.percentComplete.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine 
                    y={results.fireNumber} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: 'FIRE', 
                      position: 'right',
                      fill: 'hsl(var(--destructive))',
                      fontSize: 12
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="hsl(var(--primary))"
                    fill="url(#savingsGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Yearly Milestones */}
            <div className="space-y-3">
              <h4 className="font-medium">Hitos importantes</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {results.yearlyProjections
                  .filter((p, i) => i % 5 === 0 || p.percentComplete >= 100)
                  .slice(0, 8)
                  .map((projection) => (
                    <div 
                      key={projection.year} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        projection.percentComplete >= 100 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold">{projection.age}</div>
                          <div className="text-xs text-muted-foreground">años</div>
                        </div>
                        <div>
                          <div className="font-medium">{formatCurrency(projection.savings)}</div>
                          <div className="text-xs text-muted-foreground">Año {projection.year}</div>
                        </div>
                      </div>
                      <Badge variant={projection.percentComplete >= 100 ? 'default' : 'secondary'}>
                        {projection.percentComplete.toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Consejos para acelerar tu FIRE
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Aumentar tu tasa de ahorro del {results.currentSavingsRate}% al 50% puede reducir años de tu timeline.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Reducir gastos en $500/mes reduce tu número FIRE en {formatCurrency(500 * 12 / (inputs.withdrawalRate / 100))}.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Considera inversiones con ventajas fiscales como TFSA y RRSP para maximizar retornos.</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
