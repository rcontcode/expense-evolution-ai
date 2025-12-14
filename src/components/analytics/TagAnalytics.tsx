import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTagAnalytics } from '@/hooks/data/useTagSuggestions';
import { Tag, TrendingUp, PieChart, BarChart3, Receipt, Percent, Sparkles } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function TagAnalytics() {
  const { language } = useLanguage();
  const { data, isLoading } = useTagAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { tags, monthlyTrends, summary } = data;
  const top5Tags = tags.slice(0, 5);

  // Format month names
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' });
  };

  // Pie chart data
  const pieData = top5Tags.map(tag => ({
    name: tag.name,
    value: tag.count,
    color: tag.color,
  }));

  // Add "Others" if more tags exist
  if (tags.length > 5) {
    const othersCount = tags.slice(5).reduce((sum, t) => sum + t.count, 0);
    if (othersCount > 0) {
      pieData.push({ name: language === 'es' ? 'Otros' : 'Others', value: othersCount, color: '#6B7280' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
                <Tag className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalTags}</p>
                <p className="text-xs text-muted-foreground">{language === 'es' ? 'Etiquetas' : 'Tags'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalTaggedExpenses}</p>
                <p className="text-xs text-muted-foreground">{language === 'es' ? 'Asignaciones' : 'Assignments'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.untaggedExpenses}</p>
                <p className="text-xs text-muted-foreground">{language === 'es' ? 'Sin etiquetar' : 'Untagged'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Percent className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.coveragePercent}%</p>
                <p className="text-xs text-muted-foreground">{language === 'es' ? 'Cobertura' : 'Coverage'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {language === 'es' ? 'Etiquetas Más Usadas' : 'Most Used Tags'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top5Tags.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {language === 'es' ? 'No hay datos de etiquetas' : 'No tag data available'}
                </p>
              ) : (
                top5Tags.map((tag, idx) => {
                  const maxCount = top5Tags[0]?.count || 1;
                  const percentage = (tag.count / maxCount) * 100;
                  
                  return (
                    <div key={tag.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-5">{idx + 1}.</span>
                          <Badge style={{ backgroundColor: tag.color }} className="text-white">
                            {tag.name}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{tag.count}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            (${tag.totalAmount.toLocaleString()})
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: tag.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              {language === 'es' ? 'Distribución de Etiquetas' : 'Tag Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-16">
                {language === 'es' ? 'No hay datos de etiquetas' : 'No tag data available'}
              </p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, language === 'es' ? 'Gastos' : 'Expenses']}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Tendencias Mensuales de Etiquetas' : 'Monthly Tag Trends'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrends.every(m => m.totalCount === 0) ? (
            <p className="text-muted-foreground text-sm text-center py-16">
              {language === 'es' ? 'No hay datos de tendencias' : 'No trend data available'}
            </p>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={formatMonth}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend />
                  {top5Tags.slice(0, 4).map((tag) => (
                    <Bar
                      key={tag.id}
                      dataKey={tag.name}
                      stackId="a"
                      fill={tag.color}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Tags Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Todas las Etiquetas' : 'All Tags'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {language === 'es' ? 'No hay etiquetas creadas' : 'No tags created'}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tags.map((tag) => (
                <div 
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Badge style={{ backgroundColor: tag.color }} className="text-white">
                    {tag.name}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{tag.count}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ${tag.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
