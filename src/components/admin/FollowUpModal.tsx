import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Phone, Mail, MessageCircle, StickyNote, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface FollowUpModalProps {
  lead: QuizLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TaskType = 'call' | 'email' | 'whatsapp' | 'note' | 'meeting';

const taskTypeOptions: { value: TaskType; label: string; icon: React.ReactNode }[] = [
  { value: 'call', label: 'Llamada', icon: <Phone className="h-4 w-4" /> },
  { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" /> },
  { value: 'meeting', label: 'Reunión', icon: <Users className="h-4 w-4" /> },
  { value: 'note', label: 'Recordatorio', icon: <StickyNote className="h-4 w-4" /> },
];

export function FollowUpModal({ lead, open, onOpenChange }: FollowUpModalProps) {
  const queryClient = useQueryClient();
  const [taskType, setTaskType] = useState<TaskType>('call');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const createFollowUp = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error('No lead selected');
      
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('lead_follow_ups')
        .insert({
          lead_id: lead.id,
          task_type: taskType,
          scheduled_at: scheduledAt.toISOString(),
          notes: notes || null,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success('Seguimiento programado');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating follow-up:', error);
      toast.error('Error al programar seguimiento');
    },
  });

  const resetForm = () => {
    setTaskType('call');
    setScheduledDate('');
    setScheduledTime('09:00');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate) {
      toast.error('Selecciona una fecha');
      return;
    }
    
    createFollowUp.mutate();
  };

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = format(new Date(), 'yyyy-MM-dd');

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programar seguimiento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Para: <span className="font-medium">{lead.name}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de seguimiento</label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={minDate}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hora</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas (opcional)</label>
            <Textarea
              placeholder="Recordatorio o contexto para este seguimiento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createFollowUp.isPending}>
              {createFollowUp.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Programar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
