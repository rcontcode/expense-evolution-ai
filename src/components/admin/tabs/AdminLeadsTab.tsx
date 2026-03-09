import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ExternalLink, Flame, Phone, UserCheck, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { calculateLeadScore, getLeadPriority, getPriorityColors } from '@/hooks/admin/useLeadScoring';
import { cn } from '@/lib/utils';

interface Props {
  language: 'es' | 'en';
}

export const AdminLeadsTab = ({ language }: Props) => {
  const isEs = language === 'es';
  const navigate = useNavigate();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['admin-leads-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l: any) => l.contacted_at).length;
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

  // Top 10 hot leads
  const hotLeads = useMemo(() => {
    return leads
      .map((lead: any) => ({ ...lead, score: calculateLeadScore(lead), priority: getLeadPriority(calculateLeadScore(lead)) }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);
  }, [leads]);

  if (isLoading) {
    return <Card className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
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

      {/* Hot leads table */}
      <Card className="border-2 border-red-100 dark:border-red-900/50 shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <Flame className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>{isEs ? '🔥 Top 10 Leads Prioritarios' : '🔥 Top 10 Priority Leads'}</CardTitle>
                <CardDescription>{isEs ? 'Leads con mayor potencial de conversión' : 'Leads with highest conversion potential'}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/leads')} className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              {isEs ? 'Ver todos' : 'View all'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">#</TableHead>
                <TableHead className="font-bold">{isEs ? 'Nombre' : 'Name'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'País' : 'Country'}</TableHead>
                <TableHead className="text-center font-bold">Score</TableHead>
                <TableHead className="font-bold">{isEs ? 'Estado' : 'Status'}</TableHead>
                <TableHead className="font-bold">{isEs ? 'Fecha' : 'Date'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotLeads.map((lead: any, i: number) => {
                const colors = getPriorityColors(lead.priority);
                return (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className={cn('hover:bg-muted/30', colors.row)}>
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
                    <TableCell className="text-sm">{lead.country}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={colors.badge}>{lead.score}pts</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.contacted_at && <Badge variant="outline" className="text-[10px]"><Phone className="h-2.5 w-2.5 mr-0.5" />✓</Badge>}
                        {lead.converted_to_user && <Badge className="text-[10px] bg-emerald-600"><UserCheck className="h-2.5 w-2.5 mr-0.5" />✓</Badge>}
                        {!lead.contacted_at && !lead.converted_to_user && <Badge variant="secondary" className="text-[10px]">{isEs ? 'Nuevo' : 'New'}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), 'dd MMM', { locale: isEs ? esLocale : undefined })}
                    </TableCell>
                  </motion.tr>
                );
              })}
              {hotLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
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
