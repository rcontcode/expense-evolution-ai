import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
function DraggableLeadCard({ lead, isEs, onClickMove }: { lead: PipelineLead; isEs: boolean; onClickMove: () => void }) {
  const colors = getPriorityColors(lead.priority);

  return (
    <div
      className={cn(
        'p-3 rounded-lg border hover:shadow-md transition-shadow group',
        colors.row, colors.border
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle — only this part is draggable */}
        <div
          data-drag-handle={lead.id}
          className="cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0 touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
        </div>
        {/* Clickable content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClickMove}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs truncate">{lead.name}</span>
            <Badge className={cn('text-[9px] px-1 py-0', colors.badge)}>{lead.score}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">🌍 {lead.country} • {lead.source}</p>
          <p className="text-[10px] text-muted-foreground truncate">🎯 {lead.goal?.slice(0, 40)}</p>
          {lead.comments && (
            <div className="flex items-center gap-1 mt-1">
              <MessageSquare className="h-3 w-3 text-amber-500" />
              <span className="text-[9px] text-amber-600 truncate">{lead.comments.slice(0, 30)}...</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: isEs ? esLocale : enUS })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Droppable Column ─── */
function DroppableColumn({ stage, leads, isEs, onCardClick, isOver }: {
  stage: typeof STAGES[number];
  leads: PipelineLead[];
  isEs: boolean;
  onCardClick: (lead: PipelineLead) => void;
  isOver: boolean;
}) {
  return (
    <Card className={cn(
      'border-t-4 transition-all duration-200',
      stage.borderColor,
      isOver && 'ring-2 ring-primary/50 bg-primary/5 scale-[1.02]'
    )}>
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{stage.emoji} {isEs ? stage.labelEs : stage.labelEn}</span>
          <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <ScrollArea className="h-[400px] pr-1">
          <div className="space-y-2 min-h-[60px]">
            {leads.map((lead) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                isEs={isEs}
                onClickMove={() => onCardClick(lead)}
              />
            ))}
            {leads.length === 0 && (
              <div className={cn(
                'text-center py-8 border-2 border-dashed rounded-lg transition-colors',
                isOver ? 'border-primary/50 bg-primary/10 text-primary' : 'text-muted-foreground/50'
              )}>
                <p className="text-xs">{isEs ? 'Arrastra leads aquí' : 'Drop leads here'}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ─── Wrapper to register droppable ─── */
function DroppableStageWrapper({ stageKey, children }: { stageKey: string; children: (isOver: boolean) => React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return <div ref={setNodeRef}>{children(isOver)}</div>;
}

/* ─── Main Component ─── */
export const AdminKanbanPipeline = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [movingLead, setMovingLead] = useState<PipelineLead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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

  const performMove = useCallback(async (leadId: string, stage: PipelineStage, note?: string) => {
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
      supabase.from('lead_interactions').insert({
        lead_id: leadId,
        interaction_type: 'stage_change',
        content: note,
        metadata: { from_stage: currentLead?.pipeline_stage, to_stage: stage },
      }).then(() => {}); // fire-and-forget
    }
  }, [rawLeads]);

  const moveToStage = useMutation({
    mutationFn: ({ leadId, stage, note }: { leadId: string; stage: PipelineStage; note?: string }) =>
      performMove(leadId, stage, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      queryClient.invalidateQueries({ queryKey: ['contact-queue-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success(isEs ? '✅ Lead movido exitosamente' : '✅ Lead moved successfully');
      setMovingLead(null);
      setNoteText('');
    },
    onError: (err) => {
      console.error('Move error:', err);
      toast.error(isEs ? '❌ Error al mover lead' : '❌ Error moving lead');
    },
  });

  /* ── Drag handlers ── */
  const handleDragStart = (event: DragStartEvent) => {
    const lead = rawLeads.find(l => l.id === event.active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const draggedLead = rawLeads.find(l => l.id === active.id);
    if (!draggedLead) return;

    const targetStage = over.id as string;

    // Only accept drops on stage columns
    if (!STAGES.some(s => s.key === targetStage)) return;
    if (targetStage === draggedLead.pipeline_stage) return;

    moveToStage.mutate({ leadId: draggedLead.id, stage: targetStage as PipelineStage });
  };

  const handleCardClick = (lead: PipelineLead) => {
    setMovingLead(lead);
    setNoteText('');
  };

  const getNextStages = (current: PipelineStage): PipelineStage[] => {
    return (['new', 'contacted', 'qualified', 'converted'] as PipelineStage[]).filter(s => s !== current);
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-60 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-4 gap-2">
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

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {STAGES.map((stage) => (
            <DroppableStageWrapper key={stage.key} stageKey={stage.key}>
              {(isOver) => (
                <DroppableColumn
                  stage={stage}
                  leads={stageLeads[stage.key]}
                  isEs={isEs}
                  onCardClick={handleCardClick}
                  isOver={isOver}
                />
              )}
            </DroppableStageWrapper>
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="p-3 rounded-lg border bg-background shadow-2xl rotate-2 w-[220px] opacity-90">
              <span className="font-bold text-xs">{activeLead.name}</span>
              <p className="text-[10px] text-muted-foreground">🌍 {activeLead.country}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Move Lead Dialog (click alternative) */}
      <Dialog open={!!movingLead} onOpenChange={(open) => { if (!open) setMovingLead(null); }}>
        <DialogContent className="max-w-sm">
          {movingLead && (
            <>
              <DialogHeader>
                <DialogTitle>{isEs ? 'Mover lead' : 'Move lead'}</DialogTitle>
                <DialogDescription>
                  {movingLead.name} — {isEs ? 'Etapa actual:' : 'Current stage:'}{' '}
                  <Badge variant="outline">{movingLead.pipeline_stage}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Textarea
                  placeholder={isEs ? 'Nota opcional...' : 'Optional note...'}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                />

                <div className="grid grid-cols-1 gap-2">
                  {getNextStages(movingLead.pipeline_stage as PipelineStage).map((stageKey) => {
                    const stageInfo = STAGES.find(s => s.key === stageKey)!;
                    return (
                      <Button
                        key={stageKey}
                        variant="outline"
                        className="justify-start h-11"
                        onClick={() => {
                          console.log('Moving lead', movingLead.id, 'to', stageKey);
                          moveToStage.mutate({ leadId: movingLead.id, stage: stageKey, note: noteText || undefined });
                        }}
                        disabled={moveToStage.isPending}
                      >
                        <span className="mr-2">{stageInfo.emoji}</span>
                        <span className="font-medium">{isEs ? stageInfo.labelEs : stageInfo.labelEn}</span>
                        {moveToStage.isPending && <span className="ml-auto text-xs animate-pulse">...</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
