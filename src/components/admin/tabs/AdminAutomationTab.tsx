import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap, Flame, ThermometerSun, Snowflake, Send, MessageCircle,
  Mail, Phone, Clock, ArrowRight, Settings, ExternalLink,
  AlertTriangle, CheckCircle2, Bot, Workflow,
} from 'lucide-react';
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
  delay: string; // '0m', '30m', '1h', '24h', '3d', '7d'
  enabled: boolean;
  description: string;
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: '1',
    name: '🔥 HOT Lead → WhatsApp inmediato',
    trigger: 'hot',
    action: 'whatsapp',
    delay: '0m',
    enabled: true,
    description: 'Cuando un lead HOT (80-100pts) entra, enviar WhatsApp personalizado inmediatamente',
  },
  {
    id: '2',
    name: '🌡️ WARM Lead → Email + Follow-up',
    trigger: 'warm',
    action: 'email',
    delay: '30m',
    enabled: true,
    description: 'Lead WARM (50-79pts): email de bienvenida a los 30 min, follow-up a los 3 días',
  },
  {
    id: '3',
    name: '❄️ COOL Lead → Nurturing email',
    trigger: 'cool',
    action: 'email',
    delay: '24h',
    enabled: false,
    description: 'Lead COOL (25-49pts): secuencia de nurturing con contenido educativo',
  },
  {
    id: '4',
    name: '🆕 Nuevo lead → GHL Workflow',
    trigger: 'new_lead',
    action: 'ghl_workflow',
    delay: '0m',
    enabled: true,
    description: 'Todo lead nuevo se envía a GoHighLevel para el workflow automático',
  },
  {
    id: '5',
    name: '🔥 HOT + 3 días → Llamada',
    trigger: 'hot',
    action: 'whatsapp',
    delay: '3d',
    enabled: false,
    description: 'Si un HOT lead no responde en 3 días, enviar segundo WhatsApp con oferta',
  },
];

