import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar, Phone, Mail, MessageCircle, StickyNote, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface FollowUpModalProps {
  lead: QuizLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TaskType = 'call' | 'email' | 'whatsapp' | 'note' | 'meeting';

export function FollowUpModal({ lead, open, onOpenChange }: FollowUpModalProps) {
  const { language } = useLanguage();
  const es = language === 'es';
  const queryClient = useQueryClient();
  const [taskType, setTaskType] = useState<TaskType>('call');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const taskTypeOptions: { value: TaskType; label: string; icon: React.ReactNode }[] = [
    { value: 'call', label: es ? 'Llamada' : 'Call', icon: <Phone className="h-4 w-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" /> },
    { value: 'meeting', label: es ? 'Reunión' : 'Meeting', icon: <Users className="h-4 w-4" /> },
    { value: 'note', label: es ? 'Recordatorio' : 'Reminder', icon: <StickyNote className="h-4 w-4" /> },
  ];

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
      toast.success(es ? 'Seguimiento programado' : 'Follow-up scheduled');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating follow-up:', error);
      toast.error(es ? 'Error al programar seguimiento' : 'Error scheduling follow-up');
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
      toast.error(es ? 'Selecciona una fecha' : 'Select a date');
      return;
    }
    createFollowUp.mutate();
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {es ? 'Programar seguimiento' : 'Schedule follow-up'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {es ? 'Para' : 'For'}: <span className="font-medium">{lead.name}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{es ? 'Tipo de seguimiento' : 'Follow-up type'}</label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {taskTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">{option.icon}{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{es ? 'Fecha' : 'Date'}</label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={minDate} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{es ? 'Hora' : 'Time'}</label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{es ? 'Notas (opcional)' : 'Notes (optional)'}</label>
            <Textarea
              placeholder={es ? 'Recordatorio o contexto para este seguimiento...' : 'Reminder or context for this follow-up...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {es ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={createFollowUp.isPending}>
              {createFollowUp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {es ? 'Programar' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
