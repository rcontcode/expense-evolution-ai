import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Flame, ThermometerSun, Snowflake, MessageCircle,
  Mail, Clock, ArrowRight, AlertTriangle,
  CheckCircle2, Bot, Bell, TrendingDown,
  Plus, Trash2, Pencil, Activity, Tag, GitBranch, CalendarPlus,
  Play, BarChart3, XCircle, SkipForward, Eye, RefreshCw,
  Filter, Users, Rocket, Save, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';
import { differenceInDays, formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
  trigger_condition: TriggerCondition[];
  schedule_active_hours_start: number;
  schedule_active_hours_end: number;
  schedule_active_days: number[];
}

interface TriggerCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

const TRIGGER_OPTIONS = [
  { value: 'new_lead', label: '🆕 Nuevo Lead' },
  { value: 'hot', label: '🔥 HOT' },
  { value: 'warm', label: '🌡️ WARM' },
  { value: 'cool', label: '❄️ COOL' },
  { value: 'cold', label: '🧊 COLD' },
];

const ACTION_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp IA', icon: <MessageCircle className="h-4 w-4 text-green-600" /> },
  { value: 'email', label: 'Email IA', icon: <Mail className="h-4 w-4 text-blue-600" /> },
  { value: 'email_sequence', label: 'Secuencia Email', icon: <RefreshCw className="h-4 w-4 text-cyan-600" /> },
  { value: 'auto_contact', label: 'Auto-contactar', icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
  { value: 'auto_tag', label: 'Auto-etiquetar', icon: <Tag className="h-4 w-4 text-purple-600" /> },
  { value: 'auto_stage', label: 'Auto-pipeline', icon: <GitBranch className="h-4 w-4 text-indigo-600" /> },
  { value: 'auto_followup', label: 'Auto follow-up', icon: <CalendarPlus className="h-4 w-4 text-amber-600" /> },
];

const CONDITION_FIELDS = [
  { value: 'source', label: 'Source (app)' },
  { value: 'score', label: 'Quiz Score' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'country', label: 'País' },
  { value: 'level', label: 'Nivel' },
  { value: 'email', label: 'Email' },
];

const CONDITION_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: 'contiene' },
  { value: 'exists', label: 'existe' },
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
  email_sequence: <RefreshCw className="h-4 w-4 text-cyan-600" />,
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

const BULK_FILTERS = [
  { value: 'hot_uncontacted', label: '🔥 HOT sin contactar' },
  { value: 'warm_stale', label: '🌡️ WARM >5 días sin contacto' },
  { value: 'all_uncontacted', label: '📭 Todos sin contactar' },
  { value: 'reactivation', label: '♻️ Reactivación (>14 días)' },
];

