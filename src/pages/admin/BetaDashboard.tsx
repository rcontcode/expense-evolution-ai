import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import {
  Users,
  Star,
  Bug,
  TrendingUp,
  MessageSquare,
  Activity,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useBetaFeedback } from '@/hooks/data/useBetaFeedback';
import { useBetaCodes } from '@/hooks/data/useBetaCodes';
import { Layout } from '@/components/Layout';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'
        }`}
      />
    ))}
  </div>
);

const BetaDashboard = () => {
  const { 
    allFeedback, 
    bugReports, 
    featureUsage, 
    userStats,
    feedbackStats,
    bugStats,
    updateBugReport,
    isLoading 
  } = useBetaFeedback();
  
  const { codes, codeUses, stats: codeStats } = useBetaCodes();
  
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const formatDate = (date: string) => 
    format(new Date(date), "d MMM yyyy, HH:mm", { locale: esLocale });

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[severity] || ''}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      reviewed: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-emerald-100 text-emerald-700',
      wont_fix: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      new: 'Nuevo',
      reviewed: 'Revisado',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      wont_fix: 'No se hará',
    };
    return <Badge className={colors[status] || ''}>{labels[status] || status}</Badge>;
  };

  const handleUpdateBugStatus = async (id: string, status: string) => {
    await updateBugReport.mutateAsync({ 
      id, 
      status,
      admin_notes: adminNotes[id] || undefined,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Beta Testing</h1>
            <p className="text-muted-foreground">
              Analiza el feedback y uso de tus beta testers
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Beta Testers"
            value={userStats?.length || 0}
            icon={Users}
            trend={`${codeStats.activeCodes} códigos activos`}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <StatCard
            title="Rating Promedio"
            value={`${feedbackStats.avgRating} ⭐`}
            icon={Star}
            trend={`${feedbackStats.totalFeedback} evaluaciones`}
            color="bg-gradient-to-br from-amber-500 to-orange-500"
          />
          <StatCard
            title="Bugs Reportados"
            value={bugStats.total}
            icon={Bug}
            trend={`${bugStats.new} nuevos, ${bugStats.resolved} resueltos`}
            color="bg-gradient-to-br from-rose-500 to-red-500"
          />
          <StatCard
            title="Features Usados"
            value={featureUsage?.length || 0}
            icon={Activity}
            trend="Features diferentes"
            color="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Testers
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="bugs" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Bugs
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Uso
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Beta Testers Activos</CardTitle>
                <CardDescription>
                  Estadísticas de uso por usuario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                      <TableHead className="text-center">Features</TableHead>
                      <TableHead className="text-center">Páginas</TableHead>
                      <TableHead className="text-center">Días Activo</TableHead>
                      <TableHead className="text-center">Rating Prom.</TableHead>
                      <TableHead>Última Actividad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats?.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.user_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.user_email}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{user.total_actions}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.unique_features}
                        </TableCell>
                        <TableCell className="text-center">
                          {user.unique_pages}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{user.days_active}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.avg_rating > 0 ? (
                            <span className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {user.avg_rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_activity 
                            ? formatDate(user.last_activity)
                            : 'Sin actividad'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!userStats || userStats.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aún no hay testers registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Facilidad de Uso</p>
                      <p className="text-2xl font-bold">{feedbackStats.avgEaseOfUse} / 5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilidad</p>
                      <p className="text-2xl font-bold">{feedbackStats.avgUsefulness} / 5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recomendarían</p>
                      <p className="text-2xl font-bold">{feedbackStats.wouldRecommend}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Todos los Feedbacks</CardTitle>
                <CardDescription>
                  Evaluaciones detalladas por sección
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allFeedback?.map((feedback) => (
                    <div 
                      key={feedback.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{feedback.section}</Badge>
                            <StarDisplay rating={feedback.rating} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {feedback.user_name} ({feedback.user_email})
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(feedback.created_at)}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {feedback.ease_of_use && (
                          <div>
                            <span className="text-muted-foreground">Facilidad:</span>{' '}
                            <span className="font-medium">{feedback.ease_of_use}/5</span>
                          </div>
                        )}
                        {feedback.usefulness && (
                          <div>
                            <span className="text-muted-foreground">Utilidad:</span>{' '}
                            <span className="font-medium">{feedback.usefulness}/5</span>
                          </div>
                        )}
                        {feedback.design_rating && (
                          <div>
                            <span className="text-muted-foreground">Diseño:</span>{' '}
                            <span className="font-medium">{feedback.design_rating}/5</span>
                          </div>
                        )}
                      </div>

                      {feedback.comment && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium mb-1">Comentarios:</p>
                          <p className="text-sm">{feedback.comment}</p>
                        </div>
                      )}

                      {feedback.suggestions && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                          <p className="text-sm font-medium mb-1">Sugerencias:</p>
                          <p className="text-sm">{feedback.suggestions}</p>
                        </div>
                      )}

                      {feedback.would_recommend !== null && (
                        <Badge variant={feedback.would_recommend ? 'default' : 'destructive'}>
                          {feedback.would_recommend ? '👍 Recomendaría' : '👎 No recomendaría'}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {(!allFeedback || allFeedback.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aún no hay feedback
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bugs Tab */}
          <TabsContent value="bugs">
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                    {bugStats.new}
                  </Badge>
                  <span className="text-sm">Nuevos</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Badge className="bg-amber-100 text-amber-700 px-3 py-1">
                    {bugStats.inProgress}
                  </Badge>
                  <span className="text-sm">En Progreso</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">
                    {bugStats.resolved}
                  </Badge>
                  <span className="text-sm">Resueltos</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Por Severidad</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span>🟢 {bugStats.bySeverity.low || 0}</span>
                    <span>🟡 {bugStats.bySeverity.medium || 0}</span>
                    <span>🟠 {bugStats.bySeverity.high || 0}</span>
                    <span>🔴 {bugStats.bySeverity.critical || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reportes de Bugs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bugReports?.map((bug) => (
                    <Collapsible
                      key={bug.id}
                      open={expandedBugId === bug.id}
                      onOpenChange={(open) => setExpandedBugId(open ? bug.id : null)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {getSeverityBadge(bug.severity)}
                            {getStatusBadge(bug.status)}
                            <span className="font-medium">{bug.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {bug.user_name}
                            </span>
                            {expandedBugId === bug.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 border-t space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Descripción:</p>
                              <p className="text-sm text-muted-foreground">
                                {bug.description}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Tipo:</span>{' '}
                                <Badge variant="outline">{bug.report_type}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Página:</span>{' '}
                                {bug.page_path || 'No especificada'}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Reportado:</span>{' '}
                                {formatDate(bug.created_at)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email:</span>{' '}
                                {bug.user_email}
                              </div>
                            </div>

                            {/* Admin controls */}
                            <div className="pt-3 border-t space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Cambiar estado:</span>
                                <Select 
                                  value={bug.status}
                                  onValueChange={(status) => handleUpdateBugStatus(bug.id, status)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">Nuevo</SelectItem>
                                    <SelectItem value="reviewed">Revisado</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="resolved">Resuelto</SelectItem>
                                    <SelectItem value="wont_fix">No se hará</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium mb-1">Notas de admin:</p>
                                <Textarea
                                  value={adminNotes[bug.id] ?? bug.admin_notes ?? ''}
                                  onChange={(e) => setAdminNotes(prev => ({
                                    ...prev,
                                    [bug.id]: e.target.value,
                                  }))}
                                  placeholder="Agrega notas sobre este reporte..."
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                  {(!bugReports || bugReports.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay reportes de bugs
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Features Más Usados</CardTitle>
                <CardDescription>
                  Qué funcionalidades están probando más los testers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featureUsage?.map((feature, index) => {
                    const maxUses = featureUsage[0]?.total_uses || 1;
                    const percentage = (feature.total_uses / maxUses) * 100;
                    
                    return (
                      <div key={feature.feature_name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">{feature.feature_name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{feature.total_uses} usos</span>
                            <span>{feature.unique_users} usuarios</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                  {(!featureUsage || featureUsage.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aún no hay datos de uso
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BetaDashboard;
