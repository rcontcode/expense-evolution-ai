import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Flame, ThermometerSun, Snowflake, MessageCircle,
  Mail, Phone, Clock, ArrowRight, Settings, AlertTriangle,
  CheckCircle2, Bot, Workflow, Bell, TrendingDown, Users,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'hot' | 'warm' | 'cool' | 'cold' | 'new_lead';
  action: 'whatsapp' | 'email' | 'ghl_workflow' | 'sms';
  delay: string;
  enabled: boolean;
  description: string;
}

const DEFAULT_RULES: AutomationRule[] = [
  { id: '1', name: '🔥 HOT Lead → WhatsApp inmediato', trigger: 'hot', action: 'whatsapp', delay: '0m', enabled: true, description: 'Cuando un lead HOT (80-100pts) entra, enviar WhatsApp personalizado inmediatamente' },
  { id: '2', name: '🌡️ WARM Lead → Email + Follow-up', trigger: 'warm', action: 'email', delay: '30m', enabled: true, description: 'Lead WARM (50-79pts): email de bienvenida a los 30 min, follow-up a los 3 días' },
  { id: '3', name: '❄️ COOL Lead → Nurturing email', trigger: 'cool', action: 'email', delay: '24h', enabled: false, description: 'Lead COOL (25-49pts): secuencia de nurturing con contenido educativo' },
  { id: '4', name: '🆕 Nuevo lead → GHL Workflow', trigger: 'new_lead', action: 'ghl_workflow', delay: '0m', enabled: true, description: 'Todo lead nuevo se envía a GoHighLevel para el workflow automático' },
  { id: '5', name: '🔥 HOT + 3 días → Llamada', trigger: 'hot', action: 'whatsapp', delay: '3d', enabled: false, description: 'Si un HOT lead no responde en 3 días, enviar segundo WhatsApp con oferta' },
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
  ghl_workflow: <Workflow className="h-4 w-4 text-purple-600" />,
  sms: <Phone className="h-4 w-4 text-amber-600" />,
};

