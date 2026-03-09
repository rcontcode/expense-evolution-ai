import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  LayoutDashboard, Users, CreditCard, Target, Plus, ExternalLink,
  Globe, Smartphone, TrendingUp, Activity, ArrowLeft, Copy, Check, Trash2, Pencil,
} from 'lucide-react';
import { AdminUserOverview } from '@/components/admin/AdminUserOverview';
import { AdminSubscriptionsTab } from '@/components/admin/tabs/AdminSubscriptionsTab';
import { AdminLeadsTab } from '@/components/admin/tabs/AdminLeadsTab';
import { AdminActivityFeed } from '@/components/admin/tabs/AdminActivityFeed';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────
const WEBHOOK_BASE_URL = `https://oxrfslyuzcgxacomgzgw.supabase.co/functions/v1/webhook-leads`;

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  beta: 'bg-amber-100 text-amber-700 border-amber-300',
  development: 'bg-blue-100 text-blue-700 border-blue-300',
  planned: 'bg-gray-100 text-gray-600 border-gray-300',
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  live: { es: '🟢 Producción', en: '🟢 Live' },
  beta: { es: '🟡 Beta', en: '🟡 Beta' },
  development: { es: '🔵 Desarrollo', en: '🔵 Dev' },
  planned: { es: '⚪ Planeado', en: '⚪ Planned' },
};

const APP_ICONS = ['💰', '🧘', '🤝', '📱', '🚀', '🎯', '🧠', '💎', '🔥', '⚡', '🌐', '🛡️'];
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

