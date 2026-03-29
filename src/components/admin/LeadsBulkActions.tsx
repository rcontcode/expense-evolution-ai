import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Tag, GitBranch, Download, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface LeadsBulkActionsProps {
  selectedIds: Set<string>;
  allLeads: QuizLead[];
  onClearSelection: () => void;
  allTags?: string[];
}

const PIPELINE_STAGES = [
  { value: 'new', label: 'Nuevo', color: 'bg-gray-500' },
  { value: 'contacted', label: 'Contactado', color: 'bg-blue-500' },
  { value: 'qualified', label: 'Calificado', color: 'bg-amber-500' },
  { value: 'negotiation', label: 'Negociación', color: 'bg-purple-500' },
  { value: 'converted', label: 'Convertido', color: 'bg-green-500' },
];

export function LeadsBulkActions({ selectedIds, allLeads, onClearSelection, allTags = [] }: LeadsBulkActionsProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<string | null>(null);

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
      const updates = Array.from(selectedIds).map(id =>
        supabase.from('quiz_leads').update({ contacted_at: now }).eq('id', id)
      );
      await Promise.all(updates);
      invalidateAll();
      toast.success(`✅ ${count} leads marcados como contactados`);
      onClearSelection();
    } catch (err) {
      toast.error('Error al marcar contactados');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkTag = async (tag: string) => {
    setIsProcessing(true);
    try {
      const updates = Array.from(selectedIds).map(async (id) => {
        const lead = allLeads.find(l => l.id === id);
        const currentTags: string[] = (lead?.tags as string[]) || [];
        if (currentTags.includes(tag)) return;
        const newTags = [...currentTags, tag];
        return supabase.from('quiz_leads').update({ tags: newTags }).eq('id', id);
      });
      await Promise.all(updates);
      invalidateAll();
      toast.success(`🏷️ Tag "${tag}" aplicado a ${count} leads`);
      onClearSelection();
      setAction(null);
    } catch (err) {
      toast.error('Error al etiquetar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPipeline = async (stage: string) => {
    setIsProcessing(true);
    try {
      const updates = Array.from(selectedIds).map(id =>
        supabase.from('quiz_leads').update({ pipeline_stage: stage }).eq('id', id)
      );
      await Promise.all(updates);
      invalidateAll();
      const label = PIPELINE_STAGES.find(s => s.value === stage)?.label || stage;
      toast.success(`📊 ${count} leads movidos a "${label}"`);
      onClearSelection();
      setAction(null);
    } catch (err) {
      toast.error('Error al mover pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selected = allLeads.filter(l => selectedIds.has(l.id));
    const headers = ['Nombre', 'Email', 'Teléfono', 'País', 'Fuente', 'Score', 'Nivel', 'Prioridad', 'Fecha'];
    const rows = selected.map(l => [
      l.name, l.email, l.phone || '', l.country || '', l.source || 'evofinz',
      l.lead_score || l.quiz_score || 0, l.quiz_level || '', l.priority || '', l.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-seleccionados-${count}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`📥 ${count} leads exportados`);
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 backdrop-blur-sm shadow-sm">
      <Badge variant="secondary" className="text-sm font-semibold">
        {count} seleccionado{count !== 1 ? 's' : ''}
      </Badge>

      <div className="flex flex-wrap gap-1.5 ml-auto">
        {/* Mark contacted */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkContact}
          disabled={isProcessing}
          className="h-8 text-xs gap-1.5"
        >
          {isProcessing && action === 'contact' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
          Marcar contactados
        </Button>

        {/* Tag selector */}
        {allTags.length > 0 && (
          <Select onValueChange={handleBulkTag} disabled={isProcessing}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <Tag className="h-3 w-3 mr-1" />
              Etiquetar
            </SelectTrigger>
            <SelectContent>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Pipeline stage selector */}
        <Select onValueChange={handleBulkPipeline} disabled={isProcessing}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
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

        {/* Export */}
        <Button variant="outline" size="sm" onClick={handleBulkExport} className="h-8 text-xs gap-1.5">
          <Download className="h-3 w-3" />
          Exportar
        </Button>

        {/* Clear */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
