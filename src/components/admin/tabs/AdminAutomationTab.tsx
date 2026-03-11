import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Zap, Flame, ThermometerSun, Snowflake, MessageCircle,
  Mail, Clock, ArrowRight, Settings, AlertTriangle,
  CheckCircle2, Bot, Workflow, Bell, TrendingDown, Users,
  Plus, Trash2, Pencil, Activity, Tag, GitBranch, CalendarPlus,
} from 'lucide-react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { Json } from '@/integrations/supabase/types';

interface Props {
  language: 'es' | 'en';
}

interface RuleFormData {
  name: string;
  trigger_type: string;
  action_type: string;
  delay_minutes: number;
  description: string;
  action_config: Record<string, any>;
}

const TRIGGER_OPTIONS = [
  { value: 'new_lead', label: '🆕 Nuevo Lead', icon: <Zap className="h-4 w-4 text-emerald-500" /> },
  { value: 'hot', label: '🔥 HOT', icon: <Flame className="h-4 w-4 text-red-500" /> },
  { value: 'warm', label: '🌡️ WARM', icon: <ThermometerSun className="h-4 w-4 text-orange-500" /> },
  { value: 'cool', label: '❄️ COOL', icon: <Snowflake className="h-4 w-4 text-blue-500" /> },
  { value: 'cold', label: '🧊 COLD', icon: <Snowflake className="h-4 w-4 text-gray-400" /> },
];

const ACTION_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp IA', icon: <MessageCircle className="h-4 w-4 text-green-600" /> },
  { value: 'email', label: 'Email IA', icon: <Mail className="h-4 w-4 text-blue-600" /> },
  { value: 'auto_contact', label: 'Auto-contactar', icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
  { value: 'auto_tag', label: 'Auto-etiquetar', icon: <Tag className="h-4 w-4 text-purple-600" /> },
  { value: 'auto_stage', label: 'Auto-pipeline', icon: <GitBranch className="h-4 w-4 text-indigo-600" /> },
  { value: 'auto_followup', label: 'Auto follow-up', icon: <CalendarPlus className="h-4 w-4 text-amber-600" /> },
];

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  hot: <Flame className="h-4 w-4 text-red-500" />,
  warm: <ThermometerSun className="h-4 w-4 text-orange-500" />,
  cool: <Snowflake className="h-4 w-4 text-blue-500" />,
  cold: <Snowflake className="h-4 w-4 text-gray-400" />,
  new_lead: <Zap className="h-4 w-4 text-emerald-500" />,
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4 text-green-600" />,
  email: <Mail className="h-4 w-4 text-blue-600" />,
  auto_contact: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  auto_tag: <Tag className="h-4 w-4 text-purple-600" />,
  auto_stage: <GitBranch className="h-4 w-4 text-indigo-600" />,
  auto_followup: <CalendarPlus className="h-4 w-4 text-amber-600" />,
};

const DEFAULT_SEED_RULES = [
  { name: '🔥 HOT Lead → WhatsApp IA', trigger_type: 'hot', action_type: 'whatsapp', delay_minutes: 0, description: 'Lead HOT (80-100pts): genera WhatsApp personalizado con IA inmediatamente', action_config: { message_type: 'whatsapp', template_type: 'first_contact', language: 'es' } },
  { name: '🌡️ WARM Lead → Email IA', trigger_type: 'warm', action_type: 'email', delay_minutes: 30, description: 'Lead WARM (50-79pts): genera email personalizado a los 30 min', action_config: { message_type: 'email', template_type: 'first_contact', language: 'es' } },
  { name: '🆕 Nuevo → Auto-pipeline', trigger_type: 'new_lead', action_type: 'auto_stage', delay_minutes: 0, description: 'Todo lead nuevo se mueve a la etapa "new" del pipeline', action_config: { stage: 'new' } },
  { name: '🔥 HOT → Auto follow-up 3d', trigger_type: 'hot', action_type: 'auto_followup', delay_minutes: 0, description: 'Lead HOT: crea follow-up automático para 3 días', action_config: { followup_delay_hours: 72, followup_type: 'call' } },
];