// ─── Component ───────────────────────────────────────────────
const AdminCRM = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<ManagedApp | null>(null);

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
    toast.success(isEs ? 'Copiado al portapapeles' : 'Copied to clipboard');
  };

  const generateSourceKey = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <Layout>
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
                  ? 'Gestiona usuarios, leads y suscripciones de todas tus apps desde un solo lugar'
                  : 'Manage users, leads and subscriptions across all your apps from one place'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              {apps.length} {isEs ? 'apps' : 'apps'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/beta-dashboard')}>
              <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
              Beta Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isEs ? 'Usuarios Total' : 'Total Users', value: userCount || 0, gradient: 'from-violet-500 to-purple-600', emoji: '👥' },
            { label: 'Leads', value: leadCount || 0, gradient: 'from-red-500 to-orange-500', emoji: '🎯' },
            { label: isEs ? 'Suscriptores' : 'Subscribers', value: paidCount || 0, gradient: 'from-emerald-500 to-teal-600', emoji: '💳' },
            { label: 'Beta Testers', value: betaCount || 0, gradient: 'from-amber-500 to-yellow-500', emoji: '🧪' },
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{isEs ? '🌐 Mis Apps' : '🌐 My Apps'}</CardTitle>
                    <CardDescription>
                      {isEs
                        ? 'Todas las aplicaciones gestionadas desde este CRM'
                        : 'All applications managed from this CRM'}
                    </CardDescription>
                  </div>
                </div>
                <Dialog open={newAppOpen} onOpenChange={(open) => { setNewAppOpen(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      {isEs ? 'Nueva App' : 'New App'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingApp
                          ? (isEs ? `✏️ Editar ${editingApp.name}` : `✏️ Edit ${editingApp.name}`)
                          : (isEs ? '🚀 Registrar Nueva App' : '🚀 Register New App')}
                      </DialogTitle>
                      <DialogDescription>
                        {isEs
                          ? 'Completa los datos y obtén tu webhook URL instantáneamente'
                          : 'Fill in the details and get your webhook URL instantly'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label>{isEs ? 'Nombre de la app' : 'App name'} *</Label>
                        <Input
                          placeholder="TrustlyConnect"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <Label>{isEs ? 'Descripción' : 'Description'}</Label>
                        <Input
                          placeholder={isEs ? 'App de confianza financiera...' : 'Financial trust app...'}
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                        />
                      </div>

                      {/* URL */}
                      <div className="space-y-1.5">
                        <Label>URL</Label>
                        <Input
                          placeholder="https://myapp.lovable.app"
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                        />
                      </div>

                      {/* Icon + Color row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>{isEs ? 'Icono' : 'Icon'}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {APP_ICONS.map(icon => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => setFormIcon(icon)}
                                className={`w-8 h-8 rounded-md text-lg flex items-center justify-center border transition-all ${formIcon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/50'}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{isEs ? 'Color' : 'Color'}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {APP_COLORS.map(c => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setFormColor(c.value)}
                                className={`w-8 h-8 rounded-md bg-gradient-to-br ${c.value} border-2 transition-all ${formColor === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-transparent hover:scale-105'}`}
                              />
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

                      {/* Preview card */}
                      <div className="space-y-1.5">
                        <Label>{isEs ? 'Vista previa' : 'Preview'}</Label>
                        <Card className="overflow-hidden border">
                          <div className={`h-2 bg-gradient-to-r ${formColor}`} />
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{formIcon}</span>
                              <div>
                                <p className="font-bold text-sm">{formName || 'Mi App'}</p>
                                <p className="text-xs text-muted-foreground">{formDesc || '...'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Webhook info (only for new apps) */}
                      {!editingApp && formName.trim() && (
                        <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                          <h4 className="font-bold text-sm flex items-center gap-1.5">
                            ⚡ {isEs ? 'Tu Webhook (auto-generado)' : 'Your Webhook (auto-generated)'}
                          </h4>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                            <div className="flex items-center gap-1">
                              <code className="flex-1 text-[11px] p-2 rounded bg-background border font-mono break-all">
                                {WEBHOOK_BASE_URL}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => copyToClipboard(WEBHOOK_BASE_URL, 'url')}
                              >
                                {copiedField === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Source Key</Label>
                            <div className="flex items-center gap-1">
                              <code className="flex-1 text-[11px] p-2 rounded bg-background border font-mono">
                                {generateSourceKey(formName)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => copyToClipboard(generateSourceKey(formName), 'source')}
                              >
                                {copiedField === 'source' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{isEs ? 'Ejemplo de payload' : 'Example payload'}</Label>
                            <pre className="text-[10px] p-2 rounded bg-background border font-mono overflow-x-auto">
{`{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+56912345678",
  "score": 45,
  "level": "beginner",
  "source": "${generateSourceKey(formName)}"
}`}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs gap-1"
                              onClick={() => copyToClipboard(`{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+56912345678",
  "score": 45,
  "level": "beginner",
  "source": "${generateSourceKey(formName)}"
}`, 'payload')}
                            >
                              {copiedField === 'payload' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              {isEs ? 'Copiar payload' : 'Copy payload'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => { setNewAppOpen(false); resetForm(); }}>
                        {isEs ? 'Cancelar' : 'Cancel'}
                      </Button>
                      <Button
                        onClick={() => editingApp ? updateApp.mutate() : createApp.mutate()}
                        disabled={!formName.trim() || createApp.isPending || updateApp.isPending}
                      >
                        {(createApp.isPending || updateApp.isPending)
                          ? '...'
                          : editingApp
                            ? (isEs ? 'Guardar cambios' : 'Save changes')
                            : (isEs ? '🚀 Registrar App' : '🚀 Register App')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {apps.map((app, i) => (
                  <motion.div key={app.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer border-2 hover:border-primary/30">
                      <div className={`h-2 bg-gradient-to-r ${app.color}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-3xl flex-shrink-0">{app.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg truncate">{app.name}</h3>
                                <Badge className={`text-[10px] ${STATUS_COLORS[app.status] || STATUS_COLORS.development} border`}>
                                  {(STATUS_LABELS[app.status] || STATUS_LABELS.development)[isEs ? 'es' : 'en']}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{app.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(app)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {app.url && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(app.url, '_blank')}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {app.app_type === 'web' && <Globe className="h-3 w-3" />}
                            {app.app_type === 'mobile' && <Smartphone className="h-3 w-3" />}
                            {app.app_type === 'api' && <Activity className="h-3 w-3" />}
                            <span className="capitalize">{app.app_type}</span>
                          </div>
                          {app.url && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                              <TrendingUp className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{app.url.replace('https://', '')}</span>
                            </div>
                          )}
                        </div>
                        {/* Source key for webhook */}
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <code className="text-[10px] text-muted-foreground font-mono">source: {app.source_key}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(app.source_key, app.id); }}
                            >
                              {copiedField === app.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CRM Main Layout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-xl h-12">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold text-xs md:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{isEs ? '👥 Usuarios' : '👥 Users'}</span>
                <span className="sm:hidden">👥</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold text-xs md:text-sm">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">{isEs ? '🎯 Leads' : '🎯 Leads'}</span>
                <span className="sm:hidden">🎯</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg font-semibold text-xs md:text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">{isEs ? '💳 Planes' : '💳 Plans'}</span>
                <span className="sm:hidden">💳</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <AdminUserOverview />
            </TabsContent>
            <TabsContent value="leads">
              <AdminLeadsTab language={language} />
            </TabsContent>
            <TabsContent value="subscriptions">
              <AdminSubscriptionsTab language={language} />
            </TabsContent>
          </Tabs>

          <div className="sticky top-6">
            <AdminActivityFeed language={language} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminCRM;
