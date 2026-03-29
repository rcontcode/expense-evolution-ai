import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Trash2, Play, Pause, Clock, Mail, MessageSquare,
  Flame, ThermometerSun, Snowflake, RefreshCw, CheckCircle2,
  AlertCircle, ArrowDown, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  language: 'es' | 'en';
}

interface NurturingStep {
  day: number;
  channel: 'whatsapp' | 'email';
  template_type: string;
  message_hint: string;
}

interface NurturingSequence {
  id: string;
  name: string;
  trigger_priority: string;
  steps: NurturingStep[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface NurturingLogEntry {
  id: string;
  sequence_id: string;
  lead_id: string;
  step_index: number;
  status: string;
  scheduled_for: string;
  executed_at: string | null;
  message_generated: string | null;
  created_at: string;
}

const PRIORITY_CONFIG = {
  hot: { icon: Flame, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'HOT' },
  warm: { icon: ThermometerSun, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'WARM' },
  cool: { icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'COOL' },
  cold: { icon: Snowflake, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'COLD' },
};

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { value: 'email', label: 'Email', icon: '📧' },
];

const TEMPLATE_TYPES = [
  { value: 'first_contact', label: 'Primer contacto' },
  { value: 'value_proposition', label: 'Propuesta de valor' },
  { value: 'case_study', label: 'Caso de éxito' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'last_chance', label: 'Última oportunidad' },
  { value: 'reactivation', label: 'Reactivación' },
];

const DEFAULT_STEPS: NurturingStep[] = [
  { day: 1, channel: 'whatsapp', template_type: 'first_contact', message_hint: 'Presentación y valor clave' },
  { day: 3, channel: 'email', template_type: 'value_proposition', message_hint: 'Beneficios específicos según perfil' },
  { day: 7, channel: 'whatsapp', template_type: 'follow_up', message_hint: 'Seguimiento con oferta' },
];

export function AdminNurturingTab({ language }: Props) {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSeq, setEditingSeq] = useState<NurturingSequence | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPriority, setFormPriority] = useState('hot');
  const [formSteps, setFormSteps] = useState<NurturingStep[]>(DEFAULT_STEPS);

  // Fetch sequences
  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['nurturing-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_nurturing_sequences')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NurturingSequence[];
    },
  });

  // Fetch recent logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['nurturing-logs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_nurturing_log')
        .select('*')
        .order('scheduled_for', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as NurturingLogEntry[];
    },
  });

  // Create sequence
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('lead_nurturing_sequences').insert({
        name: formName.trim(),
        trigger_priority: formPriority,
        steps: formSteps as any,
        is_enabled: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      toast.success(isEs ? '✅ Secuencia creada' : '✅ Sequence created');
      resetForm();
      setShowCreate(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update sequence
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingSeq) return;
      const { error } = await supabase
        .from('lead_nurturing_sequences')
        .update({
          name: formName.trim(),
          trigger_priority: formPriority,
          steps: formSteps as any,
        })
        .eq('id', editingSeq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      toast.success(isEs ? '✅ Secuencia actualizada' : '✅ Sequence updated');
      resetForm();
      setEditingSeq(null);
      setShowCreate(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Toggle enabled
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('lead_nurturing_sequences')
        .update({ is_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
    },
  });

  // Delete sequence
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_nurturing_sequences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      toast.success(isEs ? 'Secuencia eliminada' : 'Sequence deleted');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormPriority('hot');
    setFormSteps(DEFAULT_STEPS);
  };

  const openEdit = (seq: NurturingSequence) => {
    setEditingSeq(seq);
    setFormName(seq.name);
    setFormPriority(seq.trigger_priority);
    setFormSteps(seq.steps || DEFAULT_STEPS);
    setShowCreate(true);
  };

  const addStep = () => {
    const lastDay = formSteps.length > 0 ? Math.max(...formSteps.map(s => s.day)) : 0;
    setFormSteps([...formSteps, {
      day: lastDay + 3,
      channel: 'whatsapp',
      template_type: 'follow_up',
      message_hint: '',
    }]);
  };

  const removeStep = (idx: number) => {
    setFormSteps(formSteps.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof NurturingStep, value: string | number) => {
    setFormSteps(formSteps.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // Stats
  const pendingCount = recentLogs.filter(l => l.status === 'pending').length;
  const sentCount = recentLogs.filter(l => l.status === 'sent').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sequences.length}</p>
              <p className="text-xs text-muted-foreground">{isEs ? 'Secuencias' : 'Sequences'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">{isEs ? 'Pendientes' : 'Pending'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentCount}</p>
              <p className="text-xs text-muted-foreground">{isEs ? 'Enviados' : 'Sent'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{isEs ? '🔄 Secuencias de Nurturing' : '🔄 Nurturing Sequences'}</CardTitle>
              <CardDescription className="text-xs">
                {isEs ? 'Cadenas automáticas de seguimiento según temperatura del lead' : 'Automatic follow-up chains based on lead temperature'}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => { resetForm(); setEditingSeq(null); setShowCreate(true); }} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isEs ? 'Nueva secuencia' : 'New sequence'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sequences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isEs ? 'No hay secuencias creadas aún' : 'No sequences created yet'}</p>
              <p className="text-xs mt-1">{isEs ? 'Crea una para automatizar el seguimiento de leads' : 'Create one to automate lead follow-ups'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sequences.map(seq => {
                const config = PRIORITY_CONFIG[seq.trigger_priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.cold;
                const Icon = config.icon;
                const steps = (seq.steps || []) as NurturingStep[];

                return (
                  <div key={seq.id} className={cn('rounded-lg border p-4 transition-colors', seq.is_enabled ? '' : 'opacity-60')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{seq.name}</h4>
                          <Badge className={cn('text-[10px]', config.bg, config.color)} variant="secondary">
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          {seq.is_enabled ? (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <Play className="h-3 w-3 mr-0.5" /> Activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              <Pause className="h-3 w-3 mr-0.5" /> Pausada
                            </Badge>
                          )}
                        </div>
                        {/* Steps preview */}
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium">
                                D{step.day} {step.channel === 'whatsapp' ? '📱' : '📧'}
                              </span>
                              {i < steps.length - 1 && <ArrowDown className="h-3 w-3 text-muted-foreground/50 rotate-[-90deg]" />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={seq.is_enabled}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: seq.id, enabled: checked })}
                        />
                        <Button variant="ghost" size="sm" onClick={() => openEdit(seq)} className="h-7 text-xs">
                          {isEs ? 'Editar' : 'Edit'}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(seq.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent log */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{isEs ? '📋 Log de Nurturing Reciente' : '📋 Recent Nurturing Log'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Step</TableHead>
                      <TableHead className="text-xs">{isEs ? 'Estado' : 'Status'}</TableHead>
                      <TableHead className="text-xs">{isEs ? 'Programado' : 'Scheduled'}</TableHead>
                      <TableHead className="text-xs">{isEs ? 'Ejecutado' : 'Executed'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.slice(0, 20).map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-medium">Paso {log.step_index + 1}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px]',
                              log.status === 'sent' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
                              log.status === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
                              log.status === 'skipped' && 'bg-gray-100 text-gray-600',
                            )}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(log.scheduled_for), 'dd MMM HH:mm', { locale: esLocale })}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.executed_at ? format(new Date(log.executed_at), 'dd MMM HH:mm', { locale: esLocale }) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingSeq(null); } }}>
        <DialogContent className="max-w-xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {editingSeq
                ? (isEs ? '✏️ Editar Secuencia' : '✏️ Edit Sequence')
                : (isEs ? '➕ Nueva Secuencia de Nurturing' : '➕ New Nurturing Sequence')
              }
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isEs ? 'Nombre de la secuencia' : 'Sequence name'}</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isEs ? 'Ej: Nurturing Hot Leads' : 'e.g. Hot Lead Nurturing'}
                />
              </div>

              <div className="space-y-2">
                <Label>{isEs ? 'Temperatura de activación' : 'Trigger temperature'}</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                      const PIcon = cfg.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <PIcon className={cn('h-4 w-4', cfg.color)} />
                            {cfg.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{isEs ? 'Pasos de la secuencia' : 'Sequence steps'}</Label>
                  <Button variant="outline" size="sm" onClick={addStep} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    {isEs ? 'Agregar paso' : 'Add step'}
                  </Button>
                </div>

                <div className="space-y-3">
                  {formSteps.map((step, idx) => (
                    <div key={idx} className="rounded-lg border p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {isEs ? `Paso ${idx + 1}` : `Step ${idx + 1}`}
                        </Badge>
                        {formSteps.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeStep(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">{isEs ? 'Día' : 'Day'}</Label>
                          <Input
                            type="number"
                            min={1}
                            value={step.day}
                            onChange={(e) => updateStep(idx, 'day', parseInt(e.target.value) || 1)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">{isEs ? 'Canal' : 'Channel'}</Label>
                          <Select value={step.channel} onValueChange={(v) => updateStep(idx, 'channel', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CHANNELS.map(ch => (
                                <SelectItem key={ch.value} value={ch.value}>{ch.icon} {ch.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">{isEs ? 'Tipo' : 'Type'}</Label>
                          <Select value={step.template_type} onValueChange={(v) => updateStep(idx, 'template_type', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TEMPLATE_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">{isEs ? 'Hint para IA' : 'AI hint'}</Label>
                        <Input
                          value={step.message_hint}
                          onChange={(e) => updateStep(idx, 'message_hint', e.target.value)}
                          placeholder={isEs ? 'Instrucción para generar el mensaje' : 'Instruction for message generation'}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingSeq(null); }}>
              {isEs ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              onClick={() => editingSeq ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!formName.trim() || formSteps.length === 0 || createMutation.isPending || updateMutation.isPending}
            >
              {editingSeq ? (isEs ? 'Guardar' : 'Save') : (isEs ? 'Crear secuencia' : 'Create sequence')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