export const AdminAutomationTab = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '', trigger_type: 'new_lead', action_type: 'whatsapp', delay_minutes: 0, description: '', action_config: {},
  });

  // ===== QUERIES =====
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Seed defaults if empty
      if (data && data.length === 0) {
        const { error: seedErr } = await supabase.from('automation_rules').insert(
          DEFAULT_SEED_RULES.map(r => ({
            ...r,
            is_enabled: true,
            action_config: r.action_config as Json,
          }))
        );
        if (seedErr) console.error('Seed error:', seedErr);
        const { data: seeded } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: true });
        return seeded || [];
      }
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['automation-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ===== MUTATIONS =====
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success(isEs ? 'Regla actualizada' : 'Rule updated');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: RuleFormData & { id?: string }) => {
      const payload = {
        name: data.name,
        trigger_type: data.trigger_type,
        action_type: data.action_type,
        delay_minutes: data.delay_minutes,
        description: data.description,
        action_config: data.action_config as Json,
      };
      if (data.id) {
        const { error } = await supabase.from('automation_rules').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('automation_rules').insert({ ...payload, is_enabled: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setDialogOpen(false);
      setEditingRule(null);
      toast.success(isEs ? 'Regla guardada' : 'Rule saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automation_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success(isEs ? 'Regla eliminada' : 'Rule deleted');
    },
  });

  // ===== ALERTS & SCORING (preserved) =====
  const dynamicAlerts = useMemo(() => {
    const alerts: { type: 'urgent' | 'warning' | 'info'; message: string; count: number }[] = [];
    const hotUncontacted: string[] = [];
    const warmStale: string[] = [];
    const decayingLeads: string[] = [];
    const reactivationCandidates: string[] = [];

    leads.forEach((lead: any) => {
      const baseScore = calculateLeadScore(lead);
      const priority = getLeadPriority(baseScore);
      const daysSinceCreated = differenceInDays(new Date(), new Date(lead.created_at));
      const daysSinceContact = lead.contacted_at ? differenceInDays(new Date(), new Date(lead.contacted_at)) : null;
      const decayDays = daysSinceContact !== null ? Math.max(0, daysSinceContact - 3) : Math.max(0, daysSinceCreated - 3);
      const decayedScore = Math.max(0, baseScore - (decayDays * 2));

      if (priority === 'hot' && !lead.contacted_at) hotUncontacted.push(lead.id);
      if (priority === 'warm' && daysSinceContact !== null && daysSinceContact > 5 && !lead.converted_to_user) warmStale.push(lead.id);
      if (decayedScore < baseScore - 10 && !lead.converted_to_user) decayingLeads.push(lead.id);
      if (daysSinceContact !== null && daysSinceContact > 14 && !lead.converted_to_user) reactivationCandidates.push(lead.id);
    });

    if (hotUncontacted.length > 0) alerts.push({ type: 'urgent', message: isEs ? `${hotUncontacted.length} leads HOT sin contactar — ¡contactar HOY!` : `${hotUncontacted.length} HOT leads uncontacted`, count: hotUncontacted.length });
    if (warmStale.length > 0) alerts.push({ type: 'warning', message: isEs ? `${warmStale.length} leads WARM necesitan follow-up (>5d)` : `${warmStale.length} WARM leads need follow-up`, count: warmStale.length });
    if (decayingLeads.length > 0) alerts.push({ type: 'warning', message: isEs ? `${decayingLeads.length} leads perdiendo puntos por inactividad` : `${decayingLeads.length} leads losing points`, count: decayingLeads.length });
    if (reactivationCandidates.length > 0) alerts.push({ type: 'info', message: isEs ? `${reactivationCandidates.length} candidatos a reactivación (>14d)` : `${reactivationCandidates.length} reactivation candidates`, count: reactivationCandidates.length });
    return alerts;
  }, [leads, isEs]);

  const scoringHealth = useMemo(() => {
    if (!leads.length) return null;
    const scores = leads.map((l: any) => calculateLeadScore(l));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const priorities = { hot: 0, warm: 0, cool: 0, cold: 0 };
    scores.forEach((s) => { priorities[getLeadPriority(s)]++; });
    const contactedRate = leads.filter((l: any) => l.contacted_at).length / leads.length * 100;
    const convertedRate = leads.filter((l: any) => l.converted_to_user).length / leads.length * 100;
    return { avgScore, priorities, contactedRate, convertedRate, total: leads.length };
  }, [leads]);

  const activeRulesCount = rules.filter((r: any) => r.is_enabled).length;

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData({ name: '', trigger_type: 'new_lead', action_type: 'whatsapp', delay_minutes: 0, description: '', action_config: {} });
    setDialogOpen(true);
  };

  const openEditDialog = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      action_type: rule.action_type,
      delay_minutes: rule.delay_minutes || 0,
      description: rule.description || '',
      action_config: (rule.action_config as Record<string, any>) || {},
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error(isEs ? 'Nombre requerido' : 'Name required'); return; }
    // Auto-fill action_config based on action_type
    let config = { ...formData.action_config };
    if (formData.action_type === 'whatsapp') config = { ...config, message_type: 'whatsapp', template_type: config.template_type || 'first_contact', language: config.language || 'es' };
    if (formData.action_type === 'email') config = { ...config, message_type: 'email', template_type: config.template_type || 'first_contact', language: config.language || 'es' };

    saveMutation.mutate({ ...formData, action_config: config, id: editingRule?.id });
  };

  // Action config fields based on selected action_type
  const renderActionConfig = () => {
    const { action_type } = formData;
    if (action_type === 'whatsapp' || action_type === 'email') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{isEs ? 'Tipo plantilla' : 'Template type'}</Label>
            <Select value={formData.action_config.template_type || 'first_contact'} onValueChange={(v) => setFormData(p => ({ ...p, action_config: { ...p.action_config, template_type: v } }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="first_contact">{isEs ? 'Primer contacto' : 'First contact'}</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="reactivation">{isEs ? 'Reactivación' : 'Reactivation'}</SelectItem>
                <SelectItem value="offer">{isEs ? 'Oferta' : 'Offer'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{isEs ? 'Idioma' : 'Language'}</Label>
            <Select value={formData.action_config.language || 'es'} onValueChange={(v) => setFormData(p => ({ ...p, action_config: { ...p.action_config, language: v } }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    if (action_type === 'auto_tag') {
      return (
        <div>
          <Label className="text-xs">{isEs ? 'Tags (separados por coma)' : 'Tags (comma separated)'}</Label>
          <Input value={(formData.action_config.tags || []).join(', ')} onChange={(e) => setFormData(p => ({ ...p, action_config: { ...p.action_config, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } }))} placeholder="VIP, Demo, Priority" />
        </div>
      );
    }
    if (action_type === 'auto_stage') {
      return (
        <div>
          <Label className="text-xs">{isEs ? 'Etapa pipeline' : 'Pipeline stage'}</Label>
          <Select value={formData.action_config.stage || 'new'} onValueChange={(v) => setFormData(p => ({ ...p, action_config: { ...p.action_config, stage: v } }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    if (action_type === 'auto_followup') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{isEs ? 'Horas para follow-up' : 'Hours to follow-up'}</Label>
            <Input type="number" value={formData.action_config.followup_delay_hours || 72} onChange={(e) => setFormData(p => ({ ...p, action_config: { ...p.action_config, followup_delay_hours: parseInt(e.target.value) || 72 } }))} />
          </div>
          <div>
            <Label className="text-xs">{isEs ? 'Tipo' : 'Type'}</Label>
            <Select value={formData.action_config.followup_type || 'call'} onValueChange={(v) => setFormData(p => ({ ...p, action_config: { ...p.action_config, followup_type: v } }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">{isEs ? 'Llamada' : 'Call'}</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Smart Alerts */}
      {dynamicAlerts.length > 0 && (
        <Card className="border-2 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              {isEs ? '🚨 Alertas inteligentes' : '🚨 Smart Alerts'}
              <Badge variant="destructive" className="text-[10px]">{dynamicAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {dynamicAlerts.map((alert, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-lg border flex items-start gap-3 ${alert.type === 'urgent' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : alert.type === 'warning' ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'}`}>
                {alert.type === 'urgent' ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" /> : alert.type === 'warning' ? <TrendingDown className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /> : <Bell className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                <p className="text-xs font-medium flex-1">{alert.message}</p>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{alert.count}</Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scoring Health */}
      {scoringHealth && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="text-center"><CardContent className="p-3"><p className="text-2xl font-black">{scoringHealth.avgScore.toFixed(0)}</p><p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Score promedio' : 'Avg Score'}</p></CardContent></Card>
          <Card className="text-center"><CardContent className="p-3"><p className="text-2xl font-black text-primary">{activeRulesCount}</p><p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Reglas activas' : 'Active Rules'}</p></CardContent></Card>
          <Card className="text-center border-red-200 bg-red-50/50 dark:bg-red-950/20"><CardContent className="p-3"><p className="text-2xl font-black text-red-600">🔥 {scoringHealth.priorities.hot}</p><p className="text-[10px] font-bold text-red-600">HOT</p></CardContent></Card>
          <Card className="text-center"><CardContent className="p-3"><p className="text-2xl font-black">{scoringHealth.contactedRate.toFixed(0)}%</p><p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Contactados' : 'Contacted'}</p></CardContent></Card>
          <Card className="text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"><CardContent className="p-3"><p className="text-2xl font-black text-emerald-600">{scoringHealth.convertedRate.toFixed(0)}%</p><p className="text-[10px] font-bold text-emerald-600">{isEs ? 'Convertidos' : 'Converted'}</p></CardContent></Card>
        </div>
      )}

      {/* Lead Scoring Decay Info */}
      <Card className="border-dashed border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">{isEs ? '📉 Lead Scoring Dinámico' : '📉 Dynamic Lead Scoring'}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isEs ? 'Los leads pierden -2 puntos por día sin interacción después de 3 días. Esto prioriza leads frescos automáticamente.' : 'Leads lose -2 points per day without interaction after 3 days.'}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">{isEs ? '3 días gracia' : '3 days grace'}</Badge>
                <Badge variant="outline" className="text-[10px]">-2pts/{isEs ? 'día' : 'day'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules — Real CRUD */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                {isEs ? '⚡ Reglas de automatización' : '⚡ Automation Rules'}
              </CardTitle>
              <CardDescription>{isEs ? 'Conectadas a la base de datos — se ejecutan con cada lead nuevo' : 'Connected to database — executed on every new lead'}</CardDescription>
            </div>
            <Button size="sm" onClick={openCreateDialog} className="gap-1">
              <Plus className="h-4 w-4" />
              {isEs ? 'Nueva regla' : 'New Rule'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rulesLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">{isEs ? 'Cargando...' : 'Loading...'}</p>
          ) : rules.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{isEs ? 'No hay reglas. Crea la primera.' : 'No rules. Create the first one.'}</p>
          ) : (
            rules.map((rule: any, i: number) => (
              <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-xl border transition-all ${rule.is_enabled ? 'bg-card shadow-sm' : 'bg-muted/30 opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-0.5">
                      {TRIGGER_ICONS[rule.trigger_type] || <Zap className="h-4 w-4" />}
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      {ACTION_ICONS[rule.action_type] || <Bot className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{rule.name}</p>
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {rule.delay_minutes === 0 ? (isEs ? 'Inmediato' : 'Instant') : `${rule.delay_minutes}m`}
                        </Badge>
                        {rule.execution_count > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Activity className="h-2.5 w-2.5 mr-0.5" />
                            {rule.execution_count}x
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(rule)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(isEs ? '¿Eliminar regla?' : 'Delete rule?')) deleteMutation.mutate(rule.id); }}><Trash2 className="h-3 w-3" /></Button>
                    <Switch checked={rule.is_enabled} onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, enabled: checked })} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            {isEs ? '📊 Ejecuciones recientes' : '📊 Recent Executions'}
            {logs.length > 0 && <Badge variant="outline" className="text-[10px]">{logs.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {isEs ? 'Sin ejecuciones aún. Las reglas se ejecutarán con el próximo lead.' : 'No executions yet. Rules will fire with the next lead.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {logs.map((log: any) => (
                <div key={log.id} className={`p-3 rounded-lg border text-xs flex items-center gap-3 ${log.status === 'success' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10' : log.status === 'failed' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/10' : 'bg-muted/30'}`}>
                  {log.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{log.action_type}</span>
                    <span className="text-muted-foreground"> · {log.lead_id?.slice(0, 8)}...</span>
                  </div>
                  <span className="text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: isEs ? es : undefined })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? (isEs ? 'Editar regla' : 'Edit Rule') : (isEs ? 'Nueva regla' : 'New Rule')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isEs ? 'Nombre' : 'Name'}</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="🔥 HOT Lead → WhatsApp IA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isEs ? 'Trigger' : 'Trigger'}</Label>
                <Select value={formData.trigger_type} onValueChange={(v) => setFormData(p => ({ ...p, trigger_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isEs ? 'Acción' : 'Action'}</Label>
                <Select value={formData.action_type} onValueChange={(v) => setFormData(p => ({ ...p, action_type: v, action_config: {} }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{isEs ? 'Delay (minutos)' : 'Delay (minutes)'}</Label>
              <Input type="number" value={formData.delay_minutes} onChange={(e) => setFormData(p => ({ ...p, delay_minutes: parseInt(e.target.value) || 0 }))} />
            </div>
            {renderActionConfig()}
            <div>
              <Label>{isEs ? 'Descripción' : 'Description'}</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? '...' : (isEs ? 'Guardar' : 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