const TRIGGER_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 border-red-300',
  warm: 'bg-orange-100 text-orange-700 border-orange-300',
  cool: 'bg-blue-100 text-blue-700 border-blue-300',
  cold: 'bg-gray-100 text-gray-600 border-gray-300',
  new_lead: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

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
  const [ghlWebhook, setGhlWebhook] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const toggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    toast.success(isEs ? 'Regla actualizada' : 'Rule updated');
  };

  const activeRules = rules.filter((r) => r.enabled);
  const inactiveRules = rules.filter((r) => !r.enabled);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-black text-primary">{activeRules.length}</p>
            <p className="text-xs font-bold text-muted-foreground">
              {isEs ? 'Reglas activas' : 'Active rules'}
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-black text-muted-foreground">{inactiveRules.length}</p>
            <p className="text-xs font-bold text-muted-foreground">
              {isEs ? 'Inactivas' : 'Inactive'}
            </p>
          </CardContent>
        </Card>
        <Card className="text-center border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-3xl font-black text-red-600">
              {rules.filter((r) => r.trigger === 'hot' && r.enabled).length}
            </p>
            <p className="text-xs font-bold text-red-600">🔥 HOT</p>
          </CardContent>
        </Card>
        <Card className="text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-1">
              <Bot className="h-5 w-5 text-emerald-600" />
              <p className="text-3xl font-black text-emerald-600">
                {rules.filter((r) => r.action === 'ghl_workflow' && r.enabled).length}
              </p>
            </div>
            <p className="text-xs font-bold text-emerald-600">GHL</p>
          </CardContent>
        </Card>
      </div>

      {/* GHL Setup Banner */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Workflow className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm">GoHighLevel Integration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEs
                    ? 'Los leads se envían automáticamente a GHL via el webhook configurado. Las reglas abajo determinan cuándo y cómo se contacta cada lead.'
                    : 'Leads are automatically sent to GHL via the configured webhook. Rules below determine when and how each lead is contacted.'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {isEs ? 'Webhook activo' : 'Webhook active'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {isEs ? 'Scoring automático' : 'Auto-scoring'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Flow Visual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {isEs ? '⚡ Flujo de automatización' : '⚡ Automation flow'}
          </CardTitle>
          <CardDescription>
            {isEs
              ? 'Visualiza cómo se procesan los leads según su temperatura'
              : 'Visualize how leads are processed by temperature'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Flow diagram */}
            <div className="grid gap-3">
              {[
                { temp: 'hot', label: 'HOT (80-100)', icon: '🔥', flow: isEs ? 'WhatsApp inmediato → Llamada si no responde (3d) → Oferta especial (7d)' : 'Instant WhatsApp → Call if no response (3d) → Special offer (7d)', color: 'border-red-300 bg-red-50/50 dark:bg-red-950/20' },
                { temp: 'warm', label: 'WARM (50-79)', icon: '🌡️', flow: isEs ? 'Email personalizado (30min) → Follow-up WhatsApp (3d) → Oferta (7d)' : 'Personalized email (30min) → WhatsApp follow-up (3d) → Offer (7d)', color: 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' },
                { temp: 'cool', label: 'COOL (25-49)', icon: '❄️', flow: isEs ? 'Nurturing: email educativo (24h) → Contenido valor (3d) → Invitación trial (7d)' : 'Nurturing: educational email (24h) → Value content (3d) → Trial invite (7d)', color: 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/10' },
                { temp: 'cold', label: 'COLD (0-24)', icon: '🧊', flow: isEs ? 'Email de bienvenida (24h) → Re-engagement (14d) → Último intento (30d)' : 'Welcome email (24h) → Re-engagement (14d) → Last attempt (30d)', color: 'border-gray-200 bg-gray-50/50 dark:bg-gray-950/20' },
              ].map((item, i) => (
                <motion.div
                  key={item.temp}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${item.color}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        <span>{item.flow}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                {isEs ? 'Reglas de automatización' : 'Automation rules'}
              </CardTitle>
              <CardDescription>{isEs ? 'Activa o desactiva reglas según tu estrategia' : 'Toggle rules based on your strategy'}</CardDescription>
            </div>
          </div>
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

      {/* How to set up GHL */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            📋 {isEs ? 'Cómo configurar en GoHighLevel' : 'How to set up in GoHighLevel'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            {[
              isEs ? '1. En GHL, crea un Workflow para cada temperatura (HOT, WARM, COOL, COLD)' : '1. In GHL, create a Workflow for each temperature (HOT, WARM, COOL, COLD)',
              isEs ? '2. Configura el trigger como "Webhook / API" y usa el campo "lead_priority" para filtrar' : '2. Set trigger to "Webhook / API" and use "lead_priority" field to filter',
              isEs ? '3. Para HOT: agrega acción de WhatsApp inmediato + tarea de llamada' : '3. For HOT: add instant WhatsApp action + call task',
              isEs ? '4. Para WARM: agrega email de bienvenida con delay de 30min + follow-up a 3 días' : '4. For WARM: add welcome email with 30min delay + 3-day follow-up',
              isEs ? '5. Para COOL/COLD: secuencia de nurturing con contenido educativo semanal' : '5. For COOL/COLD: weekly nurturing sequence with educational content',
              isEs ? '6. Usa el campo "comments" para personalizar mensajes automáticamente' : '6. Use "comments" field to auto-personalize messages',
            ].map((step, i) => (
              <p key={i} className="text-muted-foreground">
                {step}
              </p>
            ))}
          </div>
          <Separator />
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-bold mb-1">{isEs ? 'Campos disponibles en GHL:' : 'Available fields in GHL:'}</p>
            <div className="flex flex-wrap gap-1.5">
              {['name', 'email', 'phone', 'country', 'quiz_score', 'quiz_level', 'situation', 'goal', 'obstacle', 'lead_priority', 'comments', 'source'].map((field) => (
                <Badge key={field} variant="outline" className="text-[10px] font-mono">{field}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
