import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bug, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { adminTranslations } from '../adminTranslations';

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: string | null;
  status: string;
  page_path: string | null;
  admin_notes: string | null;
  user_name: string;
  created_at: string;
}

interface BugStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  bySeverity: { low: number; medium: number; high: number; critical: number };
}

interface Props {
  bugReports: BugReport[] | undefined;
  bugStats: BugStats;
  updateBugReport: { mutateAsync: (args: { id: string; status: string; admin_notes?: string }) => Promise<unknown> };
  language: 'es' | 'en';
}

export const AdminBugsTab = ({ bugReports, bugStats, updateBugReport, language }: Props) => {
  const text = adminTranslations[language];
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const formatDate = (date: string) =>
    format(new Date(date), "d MMM yyyy, HH:mm", { locale: language === 'es' ? esLocale : undefined });

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
    const labels = {
      es: { new: 'Nuevo', reviewed: 'Revisado', in_progress: 'En Progreso', resolved: 'Resuelto', wont_fix: 'No se hará' },
      en: { new: 'New', reviewed: 'Reviewed', in_progress: 'In Progress', resolved: 'Resolved', wont_fix: "Won't Fix" },
    };
    const config: Record<string, { className: string; emoji: string }> = {
      new: { className: 'bg-blue-100 text-blue-700 border-blue-200', emoji: '🆕' },
      reviewed: { className: 'bg-purple-100 text-purple-700 border-purple-200', emoji: '👀' },
      in_progress: { className: 'bg-amber-100 text-amber-700 border-amber-200', emoji: '⚙️' },
      resolved: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', emoji: '✅' },
      wont_fix: { className: 'bg-slate-100 text-slate-700 border-slate-200', emoji: '⏭️' },
    };
    const { className, emoji } = config[status] || { className: '', emoji: '' };
    const label = labels[language][status as keyof typeof labels.es] || status;
    return <Badge className={`${className} border font-medium`}>{emoji} {label}</Badge>;
  };

  const handleUpdateBugStatus = async (id: string, status: string) => {
    await updateBugReport.mutateAsync({ id, status, admin_notes: adminNotes[id] || undefined });
  };

  return (
    <>
      <div className="grid gap-4 grid-cols-4 mb-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-3xl font-black text-blue-600">{bugStats.new}</div>
            <div>
              <p className="text-sm font-medium">{text.newBugsLabel}</p>
              <p className="text-xs text-muted-foreground">{text.pendingReview}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-3xl font-black text-amber-600">{bugStats.inProgress}</div>
            <div>
              <p className="text-sm font-medium">{text.inProgress}</p>
              <p className="text-xs text-muted-foreground">{text.workingOn}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-3xl font-black text-emerald-600">{bugStats.resolved}</div>
            <div>
              <p className="text-sm font-medium">{text.resolvedLabel}</p>
              <p className="text-xs text-muted-foreground">{text.problemsFixed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-semibold">{text.bySeverity}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span>🟢 {bugStats.bySeverity.low} {text.low}</span>
              <span>🟡 {bugStats.bySeverity.medium} {text.medium}</span>
              <span>🟠 {bugStats.bySeverity.high} {text.high}</span>
              <span>🔴 {bugStats.bySeverity.critical} {text.critical}</span>
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
              <CardTitle>{text.bugReports}</CardTitle>
              <CardDescription>{text.bugReportsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <AnimatePresence>
              {bugReports?.map((bug, index) => (
                <motion.div key={bug.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Collapsible open={expandedBugId === bug.id} onOpenChange={(open) => setExpandedBugId(open ? bug.id : null)}>
                    <div className={`p-4 border-2 rounded-xl transition-all ${
                      bug.status === 'resolved' ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : bug.severity === 'critical' ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20'
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
                            {expandedBugId === bug.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">{text.fullDescription}</p>
                          <p className="text-sm whitespace-pre-wrap">{bug.description}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{text.changeStatus}</label>
                            <Select value={bug.status} onValueChange={(status) => handleUpdateBugStatus(bug.id, status)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">{text.statusNew}</SelectItem>
                                <SelectItem value="reviewed">{text.statusReviewed}</SelectItem>
                                <SelectItem value="in_progress">{text.statusInProgress}</SelectItem>
                                <SelectItem value="resolved">{text.statusResolved}</SelectItem>
                                <SelectItem value="wont_fix">{text.statusWontFix}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{text.adminNotes}</label>
                            <Textarea
                              value={adminNotes[bug.id] || bug.admin_notes || ''}
                              onChange={(e) => setAdminNotes(prev => ({ ...prev, [bug.id]: e.target.value }))}
                              placeholder={text.adminNotesPlaceholder}
                              rows={2}
                            />
                          </div>
                        </div>
                        {bug.admin_notes && (
                          <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50">
                            <p className="text-xs font-medium text-violet-600 mb-1">{text.savedNotes}</p>
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
                <p className="text-muted-foreground">{text.noBugs}</p>
                <p className="text-sm text-muted-foreground/70">{text.noBugsHint}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
