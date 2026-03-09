import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Clock, MessageCircle, Phone, Mail, ArrowRight,
  Plus, Star, UserCheck, ChevronRight, FileText,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority, getPriorityColors } from '@/hooks/admin/useLeadScoring';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  note: <FileText className="h-3.5 w-3.5 text-blue-500" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />,
  email: <Mail className="h-3.5 w-3.5 text-violet-500" />,
  call: <Phone className="h-3.5 w-3.5 text-amber-500" />,
  stage_change: <ArrowRight className="h-3.5 w-3.5 text-cyan-500" />,
  conversion: <UserCheck className="h-3.5 w-3.5 text-emerald-600" />,
};

const INTERACTION_LABELS: Record<string, { es: string; en: string }> = {
  note: { es: 'Nota', en: 'Note' },
  whatsapp: { es: 'WhatsApp', en: 'WhatsApp' },
  email: { es: 'Email', en: 'Email' },
  call: { es: 'Llamada', en: 'Call' },
  stage_change: { es: 'Cambio etapa', en: 'Stage change' },
  conversion: { es: 'Conversión', en: 'Conversion' },
};

export const AdminLeadHistory = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newInteractionType, setNewInteractionType] = useState('note');
  const [newInteractionContent, setNewInteractionContent] = useState('');

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['history-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((lead: any) => ({
        ...lead,
        score: calculateLeadScore(lead),
        priority: getLeadPriority(calculateLeadScore(lead)),
      }));
    },
  });

  // Fetch interactions for selected lead
  const { data: interactions = [] } = useQuery({
    queryKey: ['lead-interactions', selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];
      const { data, error } = await supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', selectedLeadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedLeadId,
  });

  const addInteraction = useMutation({
    mutationFn: async () => {
      if (!selectedLeadId || !newInteractionContent.trim()) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('lead_interactions').insert({
        lead_id: selectedLeadId,
        interaction_type: newInteractionType,
        direction: 'outbound' as const,
        notes: newInteractionContent.trim(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-interactions', selectedLeadId] });
      setNewInteractionContent('');
      toast.success(isEs ? '✅ Interacción registrada' : '✅ Interaction logged');
    },
  });

  const filtered = leads.filter((l: any) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return l.name?.toLowerCase().includes(s) || l.email?.toLowerCase().includes(s);
  });

  const selectedLead = leads.find((l: any) => l.id === selectedLeadId);

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isEs ? 'Buscar lead por nombre o email...' : 'Search lead by name or email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lead list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {isEs ? '📋 Selecciona un lead' : '📋 Select a lead'}
          </CardTitle>
          <CardDescription>{filtered.length} leads</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-[300px]">
            <div className="space-y-1.5">
              {filtered.slice(0, 50).map((lead: any, i: number) => {
                const colors = getPriorityColors(lead.priority);
                const isSelected = lead.id === selectedLeadId;
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50',
                      colors.border
                    )}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm truncate">{lead.name}</span>
                        <Badge className={cn('text-[9px] px-1', colors.badge)}>{lead.priority.toUpperCase()}</Badge>
                        {lead.contacted_at && <Phone className="h-3 w-3 text-amber-500" />}
                        {lead.converted_to_user && <UserCheck className="h-3 w-3 text-emerald-500" />}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lead.email} • {lead.country}</p>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Timeline */}
      {selectedLead && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isEs ? 'Historial de' : 'History for'} {selectedLead.name}
            </CardTitle>
            <CardDescription>{selectedLead.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add interaction */}
            <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                <Select value={newInteractionType} onValueChange={setNewInteractionType}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTERACTION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {isEs ? label.es : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => addInteraction.mutate()}
                  disabled={!newInteractionContent.trim() || addInteraction.isPending}
                >
                  <Plus className="h-3 w-3" />
                  {isEs ? 'Agregar' : 'Add'}
                </Button>
              </div>
              <Textarea
                placeholder={isEs ? 'Escribe una nota, resumen de llamada, etc...' : 'Write a note, call summary, etc...'}
                value={newInteractionContent}
                onChange={(e) => setNewInteractionContent(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Auto-generated timeline events */}
            <div className="space-y-0">
              {/* Lead created event */}
              <TimelineItem
                icon={<Star className="h-3.5 w-3.5 text-blue-500" />}
                label={isEs ? 'Lead creado' : 'Lead created'}
                detail={`Quiz: ${selectedLead.quiz_score}% — ${selectedLead.quiz_level}`}
                date={selectedLead.created_at}
                isEs={isEs}
              />

              {/* Contact event */}
              {selectedLead.contacted_at && (
                <TimelineItem
                  icon={<Phone className="h-3.5 w-3.5 text-amber-500" />}
                  label={isEs ? 'Contactado' : 'Contacted'}
                  date={selectedLead.contacted_at}
                  isEs={isEs}
                />
              )}

              {/* Conversion event */}
              {selectedLead.converted_to_user && (
                <TimelineItem
                  icon={<UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                  label={isEs ? 'Convertido a usuario' : 'Converted to user'}
                  date={selectedLead.contacted_at || selectedLead.created_at}
                  isEs={isEs}
                />
              )}

              {/* Manual interactions */}
              {interactions.map((interaction: any) => (
                <TimelineItem
                  key={interaction.id}
                  icon={INTERACTION_ICONS[interaction.interaction_type] || <FileText className="h-3.5 w-3.5" />}
                  label={INTERACTION_LABELS[interaction.interaction_type]?.[isEs ? 'es' : 'en'] || interaction.interaction_type}
                  detail={interaction.content}
                  date={interaction.created_at}
                  isEs={isEs}
                />
              ))}

              {interactions.length === 0 && !selectedLead.contacted_at && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {isEs ? 'Sin interacciones registradas aún' : 'No interactions logged yet'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const TimelineItem = ({ icon, label, detail, date, isEs }: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  date: string;
  isEs: boolean;
}) => (
  <div className="flex gap-3 pb-4 relative">
    <div className="flex flex-col items-center">
      <div className="p-1.5 rounded-full bg-muted border">{icon}</div>
      <div className="w-px flex-1 bg-border mt-1" />
    </div>
    <div className="flex-1 pb-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-xs">{label}</span>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(date), { addSuffix: true, locale: isEs ? esLocale : enUS })}
        </span>
      </div>
      {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
        {format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: isEs ? esLocale : undefined })}
      </p>
    </div>
  </div>
);
