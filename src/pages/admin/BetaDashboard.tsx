import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Crown,
  Sparkles,
  Rocket,
  Heart,
  Zap,
  Trophy,
  Target,
  Flame,
  Shield
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
import evofinzLogo from '@/assets/evofinz-logo.png';

const APP_SECTIONS = [
  { id: 'dashboard', emoji: '📊' }, { id: 'expenses', emoji: '💸' }, { id: 'income', emoji: '💰' },
  { id: 'quick_capture', emoji: '📷' }, { id: 'voice_assistant', emoji: '🎤' }, { id: 'clients', emoji: '👥' },
  { id: 'projects', emoji: '📁' }, { id: 'contracts', emoji: '📄' }, { id: 'mileage', emoji: '🚗' },
  { id: 'net_worth', emoji: '🏦' }, { id: 'mentorship', emoji: '📚' }, { id: 'tax_calendar', emoji: '📅' },
  { id: 'banking', emoji: '🏧' }, { id: 'settings', emoji: '⚙️' }, { id: 'general', emoji: '🌟' },
];

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  gradient,
  emoji
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: string;
  gradient: string;
  emoji?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-0">
        <div className={`p-6 bg-gradient-to-br ${gradient} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">{title}</p>
              <div className="flex items-center gap-2 mt-1">
                {emoji && <span className="text-3xl">{emoji}</span>}
                <p className="text-4xl font-black">{value}</p>
              </div>
              {trend && (
                <p className="text-xs text-white/70 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </p>
              )}
            </div>
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-8 w-8 text-white" />
            </div>
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
          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
        }`}
      />
    ))}
  </div>
);

