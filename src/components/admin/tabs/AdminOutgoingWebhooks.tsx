import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Webhook, Send, Trash2, Eye, Copy, Check, Loader2 } from 'lucide-react';

interface Props { language: string; }

const EVENT_OPTIONS = [
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'lead_contacted', label: 'Lead Contacted' },
  { value: 'lead_converted', label: 'Lead Converted' },
  { value: 'pipeline_changed', label: 'Pipeline Changed' },
  { value: 'lead_tagged', label: 'Lead Tagged' },
];

export function AdminOutgoingWebhooks({ language }: Props) {
  const es = language === 'es';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const { data: webhooks = [] } = useQuery({
    queryKey: ['outgoing-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('outgoing_webhooks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['webhook-logs', showLogs],
    enabled: !!showLogs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outgoing_webhook_logs')
        .select('*')
        .eq('webhook_id', showLogs!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const createWebhook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('outgoing_webhooks').insert({ name, url, events });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outgoing-webhooks'] });
      setOpen(false); setName(''); setUrl(''); setEvents([]);
      toast.success(es ? '✅ Webhook creado' : '✅ Webhook created');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('outgoing_webhooks').update({ is_active: !active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outgoing-webhooks'] }),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('outgoing_webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outgoing-webhooks'] });
      toast.success(es ? 'Webhook eliminado' : 'Webhook deleted');
    },
  });

  const testWebhook = useMutation({
    mutationFn: async (wh: any) => {
      setTesting(wh.id);
      const { error } = await supabase.functions.invoke('dispatch-outgoing-webhook', {
        body: {
          event: 'lead_created',
          payload: { id: 'test-123', name: 'Test Lead', email: 'test@example.com', source: 'test', priority: 'warm' },
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-logs'] });
      toast.success(es ? '✅ Test enviado' : '✅ Test sent');
    },
    onSettled: () => setTesting(null),
  });

  const toggleEvent = (ev: string) => {
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(id);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          {es ? 'Webhooks Salientes' : 'Outgoing Webhooks'}
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{es ? 'Nuevo' : 'New'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{es ? 'Crear Webhook' : 'Create Webhook'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{es ? 'Nombre' : 'Name'}</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="My Integration" /></div>
              <div><Label>URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
              <div>
                <Label>{es ? 'Eventos' : 'Events'}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EVENT_OPTIONS.map(ev => (
                    <Badge key={ev.value} variant={events.includes(ev.value) ? 'default' : 'outline'}
                      className="cursor-pointer" onClick={() => toggleEvent(ev.value)}>
                      {ev.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createWebhook.mutate()} disabled={!name || !url || events.length === 0}>
                {es ? 'Crear' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">
          {es ? 'No hay webhooks configurados' : 'No webhooks configured'}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh: any) => (
            <Card key={wh.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{wh.name}</h4>
                    <Switch checked={wh.is_active} onCheckedChange={() => toggleActive.mutate({ id: wh.id, active: wh.is_active })} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => testWebhook.mutate(wh)} disabled={testing === wh.id}>
                      {testing === wh.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLogs(showLogs === wh.id ? null : wh.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteWebhook.mutate(wh.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono mb-2">{wh.url}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(wh.events || []).map((ev: string) => <Badge key={ev} variant="secondary" className="text-[10px]">{ev}</Badge>)}
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => copySecret(wh.secret_key, wh.id)}>
                    {copiedSecret === wh.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    Secret
                  </Button>
                </div>

                {showLogs === wh.id && logs.length > 0 && (
                  <ScrollArea className="mt-3 max-h-48 border rounded-lg">
                    <div className="p-2 space-y-1">
                      {logs.map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                          <Badge variant="outline" className="text-[10px]">{log.event}</Badge>
                          <Badge variant={log.response_status && log.response_status < 300 ? 'default' : 'destructive'} className="text-[10px]">
                            {log.response_status || 'ERR'}
                          </Badge>
                          <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
