import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDataHealthCheck, ISSUE_LABELS } from '@/hooks/data/useDataHealthCheck';
import { useAuditLog } from '@/hooks/data/useAuditLog';
import { ShieldCheck, AlertTriangle, AlertCircle, History, Plus, FileEdit, Trash2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  return (
    <Layout>
      <div className="page-container section-gap">
        <PageHeader
          title={l ? 'Salud de Datos & Auditoría' : 'Data Health & Audit'}
          description={l ? 'Detecta registros huérfanos y revisa el historial completo de cambios.' : 'Detect orphaned records and review complete change history.'}
        />

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList>
            <TabsTrigger value="health" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              {l ? 'Salud' : 'Health'}
              {health && health.totalIssues > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{health.totalIssues}</Badge>
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
            ) : !health || health.totalIssues === 0 ? (
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
                {Object.entries(health.grouped).map(([issueType, issues]) => {
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