const RatingBadge = ({ rating }: { rating: number }) => {
  const getColor = () => {
    if (rating >= 4.5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (rating >= 2.5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };
  
  const getEmoji = () => {
    if (rating >= 4.5) return '🔥';
    if (rating >= 3.5) return '✨';
    if (rating >= 2.5) return '👍';
    return '🤔';
  };

  return (
    <Badge className={`${getColor()} border font-bold px-2`}>
      {getEmoji()} {rating.toFixed(1)}
    </Badge>
  );
};

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
    const config: Record<string, { className: string; emoji: string }> = {
      low: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', emoji: '🟢' },
      medium: { className: 'bg-amber-100 text-amber-700 border-amber-200', emoji: '🟡' },
      high: { className: 'bg-orange-100 text-orange-700 border-orange-200', emoji: '🟠' },
      critical: { className: 'bg-red-100 text-red-700 border-red-200', emoji: '🔴' },
    };
    const { className, emoji } = config[severity] || { className: '', emoji: '' };
    return <Badge className={`${className} border font-medium`}>{emoji} {severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; emoji: string; label: string }> = {
      new: { className: 'bg-blue-100 text-blue-700 border-blue-200', emoji: '🆕', label: 'Nuevo' },
      reviewed: { className: 'bg-purple-100 text-purple-700 border-purple-200', emoji: '👀', label: 'Revisado' },
      in_progress: { className: 'bg-amber-100 text-amber-700 border-amber-200', emoji: '⚙️', label: 'En Progreso' },
      resolved: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', emoji: '✅', label: 'Resuelto' },
      wont_fix: { className: 'bg-slate-100 text-slate-700 border-slate-200', emoji: '⏭️', label: 'No se hará' },
    };
    const { className, emoji, label } = config[status] || { className: '', emoji: '', label: status };
    return <Badge className={`${className} border font-medium`}>{emoji} {label}</Badge>;
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
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="space-y-2">
                <div className="h-6 w-64 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-36 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.img 
              src={evofinzLogo} 
              alt="EvoFinz" 
              className="h-14 w-auto"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  🎯 Centro de Comando Beta
                </h1>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-bold">
                  <Crown className="h-3 w-3 mr-1" /> ADMIN
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                El poder de mejorar EvoFinz está en tus manos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              <Activity className="h-4 w-4 mr-1 text-emerald-500" />
              Sistema Activo
            </Badge>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="🧪 Beta Testers"
            value={userStats?.length || 0}
            icon={Users}
            trend={`${codeStats.activeCodes} códigos activos`}
            gradient="from-violet-500 via-purple-500 to-indigo-600"
            emoji="👥"
          />
          <StatCard
            title="⭐ Rating Promedio"
            value={feedbackStats.avgRating}
            icon={Star}
            trend={`${feedbackStats.totalFeedback} evaluaciones`}
            gradient="from-amber-500 via-orange-500 to-yellow-500"
          />
          <StatCard
            title="🐛 Bugs Reportados"
            value={bugStats.total}
            icon={Bug}
            trend={`${bugStats.new} nuevos, ${bugStats.resolved} resueltos`}
            gradient="from-rose-500 via-pink-500 to-red-500"
          />
          <StatCard
            title="🚀 Features Usados"
            value={featureUsage?.length || 0}
            icon={Activity}
            trend="Features explorados"
            gradient="from-emerald-500 via-teal-500 to-cyan-500"
          />
        </div>

        {/* Quick Health Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Heart className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recomendarían</p>
                <p className="text-2xl font-black text-emerald-600">{feedbackStats.wouldRecommend}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Facilidad de Uso</p>
                <p className="text-2xl font-black text-blue-600">{feedbackStats.avgEaseOfUse}/5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilidad</p>
                <p className="text-2xl font-black text-amber-600">{feedbackStats.avgUsefulness}/5</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Flame className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Diseño</p>
                <p className="text-2xl font-black text-purple-600">{feedbackStats.avgRating}/5</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/50 rounded-xl h-14">
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold"
              >
                <Users className="h-4 w-4" />
                👥 Testers
              </TabsTrigger>
              <TabsTrigger 
                value="feedback" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold"
              >
                <MessageSquare className="h-4 w-4" />
                ⭐ Feedback
              </TabsTrigger>
              <TabsTrigger 
                value="bugs" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg font-semibold"
              >
                <Bug className="h-4 w-4" />
                🐛 Bugs
              </TabsTrigger>
              <TabsTrigger 
                value="usage" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg font-semibold"
              >
                <BarChart3 className="h-4 w-4" />
                📊 Uso
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="border-2 border-violet-100 dark:border-violet-900/50 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                      <Trophy className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        🏆 Beta Testers VIP
                      </CardTitle>
                      <CardDescription>
                        Los pioneros que están construyendo EvoFinz contigo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-bold">👤 Usuario</TableHead>
                        <TableHead className="font-bold">📧 Email</TableHead>
                        <TableHead className="text-center font-bold">⚡ Acciones</TableHead>
                        <TableHead className="text-center font-bold">🎯 Features</TableHead>
                        <TableHead className="text-center font-bold">📄 Páginas</TableHead>
                        <TableHead className="text-center font-bold">📅 Días Activo</TableHead>
                        <TableHead className="text-center font-bold">⭐ Rating</TableHead>
                        <TableHead className="font-bold">🕐 Última Actividad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats?.map((user, index) => (
                        <motion.tr 
                          key={user.user_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
                        >
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <span className="text-lg">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              )}
                              {user.user_name || 'Sin nombre'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.user_email}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 border font-bold">
                              {user.total_actions}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {user.unique_features}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {user.unique_pages}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-medium">
                              {user.days_active} días
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {user.avg_rating > 0 ? (
                              <RatingBadge rating={user.avg_rating} />
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.last_activity 
                              ? formatDate(user.last_activity)
                              : 'Sin actividad'}
                          </TableCell>
                        </motion.tr>
                      ))}
                      {(!userStats || userStats.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="h-12 w-12 text-muted-foreground/30" />
                              <p className="text-muted-foreground">Aún no hay testers registrados</p>
                              <p className="text-sm text-muted-foreground/70">¡Comparte tus códigos beta para empezar!</p>
                            </div>
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
              <Card className="border-2 border-amber-100 dark:border-amber-900/50 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        ⭐ Todas las Evaluaciones
                      </CardTitle>
                      <CardDescription>
                        Cada opinión es oro para mejorar
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {allFeedback?.map((feedback, index) => (
                        <motion.div 
                          key={feedback.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-5 border-2 rounded-xl space-y-4 hover:border-amber-200 hover:shadow-md transition-all bg-gradient-to-r from-transparent to-amber-50/30 dark:to-amber-950/10"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 font-semibold">
                                  {APP_SECTIONS.find(s => s.id === feedback.section)?.emoji} {feedback.section}
                                </Badge>
                                <StarDisplay rating={feedback.rating} />
                                <RatingBadge rating={feedback.rating} />
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-medium text-foreground">{feedback.user_name || 'Anónimo'}</span>
                                <span>•</span>
                                <span>{feedback.user_email}</span>
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(feedback.created_at)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm p-3 bg-muted/30 rounded-lg">
                            {feedback.ease_of_use && (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎮</span>
                                <span className="text-muted-foreground">Facilidad:</span>
                                <span className="font-bold">{feedback.ease_of_use}/5</span>
                              </div>
                            )}
                            {feedback.usefulness && (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                <span className="text-muted-foreground">Utilidad:</span>
                                <span className="font-bold">{feedback.usefulness}/5</span>
                              </div>
                            )}
                            {feedback.design_rating && (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎨</span>
                                <span className="text-muted-foreground">Diseño:</span>
                                <span className="font-bold">{feedback.design_rating}/5</span>
                              </div>
                            )}
                          </div>

                          {feedback.comment && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                💬 Comentarios:
                              </p>
                              <p className="text-sm leading-relaxed">{feedback.comment}</p>
                            </div>
                          )}

                          {feedback.suggestions && (
                            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg border border-amber-100 dark:border-amber-900/50">
                              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                💡 Sugerencias:
                              </p>
                              <p className="text-sm leading-relaxed">{feedback.suggestions}</p>
                            </div>
                          )}

                          {feedback.would_recommend !== null && (
                            <Badge className={`${
                              feedback.would_recommend 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-100 text-rose-700 border-rose-200'
                            } border font-medium`}>
                              {feedback.would_recommend ? '👍 Recomendaría' : '👎 No recomendaría (aún)'}
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(!allFeedback || allFeedback.length === 0) && (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Aún no hay feedback</p>
                        <p className="text-sm text-muted-foreground/70">El feedback aparecerá aquí cuando los testers evalúen</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bugs Tab */}
            <TabsContent value="bugs">
              {/* Bug Stats Row */}
              <div className="grid gap-4 grid-cols-4 mb-6">
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl font-black text-blue-600">{bugStats.new}</div>
                    <div>
                      <p className="text-sm font-medium">🆕 Nuevos</p>
                      <p className="text-xs text-muted-foreground">Pendientes de revisar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl font-black text-amber-600">{bugStats.inProgress}</div>
                    <div>
                      <p className="text-sm font-medium">⚙️ En Progreso</p>
                      <p className="text-xs text-muted-foreground">Trabajando en ellos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl font-black text-emerald-600">{bugStats.resolved}</div>
                    <div>
                      <p className="text-sm font-medium">✅ Resueltos</p>
                      <p className="text-xs text-muted-foreground">Problemas arreglados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <span className="text-sm font-semibold">Por Severidad</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span>🟢 {bugStats.bySeverity.low} baja</span>
                      <span>🟡 {bugStats.bySeverity.medium} media</span>
                      <span>🟠 {bugStats.bySeverity.high} alta</span>
                      <span>🔴 {bugStats.bySeverity.critical} crítica</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-rose-100 dark:border-rose-900/50 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50">
                      <Bug className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        🐛 Reportes de Bugs
                      </CardTitle>
                      <CardDescription>
                        Gestiona y resuelve los problemas reportados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {bugReports?.map((bug, index) => (
                        <motion.div
                          key={bug.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Collapsible
                            open={expandedBugId === bug.id}
                            onOpenChange={(open) => setExpandedBugId(open ? bug.id : null)}
                          >
                            <div className={`p-4 border-2 rounded-xl transition-all ${
                              bug.status === 'resolved' 
                                ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10' 
                                : bug.severity === 'critical'
                                ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20'
                                : 'border-border hover:border-rose-200'
                            }`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <h3 className="font-bold text-lg">{bug.title}</h3>
                                    {getSeverityBadge(bug.severity || 'medium')}
                                    {getStatusBadge(bug.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    📝 {bug.user_name || 'Anónimo'} • {bug.page_path} • {formatDate(bug.created_at)}
                                  </p>
                                  <p className="text-sm line-clamp-2">{bug.description}</p>
                                </div>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="shrink-0">
                                    {expandedBugId === bug.id ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </div>

                              <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <p className="text-sm font-medium mb-2">📋 Descripción completa:</p>
                                  <p className="text-sm whitespace-pre-wrap">{bug.description}</p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">🔄 Cambiar Estado:</label>
                                    <Select
                                      value={bug.status}
                                      onValueChange={(status) => handleUpdateBugStatus(bug.id, status)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="new">🆕 Nuevo</SelectItem>
                                        <SelectItem value="reviewed">👀 Revisado</SelectItem>
                                        <SelectItem value="in_progress">⚙️ En Progreso</SelectItem>
                                        <SelectItem value="resolved">✅ Resuelto</SelectItem>
                                        <SelectItem value="wont_fix">⏭️ No se hará</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">📝 Notas Admin:</label>
                                    <Textarea
                                      value={adminNotes[bug.id] || bug.admin_notes || ''}
                                      onChange={(e) => setAdminNotes(prev => ({
                                        ...prev,
                                        [bug.id]: e.target.value
                                      }))}
                                      placeholder="Notas internas sobre este bug..."
                                      rows={2}
                                    />
                                  </div>
                                </div>

                                {bug.admin_notes && (
                                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50">
                                    <p className="text-xs font-medium text-violet-600 mb-1">💼 Notas guardadas:</p>
                                    <p className="text-sm">{bug.admin_notes}</p>
                                  </div>
                                )}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(!bugReports || bugReports.length === 0) && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">¡Sin bugs reportados! 🎉</p>
                        <p className="text-sm text-muted-foreground/70">Todo funciona de maravilla (por ahora)</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage">
              <Card className="border-2 border-emerald-100 dark:border-emerald-900/50 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        📊 Uso de Features
                      </CardTitle>
                      <CardDescription>
                        Qué están explorando más tus testers
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {featureUsage && featureUsage.length > 0 ? (
                      <>
                        {/* Group and count features */}
                        {(() => {
                          const featureCounts = featureUsage.reduce((acc, log) => {
                            acc[log.feature_name] = (acc[log.feature_name] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          const maxCount = Math.max(...Object.values(featureCounts));
                          const sortedFeatures = Object.entries(featureCounts)
                            .sort(([, a], [, b]) => b - a);

                          return sortedFeatures.map(([feature, count], index) => (
                            <motion.div 
                              key={feature}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {index === 0 && <span className="text-lg">🥇</span>}
                                  {index === 1 && <span className="text-lg">🥈</span>}
                                  {index === 2 && <span className="text-lg">🥉</span>}
                                  <span className="font-medium">{feature}</span>
                                </div>
                                <Badge variant="secondary" className="font-bold">
                                  {count} usos
                                </Badge>
                              </div>
                              <Progress 
                                value={(count / maxCount) * 100} 
                                className="h-3"
                              />
                            </motion.div>
                          ));
                        })()}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Aún no hay datos de uso</p>
                        <p className="text-sm text-muted-foreground/70">Los datos aparecerán cuando los testers usen la app</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

export default BetaDashboard;
