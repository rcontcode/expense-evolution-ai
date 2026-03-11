import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Merge, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { calculateLeadScore, getLeadPriority, getPriorityColors } from '@/hooks/admin/useLeadScoring';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allLeads: QuizLead[];
}

export function LeadMergeDialog({ open, onOpenChange, allLeads }: Props) {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [step, setStep] = useState<'search' | 'confirm'>('search');

  const duplicates = useMemo(() => {
    if (!searchEmail || searchEmail.length < 3) return [];
    const lower = searchEmail.toLowerCase();
    return allLeads.filter(l => l.email.toLowerCase().includes(lower));
  }, [searchEmail, allLeads]);

  const groupedByEmail = useMemo(() => {
    const groups: Record<string, QuizLead[]> = {};
    duplicates.forEach(l => {
      const key = l.email.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    // Only show groups with actual duplicates
    return Object.entries(groups).filter(([, leads]) => leads.length > 1);
  }, [duplicates]);

  const selectedGroup = useMemo(() => {
    if (!primaryId) return null;
    for (const [email, leads] of groupedByEmail) {
      if (leads.some(l => l.id === primaryId)) return { email, leads };
    }
    return null;
  }, [primaryId, groupedByEmail]);

  const handleMerge = async () => {
    if (!selectedGroup || !primaryId) return;
    setMerging(true);

    try {
      const primary = selectedGroup.leads.find(l => l.id === primaryId)!;
      const secondaries = selectedGroup.leads.filter(l => l.id !== primaryId);
      const secondaryIds = secondaries.map(l => l.id);

      // Merge: update primary with best data from secondaries
      const mergedMetadata: Record<string, unknown> = {
        ...(primary.metadata as Record<string, unknown> || {}),
        merged_from: secondaryIds,
        merged_at: new Date().toISOString(),
        merged_sources: secondaries.map(l => l.source),
      };

      // Keep the best phone, comments, etc.
      const bestPhone = primary.phone || secondaries.find(l => l.phone)?.phone || null;
      const bestComments = [primary.comments, ...secondaries.map(l => l.comments)]
        .filter(Boolean)
        .join(' | ') || null;
      const bestCountry = primary.country || secondaries.find(l => l.country)?.country || '';

      // Recalculate score with merged data
      const bestScore = Math.max(
        calculateLeadScore(primary),
        ...secondaries.map(l => calculateLeadScore(l))
      );

      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({
          phone: bestPhone,
          comments: bestComments,
          country: bestCountry,
          lead_score: bestScore,
          priority: getLeadPriority(bestScore),
          metadata: mergedMetadata,
          contacted_at: primary.contacted_at || secondaries.find(l => l.contacted_at)?.contacted_at || null,
          converted_to_user: primary.converted_to_user || secondaries.some(l => l.converted_to_user),
        })
        .eq('id', primaryId);

      if (updateError) throw updateError;

      // Mark secondaries as merged (soft delete via metadata)
      for (const secId of secondaryIds) {
        await supabase
          .from('quiz_leads')
          .update({
            metadata: {
              merged_into: primaryId,
              merged_at: new Date().toISOString(),
              _merged: true,
            },
          })
          .eq('id', secId);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast.success(`${secondaryIds.length} lead(s) fusionados en el registro principal`);
      setStep('search');
      setPrimaryId(null);
      setSearchEmail('');
      onOpenChange(false);
    } catch (err) {
      console.error('Merge error:', err);
      toast.error('Error al fusionar leads');
    } finally {
      setMerging(false);
    }
  };

  const reset = () => {
    setStep('search');
    setPrimaryId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            Fusionar Leads Duplicados
          </DialogTitle>
          <DialogDescription>
            Busca por email para encontrar duplicados y fusionar registros manualmente
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchEmail.length >= 3 && groupedByEmail.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Check className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  No se encontraron duplicados para este email
                </div>
              )}

              {groupedByEmail.map(([email, leads]) => (
                <Card key={email} className="border-amber-300 bg-amber-50/30 dark:bg-amber-900/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-bold">{email}</span>
                        <Badge variant="destructive" className="text-[10px]">
                          {leads.length} duplicados
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPrimaryId(leads[0].id);
                          setStep('confirm');
                        }}
                      >
                        <Merge className="h-3 w-3 mr-1" />
                        Fusionar
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {leads.map(l => {
                        const score = calculateLeadScore(l);
                        const priority = getLeadPriority(score);
                        const colors = getPriorityColors(priority);
                        return (
                          <div key={l.id} className="flex items-center gap-2 text-xs p-2 rounded bg-background border">
                            <Badge className={`text-[9px] ${colors.badge}`}>{priority.toUpperCase()}</Badge>
                            <span className="font-medium">{l.source}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{format(new Date(l.created_at), 'dd/MM/yyyy')}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-mono">{score}pts</span>
                            {l.contacted_at && <Badge variant="outline" className="text-[9px]">✓ Contactado</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 'confirm' && selectedGroup && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={reset}>← Volver a búsqueda</Button>
              
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/30 dark:bg-amber-900/10">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Selecciona el registro principal (se conservará)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Los datos únicos de los demás se fusionarán en este registro. Los secundarios serán marcados como fusionados.
                </p>
              </div>

              <RadioGroup value={primaryId || ''} onValueChange={setPrimaryId}>
                {selectedGroup.leads.map(l => {
                  const score = calculateLeadScore(l);
                  const priority = getLeadPriority(score);
                  const colors = getPriorityColors(priority);
                  const isSelected = primaryId === l.id;
                  return (
                    <div
                      key={l.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                      onClick={() => setPrimaryId(l.id)}
                    >
                      <RadioGroupItem value={l.id} id={l.id} className="mt-1" />
                      <Label htmlFor={l.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{l.name}</span>
                          <Badge className={`text-[9px] ${colors.badge}`}>{priority.toUpperCase()} ({score}pts)</Badge>
                          {isSelected && <Badge className="text-[9px] bg-primary text-primary-foreground">Principal</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Source: <strong>{l.source}</strong></span>
                          <span>Fecha: {format(new Date(l.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          <span>Quiz: {l.quiz_score}% ({l.quiz_level})</span>
                          <span>País: {l.country || '—'}</span>
                          {l.phone && <span>Tel: {l.phone}</span>}
                          {l.comments && <span className="col-span-2 truncate">💬 {l.comments}</span>}
                          {l.contacted_at && <span className="text-emerald-600">✓ Contactado</span>}
                          {l.converted_to_user && <span className="text-emerald-600">✓ Convertido</span>}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}
        </ScrollArea>

        {step === 'confirm' && (
          <DialogFooter>
            <Button variant="outline" onClick={reset}>Cancelar</Button>
            <Button
              onClick={handleMerge}
              disabled={!primaryId || merging}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {merging ? 'Fusionando...' : `Fusionar ${(selectedGroup?.leads.length || 2) - 1} registro(s)`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
