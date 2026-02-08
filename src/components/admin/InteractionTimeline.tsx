import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Mail,
  MessageCircle,
  StickyNote,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  MinusCircle,
  PhoneMissed,
  Loader2,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InteractionTimelineProps {
  leadId: string;
  className?: string;
}

type InteractionType = 'call' | 'email' | 'whatsapp' | 'note' | 'meeting';
type InteractionDirection = 'inbound' | 'outbound';
type InteractionOutcome = 'positive' | 'neutral' | 'negative' | 'no_answer' | null;

interface Interaction {
  id: string;
  lead_id: string;
  interaction_type: InteractionType;
  direction: InteractionDirection;
  notes: string | null;
  outcome: InteractionOutcome;
  created_at: string;
  created_by: string | null;
}

const typeIcons: Record<InteractionType, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
};

const typeLabels: Record<InteractionType, string> = {
  call: 'Llamada',
  email: 'Email',
  whatsapp: 'WhatsApp',
  meeting: 'Reunión',
  note: 'Nota',
};

const outcomeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  positive: { 
    icon: <CheckCircle className="h-3 w-3" />, 
    label: 'Positivo', 
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20' 
  },
  neutral: { 
    icon: <MinusCircle className="h-3 w-3" />, 
    label: 'Neutral', 
    color: 'text-gray-600 bg-gray-50 dark:bg-gray-800' 
  },
  negative: { 
    icon: <XCircle className="h-3 w-3" />, 
    label: 'Negativo', 
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20' 
  },
  no_answer: { 
    icon: <PhoneMissed className="h-3 w-3" />, 
    label: 'Sin respuesta', 
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' 
  },
};

export function InteractionTimeline({ leadId, className }: InteractionTimelineProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call' as InteractionType,
    direction: 'outbound' as InteractionDirection,
    outcome: '' as string,
    notes: '',
  });

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['lead-interactions', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Interaction[];
    },
  });

  const addInteraction = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('lead_interactions')
        .insert({
          lead_id: leadId,
          interaction_type: formData.type,
          direction: formData.direction,
          outcome: formData.outcome || null,
          notes: formData.notes || null,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-interactions', leadId] });
      toast.success('Interacción registrada');
      setFormData({ type: 'call', direction: 'outbound', outcome: '', notes: '' });
      setShowForm(false);
    },
    onError: (error) => {
      console.error('Error adding interaction:', error);
      toast.error('Error al registrar interacción');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInteraction.mutate();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Historial de interacciones</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as InteractionType })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      {typeIcons[value as InteractionType]}
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.direction}
              onValueChange={(v) => setFormData({ ...formData, direction: v as InteractionDirection })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Saliente</SelectItem>
                <SelectItem value="inbound">Entrante</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={formData.outcome}
              onValueChange={(v) => setFormData({ ...formData, outcome: v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
                <SelectItem value="no_answer">Sin respuesta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Notas sobre la interacción..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={addInteraction.isPending}>
              {addInteraction.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : interactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay interacciones registradas
        </p>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <div
              key={interaction.id}
              className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-2 rounded-full bg-muted">
                  {typeIcons[interaction.interaction_type]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {typeLabels[interaction.interaction_type]}
                  </span>
                  
                  {/* Direction indicator */}
                  {interaction.direction === 'inbound' ? (
                    <ArrowDownRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-blue-600" />
                  )}

                  {/* Outcome badge */}
                  {interaction.outcome && outcomeConfig[interaction.outcome] && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs flex items-center gap-1',
                        outcomeConfig[interaction.outcome].color
                      )}
                    >
                      {outcomeConfig[interaction.outcome].icon}
                      {outcomeConfig[interaction.outcome].label}
                    </Badge>
                  )}
                </div>

                {interaction.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {interaction.notes}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(interaction.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                  {' · '}
                  {format(new Date(interaction.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
