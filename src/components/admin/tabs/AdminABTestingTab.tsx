import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FlaskConical, Trophy, Pause, Play, BarChart3 } from 'lucide-react';

interface Props { language: string; }

const TEMPLATES = [
  'crm-lead-outreach',
  'crm-fokuspark-outreach',
  'crm-universmind-outreach',
  'crm-follow-up',
];

export function AdminABTestingTab({ language }: Props) {
  const es = language === 'es';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [templateA, setTemplateA] = useState('');
  const [templateB, setTemplateB] = useState('');

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ['ab-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_ab_results')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('email_ab_tests').insert({
        name, template_a: templateA, template_b: templateB,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-tests'] });
      setOpen(false);
      setName(''); setTemplateA(''); setTemplateB('');
      toast.success(es ? '✅ Test A/B creado' : '✅ A/B test created');
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'paused' : 'active';
      const { error } = await supabase.from('email_ab_tests').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ab-tests'] }),
  });

  const declareWinner = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('email_ab_tests').update({ status: 'completed' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success(es ? '🏆 Test completado' : '🏆 Test completed');
    },
  });

  const getStats = (testId: string, variant: string) => {
    const r = results.filter((res: any) => res.test_id === testId && res.variant === variant);
    return {
      sent: r.length,
      opened: r.filter((x: any) => x.opened).length,
      clicked: r.filter((x: any) => x.clicked).length,
      converted: r.filter((x: any) => x.converted).length,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          {es ? 'Tests A/B de Email' : 'Email A/B Tests'}
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{es ? 'Nuevo Test' : 'New Test'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{es ? 'Crear Test A/B' : 'Create A/B Test'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{es ? 'Nombre' : 'Name'}</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div>
                <Label>Template A</Label>
                <Select value={templateA} onValueChange={setTemplateA}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template B</Label>
                <Select value={templateB} onValueChange={setTemplateB}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createTest.mutate()} disabled={!name || !templateA || !templateB}>
                {es ? 'Crear' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{es ? 'Cargando...' : 'Loading...'}</p>
      ) : tests.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">
          {es ? 'No hay tests A/B activos' : 'No active A/B tests'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test: any) => {
            const statsA = getStats(test.id, 'A');
            const statsB = getStats(test.id, 'B');
            return (
              <Card key={test.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {test.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={test.status === 'active' ? 'default' : test.status === 'completed' ? 'secondary' : 'outline'}>
                        {test.status}
                      </Badge>
                      {test.status !== 'completed' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus.mutate({ id: test.id, status: test.status })}>
                            {test.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => declareWinner.mutate({ id: test.id })}>
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: 'A', template: test.template_a, stats: statsA }, { label: 'B', template: test.template_b, stats: statsB }].map(v => (
                      <div key={v.label} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-bold">{es ? 'Variante' : 'Variant'} {v.label}</Badge>
                          <span className="text-xs text-muted-foreground">{v.template}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { label: es ? 'Enviados' : 'Sent', val: v.stats.sent },
                            { label: es ? 'Abiertos' : 'Opened', val: v.stats.opened },
                            { label: 'Clicks', val: v.stats.clicked },
                            { label: es ? 'Convertidos' : 'Converted', val: v.stats.converted },
                          ].map(m => (
                            <div key={m.label}>
                              <p className="text-lg font-bold">{m.val}</p>
                              <p className="text-[10px] text-muted-foreground">{m.label}</p>
                            </div>
                          ))}
                        </div>
                        {v.stats.sent > 0 && (
                          <div className="text-xs text-muted-foreground text-center">
                            {es ? 'Tasa apertura' : 'Open rate'}: {Math.round((v.stats.opened / v.stats.sent) * 100)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
