import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Users, CreditCard, Target, Plus, ExternalLink,
  Globe, Smartphone, TrendingUp, Activity, ArrowLeft, Copy, Check, 
  Pencil, MoreVertical, Zap, Clock, Send, Code, FileJson, Trash2,
  CheckCircle2, AlertCircle, Loader2, Phone,
} from 'lucide-react';
import { AdminUserOverview } from '@/components/admin/AdminUserOverview';
import { AdminSubscriptionsTab } from '@/components/admin/tabs/AdminSubscriptionsTab';
import { AdminLeadsTab } from '@/components/admin/tabs/AdminLeadsTab';
import { AdminActivityFeed } from '@/components/admin/tabs/AdminActivityFeed';
import { AdminContactQueueTab } from '@/components/admin/tabs/AdminContactQueueTab';
import { AdminAutomationTab } from '@/components/admin/tabs/AdminAutomationTab';
import { AdminCrossAppRanking } from '@/components/admin/tabs/AdminCrossAppRanking';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

// ─── Constants ───────────────────────────────────────────────
const WEBHOOK_BASE_URL = `https://oxrfslyuzcgxacomgzgw.supabase.co/functions/v1/webhook-leads`;

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
  beta: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  development: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  planned: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  live: { es: 'Producción', en: 'Live' },
  beta: { es: 'Beta', en: 'Beta' },
  development: { es: 'Desarrollo', en: 'Dev' },
  planned: { es: 'Planeado', en: 'Planned' },
};

const APP_ICONS = ['💰', '🧘', '🤝', '📱', '🚀', '🎯', '🧠', '💎', '🔥', '⚡', '🌐', '🛡️', '📊', '🎨', '🔔', '💼'];
const APP_COLORS = [
  { label: 'Emerald', value: 'from-emerald-500 to-teal-600' },
  { label: 'Violet', value: 'from-violet-500 to-purple-600' },
  { label: 'Sky', value: 'from-sky-500 to-blue-600' },
  { label: 'Rose', value: 'from-rose-500 to-pink-600' },
  { label: 'Amber', value: 'from-amber-500 to-yellow-600' },
  { label: 'Indigo', value: 'from-indigo-500 to-blue-700' },
  { label: 'Cyan', value: 'from-cyan-500 to-teal-500' },
  { label: 'Orange', value: 'from-orange-500 to-red-500' },
];

interface ManagedApp {
  id: string;
  name: string;
  description: string;
  url: string;
  status: string;
  app_type: string;
  icon: string;
  color: string;
  source_key: string;
  is_active: boolean;
  lead_count: number;
  webhook_url: string | null;
  created_at: string;
}

interface LeadStats {
  source: string;
  count: number;
  lastLead: string | null;
}

