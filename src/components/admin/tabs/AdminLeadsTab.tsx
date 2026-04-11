import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ExternalLink, Flame, Phone, UserCheck, MessageSquare, Copy, CheckCircle, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { calculateLeadScore, getLeadPriority, getPriorityColors } from '@/hooks/admin/useLeadScoring';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  language: 'es' | 'en';
  sourceFilter?: string | null;
  onClearFilter?: () => void;
}

export const AdminLeadsTab = ({ language, sourceFilter, onClearFilter }: Props) => {
  const isEs = language === 'es';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc'); // desc = newest first

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['admin-leads-summary', sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sourceFilter) {
        query = query.ilike('source', `%${sourceFilter}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const sortedLeads = useMemo(() => {
    const sorted = [...leads];
    sorted.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [leads, sortDirection]);

  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l: any) => l.contacted_at && !l.contact_notes?.startsWith('[AUTO]')).length;
    const converted = leads.filter((l: any) => l.converted_to_user).length;
    const withComments = leads.filter((l: any) => l.comments).length;
    const priorities = { hot: 0, warm: 0, cool: 0, cold: 0 };
    leads.forEach((lead: any) => {
      const score = calculateLeadScore(lead);
      const p = getLeadPriority(score);
      priorities[p]++;
    });
    return { total, contacted, converted, withComments, priorities };
  }, [leads]);

  const scoredLeads = useMemo(() => {
    return sortedLeads.map((lead: any) => ({
      ...lead,
      score: calculateLeadScore(lead),
      priority: getLeadPriority(calculateLeadScore(lead)),
    }));
  }, [sortedLeads]);

  const handleMarkContacted = async (leadId: string) => {
    setContactingId(leadId);
    try {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ contacted_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
      toast.success(isEs ? '✅ Lead marcado como contactado' : '✅ Lead marked as contacted');
      queryClient.invalidateQueries({ queryKey: ['admin-leads-summary'] });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setContactingId(null);
    }
  };

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('quiz_leads')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-lead-count'] });
      setSelectedIds(new Set());
      toast.success(isEs ? '🗑️ Leads eliminados' : '🗑️ Leads deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting leads');
    },
  });

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(isEs ? `¿Eliminar ${count} lead(s) seleccionado(s)? Esta acción no se puede deshacer.` : `Delete ${count} selected lead(s)? This cannot be undone.`)) return;
    bulkDelete.mutate(Array.from(selectedIds));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === scoredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scoredLeads.map((l: any) => l.id)));
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Active filter indicator */}
      {sourceFilter && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary">
              {isEs ? 'Filtrando por:' : 'Filtering by:'} {sourceFilter}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {leads.length} {isEs ? 'leads encontrados' : 'leads found'}
            </span>
          </div>
          {onClearFilter && (
            <Button variant="ghost" size="sm" onClick={onClearFilter}>
              {isEs ? '✕ Quitar filtro' : '✕ Clear filter'}
            </Button>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-3xl font-black text-red-600">🔥 {stats.priorities.hot}</p>
            <p className="text-xs font-bold text-red-600">HOT</p>
          </CardContent>
        </Card>
        <Card className="text-center border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <p className="text-3xl font-black text-orange-600">🌡️ {stats.priorities.warm}</p>
            <p className="text-xs font-bold text-orange-600">WARM</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-black">{stats.contacted}</p>
            <p className="text-xs font-bold text-muted-foreground">{isEs ? 'Contactados' : 'Contacted'}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-3xl font-black text-emerald-600">{stats.converted}</p>
            <p className="text-xs font-bold text-emerald-600">{isEs ? 'Convertidos' : 'Converted'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <span className="text-sm font-medium">
            {selectedIds.size} {isEs ? 'seleccionado(s)' : 'selected'}
          </span>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={handleBulkDelete}
            disabled={bulkDelete.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isEs ? 'Eliminar seleccionados' : 'Delete selected'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            {isEs ? 'Deseleccionar' : 'Deselect all'}
          </Button>
        </motion.div>
      )}

      {/* All leads table */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{isEs ? '📋 Todos los Leads' : '📋 All Leads'} ({scoredLeads.length})</CardTitle>
                <CardDescription>{isEs ? 'Lista completa con selección múltiple' : 'Full list with multi-select'}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/leads')} className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              {isEs ? 'Vista completa' : 'Full view'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10">
                  <Checkbox
                    checked={scoredLeads.length > 0 && selectedIds.size === scoredLeads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold">#</TableHead>
                <TableHead className="font-bold">{isEs ? 'Nombre' : 'Name'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'Fuente' : 'Source'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'País' : 'Country'}</TableHead>
                <TableHead className="text-center font-bold">Score</TableHead>
                <TableHead className="font-bold">{isEs ? 'Estado' : 'Status'}</TableHead>
                <TableHead className="font-bold">
                  <button
                    onClick={toggleSortDirection}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {isEs ? 'Fecha' : 'Date'}
                    {sortDirection === 'desc' ? (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-center font-bold">{isEs ? 'Acción' : 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoredLeads.map((lead: any, i: number) => {
                const colors = getPriorityColors(lead.priority);
                const sourceLabel = (lead.source || 'evofinz').toLowerCase();
                const sourceEmoji = sourceLabel.includes('fokus') ? '🧠' : sourceLabel.includes('univers') ? '🌌' : '💰';
                const sourceName = sourceLabel.includes('fokus') ? 'Fokuspark' : sourceLabel.includes('univers') ? 'UniversMind' : 'EvoFinz';
                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className={cn(
                      'hover:bg-muted/30',
                      colors.row,
                      selectedIds.has(lead.id) && 'bg-primary/5'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{lead.name}</span>
                          {lead.comments && <MessageSquare className="h-3 w-3 text-amber-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {sourceEmoji} {sourceName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{lead.country}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={colors.badge}>{lead.score}pts</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.contacted_at && lead.contact_notes?.startsWith('[AUTO]') && (
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground"><Phone className="h-2.5 w-2.5 mr-0.5" />Auto</Badge>
                        )}
                        {lead.contacted_at && !lead.contact_notes?.startsWith('[AUTO]') && (
                          <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600"><Phone className="h-2.5 w-2.5 mr-0.5" />✓</Badge>
                        )}
                        {lead.converted_to_user && <Badge className="text-[10px] bg-emerald-600"><UserCheck className="h-2.5 w-2.5 mr-0.5" />✓</Badge>}
                        {!lead.contacted_at && !lead.converted_to_user && <Badge variant="secondary" className="text-[10px]">{isEs ? 'Nuevo' : 'New'}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: isEs ? esLocale : undefined })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 justify-center">
                        {!lead.contacted_at && !lead.converted_to_user && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs gap-1"
                            onClick={() => handleMarkContacted(lead.id)}
                            disabled={contactingId === lead.id}
                          >
                            <CheckCircle className="h-3 w-3" /> {isEs ? 'Contactar' : 'Contact'}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => { navigator.clipboard.writeText(lead.email); toast.success(isEs ? 'Email copiado' : 'Email copied'); }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
              {scoredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{isEs ? 'No hay leads aún' : 'No leads yet'}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
