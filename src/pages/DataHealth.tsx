import { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDataHealthCheck, ISSUE_LABELS } from '@/hooks/data/useDataHealthCheck';
import { useAuditLog } from '@/hooks/data/useAuditLog';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { ShieldCheck, AlertTriangle, AlertCircle, History, Plus, FileEdit, Trash2, RotateCcw, Receipt, Tag, HelpCircle, ArrowRight, Activity, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-3.5 w-3.5 text-emerald-500" />,
  update: <FileEdit className="h-3.5 w-3.5 text-blue-500" />,
  delete: <Trash2 className="h-3.5 w-3.5 text-destructive" />,
  restore: <RotateCcw className="h-3.5 w-3.5 text-amber-500" />,
};

const ENTITY_LABELS: Record<string, { es: string; en: string }> = {
  expense: { es: 'Gasto', en: 'Expense' },
  income: { es: 'Ingreso', en: 'Income' },
  client: { es: 'Cliente', en: 'Client' },
  project: { es: 'Proyecto', en: 'Project' },
  contract: { es: 'Contrato', en: 'Contract' },
};

export default function DataHealth() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { data: health, isLoading: healthLoading } = useDataHealthCheck();
  const { data: auditLogs, isLoading: auditLoading } = useAuditLog(200);
  const { expenseMissingReceipt, expensePendingClassification, expenseNoCategory } = useNudgeSystem();
  const navigate = useNavigate();

  // Combine DB issues + expense-level issues for total count
  const dbIssueCount = health?.totalIssues || 0;
  const expenseLevelIssues = expenseMissingReceipt + expensePendingClassification + expenseNoCategory;
  const totalIssues = dbIssueCount + expenseLevelIssues;

  // Health score calculation (0-100)
  const healthScore = useMemo(() => {
    if (healthLoading) return null;
    // Max penalty: 50 for DB issues, 50 for expense issues
    const dbPenalty = Math.min(dbIssueCount * 5, 50);
    const expPenalty = Math.min(expenseLevelIssues * 2, 50);
    return Math.max(0, 100 - dbPenalty - expPenalty);
  }, [dbIssueCount, expenseLevelIssues, healthLoading]);

  const scoreColor = healthScore !== null
    ? healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 50 ? 'text-amber-600' : 'text-destructive'
    : 'text-muted-foreground';
  const scoreLabel = healthScore !== null
    ? healthScore >= 80 ? (l ? 'Excelente' : 'Excellent') : healthScore >= 50 ? (l ? 'Aceptable' : 'Fair') : (l ? 'Necesita atención' : 'Needs attention')
    : '';

  // Activity stats from audit log
  const recentActivity = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) return null;
    const today = new Date();
    const last7 = auditLogs.filter(e => {
      const d = parseISO(e.created_at);
      return (today.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });
    const last30 = auditLogs.filter(e => {
      const d = parseISO(e.created_at);
      return (today.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
    });
    return { week: last7.length, month: last30.length, total: auditLogs.length };
  }, [auditLogs]);

  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={l ? 'Salud de Datos & Auditoría' : 'Data Health & Audit'}
          description={l ? 'Detecta registros huérfanos, datos incompletos y revisa el historial completo de cambios.' : 'Detect orphaned records, incomplete data and review complete change history.'}
        />

        {/* Health Score Overview */}
        {healthScore !== null && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
                <CardContent className="p-4 relative">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l ? 'Puntuación' : 'Score'}</p>
                  <div className="flex items-end gap-2">
                    <span className={cn("text-3xl font-bold", scoreColor)}>{healthScore}</span>
                    <span className="text-xs text-muted-foreground mb-1">/100</span>
                  </div>
                  <Progress value={healthScore} className="h-1.5 mt-2" />
                  <p className={cn("text-[10px] mt-1 font-medium", scoreColor)}>{scoreLabel}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l ? 'Problemas' : 'Issues'}</p>
                  <p className={cn("text-3xl font-bold", totalIssues > 0 ? 'text-amber-600' : 'text-emerald-600')}>{totalIssues}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{l ? 'Requieren atención' : 'Need attention'}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l ? 'Actividad 7d' : '7-day activity'}</p>
                  <p className="text-3xl font-bold">{recentActivity?.week || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{l ? 'Acciones registradas' : 'Actions logged'}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l ? 'Total auditoría' : 'Total audit'}</p>
                  <p className="text-3xl font-bold">{recentActivity?.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{l ? 'Registros históricos' : 'Historical records'}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList>
            <TabsTrigger value="health" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              {l ? 'Salud' : 'Health'}
              {totalIssues > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{totalIssues}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              {l ? 'Auditoría' : 'Audit Log'}
            </TabsTrigger>
          </TabsList>

          {/* Health Check Tab */}
          <TabsContent value="health" className="space-y-4">
            {healthLoading ? (
              <div className="h-32 animate-pulse bg-muted/30 rounded-lg" />
            ) : totalIssues === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{l ? '¡Datos saludables!' : 'Data is healthy!'}</p>
                    <p className="text-sm text-muted-foreground">{l ? 'No se encontraron registros huérfanos ni inconsistencias.' : 'No orphaned records or inconsistencies found.'}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* DB-level issues (orphaned records) */}
                {health && Object.entries(health.grouped).map(([issueType, issues]) => {
                  const label = ISSUE_LABELS[issueType];
                  const isError = label?.severity === 'error';
                  return (
                    <Card key={issueType}>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {isError ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          {l ? label?.es : label?.en}
                          <Badge variant={isError ? 'destructive' : 'secondary'} className="ml-auto">
                            {issues.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {issues.slice(0, 20).map(issue => (
                            <div key={issue.record_id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/50">
                              <span className="font-medium truncate flex-1">{issue.record_name}</span>
                              <span className="text-muted-foreground">${issue.detail}</span>
                              <span className="text-muted-foreground/60">{issue.record_date}</span>
                            </div>
                          ))}
                          {issues.length > 20 && (
                            <p className="text-xs text-muted-foreground text-center py-1">
                              +{issues.length - 20} {l ? 'más' : 'more'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Expense-level issues */}
                {expenseMissingReceipt > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-amber-500" />
                        {l ? 'Gastos sin recibo' : 'Expenses missing receipt'}
                        <Badge variant="secondary" className="ml-auto">{expenseMissingReceipt}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xs text-muted-foreground">
                        {l ? 'Estos gastos no tienen un documento/recibo vinculado. Vincular recibos es esencial para auditorías fiscales.' : 'These expenses have no linked document/receipt. Linking receipts is essential for tax audits.'}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/expenses')}>
                        {l ? 'Ir a gastos' : 'Go to expenses'}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {expensePendingClassification > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-amber-500" />
                        {l ? 'Gastos sin clasificar (reembolso)' : 'Unclassified expenses (reimbursement)'}
                        <Badge variant="secondary" className="ml-auto">{expensePendingClassification}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xs text-muted-foreground">
                        {l ? 'Estos gastos aún no han sido clasificados como reembolsable, deducible o personal.' : 'These expenses haven\'t been classified as reimbursable, deductible, or personal yet.'}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/expenses')}>
                        {l ? 'Clasificar' : 'Classify'}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {expenseNoCategory > 0 && (
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Tag className="h-4 w-4 text-amber-500" />
                        {l ? 'Gastos sin categoría' : 'Expenses without category'}
                        <Badge variant="secondary" className="ml-auto">{expenseNoCategory}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xs text-muted-foreground">
                        {l ? 'Estos gastos no tienen categoría asignada. Categorizar es clave para presupuestos y reportes fiscales.' : 'These expenses have no assigned category. Categorizing is key for budgets and tax reports.'}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/expenses')}>
                        {l ? 'Categorizar' : 'Categorize'}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            {auditLoading ? (
              <div className="h-32 animate-pulse bg-muted/30 rounded-lg" />
            ) : !auditLogs || auditLogs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{l ? 'Sin actividad registrada' : 'No activity recorded'}</p>
                    <p className="text-sm text-muted-foreground">{l ? 'Los cambios futuros aparecerán aquí.' : 'Future changes will appear here.'}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {auditLogs.map(entry => {
                      const icon = ACTION_ICONS[entry.action] || ACTION_ICONS.update;
                      const entityLabel = ENTITY_LABELS[entry.entity_type];
                      const timeAgo = formatDistanceToNow(parseISO(entry.created_at), {
                        addSuffix: true,
                        locale: l ? es : enUS,
                      });

                      return (
                        <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="mt-0.5 shrink-0">{icon}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="font-medium capitalize">{entry.action}</span>
                              {' '}
                              <Badge variant="outline" className="text-xs">
                                {l ? entityLabel?.es : entityLabel?.en}
                              </Badge>
                              {entry.entity_name && (
                                <span className="text-muted-foreground ml-1">— {entry.entity_name}</span>
                              )}
                            </p>
                            {entry.new_values && typeof entry.new_values === 'object' && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {Object.entries(entry.new_values).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
