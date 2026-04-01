import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Tag, GitBranch, Download, X, Loader2, Mail, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface LeadsBulkActionsProps {
  selectedIds: Set<string>;
  allLeads: QuizLead[];
  onClearSelection: () => void;
  allTags?: string[];
}

export function LeadsBulkActions({ selectedIds, allLeads, onClearSelection, allTags = [] }: LeadsBulkActionsProps) {
  const { language } = useLanguage();
  const es = language === 'es';
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const PIPELINE_STAGES = [
    { value: 'new', label: es ? 'Nuevo' : 'New', color: 'bg-gray-500' },
    { value: 'contacted', label: es ? 'Contactado' : 'Contacted', color: 'bg-blue-500' },
    { value: 'qualified', label: es ? 'Calificado' : 'Qualified', color: 'bg-amber-500' },
    { value: 'negotiation', label: es ? 'Negociación' : 'Negotiation', color: 'bg-purple-500' },
    { value: 'converted', label: es ? 'Convertido' : 'Converted', color: 'bg-green-500' },
  ];

  const count = selectedIds.size;
  if (count === 0) return null;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    queryClient.invalidateQueries({ queryKey: ['cross-app-all-leads'] });
  };

  const handleBulkContact = async () => {
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      await Promise.all(Array.from(selectedIds).map(id =>
        supabase.from('quiz_leads').update({ contacted_at: now }).eq('id', id)
      ));
      invalidateAll();
      toast.success(es ? `✅ ${count} leads marcados como contactados` : `✅ ${count} leads marked as contacted`);
      onClearSelection();
    } catch {
      toast.error(es ? 'Error al marcar contactados' : 'Error marking as contacted');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkTag = async (tag: string) => {
    setIsProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(async (id) => {
        const lead = allLeads.find(l => l.id === id);
        const currentTags: string[] = (lead?.tags as string[]) || [];
        if (currentTags.includes(tag)) return;
        return supabase.from('quiz_leads').update({ tags: [...currentTags, tag] }).eq('id', id);
      }));
      invalidateAll();
      toast.success(es ? `🏷️ Tag "${tag}" aplicado a ${count} leads` : `🏷️ Tag "${tag}" applied to ${count} leads`);
      onClearSelection();
    } catch {
      toast.error(es ? 'Error al etiquetar' : 'Error applying tag');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRemoveTag = async (tag: string) => {
    setIsProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(async (id) => {
        const lead = allLeads.find(l => l.id === id);
        const currentTags: string[] = (lead?.tags as string[]) || [];
        if (!currentTags.includes(tag)) return;
        return supabase.from('quiz_leads').update({ tags: currentTags.filter(t => t !== tag) }).eq('id', id);
      }));
      invalidateAll();
      toast.success(es ? `🏷️ Tag "${tag}" removido de ${count} leads` : `🏷️ Tag "${tag}" removed from ${count} leads`);
      onClearSelection();
    } catch {
      toast.error(es ? 'Error al remover tag' : 'Error removing tag');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPipeline = async (stage: string) => {
    setIsProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        supabase.from('quiz_leads').update({ pipeline_stage: stage }).eq('id', id)
      ));
      invalidateAll();
      const label = PIPELINE_STAGES.find(s => s.value === stage)?.label || stage;
      toast.success(es ? `📊 ${count} leads movidos a "${label}"` : `📊 ${count} leads moved to "${label}"`);
      onClearSelection();
    } catch {
      toast.error(es ? 'Error al mover pipeline' : 'Error moving pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEmail = async () => {
    if (!confirm(es ? `¿Enviar email CRM a ${count} leads seleccionados?` : `Send CRM email to ${count} selected leads?`)) return;
    setIsProcessing(true);
    try {
      const selected = allLeads.filter(l => selectedIds.has(l.id));
      let sent = 0;
      for (const lead of selected) {
        if (!lead.email) continue;
        try {
          await supabase.functions.invoke('send-crm-email', {
            body: {
              recipientEmail: lead.email,
              recipientName: lead.name || '',
              subject: es ? 'Tenemos algo para ti' : 'We have something for you',
              textBody: '',
              leadId: lead.id,
              leadSource: lead.source || 'evofinz',
            },
          });
          sent++;
        } catch (e) {
          console.error(`Failed to send to ${lead.email}:`, e);
        }
      }
      invalidateAll();
      toast.success(es ? `📧 ${sent}/${count} emails enviados` : `📧 ${sent}/${count} emails sent`);
      onClearSelection();
    } catch {
      toast.error(es ? 'Error al enviar emails' : 'Error sending emails');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selected = allLeads.filter(l => selectedIds.has(l.id));
    const headers = [
      es ? 'Nombre' : 'Name', 'Email', es ? 'Teléfono' : 'Phone',
      es ? 'País' : 'Country', es ? 'Fuente' : 'Source', 'Score',
      es ? 'Nivel' : 'Level', es ? 'Prioridad' : 'Priority', es ? 'Fecha' : 'Date',
    ];
    const rows = selected.map(l => [
      l.name, l.email, l.phone || '', l.country || '', l.source || 'evofinz',
      l.lead_score || l.quiz_score || 0, l.quiz_level || '', l.priority || '', l.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${es ? 'seleccionados' : 'selected'}-${count}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(es ? `📥 ${count} leads exportados` : `📥 ${count} leads exported`);
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 backdrop-blur-sm shadow-sm">
      <Badge variant="secondary" className="text-sm font-semibold">
        {count} {es ? `seleccionado${count !== 1 ? 's' : ''}` : 'selected'}
      </Badge>

      <div className="flex flex-wrap gap-1.5 ml-auto">
        <Button variant="outline" size="sm" onClick={handleBulkContact} disabled={isProcessing} className="h-8 text-xs gap-1.5">
          <Phone className="h-3 w-3" />
          {es ? 'Contactados' : 'Contacted'}
        </Button>

        <Button variant="outline" size="sm" onClick={handleBulkEmail} disabled={isProcessing} className="h-8 text-xs gap-1.5">
          <Mail className="h-3 w-3" />
          {es ? 'Enviar Email' : 'Send Email'}
        </Button>

        {allTags.length > 0 && (
          <>
            <Select onValueChange={handleBulkTag} disabled={isProcessing}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <Tag className="h-3 w-3 mr-1" />
                + Tag
              </SelectTrigger>
              <SelectContent>
                {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={handleBulkRemoveTag} disabled={isProcessing}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <MinusCircle className="h-3 w-3 mr-1" />
                - Tag
              </SelectTrigger>
              <SelectContent>
                {allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}

        <Select onValueChange={handleBulkPipeline} disabled={isProcessing}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            Pipeline
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map(stage => (
              <SelectItem key={stage.value} value={stage.value}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                  {stage.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleBulkExport} className="h-8 text-xs gap-1.5">
          <Download className="h-3 w-3" />
          {es ? 'Exportar' : 'Export'}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
