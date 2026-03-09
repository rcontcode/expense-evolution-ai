import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Flame, Phone, UserCheck, MessageCircle, Mail, Sparkles,
  Clock, AlertTriangle, Copy, Loader2, Send, ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { es as esLocale, enUS } from 'date-fns/locale';
import { calculateLeadScore, getLeadPriority, getPriorityColors } from '@/hooks/admin/useLeadScoring';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  language: 'es' | 'en';
}

interface QueueLead {
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
  time_spent: string | null;
  contacted_at: string | null;
  converted_to_user: boolean | null;
  created_at: string;
  failed_questions: number[] | null;
  // Computed
  score: number;
  priority: 'hot' | 'warm' | 'cool' | 'cold';
  urgencyScore: number;
}

export const AdminContactQueueTab = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<QueueLead | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'offer'>('whatsapp');
  const [targetApp, setTargetApp] = useState<'evofinz' | 'fokuspark' | 'bundle'>('evofinz');
  const [templateType, setTemplateType] = useState<'first_contact' | 'follow_up' | 'reactivation' | 'invitation' | 'offer'>('first_contact');

  const { data: rawLeads = [], isLoading } = useQuery({
    queryKey: ['contact-queue-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .is('converted_to_user', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Also include converted_to_user = false
      const { data: data2, error: error2 } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('converted_to_user', false)
        .order('created_at', { ascending: false });
      if (error2) throw error2;
      // Merge and dedupe
      const all = [...(data || []), ...(data2 || [])];
      const seen = new Set<string>();
      return all.filter((l: any) => {
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      });
    },
  });

  // Compute queue with urgency scoring
  const queue = useMemo(() => {
    return rawLeads
      .map((lead: any) => {
        const score = calculateLeadScore(lead);
        const priority = getLeadPriority(score);
        const daysSinceCreated = differenceInDays(new Date(), new Date(lead.created_at));
        const daysSinceContact = lead.contacted_at
          ? differenceInDays(new Date(), new Date(lead.contacted_at))
          : 999;

        // Urgency = lead score + recency bonus + not-contacted bonus
        let urgencyScore = score;
        if (!lead.contacted_at) urgencyScore += 30; // Never contacted = urgent
        if (daysSinceCreated <= 1) urgencyScore += 20; // Fresh lead
        else if (daysSinceCreated <= 3) urgencyScore += 10;
        if (daysSinceContact > 7 && lead.contacted_at) urgencyScore += 15; // Follow-up needed
        if (lead.comments) urgencyScore += 10; // Has personal message

        return { ...lead, score, priority, urgencyScore } as QueueLead;
      })
      .filter((l) => !l.converted_to_user) // Exclude already converted
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [rawLeads]);

  // Split into sections
  const urgent = queue.filter((l) => !l.contacted_at && (l.priority === 'hot' || l.priority === 'warm'));
  const followUp = queue.filter((l) => l.contacted_at && differenceInDays(new Date(), new Date(l.contacted_at)) >= 3);
  const newLeads = queue.filter((l) => !l.contacted_at && (l.priority === 'cool' || l.priority === 'cold'));

  const generateAIMessage = async (lead: QueueLead, type: 'whatsapp' | 'email' | 'offer') => {
    setAiLoading(true);
    setMessageType(type);
    setAiMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-lead-message', {
        body: { lead, messageType: type, language, targetApp, templateType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiMessage(data.message || '');
    } catch (err: any) {
      toast.error(err.message || 'Error generating message');
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-select template based on lead state
  const autoSelectTemplate = (lead: QueueLead) => {
    if (lead.contacted_at) {
      const days = differenceInDays(new Date(), new Date(lead.contacted_at));
      setTemplateType(days > 7 ? 'reactivation' : 'follow_up');
    } else {
      setTemplateType('first_contact');
    }
    // Auto-select app based on source
    if (lead.source?.toLowerCase().includes('fokus')) {
      setTargetApp('fokuspark');
    } else {
      setTargetApp('evofinz');
    }
  };

  const markAsContacted = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ contacted_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-queue-leads'] });
      toast.success(isEs ? '✅ Marcado como contactado' : '✅ Marked as contacted');
    },
  });

  const copyMessage = () => {
    navigator.clipboard.writeText(aiMessage);
    toast.success(isEs ? '📋 Mensaje copiado' : '📋 Message copied');
  };

  const handleWhatsApp = (lead: QueueLead, customMessage?: string) => {
    if (!lead.phone) {
      toast.error(isEs ? 'Sin teléfono registrado' : 'No phone registered');
      return;
    }
    const phone = lead.phone.replace(/[^\d+]/g, '');
    const msg = encodeURIComponent(customMessage || aiMessage);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    // Auto-mark as contacted
    if (!lead.contacted_at) markAsContacted.mutate(lead.id);
  };

  const handleEmail = (lead: QueueLead, customMessage?: string) => {
    const body = encodeURIComponent(customMessage || aiMessage);
    const subject = encodeURIComponent(
      isEs
        ? `${lead.name.split(' ')[0]}, tu plan financiero personalizado`
        : `${lead.name.split(' ')[0]}, your personalized financial plan`
    );
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
    // Auto-mark as contacted
    if (!lead.contacted_at) markAsContacted.mutate(lead.id);
  };

  const LeadCard = ({ lead, index }: { lead: QueueLead; index: number }) => {
    const colors = getPriorityColors(lead.priority);
    const daysSinceCreated = differenceInDays(new Date(), new Date(lead.created_at));
    const isNew = daysSinceCreated <= 1;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className={cn(
          'p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all group',
          colors.border, colors.row
        )}
        onClick={() => { autoSelectTemplate(lead); setSelectedLead(lead); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">{lead.name}</span>
              <Badge className={cn('text-[10px]', colors.badge)}>
                {lead.score}pts • {lead.priority.toUpperCase()}
              </Badge>
              {isNew && (
                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                  ✨ {isEs ? 'NUEVO' : 'NEW'}
                </Badge>
              )}
              {lead.comments && (
                <Badge variant="outline" className="text-[10px]">💬</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.email}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              <span>🌍 {lead.country}</span>
              <span>🎯 {lead.goal?.slice(0, 30)}{lead.goal?.length > 30 ? '...' : ''}</span>
              <span className="ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: isEs ? esLocale : enUS })}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-black text-red-600">{urgent.length}</span>
            </div>
            <p className="text-xs font-bold text-red-600 mt-1">
              {isEs ? '🔥 Urgentes' : '🔥 Urgent'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-5 w-5 text-amber-500" />
              <span className="text-3xl font-black text-amber-600">{followUp.length}</span>
            </div>
            <p className="text-xs font-bold text-amber-600 mt-1">
              {isEs ? '📞 Follow-up' : '📞 Follow-up'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-3xl font-black">{newLeads.length}</span>
            <p className="text-xs font-bold text-muted-foreground mt-1">
              {isEs ? '🆕 Nuevos' : '🆕 New'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Section */}
      {urgent.length > 0 && (
        <Card className="border-2 border-red-200 dark:border-red-900/50">
          <CardHeader className="pb-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              {isEs ? '🔥 Contactar HOY — Hot & Warm sin contactar' : '🔥 Contact TODAY — Hot & Warm uncontacted'}
            </CardTitle>
            <CardDescription>
              {isEs ? 'Leads con mayor potencial que aún no han sido contactados' : 'High-potential leads that haven\'t been contacted yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {urgent.slice(0, 10).map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} />
            ))}
            {urgent.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{urgent.length - 10} {isEs ? 'más' : 'more'}...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Follow-up Section */}
      {followUp.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-amber-500" />
              {isEs ? '📞 Requieren Follow-up (3+ días)' : '📞 Need Follow-up (3+ days)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {followUp.slice(0, 10).map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Leads Section */}
      {newLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🆕 {isEs ? 'Nuevos — Cool & Cold' : 'New — Cool & Cold'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {newLeads.slice(0, 10).map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lead Detail + AI Message Generator Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) { setSelectedLead(null); setAiMessage(''); } }}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          {selectedLead && (
            <ScrollArea className="max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLead.name}
                  <Badge className={getPriorityColors(selectedLead.priority).badge}>
                    {selectedLead.score}pts
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedLead.email} • {selectedLead.country}</DialogDescription>
              </DialogHeader>

              {/* Lead profile */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Situación' : 'Situation'}</p>
                  <p className="text-sm font-medium">{selectedLead.situation}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Meta' : 'Goal'}</p>
                  <p className="text-sm font-medium">{selectedLead.goal}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground font-medium">{isEs ? 'Obstáculo' : 'Obstacle'}</p>
                  <p className="text-sm font-medium">{selectedLead.obstacle}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground font-medium">Quiz</p>
                  <p className="text-sm font-medium">{selectedLead.quiz_score}% — {selectedLead.quiz_level}</p>
                </div>
                {selectedLead.comments && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 col-span-2">
                    <p className="text-[10px] text-amber-600 font-medium">💬 {isEs ? 'Comentario personal' : 'Personal comment'}</p>
                    <p className="text-sm mt-1">{selectedLead.comments}</p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* AI Message Generator */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isEs ? 'Generar mensaje con IA' : 'Generate AI message'}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={messageType === 'whatsapp' ? 'default' : 'outline'}
                    className="text-xs"
                    onClick={() => generateAIMessage(selectedLead, 'whatsapp')}
                    disabled={aiLoading}
                  >
                    {aiLoading && messageType === 'whatsapp' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <MessageCircle className="h-3 w-3 mr-1" />}
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant={messageType === 'email' ? 'default' : 'outline'}
                    className="text-xs"
                    onClick={() => generateAIMessage(selectedLead, 'email')}
                    disabled={aiLoading}
                  >
                    {aiLoading && messageType === 'email' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant={messageType === 'offer' ? 'default' : 'outline'}
                    className="text-xs"
                    onClick={() => generateAIMessage(selectedLead, 'offer')}
                    disabled={aiLoading}
                  >
                    {aiLoading && messageType === 'offer' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    {isEs ? 'Oferta' : 'Offer'}
                  </Button>
                </div>

                {aiLoading && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {isEs ? 'Generando mensaje personalizado...' : 'Generating personalized message...'}
                  </div>
                )}

                {aiMessage && !aiLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Textarea
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      className="min-h-[150px] text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={copyMessage} className="text-xs gap-1">
                        <Copy className="h-3 w-3" /> {isEs ? 'Copiar' : 'Copy'}
                      </Button>
                      {selectedLead.phone && (
                        <Button
                          size="sm"
                          className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleWhatsApp(selectedLead, aiMessage)}
                        >
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => handleEmail(selectedLead, aiMessage)}
                      >
                        <Mail className="h-3 w-3" /> Email
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick actions without AI */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <h3 className="font-bold text-sm">{isEs ? 'Contacto rápido' : 'Quick contact'}</h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedLead.phone && (
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleWhatsApp(selectedLead)}>
                      <MessageCircle className="h-3 w-3 text-green-600" /> WhatsApp
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleEmail(selectedLead)}>
                    <Mail className="h-3 w-3 text-blue-600" /> Email
                  </Button>
                  {selectedLead.phone && (
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.open(`tel:${selectedLead.phone}`, '_blank')}>
                      <Phone className="h-3 w-3 text-purple-600" /> {isEs ? 'Llamar' : 'Call'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1"
                    onClick={() => { navigator.clipboard.writeText(selectedLead.email); toast.success('📋 Email copied'); }}
                  >
                    <Copy className="h-3 w-3" /> {isEs ? 'Copiar email' : 'Copy email'}
                  </Button>
                  {!selectedLead.contacted_at && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs gap-1"
                      disabled={markAsContacted.isPending}
                      onClick={() => markAsContacted.mutate(selectedLead.id)}
                    >
                      <UserCheck className="h-3 w-3" /> {isEs ? 'Marcar contactado' : 'Mark contacted'}
                    </Button>
                  )}
                  {selectedLead.contacted_at && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600">
                      ✅ {isEs ? 'Ya contactado' : 'Already contacted'}
                    </Badge>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
