import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MessageSquare, GripVertical, Mail, Phone, Globe, User, ArrowRight, Copy, ExternalLink, Send, MessageCircle, CalendarCheck, Star, Zap } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority, getPriorityColors } from '@/hooks/admin/useLeadScoring';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

interface Props {
  language: 'es' | 'en';
}

type PipelineStage = 'new' | 'contacted' | 'qualified' | 'converted';

interface PipelineLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  situation: string;
  goal: string;
  obstacle: string;
  quiz_score: number;
  quiz_level: string;
  comments: string | null;
  source: string;
  contacted_at: string | null;
  converted_to_user: boolean | null;
  pipeline_stage: string | null;
  created_at: string;
  score: number;
  priority: 'hot' | 'warm' | 'cool' | 'cold';
}

const STAGES: { key: PipelineStage; emoji: string; labelEs: string; labelEn: string; gradient: string; borderColor: string }[] = [
  { key: 'new', emoji: '🆕', labelEs: 'Nuevos', labelEn: 'New', gradient: 'from-blue-500 to-cyan-500', borderColor: 'border-t-blue-500' },
  { key: 'contacted', emoji: '📞', labelEs: 'Contactados', labelEn: 'Contacted', gradient: 'from-amber-500 to-orange-500', borderColor: 'border-t-amber-500' },
  { key: 'qualified', emoji: '⭐', labelEs: 'Calificados', labelEn: 'Qualified', gradient: 'from-violet-500 to-purple-500', borderColor: 'border-t-violet-500' },
  { key: 'converted', emoji: '✅', labelEs: 'Convertidos', labelEn: 'Converted', gradient: 'from-emerald-500 to-teal-500', borderColor: 'border-t-emerald-500' },
];

