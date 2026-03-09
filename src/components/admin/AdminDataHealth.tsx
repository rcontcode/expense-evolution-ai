import { memo } from 'react';
import { useDataHealthCheck, ISSUE_LABELS } from '@/hooks/data/useDataHealthCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeartPulse, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Admin widget showing data integrity health issues
 * from the data_health_check database view.
 */
export const AdminDataHealth = memo(() => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const { data, isLoading } = useDataHealthCheck();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><div className="h-5 w-40 bg-muted rounded" /></CardHeader>
        <CardContent><div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted rounded" />)}</div></CardContent>
      </Card>
    );
  }

  const totalIssues = data?.totalIssues || 0;
  const isHealthy = totalIssues === 0;

  return (
    <Card className={`border ${isHealthy ? 'border-emerald-200 dark:border-emerald-800' : 'border-amber-200 dark:border-amber-800'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className={`h-4 w-4 ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`} />
            {isEs ? '🩺 Salud de Datos' : '🩺 Data Health'}
          </div>
          <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-xs">
            {isHealthy
              ? (isEs ? '✅ Saludable' : '✅ Healthy')
              : `${totalIssues} ${isEs ? 'problemas' : 'issues'}`
            }
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isHealthy ? (
          <div className="flex items-center gap-3 py-4 text-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              {isEs ? 'No se detectaron problemas de integridad' : 'No integrity issues detected'}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {Object.entries(data?.grouped || {}).map(([issueType, issues], index) => {
                const label = ISSUE_LABELS[issueType];
                const isError = label?.severity === 'error';
                return (
                  <motion.div
                    key={issueType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isError ? 'bg-destructive/10' : 'bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isError
                        ? <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      }
                      <span className="text-xs font-medium">
                        {isEs ? label?.es : label?.en || issueType}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {issues.length}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});

AdminDataHealth.displayName = 'AdminDataHealth';
