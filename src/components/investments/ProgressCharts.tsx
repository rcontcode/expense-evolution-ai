import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, PiggyBank, Target, Calendar } from 'lucide-react';

interface ProgressChartsProps {
  savingsGoals: any[];
  investmentGoals: any[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ProgressCharts({ savingsGoals, investmentGoals }: ProgressChartsProps) {
  const { t } = useLanguage();

  // Combine all goals for overview
  const allGoals = useMemo(() => {
    const savings = (savingsGoals || []).map(g => ({
      ...g,
      type: 'savings',
      progress: g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
    }));
    const investments = (investmentGoals || []).map(g => ({
      ...g,
      type: 'investment',
      progress: g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
    }));
    return [...savings, ...investments];
  }, [savingsGoals, investmentGoals]);

  // Summary data for pie chart
  const summaryData = useMemo(() => {
    const totalSavings = (savingsGoals || []).reduce((acc, g) => acc + (g.current_amount || 0), 0);
    const totalInvestments = (investmentGoals || []).reduce((acc, g) => acc + (g.current_amount || 0), 0);
    return [
      { name: t('investments.savings'), value: totalSavings, color: '#10B981' },
      { name: t('investments.investments'), value: totalInvestments, color: '#8B5CF6' },
    ].filter(d => d.value > 0);
  }, [savingsGoals, investmentGoals, t]);

  // Goals progress bar chart data
  const goalsProgressData = useMemo(() => {
    return allGoals.slice(0, 6).map(goal => ({
      name: goal.name.length > 12 ? goal.name.substring(0, 12) + '...' : goal.name,
      fullName: goal.name,
      progress: Math.min(goal.progress, 100),
      remaining: Math.max(100 - goal.progress, 0),
      current: goal.current_amount || 0,
      target: goal.target_amount,
      type: goal.type,
      color: goal.color || (goal.type === 'savings' ? '#10B981' : '#8B5CF6')
    }));
  }, [allGoals]);

  // Simulated monthly progress (based on current amounts)
  const monthlyProgressData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const totalCurrent = allGoals.reduce((acc, g) => acc + (g.current_amount || 0), 0);
    
    // Simulate growth pattern
    return months.map((month, index) => ({
      month,
      savings: Math.round((totalCurrent * 0.6) * ((index + 1) / 6)),
      investments: Math.round((totalCurrent * 0.4) * ((index + 1) / 6)),
      total: Math.round(totalCurrent * ((index + 1) / 6)),
    }));
  }, [allGoals]);

  const totalSaved = summaryData.reduce((acc, d) => acc + d.value, 0);

  if (allGoals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="font-semibold text-lg">{t('investments.noDataForCharts')}</h4>
          <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
            {t('investments.createGoalsForCharts')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <PiggyBank className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('investments.totalSaved')}</p>
                <p className="text-2xl font-bold">${totalSaved.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900">
                <Target className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('investments.activeGoals')}</p>
                <p className="text-2xl font-bold">{allGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('investments.avgProgress')}</p>
                <p className="text-2xl font-bold">
                  {allGoals.length > 0 
                    ? Math.round(allGoals.reduce((acc, g) => acc + g.progress, 0) / allGoals.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Progress Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t('investments.progressOverTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyProgressData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="savings" 
                  name={t('investments.savings')}
                  stackId="1"
                  stroke="#10B981" 
                  fillOpacity={1}
                  fill="url(#colorSavings)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="investments" 
                  name={t('investments.investments')}
                  stackId="1"
                  stroke="#8B5CF6" 
                  fillOpacity={1}
                  fill="url(#colorInvestments)" 
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-4 w-4" />
              {t('investments.distribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goals Progress Bar Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              {t('investments.goalsProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalsProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'progress') {
                      return [`${value.toFixed(1)}% ($${props.payload.current.toLocaleString()} / $${props.payload.target.toLocaleString()})`, t('investments.progress')];
                    }
                    return [`${value.toFixed(1)}%`, t('investments.remaining')];
                  }}
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                />
                <Bar 
                  dataKey="progress" 
                  stackId="a" 
                  fill="#10B981"
                  radius={[4, 0, 0, 4]}
                  name={t('investments.progress')}
                />
                <Bar 
                  dataKey="remaining" 
                  stackId="a" 
                  fill="hsl(var(--muted))"
                  radius={[0, 4, 4, 0]}
                  name={t('investments.remaining')}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