export const AdminAutomationTab = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTestLead, setSelectedTestLead] = useState<string>('');
  const [logDetailDialog, setLogDetailDialog] = useState<any | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFilter, setBulkFilter] = useState('hot_uncontacted');
  const [bulkProgress, setBulkProgress] = useState<{ total: number; done: number; running: boolean } | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '', trigger_type: 'new_lead', action_type: 'whatsapp', delay_minutes: 0, description: '', action_config: {}, trigger_condition: [],
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
      if (data && data.length === 0) {
        const { error: seedErr } = await supabase.from('automation_rules').insert(
          DEFAULT_SEED_RULES.map(r => ({ ...r, is_enabled: true, action_config: r.action_config as Json }))
        );
        if (seedErr) console.error('Seed error:', seedErr);
        const { data: seeded } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: true });
        return seeded || [];
      }
      return data;
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
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

  // Lead/Rule name lookup maps
  const leadNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    leads.forEach((l: any) => { map[l.id] = l.name || l.email || l.id.slice(0, 8); });
    return map;
  }, [leads]);

  const ruleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    rules.forEach((r: any) => { map[r.id] = r.name; });
    return map;
  }, [rules]);

  // ===== PER-RULE INSIGHTS =====
  const ruleInsights = useMemo(() => {
    const insights: Record<string, { total: number; success: number; failed: number; skipped: number; successRate: number; lastLead: string | null; lastDate: string | null; recentLogs: any[] }> = {};
    rules.forEach((r: any) => {
      const ruleLogs = logs.filter((l: any) => l.rule_id === r.id);
      const success = ruleLogs.filter((l: any) => l.status === 'success').length;
      const failed = ruleLogs.filter((l: any) => l.status === 'failed').length;
      const skipped = ruleLogs.filter((l: any) => l.status === 'skipped').length;
      const last = ruleLogs[0];
      insights[r.id] = {
        total: ruleLogs.length,
        success, failed, skipped,
        successRate: ruleLogs.length > 0 ? Math.round((success / ruleLogs.length) * 100) : 0,
        lastLead: last ? (leadNameMap[last.lead_id] || last.lead_id?.slice(0, 8)) : null,
        lastDate: last?.executed_at || null,
        recentLogs: ruleLogs.slice(0, 5),
      };
    });
    return insights;
  }, [rules, logs, leadNameMap]);

  // ===== MUTATIONS =====
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('automation_rules').update({ is_enabled: enabled }).eq('id', id);
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
        trigger_condition: (data.trigger_condition.length > 0 ? data.trigger_condition : null) as unknown as Json,
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

  const testMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const lead = leads.find((l: any) => l.id === leadId);
      if (!lead) throw new Error('Lead not found');
      const { data, error } = await supabase.functions.invoke('run-automations', { body: { lead } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automation-logs'] });
      queryClient.invalidateQueries({ queryKey: ['automation-leads'] });
      setTestDialogOpen(false);
      const skippedCount = data?.skipped?.length || 0;
      toast.success(
        isEs
          ? `✅ ${data?.executed || 0} ejecutadas, ${skippedCount} saltadas`
          : `✅ ${data?.executed || 0} executed, ${skippedCount} skipped`
      );
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ content, actionType, templateType, targetApp }: { content: string; actionType: string; templateType: string; targetApp: string }) => {
      const { error } = await supabase.from('lead_message_templates').insert({
        name: `[Manual] ${actionType} — ${templateType}`,
        content,
        message_type: actionType,
        template_type: templateType,
        target_app: targetApp || 'evofinz',
        language,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success(isEs ? '💾 Plantilla guardada' : '💾 Template saved'),
    onError: (e: any) => toast.error(e.message),
  });

  // ===== BULK EXECUTION =====
  const getFilteredLeads = (filter: string) => {
    return leads.filter((lead: any) => {
      const score = calculateLeadScore(lead);
      const priority = getLeadPriority(score);
      const daysSinceContact = lead.contacted_at ? differenceInDays(new Date(), new Date(lead.contacted_at)) : null;

      switch (filter) {
        case 'hot_uncontacted': return priority === 'hot' && !lead.contacted_at && !lead.converted_to_user;
        case 'warm_stale': return priority === 'warm' && (daysSinceContact === null || daysSinceContact > 5) && !lead.converted_to_user;
        case 'all_uncontacted': return !lead.contacted_at && !lead.converted_to_user;
        case 'reactivation': return daysSinceContact !== null && daysSinceContact > 14 && !lead.converted_to_user;
        default: return false;
      }
    });
  };

  const runBulkAutomation = async () => {
    const filtered = getFilteredLeads(bulkFilter);
    if (filtered.length === 0) { toast.error(isEs ? 'No hay leads que coincidan' : 'No matching leads'); return; }
    
    setBulkProgress({ total: filtered.length, done: 0, running: true });
    let successCount = 0;

    for (let i = 0; i < filtered.length; i++) {
      try {
        await supabase.functions.invoke('run-automations', { body: { lead: filtered[i] } });
        successCount++;
      } catch (e) {
        console.error(`Bulk error for lead ${filtered[i].id}:`, e);
      }
      setBulkProgress({ total: filtered.length, done: i + 1, running: i + 1 < filtered.length });
    }

    queryClient.invalidateQueries({ queryKey: ['automation-logs'] });
    queryClient.invalidateQueries({ queryKey: ['automation-leads'] });
    toast.success(isEs ? `🚀 Lote completado: ${successCount}/${filtered.length} leads procesados` : `🚀 Batch done: ${successCount}/${filtered.length} leads processed`);
    setBulkProgress(null);
  };

  // ===== COMPUTED =====
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

  const executionStats = useMemo(() => {
    if (!logs.length) return null;
    const total = logs.length;
    const success = logs.filter((l: any) => l.status === 'success').length;
    const failed = logs.filter((l: any) => l.status === 'failed').length;
    const skipped = logs.filter((l: any) => l.status === 'skipped').length;
    const byAction: Record<string, number> = {};
    logs.forEach((l: any) => { byAction[l.action_type] = (byAction[l.action_type] || 0) + 1; });
    const topAction = Object.entries(byAction).sort((a, b) => b[1] - a[1])[0];
    return { total, success, failed, skipped, successRate: ((success / total) * 100).toFixed(0), topAction };
  }, [logs]);

  const activeRulesCount = rules.filter((r: any) => r.is_enabled).length;

  // ===== DIALOG HANDLERS =====
  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData({ name: '', trigger_type: 'new_lead', action_type: 'whatsapp', delay_minutes: 0, description: '', action_config: {}, trigger_condition: [] });
    setDialogOpen(true);
  };

  const openEditDialog = (rule: any) => {
    setEditingRule(rule);
    const rawCond = rule.trigger_condition;
    const parsedCond: TriggerCondition[] = rawCond
      ? (Array.isArray(rawCond) ? rawCond : [rawCond]).map((c: any) => ({ field: c.field || '', operator: c.operator || 'eq', value: c.value ?? '' }))
      : [];
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      action_type: rule.action_type,
      delay_minutes: rule.delay_minutes || 0,
      description: rule.description || '',
      action_config: (rule.action_config as Record<string, any>) || {},
      trigger_condition: parsedCond,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error(isEs ? 'Nombre requerido' : 'Name required'); return; }
    let config = { ...formData.action_config };
    if (formData.action_type === 'whatsapp') config = { ...config, message_type: 'whatsapp', template_type: config.template_type || 'first_contact', language: config.language || 'es' };
    if (formData.action_type === 'email') config = { ...config, message_type: 'email', template_type: config.template_type || 'first_contact', language: config.language || 'es' };
    saveMutation.mutate({ ...formData, action_config: config, id: editingRule?.id });
  };

  const addCondition = () => {
    setFormData(p => ({ ...p, trigger_condition: [...p.trigger_condition, { field: 'source', operator: 'eq', value: '' }] }));
  };

  const removeCondition = (idx: number) => {
    setFormData(p => ({ ...p, trigger_condition: p.trigger_condition.filter((_, i) => i !== idx) }));
  };

  const updateCondition = (idx: number, updates: Partial<TriggerCondition>) => {
    setFormData(p => ({
      ...p,
      trigger_condition: p.trigger_condition.map((c, i) => i === idx ? { ...c, ...updates } : c),
    }));
  };

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
                <SelectItem value="invitation">{isEs ? 'Invitación' : 'Invitation'}</SelectItem>
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
          <div className="col-span-2">
            <Label className="text-xs">{isEs ? 'App destino' : 'Target app'}</Label>
            <Select value={formData.action_config.target_app || 'evofinz'} onValueChange={(v) => setFormData(p => ({ ...p, action_config: { ...p.action_config, target_app: v } }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="evofinz">EvoFinz 🔥</SelectItem>
                <SelectItem value="fokuspark">Fokuspark 🧠</SelectItem>
                <SelectItem value="universmind">UniversMind 🌌</SelectItem>
                <SelectItem value="bundle">Bundle (EvoFinz + FokusPark)</SelectItem>
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
    if (action_type === 'email_sequence') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{isEs ? 'Pasos en la secuencia' : 'Sequence steps'}</Label>
              <Input type="number" min={2} max={5} value={formData.action_config.sequence_steps || 3} onChange={(e) => setFormData(p => ({ ...p, action_config: { ...p.action_config, sequence_steps: parseInt(e.target.value) || 3 } }))} />
            </div>
            <div>
              <Label className="text-xs">{isEs ? 'Días entre emails' : 'Days between emails'}</Label>
              <Input type="number" min={1} max={14} value={formData.action_config.days_between || 3} onChange={(e) => setFormData(p => ({ ...p, action_config: { ...p.action_config, days_between: parseInt(e.target.value) || 3 } }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">{isEs ? 'App destino' : 'Target app'}</Label>
            <Select value={formData.action_config.target_app || 'auto'} onValueChange={(v) => setFormData(p => ({ ...p, action_config: { ...p.action_config, target_app: v } }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{isEs ? '🤖 Auto (según fuente del lead)' : '🤖 Auto (by lead source)'}</SelectItem>
                <SelectItem value="evofinz">EvoFinz 🔥</SelectItem>
                <SelectItem value="fokuspark">Fokuspark 🧠</SelectItem>
                <SelectItem value="universmind">UniversMind 🌌</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isEs 
              ? '📧 Envía secuencia de follow-up automática. Cada email usa IA para generar contenido personalizado. Se detiene si el lead responde o se convierte.'
              : '📧 Sends automatic follow-up sequence. Each email uses AI for personalized content. Stops if lead responds or converts.'}
          </p>
        </div>
      );
    }
    return null;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />;
    if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
    return <SkipForward className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />;
  };

  const getStatusBg = (status: string) => {
    if (status === 'success') return 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-800';
    if (status === 'failed') return 'bg-red-50/50 border-red-200 dark:bg-red-950/10 dark:border-red-800';
    return 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-800';
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

      {/* Scoring Health + Execution Stats */}
      {scoringHealth && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="text-center"><CardContent className="p-3"><p className="text-2xl font-black">{scoringHealth.avgScore.toFixed(0)}</p><p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Score promedio' : 'Avg Score'}</p></CardContent></Card>
          <Card className="text-center"><CardContent className="p-3"><p className="text-2xl font-black text-primary">{activeRulesCount}</p><p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Reglas activas' : 'Active Rules'}</p></CardContent></Card>
          <Card className="text-center border-red-200 bg-red-50/50 dark:bg-red-950/20"><CardContent className="p-3"><p className="text-2xl font-black text-red-600">🔥 {scoringHealth.priorities.hot}</p><p className="text-[10px] font-bold text-red-600">HOT</p></CardContent></Card>
          <Card className="text-center"><CardContent className="p-3"><p className="text-2xl font-black">{scoringHealth.contactedRate.toFixed(0)}%</p><p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Contactados' : 'Contacted'}</p></CardContent></Card>
          <Card className="text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"><CardContent className="p-3"><p className="text-2xl font-black text-emerald-600">{scoringHealth.convertedRate.toFixed(0)}%</p><p className="text-[10px] font-bold text-emerald-600">{isEs ? 'Convertidos' : 'Converted'}</p></CardContent></Card>
        </div>
      )}

      {/* Execution Stats Bar */}
      {executionStats && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold">{isEs ? 'Ejecuciones' : 'Executions'}:</span>
              </div>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Activity className="h-3 w-3" /> {executionStats.total} total
              </Badge>
              <Badge className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {executionStats.success} ok ({executionStats.successRate}%)
              </Badge>
              {executionStats.failed > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <XCircle className="h-3 w-3" /> {executionStats.failed} {isEs ? 'fallidas' : 'failed'}
                </Badge>
              )}
              {executionStats.skipped > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Shield className="h-3 w-3" /> {executionStats.skipped} {isEs ? 'saltadas (dedup)' : 'skipped (dedup)'}
                </Badge>
              )}
              {executionStats.topAction && (
                <Badge variant="outline" className="text-[10px] gap-1 ml-auto">
                  {ACTION_ICONS[executionStats.topAction[0]]} {executionStats.topAction[0]} ({executionStats.topAction[1]})
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
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
                <Badge variant="outline" className="text-[10px] gap-1"><Shield className="h-2.5 w-2.5" />{isEs ? 'Dedup activo' : 'Dedup active'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                {isEs ? '⚡ Reglas de automatización' : '⚡ Automation Rules'}
              </CardTitle>
              <CardDescription>{isEs ? 'Con dedup guard, condiciones avanzadas y tracking' : 'With dedup guard, advanced conditions & tracking'}</CardDescription>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setBulkDialogOpen(true)} className="gap-1">
                      <Rocket className="h-4 w-4" />
                      {isEs ? 'Lote' : 'Bulk'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isEs ? 'Ejecutar reglas en lote sobre leads filtrados' : 'Run rules in batch on filtered leads'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setTestDialogOpen(true)} className="gap-1">
                      <Play className="h-4 w-4" />
                      {isEs ? 'Test' : 'Test'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isEs ? 'Ejecutar reglas manualmente en un lead' : 'Manually run rules on a lead'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button size="sm" onClick={openCreateDialog} className="gap-1">
                <Plus className="h-4 w-4" />
                {isEs ? 'Nueva regla' : 'New Rule'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rulesLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">{isEs ? 'Cargando...' : 'Loading...'}</p>
          ) : rules.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{isEs ? 'No hay reglas. Crea la primera.' : 'No rules. Create the first one.'}</p>
          ) : (
            <AnimatePresence>
              {rules.map((rule: any, i: number) => {
                const insight = ruleInsights[rule.id];
                const isExpanded = expandedRuleId === rule.id;
                const condCount = rule.trigger_condition ? (Array.isArray(rule.trigger_condition) ? rule.trigger_condition.length : 1) : 0;
                return (
                  <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                    className={`rounded-xl border transition-all ${rule.is_enabled ? 'bg-card shadow-sm' : 'bg-muted/30 opacity-60'}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center gap-2 mt-0.5">
                            {TRIGGER_ICONS[rule.trigger_type] || <Zap className="h-4 w-4" />}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {ACTION_ICONS[rule.action_type] || <Bot className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm truncate">{rule.name}</p>
                              <Badge variant="outline" className="text-[10px]">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                {rule.delay_minutes === 0 ? (isEs ? 'Inmediato' : 'Instant') : `${rule.delay_minutes}m`}
                              </Badge>
                              {condCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] gap-0.5">
                                  <Filter className="h-2.5 w-2.5" /> {condCount} {isEs ? 'cond' : 'cond'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{rule.description}</p>
                            {/* Mini Insights */}
                            {insight && insight.total > 0 && (
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Activity className="h-2.5 w-2.5" /> {insight.total}x
                                </span>
                                <span className={`text-[10px] font-semibold ${insight.successRate >= 80 ? 'text-emerald-600' : insight.successRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {insight.successRate}% {isEs ? 'éxito' : 'success'}
                                </span>
                                {insight.lastLead && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {isEs ? 'Último' : 'Last'}: {insight.lastLead}
                                  </span>
                                )}
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto"
                                  onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}>
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(rule)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(isEs ? '¿Eliminar regla?' : 'Delete rule?')) deleteMutation.mutate(rule.id); }}><Trash2 className="h-3 w-3" /></Button>
                          <Switch checked={rule.is_enabled} onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, enabled: checked })} />
                        </div>
                      </div>
                    </div>
                    {/* Expanded: Recent logs for this rule */}
                    <AnimatePresence>
                      {isExpanded && insight && insight.recentLogs.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t px-4 pb-3 pt-2 space-y-1.5 overflow-hidden">
                          <p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Últimas 5 ejecuciones:' : 'Last 5 executions:'}</p>
                          {insight.recentLogs.map((log: any) => (
                            <div key={log.id} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-muted/50 rounded p-1 -mx-1"
                              onClick={() => setLogDetailDialog(log)}>
                              {getStatusIcon(log.status)}
                              <span className="font-medium">{leadNameMap[log.lead_id] || log.lead_id?.slice(0, 8)}</span>
                              <span className="text-muted-foreground ml-auto">
                                {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: isEs ? es : undefined })}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              {isEs ? '📊 Ejecuciones recientes' : '📊 Recent Executions'}
              {logs.length > 0 && <Badge variant="outline" className="text-[10px]">{logs.length}</Badge>}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: ['automation-logs'] })}>
              <RefreshCw className={`h-3 w-3 ${logsLoading ? 'animate-spin' : ''}`} />
              {isEs ? 'Actualizar' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {isEs ? 'Sin ejecuciones aún. Las reglas se ejecutarán con el próximo lead.' : 'No executions yet. Rules will fire with the next lead.'}
            </p>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2 pr-3">
                {logs.map((log: any) => {
                  const resultData = log.result_data as Record<string, any> | null;
                  const hasMessage = resultData?.message;
                  const isDedup = resultData?.reason === 'already_executed';
                  return (
                    <motion.div key={log.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border text-xs flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow ${getStatusBg(log.status)}`}
                      onClick={() => setLogDetailDialog(log)}>
                      {getStatusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ACTION_ICONS[log.action_type]}
                          <span className="font-semibold">{log.action_type}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium truncate">{leadNameMap[log.lead_id] || log.lead_id?.slice(0, 8)}</span>
                        </div>
                        {log.rule_id && ruleNameMap[log.rule_id] && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {isEs ? 'Regla' : 'Rule'}: {ruleNameMap[log.rule_id]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasMessage && <Badge variant="outline" className="text-[9px]">IA ✨</Badge>}
                        {isDedup && <Badge variant="outline" className="text-[9px] gap-0.5"><Shield className="h-2 w-2" /> dedup</Badge>}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: isEs ? es : undefined })}
                        </span>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? (isEs ? 'Editar regla' : 'Edit Rule') : (isEs ? 'Nueva regla' : 'New Rule')}</DialogTitle>
            <DialogDescription>{isEs ? 'Configura trigger, condiciones avanzadas y acción' : 'Configure trigger, advanced conditions & action'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-4 pr-3">
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
                <Label>{isEs ? 'Delay (minutos, 0 = inmediato)' : 'Delay (minutes, 0 = instant)'}</Label>
                <Input type="number" value={formData.delay_minutes} onChange={(e) => setFormData(p => ({ ...p, delay_minutes: parseInt(e.target.value) || 0 }))} />
                {formData.delay_minutes > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">{isEs ? '⚠️ Reglas con delay se saltan hasta que se implemente cron' : '⚠️ Delayed rules are skipped until cron is implemented'}</p>
                )}
              </div>

              {/* ADVANCED CONDITIONS */}
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    {isEs ? 'Condiciones avanzadas' : 'Advanced Conditions'}
                  </Label>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={addCondition}>
                    <Plus className="h-3 w-3" /> {isEs ? 'Agregar' : 'Add'}
                  </Button>
                </div>
                {formData.trigger_condition.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'Sin condiciones — se ejecuta para todos los leads del trigger' : 'No conditions — runs for all leads matching the trigger'}</p>
                )}
                {formData.trigger_condition.map((cond, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={cond.field} onValueChange={(v) => updateCondition(idx, { field: v })}>
                      <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={cond.operator} onValueChange={(v) => updateCondition(idx, { operator: v })}>
                      <SelectTrigger className="h-8 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {cond.operator === 'exists' ? (
                      <Select value={String(cond.value)} onValueChange={(v) => updateCondition(idx, { value: v === 'true' })}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{isEs ? 'Sí' : 'Yes'}</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input className="h-8 text-xs flex-1" value={String(cond.value)} onChange={(e) => updateCondition(idx, { value: e.target.value })} placeholder={isEs ? 'Valor...' : 'Value...'} />
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => removeCondition(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {renderActionConfig()}
              <div>
                <Label>{isEs ? 'Descripción' : 'Description'}</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? '...' : (isEs ? 'Guardar' : 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEs ? '🧪 Test de automatización' : '🧪 Automation Test'}</DialogTitle>
            <DialogDescription>{isEs ? 'Ejecuta todas las reglas activas en un lead (con dedup guard)' : 'Run all active rules on a lead (with dedup guard)'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isEs ? 'Seleccionar lead' : 'Select lead'}</Label>
              <Select value={selectedTestLead} onValueChange={setSelectedTestLead}>
                <SelectTrigger><SelectValue placeholder={isEs ? 'Elige un lead...' : 'Pick a lead...'} /></SelectTrigger>
                <SelectContent>
                  {leads.slice(0, 30).map((lead: any) => {
                    const score = calculateLeadScore(lead);
                    const priority = getLeadPriority(score);
                    const emoji = priority === 'hot' ? '🔥' : priority === 'warm' ? '🌡️' : priority === 'cool' ? '❄️' : '🧊';
                    return (
                      <SelectItem key={lead.id} value={lead.id}>
                        {emoji} {lead.name || lead.email} — {score}pts
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedTestLead && (
              <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
                {(() => {
                  const lead = leads.find((l: any) => l.id === selectedTestLead) as any;
                  if (!lead) return null;
                  const score = calculateLeadScore(lead);
                  const priority = getLeadPriority(score);
                  const matchingRules = rules.filter((r: any) =>
                    r.is_enabled && (r.trigger_type === 'new_lead' || r.trigger_type === priority) && (r.delay_minutes || 0) === 0
                  );
                  return (
                    <>
                      <p><strong>{lead.name}</strong> — {lead.email}</p>
                      <p>Score: {score}pts | Priority: {priority.toUpperCase()}</p>
                      <p className="text-emerald-600 font-medium mt-1">
                        {isEs ? `${matchingRules.length} reglas coincidirán:` : `${matchingRules.length} rules will match:`}
                      </p>
                      {matchingRules.map((r: any) => (
                        <p key={r.id} className="ml-2">• {r.name}</p>
                      ))}
                      {matchingRules.length === 0 && (
                        <p className="text-amber-600">{isEs ? 'Ninguna regla activa coincide' : 'No active rules match'}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>{isEs ? 'Cancelar' : 'Cancel'}</Button>
            <Button onClick={() => selectedTestLead && testMutation.mutate(selectedTestLead)}
              disabled={!selectedTestLead || testMutation.isPending} className="gap-1">
              <Play className="h-4 w-4" />
              {testMutation.isPending ? (isEs ? 'Ejecutando...' : 'Running...') : (isEs ? 'Ejecutar' : 'Run')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Automation Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              {isEs ? '🚀 Automatización en lote' : '🚀 Bulk Automation'}
            </DialogTitle>
            <DialogDescription>{isEs ? 'Ejecuta las reglas activas sobre todos los leads de un filtro' : 'Run active rules on all leads matching a filter'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isEs ? 'Filtro de leads' : 'Lead filter'}</Label>
              <Select value={bulkFilter} onValueChange={setBulkFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BULK_FILTERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold">
                  {getFilteredLeads(bulkFilter).length} {isEs ? 'leads coinciden' : 'leads match'}
                </span>
              </div>
              <p className="text-muted-foreground">
                {isEs ? `Se ejecutarán ${activeRulesCount} reglas activas por cada lead (con dedup guard)` : `${activeRulesCount} active rules will run per lead (with dedup guard)`}
              </p>
            </div>
            {bulkProgress && (
              <div className="space-y-2">
                <Progress value={(bulkProgress.done / bulkProgress.total) * 100} className="h-2" />
                <p className="text-xs text-center font-medium">
                  {bulkProgress.done}/{bulkProgress.total} {isEs ? 'procesados' : 'processed'}
                  {bulkProgress.running && ' ⏳'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} disabled={bulkProgress?.running}>
              {isEs ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button onClick={runBulkAutomation} disabled={getFilteredLeads(bulkFilter).length === 0 || bulkProgress?.running} className="gap-1">
              <Rocket className="h-4 w-4" />
              {bulkProgress?.running ? (isEs ? 'Procesando...' : 'Processing...') : (isEs ? 'Ejecutar lote' : 'Run Batch')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={!!logDetailDialog} onOpenChange={(open) => !open && setLogDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {logDetailDialog && getStatusIcon(logDetailDialog.status)}
              {isEs ? 'Detalle de ejecución' : 'Execution Detail'}
            </DialogTitle>
          </DialogHeader>
          {logDetailDialog && (() => {
            const resultData = logDetailDialog.result_data as Record<string, any> | null;
            return (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{isEs ? 'Acción' : 'Action'}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {ACTION_ICONS[logDetailDialog.action_type]}
                      <span className="font-medium">{logDetailDialog.action_type}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(logDetailDialog.status)}
                      <Badge variant={logDetailDialog.status === 'success' ? 'default' : logDetailDialog.status === 'failed' ? 'destructive' : 'secondary'}>
                        {logDetailDialog.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Lead</Label>
                    <p className="font-medium mt-1">{leadNameMap[logDetailDialog.lead_id] || logDetailDialog.lead_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{isEs ? 'Fecha' : 'Date'}</Label>
                    <p className="font-medium mt-1">{format(new Date(logDetailDialog.executed_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                  </div>
                  {logDetailDialog.rule_id && ruleNameMap[logDetailDialog.rule_id] && (
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">{isEs ? 'Regla' : 'Rule'}</Label>
                      <p className="font-medium mt-1">{ruleNameMap[logDetailDialog.rule_id]}</p>
                    </div>
                  )}
                </div>

                {/* AI Generated Message */}
                {resultData?.message && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{isEs ? '✨ Mensaje generado por IA' : '✨ AI Generated Message'}</Label>
                    <div className="mt-1 p-3 rounded-lg border bg-muted/30 text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {resultData.message}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
                        navigator.clipboard.writeText(resultData.message);
                        toast.success(isEs ? 'Copiado al portapapeles' : 'Copied to clipboard');
                      }}>
                        {isEs ? '📋 Copiar' : '📋 Copy'}
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => {
                        saveTemplateMutation.mutate({
                          content: resultData.message,
                          actionType: logDetailDialog.action_type,
                          templateType: resultData.templateType || 'first_contact',
                          targetApp: resultData.targetApp || 'evofinz',
                        });
                      }} disabled={saveTemplateMutation.isPending}>
                        <Save className="h-3 w-3" />
                        {isEs ? 'Guardar plantilla' : 'Save Template'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Dedup info */}
                {resultData?.reason === 'already_executed' && (
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 text-xs flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span>{isEs ? 'Saltada por dedup guard — esta regla ya se ejecutó exitosamente en este lead' : 'Skipped by dedup guard — this rule already ran successfully on this lead'}</span>
                  </div>
                )}

                {/* Error details */}
                {resultData?.error && (
                  <div>
                    <Label className="text-xs text-destructive">Error</Label>
                    <p className="mt-1 p-2 rounded border border-destructive/30 bg-destructive/5 text-xs">{resultData.error}</p>
                  </div>
                )}

                {/* Other result data */}
                {resultData && !resultData.message && !resultData.error && resultData.reason !== 'already_executed' && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{isEs ? 'Resultado' : 'Result'}</Label>
                    <pre className="mt-1 p-2 rounded border bg-muted/30 text-[11px] overflow-x-auto">
                      {JSON.stringify(resultData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