export const AdminAutomationTab = ({ language }: Props) => {
  const isEs = language === 'es';
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    const saved = localStorage.getItem('crm-automation-rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  // Fetch leads for dynamic scoring & alerts
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

  // Dynamic lead scoring with decay
  const dynamicAlerts = useMemo(() => {
    const alerts: { type: 'urgent' | 'warning' | 'info'; message: string; count: number; leadIds: string[] }[] = [];

    const hotUncontacted: string[] = [];
    const warmStale: string[] = [];
    const decayingLeads: string[] = [];
    const reactivationCandidates: string[] = [];

    leads.forEach((lead: any) => {
      const baseScore = calculateLeadScore(lead);
      const priority = getLeadPriority(baseScore);
      const daysSinceCreated = differenceInDays(new Date(), new Date(lead.created_at));
      const daysSinceContact = lead.contacted_at
        ? differenceInDays(new Date(), new Date(lead.contacted_at))
        : null;

      // Score decay: -2pts per day without contact after 3 days
      const decayDays = daysSinceContact !== null ? Math.max(0, daysSinceContact - 3) : Math.max(0, daysSinceCreated - 3);
      const decayedScore = Math.max(0, baseScore - (decayDays * 2));
      const hasDecayed = decayedScore < baseScore - 10;

      // Hot lead not contacted
      if (priority === 'hot' && !lead.contacted_at) {
        hotUncontacted.push(lead.id);
      }

      // Warm lead contacted >5 days ago without conversion
      if (priority === 'warm' && daysSinceContact !== null && daysSinceContact > 5 && !lead.converted_to_user) {
        warmStale.push(lead.id);
      }

      // Significant score decay
      if (hasDecayed && !lead.converted_to_user) {
        decayingLeads.push(lead.id);
      }

      // Reactivation: contacted >14 days ago, not converted
      if (daysSinceContact !== null && daysSinceContact > 14 && !lead.converted_to_user) {
        reactivationCandidates.push(lead.id);
      }
    });

    if (hotUncontacted.length > 0) {
      alerts.push({
        type: 'urgent',
        message: isEs
          ? `${hotUncontacted.length} leads HOT sin contactar — ¡contactar HOY!`
          : `${hotUncontacted.length} HOT leads uncontacted — contact TODAY!`,
        count: hotUncontacted.length,
        leadIds: hotUncontacted,
      });
    }

    if (warmStale.length > 0) {
      alerts.push({
        type: 'warning',
        message: isEs
          ? `${warmStale.length} leads WARM necesitan follow-up (>5 días sin respuesta)`
          : `${warmStale.length} WARM leads need follow-up (>5 days no response)`,
        count: warmStale.length,
        leadIds: warmStale,
      });
    }

    if (decayingLeads.length > 0) {
      alerts.push({
        type: 'warning',
        message: isEs
          ? `${decayingLeads.length} leads perdiendo puntos por inactividad (-2pts/día)`
          : `${decayingLeads.length} leads losing points from inactivity (-2pts/day)`,
        count: decayingLeads.length,
        leadIds: decayingLeads,
      });
    }

    if (reactivationCandidates.length > 0) {
      alerts.push({
        type: 'info',
        message: isEs
          ? `${reactivationCandidates.length} leads candidatos a reactivación (>14 días)`
          : `${reactivationCandidates.length} reactivation candidates (>14 days)`,
        count: reactivationCandidates.length,
        leadIds: reactivationCandidates,
      });
    }

    return alerts;
  }, [leads, isEs]);

  // Scoring health metrics
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

  const toggleRule = (ruleId: string) => {
    setRules((prev) => {
      const updated = prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
      localStorage.setItem('crm-automation-rules', JSON.stringify(updated));
      return updated;
    });
    toast.success(isEs ? 'Regla actualizada' : 'Rule updated');
  };

  const activeRules = rules.filter((r) => r.enabled);
  const inactiveRules = rules.filter((r) => !r.enabled);

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
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-lg border flex items-start gap-3 ${
                  alert.type === 'urgent' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
                  alert.type === 'warning' ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' :
                  'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                }`}
              >
                {alert.type === 'urgent' ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" /> :
                 alert.type === 'warning' ? <TrendingDown className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /> :
                 <Bell className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-xs font-medium">{alert.message}</p>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">{alert.count}</Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scoring Health */}
      {scoringHealth && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-black">{scoringHealth.avgScore.toFixed(0)}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Score promedio' : 'Avg Score'}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-black text-primary">{activeRules.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Reglas activas' : 'Active Rules'}</p>
            </CardContent>
          </Card>
          <Card className="text-center border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-3">
              <p className="text-2xl font-black text-red-600">🔥 {scoringHealth.priorities.hot}</p>
              <p className="text-[10px] font-bold text-red-600">HOT</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-black">{scoringHealth.contactedRate.toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-muted-foreground">{isEs ? 'Contactados' : 'Contacted'}</p>
            </CardContent>
          </Card>
          <Card className="text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-3">
              <p className="text-2xl font-black text-emerald-600">{scoringHealth.convertedRate.toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-emerald-600">{isEs ? 'Convertidos' : 'Converted'}</p>
            </CardContent>
          </Card>
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
                {isEs
                  ? 'Los leads pierden -2 puntos por día sin interacción después de 3 días. Los leads contactados recientemente mantienen su score. Esto prioriza leads frescos automáticamente.'
                  : 'Leads lose -2 points per day without interaction after 3 days. Recently contacted leads maintain their score. This automatically prioritizes fresh leads.'}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  {isEs ? '3 días gracia' : '3 days grace'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  -2pts/{isEs ? 'día' : 'day'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {isEs ? 'Mín: 0pts' : 'Min: 0pts'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GHL Integration */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Workflow className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">GoHighLevel Integration</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEs
                  ? 'Los leads se envían automáticamente a GHL. Las reglas determinan cuándo y cómo se contacta.'
                  : 'Leads are automatically sent to GHL. Rules determine when and how to contact.'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isEs ? 'Webhook activo' : 'Webhook active'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">Scoring + Decay</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {isEs ? '⚡ Flujo de automatización' : '⚡ Automation flow'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { temp: 'hot', label: 'HOT (80-100)', icon: '🔥', flow: isEs ? 'WhatsApp inmediato → Llamada (3d) → Oferta (7d)' : 'Instant WhatsApp → Call (3d) → Offer (7d)', color: 'border-red-300 bg-red-50/50 dark:bg-red-950/20' },
              { temp: 'warm', label: 'WARM (50-79)', icon: '🌡️', flow: isEs ? 'Email (30min) → WhatsApp (3d) → Oferta (7d)' : 'Email (30min) → WhatsApp (3d) → Offer (7d)', color: 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' },
              { temp: 'cool', label: 'COOL (25-49)', icon: '❄️', flow: isEs ? 'Nurturing email (24h) → Contenido (3d) → Trial (7d)' : 'Nurturing (24h) → Content (3d) → Trial (7d)', color: 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/10' },
              { temp: 'cold', label: 'COLD (0-24)', icon: '🧊', flow: isEs ? 'Email (24h) → Re-engagement (14d) → Último (30d)' : 'Email (24h) → Re-engagement (14d) → Last (30d)', color: 'border-gray-200 bg-gray-50/50 dark:bg-gray-950/20' },
            ].map((item, i) => (
              <motion.div
                key={item.temp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl border-2 ${item.color}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <ArrowRight className="h-3 w-3" /> {item.flow}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            {isEs ? 'Reglas de automatización' : 'Automation rules'}
          </CardTitle>
          <CardDescription>{isEs ? 'Activa o desactiva según tu estrategia' : 'Toggle based on your strategy'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border transition-all ${rule.enabled ? 'bg-card shadow-sm' : 'bg-muted/30 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-0.5">
                    {TRIGGER_ICONS[rule.trigger]}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    {ACTION_ICONS[rule.action]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{rule.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {rule.delay === '0m' ? (isEs ? 'Inmediato' : 'Instant') : rule.delay}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                  </div>
                </div>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* GHL Setup Guide */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📋 {isEs ? 'Guía GoHighLevel' : 'GoHighLevel Guide'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            isEs ? '1. Crea Workflows por temperatura (HOT, WARM, COOL, COLD)' : '1. Create Workflows by temperature',
            isEs ? '2. Trigger: "Webhook / API" → filtrar por "lead_priority"' : '2. Trigger: "Webhook / API" → filter by "lead_priority"',
            isEs ? '3. HOT: WhatsApp inmediato + tarea de llamada' : '3. HOT: Instant WhatsApp + call task',
            isEs ? '4. WARM: Email bienvenida (30min) + follow-up (3d)' : '4. WARM: Welcome email (30min) + follow-up (3d)',
            isEs ? '5. COOL/COLD: Nurturing semanal educativo' : '5. COOL/COLD: Weekly educational nurturing',
          ].map((step, i) => (
            <p key={i} className="text-muted-foreground text-xs">{step}</p>
          ))}
          <Separator />
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-bold mb-1">{isEs ? 'Campos GHL:' : 'GHL Fields:'}</p>
            <div className="flex flex-wrap gap-1">
              {['name', 'email', 'phone', 'country', 'quiz_score', 'lead_priority', 'comments', 'source'].map((f) => (
                <Badge key={f} variant="outline" className="text-[9px] font-mono">{f}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