// ─── Component ───────────────────────────────────────────────
const AdminCRM = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<ManagedApp | null>(null);
  const [testingApp, setTestingApp] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ManagedApp | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formStatus, setFormStatus] = useState('development');
  const [formType, setFormType] = useState('web');
  const [formIcon, setFormIcon] = useState('📱');
  const [formColor, setFormColor] = useState(APP_COLORS[0].value);

  // ─── Queries ─────────────────────────────────────────────
  const { data: apps = [], isLoading: appsLoading } = useQuery({
    queryKey: ['managed-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('managed_apps')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ManagedApp[];
    },
  });

  const { data: leadStats = [] } = useQuery({
    queryKey: ['lead-stats-by-source'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('source, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const stats: Record<string, LeadStats> = {};
      (data || []).forEach((lead: any) => {
        const src = lead.source || 'evofinz';
        if (!stats[src]) {
          stats[src] = { source: src, count: 0, lastLead: lead.created_at };
        }
        stats[src].count++;
      });
      return Object.values(stats);
    },
  });

  const { data: userCount } = useQuery({
    queryKey: ['crm-user-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: leadCount } = useQuery({
    queryKey: ['crm-lead-count'],
    queryFn: async () => {
      const { count } = await supabase.from('quiz_leads').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: paidCount } = useQuery({
    queryKey: ['crm-paid-count'],
    queryFn: async () => {
      const { data } = await supabase.from('user_subscriptions').select('id').neq('plan_type', 'free').eq('is_active', true);
      return data?.length || 0;
    },
  });

  const { data: betaCount } = useQuery({
    queryKey: ['crm-beta-count'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id').eq('is_beta_tester', true);
      return data?.length || 0;
    },
  });

  // Get stats for an app
  const getAppStats = (sourceKey: string) => {
    return leadStats.find(s => 
      s.source === sourceKey || 
      s.source?.toLowerCase().includes(sourceKey.toLowerCase()) ||
      sourceKey?.toLowerCase().includes(s.source?.toLowerCase() || '')
    ) || { count: 0, lastLead: null };
  };

  // ─── Mutations ───────────────────────────────────────────
  const createApp = useMutation({
    mutationFn: async () => {
      const sourceKey = formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error } = await supabase.from('managed_apps').insert({
        name: formName.trim(),
        description: formDesc.trim(),
        url: formUrl.trim(),
        status: formStatus,
        app_type: formType,
        icon: formIcon,
        color: formColor,
        source_key: sourceKey,
        webhook_url: WEBHOOK_BASE_URL,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-apps'] });
      setNewAppOpen(false);
      resetForm();
      toast.success(isEs ? '✅ App registrada exitosamente' : '✅ App registered successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error creating app');
    },
  });

  const deleteApp = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase.from('managed_apps').update({ is_active: false }).eq('id', appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-apps'] });
      toast.success(isEs ? 'App eliminada' : 'App removed');
    },
  });

  const updateApp = useMutation({
    mutationFn: async () => {
      if (!editingApp) return;
      const { error } = await supabase.from('managed_apps').update({
        name: formName.trim(),
        description: formDesc.trim(),
        url: formUrl.trim(),
        status: formStatus,
        app_type: formType,
        icon: formIcon,
        color: formColor,
      }).eq('id', editingApp.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-apps'] });
      setEditingApp(null);
      setNewAppOpen(false);
      resetForm();
      toast.success(isEs ? '✅ App actualizada' : '✅ App updated');
    },
  });

  const testWebhook = useMutation({
    mutationFn: async (sourceKey: string) => {
      setTestingApp(sourceKey);
      const response = await fetch(WEBHOOK_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Lead',
          email: `test-${Date.now()}@webhook-test.com`,
          phone: '+1234567890',
          score: 50,
          level: 'test',
          source: sourceKey,
        }),
      });
      if (!response.ok) throw new Error('Webhook failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-stats-by-source'] });
      queryClient.invalidateQueries({ queryKey: ['crm-lead-count'] });
      toast.success(
        isEs 
          ? `✅ Webhook funciona! Lead de prueba creado (score: ${data.lead_score})` 
          : `✅ Webhook works! Test lead created (score: ${data.lead_score})`
      );
    },
    onError: () => {
      toast.error(isEs ? '❌ Error en el webhook' : '❌ Webhook error');
    },
    onSettled: () => {
      setTestingApp(null);
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormUrl('');
    setFormStatus('development');
    setFormType('web');
    setFormIcon('📱');
    setFormColor(APP_COLORS[0].value);
    setEditingApp(null);
  };

  const openEditDialog = (app: ManagedApp) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormDesc(app.description);
    setFormUrl(app.url);
    setFormStatus(app.status);
    setFormType(app.app_type);
    setFormIcon(app.icon);
    setFormColor(app.color);
    setNewAppOpen(true);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(isEs ? '📋 Copiado' : '📋 Copied');
  };

  const generateSourceKey = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const formatRelativeTime = (date: string | null) => {
    if (!date) return isEs ? 'Sin leads' : 'No leads';
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: isEs ? es : enUS 
    });
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/beta-dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  🍊 CRM & Centro de Apps
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isEs
                    ? 'Gestiona usuarios, leads y suscripciones de todas tus apps'
                    : 'Manage users, leads and subscriptions across all your apps'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="px-3 py-1.5">
                <Activity className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                {apps.length} apps
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowDocs(true)}>
                <Code className="h-3.5 w-3.5 mr-1" />
                API Docs
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/beta-dashboard')}>
                <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
                Beta
              </Button>
            </div>
          </motion.div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isEs ? 'Usuarios' : 'Users', value: userCount || 0, gradient: 'from-violet-500 to-purple-600', emoji: '👥' },
              { label: 'Leads', value: leadCount || 0, gradient: 'from-red-500 to-orange-500', emoji: '🎯' },
              { label: isEs ? 'Suscriptores' : 'Subscribers', value: paidCount || 0, gradient: 'from-emerald-500 to-teal-600', emoji: '💳' },
              { label: 'Beta', value: betaCount || 0, gradient: 'from-amber-500 to-yellow-500', emoji: '🧪' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className={`p-4 bg-gradient-to-br ${stat.gradient} text-white`}>
                      <p className="text-xs text-white/80 font-medium">{stat.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl">{stat.emoji}</span>
                        <p className="text-3xl font-black">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Apps Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{isEs ? '🌐 Mis Apps' : '🌐 My Apps'}</CardTitle>
                      <CardDescription className="text-xs">
                        {isEs ? 'Click en una app para ver opciones' : 'Click an app for options'}
                      </CardDescription>
                    </div>
                  </div>
                  <Dialog open={newAppOpen} onOpenChange={(open) => { setNewAppOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        {isEs ? 'Nueva App' : 'New App'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingApp
                            ? (isEs ? `✏️ Editar ${editingApp.name}` : `✏️ Edit ${editingApp.name}`)
                            : (isEs ? '🚀 Registrar Nueva App' : '🚀 Register New App')}
                        </DialogTitle>
                        <DialogDescription>
                          {isEs
                            ? 'Completa los datos y obtén tu webhook URL'
                            : 'Fill in the details to get your webhook URL'}
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5 col-span-2">
                              <Label>{isEs ? 'Nombre' : 'Name'} *</Label>
                              <Input placeholder="TrustlyConnect" value={formName} onChange={(e) => setFormName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                              <Label>{isEs ? 'Descripción' : 'Description'}</Label>
                              <Input placeholder={isEs ? 'App de confianza financiera...' : 'Financial trust app...'} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                              <Label>URL</Label>
                              <Input placeholder="https://myapp.lovable.app" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} />
                            </div>
                          </div>

                          {/* Icon + Color */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label>{isEs ? 'Icono' : 'Icon'}</Label>
                              <div className="flex flex-wrap gap-1">
                                {APP_ICONS.map(icon => (
                                  <button key={icon} type="button" onClick={() => setFormIcon(icon)}
                                    className={`w-7 h-7 rounded text-base flex items-center justify-center border transition-all ${formIcon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/50'}`}>
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label>{isEs ? 'Color' : 'Color'}</Label>
                              <div className="flex flex-wrap gap-1">
                                {APP_COLORS.map(c => (
                                  <button key={c.value} type="button" onClick={() => setFormColor(c.value)}
                                    className={`w-7 h-7 rounded bg-gradient-to-br ${c.value} border-2 transition-all ${formColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`} />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Status + Type */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label>Status</Label>
                              <Select value={formStatus} onValueChange={setFormStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planned">⚪ {isEs ? 'Planeado' : 'Planned'}</SelectItem>
                                  <SelectItem value="development">🔵 {isEs ? 'Desarrollo' : 'Development'}</SelectItem>
                                  <SelectItem value="beta">🟡 Beta</SelectItem>
                                  <SelectItem value="live">🟢 {isEs ? 'Producción' : 'Live'}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label>{isEs ? 'Tipo' : 'Type'}</Label>
                              <Select value={formType} onValueChange={setFormType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="web">🌐 Web</SelectItem>
                                  <SelectItem value="mobile">📱 Mobile</SelectItem>
                                  <SelectItem value="api">⚡ API</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{isEs ? 'Vista previa' : 'Preview'}</Label>
                            <Card className="overflow-hidden border">
                              <div className={`h-1.5 bg-gradient-to-r ${formColor}`} />
                              <CardContent className="p-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{formIcon}</span>
                                  <div>
                                    <p className="font-bold text-sm">{formName || 'Mi App'}</p>
                                    <p className="text-[10px] text-muted-foreground">{formDesc || '...'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Webhook info */}
                          {!editingApp && formName.trim() && (
                            <div className="space-y-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                              <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                <Zap className="h-4 w-4" />
                                {isEs ? 'Tu Webhook' : 'Your Webhook'}
                              </h4>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">URL (POST)</Label>
                                  <div className="flex items-center gap-1">
                                    <code className="flex-1 text-[10px] p-1.5 rounded bg-background border font-mono truncate">{WEBHOOK_BASE_URL}</code>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => copyToClipboard(WEBHOOK_BASE_URL, 'url')}>
                                      {copiedField === 'url' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">Source Key</Label>
                                  <div className="flex items-center gap-1">
                                    <code className="flex-1 text-[10px] p-1.5 rounded bg-background border font-mono">{generateSourceKey(formName)}</code>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => copyToClipboard(generateSourceKey(formName), 'source')}>
                                      {copiedField === 'source' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setNewAppOpen(false); resetForm(); }}>
                          {isEs ? 'Cancelar' : 'Cancel'}
                        </Button>
                        <Button onClick={() => editingApp ? updateApp.mutate() : createApp.mutate()} disabled={!formName.trim() || createApp.isPending || updateApp.isPending}>
                          {(createApp.isPending || updateApp.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> 
                            : editingApp ? (isEs ? 'Guardar' : 'Save') : (isEs ? '🚀 Registrar' : '🚀 Register')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {apps.map((app, i) => {
                      const stats = getAppStats(app.source_key);
                      return (
                        <motion.div key={app.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.03 }}>
                          <Card 
                            className="overflow-hidden hover:shadow-lg transition-all group border-2 hover:border-primary/30 h-full cursor-pointer"
                            onClick={() => setSelectedApp(app)}
                          >
                            <div className={`h-1.5 bg-gradient-to-r ${app.color}`} />
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-2xl flex-shrink-0">{app.icon}</span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h3 className="font-bold truncate">{app.name}</h3>
                                      <Badge className={`text-[9px] px-1.5 py-0 ${STATUS_COLORS[app.status] || STATUS_COLORS.development} border`}>
                                        {(STATUS_LABELS[app.status] || STATUS_LABELS.development)[isEs ? 'es' : 'en']}
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{app.description}</p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => copyToClipboard(app.source_key, app.id)}>
                                      <Copy className="h-3.5 w-3.5 mr-2" />
                                      {isEs ? 'Copiar source key' : 'Copy source key'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => copyToClipboard(WEBHOOK_BASE_URL, 'webhook-' + app.id)}>
                                      <FileJson className="h-3.5 w-3.5 mr-2" />
                                      {isEs ? 'Copiar webhook URL' : 'Copy webhook URL'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => testWebhook.mutate(app.source_key)} disabled={testingApp === app.source_key}>
                                      {testingApp === app.source_key 
                                        ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        : <Send className="h-3.5 w-3.5 mr-2" />}
                                      {isEs ? 'Probar webhook' : 'Test webhook'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => openEditDialog(app)}>
                                      <Pencil className="h-3.5 w-3.5 mr-2" />
                                      {isEs ? 'Editar' : 'Edit'}
                                    </DropdownMenuItem>
                                    {app.url && (
                                      <DropdownMenuItem onClick={() => window.open(app.url, '_blank')}>
                                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                        {isEs ? 'Abrir app' : 'Open app'}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => deleteApp.mutate(app.id)}>
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      {isEs ? 'Eliminar' : 'Delete'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Stats row */}
                              <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[11px]">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Target className="h-3 w-3" />
                                      <span className="font-semibold text-foreground">{stats.count}</span>
                                      <span>leads</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{isEs ? 'Leads recibidos' : 'Leads received'}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-muted-foreground truncate">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{formatRelativeTime(stats.lastLead)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{isEs ? 'Último lead' : 'Last lead'}</TooltipContent>
                                </Tooltip>
                              </div>

                              {/* Source key */}
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <code className="text-[10px] text-muted-foreground font-mono truncate">source: {app.source_key}</code>
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); copyToClipboard(app.source_key, 'key-' + app.id); }}>
                                    {copiedField === 'key-' + app.id ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CRM Tabs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 p-1 bg-muted/50 rounded-xl h-12">
                <TabsTrigger value="users" className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold text-[11px] md:text-sm">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Usuarios' : 'Users'}</span>
                  <span className="sm:hidden">👥</span>
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold text-[11px] md:text-sm">
                  <Target className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Leads</span>
                  <span className="sm:hidden">🎯</span>
                </TabsTrigger>
                <TabsTrigger value="queue" className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold text-[11px] md:text-sm">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Contactar' : 'Queue'}</span>
                  <span className="sm:hidden">📞</span>
                </TabsTrigger>
                <TabsTrigger value="automation" className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg font-semibold text-[11px] md:text-sm">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Auto' : 'Auto'}</span>
                  <span className="sm:hidden">⚡</span>
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg font-semibold text-[11px] md:text-sm">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isEs ? 'Planes' : 'Plans'}</span>
                  <span className="sm:hidden">💳</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="users"><AdminUserOverview /></TabsContent>
              <TabsContent value="leads"><AdminLeadsTab language={language} sourceFilter={sourceFilter} onClearFilter={() => setSourceFilter(null)} /></TabsContent>
              <TabsContent value="queue"><AdminContactQueueTab language={language} /></TabsContent>
              <TabsContent value="automation"><AdminAutomationTab language={language} /></TabsContent>
              <TabsContent value="subscriptions"><AdminSubscriptionsTab language={language} /></TabsContent>
            </Tabs>
            <div className="sticky top-6"><AdminActivityFeed language={language} /></div>
          </motion.div>
        </div>

        {/* API Documentation Dialog */}
        <Dialog open={showDocs} onOpenChange={setShowDocs}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Documentation
              </DialogTitle>
              <DialogDescription>
                {isEs ? 'Integra cualquier app con el CRM de EvoFinz' : 'Integrate any app with the EvoFinz CRM'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                {/* Endpoint */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Endpoint
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge>POST</Badge>
                    <code className="flex-1 text-xs p-2 rounded bg-muted font-mono break-all">{WEBHOOK_BASE_URL}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(WEBHOOK_BASE_URL, 'docs-url')}>
                      {copiedField === 'docs-url' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Required fields */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">{isEs ? 'Campos requeridos' : 'Required fields'}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted">
                      <code className="text-xs font-mono">name</code>
                      <p className="text-[10px] text-muted-foreground">{isEs ? 'Nombre del contacto' : 'Contact name'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <code className="text-xs font-mono">email</code>
                      <p className="text-[10px] text-muted-foreground">{isEs ? 'Email válido' : 'Valid email'}</p>
                    </div>
                  </div>
                </div>

                {/* Optional fields */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">{isEs ? 'Campos opcionales' : 'Optional fields'}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { field: 'phone', desc: isEs ? 'Teléfono' : 'Phone' },
                      { field: 'score', desc: isEs ? 'Puntuación (0-100)' : 'Score (0-100)' },
                      { field: 'level', desc: isEs ? 'Nivel del quiz' : 'Quiz level' },
                      { field: 'source', desc: isEs ? '⚠️ Tu source_key' : '⚠️ Your source_key' },
                    ].map(f => (
                      <div key={f.field} className="p-2 rounded bg-muted">
                        <code className="text-xs font-mono">{f.field}</code>
                        <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example request */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    {isEs ? 'Ejemplo de request' : 'Example request'}
                  </h4>
                  <div className="relative">
                    <pre className="text-[11px] p-3 rounded bg-zinc-900 text-zinc-100 font-mono overflow-x-auto">
{`fetch("${WEBHOOK_BASE_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "+56912345678",
    score: 45,
    level: "beginner",
    source: "my-app-name"
  })
})`}
                    </pre>
                    <Button variant="secondary" size="sm" className="absolute top-2 right-2 h-7 text-xs" 
                      onClick={() => copyToClipboard(`fetch("${WEBHOOK_BASE_URL}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    name: "Juan Pérez",\n    email: "juan@example.com",\n    phone: "+56912345678",\n    score: 45,\n    level: "beginner",\n    source: "my-app-name"\n  })\n})`, 'docs-fetch')}>
                      {copiedField === 'docs-fetch' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy
                    </Button>
                  </div>
                </div>

                {/* cURL */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">cURL</h4>
                  <div className="relative">
                    <pre className="text-[11px] p-3 rounded bg-zinc-900 text-zinc-100 font-mono overflow-x-auto">
{`curl -X POST "${WEBHOOK_BASE_URL}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test","email":"test@test.com","source":"my-app"}'`}
                    </pre>
                    <Button variant="secondary" size="sm" className="absolute top-2 right-2 h-7 text-xs"
                      onClick={() => copyToClipboard(`curl -X POST "${WEBHOOK_BASE_URL}" -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","source":"my-app"}'`, 'docs-curl')}>
                      {copiedField === 'docs-curl' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Response */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {isEs ? 'Respuesta exitosa' : 'Success response'}
                  </h4>
                  <pre className="text-[11px] p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 font-mono">
{`{
  "success": true,
  "lead_id": "uuid-del-lead",
  "lead_score": 40,
  "priority": "warm",
  "message": "Lead received successfully"
}`}
                  </pre>
                </div>

                {/* Error */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    {isEs ? 'Respuesta de error' : 'Error response'}
                  </h4>
                  <pre className="text-[11px] p-3 rounded bg-destructive/10 border border-destructive/30 font-mono">
{`{
  "error": "Fields 'name' and 'email' are required"
}`}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* App Details Modal */}
        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
          <DialogContent className="max-w-lg">
            {selectedApp && (
              <>
                <DialogHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedApp.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {selectedApp.icon}
                    </div>
                    <div>
                      <DialogTitle className="flex items-center gap-2">
                        {selectedApp.name}
                        <Badge className={`text-[10px] ${STATUS_COLORS[selectedApp.status] || STATUS_COLORS.development} border`}>
                          {(STATUS_LABELS[selectedApp.status] || STATUS_LABELS.development)[isEs ? 'es' : 'en']}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-xs mt-0.5">{selectedApp.description}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-primary">{getAppStats(selectedApp.source_key).count}</p>
                    <p className="text-[11px] text-muted-foreground">{isEs ? 'Leads totales' : 'Total leads'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm font-medium">{formatRelativeTime(getAppStats(selectedApp.source_key).lastLead)}</p>
                    <p className="text-[11px] text-muted-foreground">{isEs ? 'Último lead' : 'Last lead'}</p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isEs ? 'Acciones rápidas' : 'Quick actions'}</h4>
                  <div className="grid gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start h-11 text-left"
                      onClick={() => {
                        setSourceFilter(selectedApp.source_key);
                        setSelectedApp(null);
                        setActiveTab('leads');
                      }}
                    >
                      <Target className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{isEs ? 'Ver leads de esta app' : 'View leads from this app'}</p>
                        <p className="text-[10px] text-muted-foreground">{isEs ? 'Filtra la tabla por esta fuente' : 'Filter table by this source'}</p>
                      </div>
                    </Button>

                    {selectedApp.url && (
                      <Button 
                        variant="outline" 
                        className="justify-start h-11 text-left"
                        onClick={() => window.open(selectedApp.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2 text-sky-500" />
                        <div>
                          <p className="font-medium text-sm">{isEs ? 'Abrir app' : 'Open app'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">{selectedApp.url}</p>
                        </div>
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      className="justify-start h-11 text-left"
                      onClick={() => testWebhook.mutate(selectedApp.source_key)}
                      disabled={testingApp === selectedApp.source_key}
                    >
                      {testingApp === selectedApp.source_key 
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Send className="h-4 w-4 mr-2 text-emerald-500" />}
                      <div>
                        <p className="font-medium text-sm">{isEs ? 'Probar webhook' : 'Test webhook'}</p>
                        <p className="text-[10px] text-muted-foreground">{isEs ? 'Envía un lead de prueba' : 'Send a test lead'}</p>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Webhook info */}
                <div className="space-y-2 mt-3 p-3 rounded-lg bg-muted/30 border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="h-3 w-3" />
                    {isEs ? 'Integración' : 'Integration'}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Source Key</Label>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 text-xs p-2 rounded bg-background border font-mono">{selectedApp.source_key}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(selectedApp.source_key, 'detail-source')}>
                          {copiedField === 'detail-source' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Webhook URL</Label>
                      <div className="flex items-center gap-1">
                        <code className="flex-1 text-[10px] p-2 rounded bg-background border font-mono truncate">{WEBHOOK_BASE_URL}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(WEBHOOK_BASE_URL, 'detail-url')}>
                          {copiedField === 'detail-url' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 mt-3">
                  <Button variant="outline" onClick={() => { openEditDialog(selectedApp); setSelectedApp(null); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    {isEs ? 'Editar' : 'Edit'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowDocs(true); setSelectedApp(null); }}>
                    <Code className="h-4 w-4 mr-2" />
                    API Docs
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </Layout>
  );
};

export default AdminCRM;