/* ─── Draggable Lead Card ─── */
function DraggableLeadCard({ lead, isEs, onClickCard }: { lead: PipelineLead; isEs: boolean; onClickCard: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const colors = getPriorityColors(lead.priority);

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={cn(
        'p-3 rounded-lg border hover:shadow-md transition-shadow group',
        colors.row, colors.border
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle only */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none mt-0.5 flex-shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
        </div>
        {/* Clickable content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClickCard}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs">{lead.name}</span>
            <Badge className={cn('text-[9px] px-1 py-0 flex-shrink-0', colors.badge)}>{lead.score}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">🌍 {lead.country} • {lead.source}</p>
          <p className="text-[10px] text-muted-foreground">🎯 {lead.goal?.slice(0, 50)}</p>
          {lead.comments && (
            <div className="flex items-center gap-1 mt-1">
              <MessageSquare className="h-3 w-3 text-amber-500 flex-shrink-0" />
              <span className="text-[9px] text-amber-600 truncate">{lead.comments.slice(0, 40)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-1.5">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: isEs ? esLocale : enUS })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Droppable Column ─── */
function DroppableColumn({ stageKey, stage, leads, isEs, onCardClick }: {
  stageKey: string;
  stage: typeof STAGES[number];
  leads: PipelineLead[];
  isEs: boolean;
  onCardClick: (lead: PipelineLead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  return (
    <div ref={setNodeRef} className="min-w-[260px]">
      <Card className={cn(
        'border-t-4 transition-all duration-200 h-full',
        stage.borderColor,
        isOver && 'ring-2 ring-primary/50 bg-primary/5 scale-[1.01]'
      )}>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{stage.emoji} {isEs ? stage.labelEs : stage.labelEn}</span>
            <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <ScrollArea className="h-[450px] pr-1">
            <div className="space-y-2 min-h-[80px]">
              {leads.map((lead) => (
                <DraggableLeadCard
                  key={lead.id}
                  lead={lead}
                  isEs={isEs}
                  onClickCard={() => onCardClick(lead)}
                />
              ))}
              {leads.length === 0 && (
                <div className={cn(
                  'text-center py-10 border-2 border-dashed rounded-lg transition-colors',
                  isOver ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground/40'
                )}>
                  <p className="text-xs font-medium">{isEs ? '📥 Arrastra leads aquí' : '📥 Drop leads here'}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Lead Detail Dialog ─── */
function LeadDetailDialog({ lead, isEs, open, onClose, onMove, isPending }: {
  lead: PipelineLead | null;
  isEs: boolean;
  open: boolean;
  onClose: () => void;
  onMove: (stage: PipelineStage, note?: string) => void;
  isPending: boolean;
}) {
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  if (!lead) return null;

  const colors = getPriorityColors(lead.priority);
  const currentStage = lead.pipeline_stage as PipelineStage;
  const nextStages = (['new', 'contacted', 'qualified', 'converted'] as PipelineStage[]).filter(s => s !== currentStage);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isEs ? `${label} copiado` : `${label} copied`);
  };

  const whatsappUrl = lead.phone
    ? `https://wa.me/${lead.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(
        isEs
          ? `Hola ${lead.name}, soy del equipo de EvoFinz. Vi que completaste nuestro quiz y me gustaría ayudarte con tu objetivo: "${lead.goal?.slice(0, 60)}". ¿Tienes unos minutos para conversar?`
          : `Hi ${lead.name}, I'm from the EvoFinz team. I saw you completed our quiz and I'd like to help you with your goal: "${lead.goal?.slice(0, 60)}". Do you have a few minutes to chat?`
      )}`
    : null;

  const emailUrl = `mailto:${lead.email}?subject=${encodeURIComponent(
    isEs ? `${lead.name}, sobre tu evaluación financiera` : `${lead.name}, about your financial assessment`
  )}&body=${encodeURIComponent(
    isEs
      ? `Hola ${lead.name},\n\nGracias por completar nuestra evaluación financiera. Noté que tu objetivo es "${lead.goal}".\n\nMe gustaría agendar una llamada para explorar cómo podemos ayudarte.\n\n¿Cuándo te viene bien?\n\nSaludos`
      : `Hi ${lead.name},\n\nThank you for completing our financial assessment. I noticed your goal is "${lead.goal}".\n\nI'd like to schedule a call to explore how we can help you.\n\nWhen works best for you?\n\nBest regards`
  )}`;

  const priorityLabel = {
    hot: { es: '🔥 Caliente', en: '🔥 Hot' },
    warm: { es: '🌤 Tibio', en: '🌤 Warm' },
    cool: { es: '❄️ Frío', en: '❄️ Cool' },
    cold: { es: '🧊 Muy frío', en: '🧊 Cold' },
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setNoteText(''); setActiveTab('details'); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            {lead.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('text-xs', colors.badge)}>
                <Star className="h-3 w-3 mr-1" />
                {lead.score} pts
              </Badge>
              <Badge variant="outline" className="text-xs">
                {priorityLabel[lead.priority]?.[isEs ? 'es' : 'en']}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {STAGES.find(s => s.key === currentStage)?.emoji} {isEs ? STAGES.find(s => s.key === currentStage)?.labelEs : STAGES.find(s => s.key === currentStage)?.labelEn}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{isEs ? '📋 Info' : '📋 Info'}</TabsTrigger>
            <TabsTrigger value="actions">{isEs ? '⚡ Acciones' : '⚡ Actions'}</TabsTrigger>
            <TabsTrigger value="move">{isEs ? '🚀 Mover' : '🚀 Move'}</TabsTrigger>
          </TabsList>

          {/* ── Details Tab ── */}
          <TabsContent value="details" className="space-y-3 mt-3">
            {/* Contact info with copy buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">Email</p>
                  <p className="text-xs font-medium truncate">{lead.email}</p>
                </div>
                <button onClick={() => copyToClipboard(lead.email, 'Email')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'Teléfono' : 'Phone'}</p>
                  <p className="text-xs font-medium">{lead.phone || '—'}</p>
                </div>
                {lead.phone && (
                  <button onClick={() => copyToClipboard(lead.phone!, isEs ? 'Teléfono' : 'Phone')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'País' : 'Country'}</p>
                  <p className="text-xs font-medium">{lead.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{isEs ? 'Registrado' : 'Registered'}</p>
                  <p className="text-xs font-medium">{format(new Date(lead.created_at), 'dd MMM yyyy HH:mm', { locale: isEs ? esLocale : enUS })}</p>
                </div>
              </div>
            </div>

            {/* Quiz info */}
            <div className="space-y-2">
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-1">🎯 {isEs ? 'Objetivo' : 'Goal'}</p>
                <p className="text-xs">{lead.goal || '—'}</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-1">📍 {isEs ? 'Situación actual' : 'Current situation'}</p>
                <p className="text-xs">{lead.situation || '—'}</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-1">🚧 {isEs ? 'Obstáculo' : 'Obstacle'}</p>
                <p className="text-xs">{lead.obstacle || '—'}</p>
              </div>
            </div>

            {/* Quiz score & source */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                📊 Quiz: {lead.quiz_score}/10 — {lead.quiz_level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                📡 {isEs ? 'Fuente' : 'Source'}: {lead.source}
              </Badge>
              {lead.contacted_at && (
                <Badge variant="outline" className="text-xs">
                  📞 {isEs ? 'Contactado' : 'Contacted'}: {format(new Date(lead.contacted_at), 'dd MMM', { locale: isEs ? esLocale : enUS })}
                </Badge>
              )}
            </div>

            {/* Comments */}
            {lead.comments && (
              <div className="p-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <p className="text-[10px] text-amber-600 mb-1 font-medium">💬 {isEs ? 'Notas admin' : 'Admin notes'}</p>
                <p className="text-xs text-amber-800 dark:text-amber-300">{lead.comments}</p>
              </div>
            )}
          </TabsContent>

          {/* ── Actions Tab ── */}
          <TabsContent value="actions" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">{isEs ? 'Acciones rápidas para este lead:' : 'Quick actions for this lead:'}</p>

            <div className="grid grid-cols-1 gap-2">
              {/* Email */}
              <a href={emailUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start h-11 gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{isEs ? 'Enviar email personalizado' : 'Send personalized email'}</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                </Button>
              </a>

              {/* WhatsApp */}
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start h-11 gap-2">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{isEs ? 'Contactar por WhatsApp' : 'Contact via WhatsApp'}</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full justify-start h-11 gap-2" disabled>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{isEs ? 'WhatsApp (sin teléfono)' : 'WhatsApp (no phone)'}</span>
                </Button>
              )}

              {/* Phone call */}
              {lead.phone ? (
                <a href={`tel:${lead.phone}`}>
                  <Button variant="outline" className="w-full justify-start h-11 gap-2">
                    <Phone className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">{isEs ? 'Llamar por teléfono' : 'Call by phone'}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{lead.phone}</span>
                  </Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full justify-start h-11 gap-2" disabled>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{isEs ? 'Llamar (sin teléfono)' : 'Call (no phone)'}</span>
                </Button>
              )}

              {/* Copy all info */}
              <Button
                variant="outline"
                className="w-full justify-start h-11 gap-2"
                onClick={() => {
                  const info = [
                    `${isEs ? 'Nombre' : 'Name'}: ${lead.name}`,
                    `Email: ${lead.email}`,
                    `${isEs ? 'Teléfono' : 'Phone'}: ${lead.phone || '—'}`,
                    `${isEs ? 'País' : 'Country'}: ${lead.country}`,
                    `Quiz: ${lead.quiz_score}/10 (${lead.quiz_level})`,
                    `Score: ${lead.score} (${lead.priority})`,
                    `${isEs ? 'Objetivo' : 'Goal'}: ${lead.goal}`,
                    `${isEs ? 'Situación' : 'Situation'}: ${lead.situation}`,
                    `${isEs ? 'Obstáculo' : 'Obstacle'}: ${lead.obstacle}`,
                    `${isEs ? 'Fuente' : 'Source'}: ${lead.source}`,
                  ].join('\n');
                  copyToClipboard(info, isEs ? 'Info completa' : 'Full info');
                }}
              >
                <Copy className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{isEs ? 'Copiar toda la info' : 'Copy all info'}</span>
              </Button>

              {/* Quick move to contacted */}
              {currentStage === 'new' && (
                <Button
                  className="w-full justify-start h-11 gap-2"
                  onClick={() => { onMove('contacted'); setActiveTab('details'); }}
                  disabled={isPending}
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span className="font-medium">{isEs ? 'Marcar como contactado' : 'Mark as contacted'}</span>
                  <Zap className="h-3 w-3 ml-auto" />
                </Button>
              )}

              {currentStage === 'contacted' && (
                <Button
                  className="w-full justify-start h-11 gap-2"
                  onClick={() => { onMove('qualified'); setActiveTab('details'); }}
                  disabled={isPending}
                >
                  <Star className="h-4 w-4" />
                  <span className="font-medium">{isEs ? 'Calificar lead' : 'Qualify lead'}</span>
                  <Zap className="h-3 w-3 ml-auto" />
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ── Move Tab ── */}
          <TabsContent value="move" className="space-y-3 mt-3">
            <Textarea
              placeholder={isEs ? 'Nota opcional al mover...' : 'Optional note when moving...'}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-1 gap-2">
              {nextStages.map((stageKey) => {
                const stageInfo = STAGES.find(s => s.key === stageKey)!;
                return (
                  <Button
                    key={stageKey}
                    variant="outline"
                    className="justify-start h-11"
                    onClick={() => {
                      onMove(stageKey, noteText || undefined);
                      setNoteText('');
                    }}
                    disabled={isPending}
                  >
                    <span className="mr-2">{stageInfo.emoji}</span>
                    <span className="font-medium">{isEs ? stageInfo.labelEs : stageInfo.labelEn}</span>
                    <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                    {isPending && <span className="ml-1 text-xs animate-pulse">⏳</span>}
                  </Button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Stage Change Note Dialog ─── */
function StageChangeNoteDialog({ open, onClose, onConfirm, leadName, fromStage, toStage, isEs, isPending }: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  leadName: string;
  fromStage: string;
  toStage: string;
  isEs: boolean;
  isPending: boolean;
}) {
  const [note, setNote] = useState('');
  const fromInfo = STAGES.find(s => s.key === fromStage);
  const toInfo = STAGES.find(s => s.key === toStage);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setNote(''); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            {isEs ? 'Mover lead' : 'Move lead'}: {leadName}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Badge variant="outline">{fromInfo?.emoji} {isEs ? fromInfo?.labelEs : fromInfo?.labelEn}</Badge>
              <ArrowRight className="h-3 w-3" />
              <Badge variant="outline">{toInfo?.emoji} {isEs ? toInfo?.labelEs : toInfo?.labelEn}</Badge>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={isEs ? 'Nota rápida (opcional)...' : 'Quick note (optional)...'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => { onClose(); setNote(''); }}>
            {isEs ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button size="sm" onClick={() => { onConfirm(note); setNote(''); }} disabled={isPending}>
            {isPending ? '⏳' : '✅'} {isEs ? 'Mover' : 'Move'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Component ─── */
export const AdminKanbanPipeline = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);
  const [pendingDrag, setPendingDrag] = useState<{ lead: PipelineLead; targetStage: PipelineStage } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: rawLeads = [], isLoading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((lead: any) => {
        const score = calculateLeadScore(lead);
        const priority = getLeadPriority(score);
        let stage = lead.pipeline_stage || 'new';
        if (stage === 'new' && lead.converted_to_user) stage = 'converted';
        else if (stage === 'new' && lead.contacted_at) stage = 'contacted';
        return { ...lead, score, priority, pipeline_stage: stage } as PipelineLead;
      });
    },
  });

  const stageLeads = useMemo(() => {
    const grouped: Record<PipelineStage, PipelineLead[]> = { new: [], contacted: [], qualified: [], converted: [] };
    rawLeads.forEach((lead) => {
      const stage = (lead.pipeline_stage as PipelineStage) || 'new';
      if (grouped[stage]) grouped[stage].push(lead);
      else grouped.new.push(lead);
    });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => b.score - a.score));
    return grouped;
  }, [rawLeads]);

  const moveToStage = useMutation({
    mutationFn: async ({ leadId, stage, note }: { leadId: string; stage: PipelineStage; note?: string }) => {
      const updates: Record<string, any> = { pipeline_stage: stage };
      if (stage === 'contacted' || stage === 'qualified') {
        updates.contacted_at = new Date().toISOString();
      }
      if (stage === 'converted') {
        updates.converted_to_user = true;
      }

      const { error } = await supabase.from('quiz_leads').update(updates).eq('id', leadId);
      if (error) throw error;

      if (note) {
        const currentLead = rawLeads.find(l => l.id === leadId);
        const { data: { user } } = await supabase.auth.getUser();
        const { error: interactionError } = await supabase.from('lead_interactions').insert({
          lead_id: leadId,
          interaction_type: 'stage_change',
          direction: 'outbound' as const,
          notes: `[${currentLead?.pipeline_stage} → ${stage}] ${note}`,
          created_by: user?.id,
        });
        if (interactionError) {
          console.error('Error logging interaction:', interactionError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queue-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-interactions', variables.leadId] });
      toast.success(isEs ? '✅ Lead movido exitosamente' : '✅ Lead moved successfully');
      setSelectedLead(null);
    },
    onError: (err) => {
      console.error('Move error:', err);
      toast.error(isEs ? '❌ Error al mover lead' : '❌ Error moving lead');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const lead = rawLeads.find(l => l.id === String(event.active.id));
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const draggedLead = rawLeads.find(l => l.id === String(active.id));
    if (!draggedLead) return;

    const targetStage = String(over.id);
    if (!STAGES.some(s => s.key === targetStage)) return;
    if (targetStage === draggedLead.pipeline_stage) return;

    // Show note dialog before moving
    setPendingDrag({ lead: draggedLead, targetStage: targetStage as PipelineStage });
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-60 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAGES.map((stage) => {
          const count = stageLeads[stage.key].length;
          return (
            <div key={stage.key} className={`text-center p-3 rounded-xl bg-gradient-to-br ${stage.gradient} text-white`}>
              <span className="text-2xl font-black">{count}</span>
              <p className="text-[11px] font-bold opacity-90">{stage.emoji} {isEs ? stage.labelEs : stage.labelEn}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Board - horizontal scroll on smaller screens */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-4 gap-3" style={{ minWidth: '1080px' }}>
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage.key}
                stageKey={stage.key}
                stage={stage}
                leads={stageLeads[stage.key]}
                isEs={isEs}
                onCardClick={(lead) => setSelectedLead(lead)}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead && (
            <div className="p-3 rounded-lg border-2 border-primary bg-background shadow-2xl rotate-1 w-[250px]">
              <span className="font-bold text-xs">{activeLead.name}</span>
              <p className="text-[10px] text-muted-foreground">🌍 {activeLead.country} • {activeLead.source}</p>
              <p className="text-[10px] text-muted-foreground">🎯 {activeLead.goal?.slice(0, 40)}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Lead Detail + Move Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        isEs={isEs}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onMove={(stage, note) => {
          if (selectedLead) {
            moveToStage.mutate({ leadId: selectedLead.id, stage, note });
          }
        }}
        isPending={moveToStage.isPending}
      />

      {/* Stage Change Note Dialog (on drag) */}
      <StageChangeNoteDialog
        open={!!pendingDrag}
        onClose={() => setPendingDrag(null)}
        onConfirm={(note) => {
          if (pendingDrag) {
            moveToStage.mutate({ leadId: pendingDrag.lead.id, stage: pendingDrag.targetStage, note: note || undefined });
            setPendingDrag(null);
          }
        }}
        leadName={pendingDrag?.lead.name || ''}
        fromStage={pendingDrag?.lead.pipeline_stage || 'new'}
        toStage={pendingDrag?.targetStage || 'new'}
        isEs={isEs}
        isPending={moveToStage.isPending}
      />
    </div>
  );
};
