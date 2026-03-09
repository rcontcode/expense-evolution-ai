import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  LayoutDashboard, Users, CreditCard, Target, Plus, ExternalLink,
  Globe, Smartphone, TrendingUp, Activity, ArrowLeft,
} from 'lucide-react';
import { AdminUserOverview } from '@/components/admin/AdminUserOverview';
import { AdminSubscriptionsTab } from '@/components/admin/tabs/AdminSubscriptionsTab';
import { AdminLeadsTab } from '@/components/admin/tabs/AdminLeadsTab';
import { AdminActivityFeed } from '@/components/admin/tabs/AdminActivityFeed';
import { toast } from 'sonner';

// ─── App Registry ────────────────────────────────────────────
interface ManagedApp {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'live' | 'beta' | 'development' | 'planned';
  type: 'web' | 'mobile' | 'api';
  icon: string;
  color: string;
  metrics?: { users?: number; leads?: number; revenue?: string };
}

const MANAGED_APPS: ManagedApp[] = [
  {
    id: 'evofinz',
    name: 'EvoFinz',
    description: 'Plataforma de gestión financiera personal y empresarial con IA',
    url: 'https://expense-evolution-ai.lovable.app',
    status: 'beta',
    type: 'web',
    icon: '💰',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'fokuspark',
    name: 'Fokuspark',
    description: 'App de bienestar, enfoque y productividad financiera',
    url: 'https://fokuspark.lovable.app',
    status: 'beta',
    type: 'web',
    icon: '🧘',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'trustlyconnect',
    name: 'TrustlyConnect',
    description: 'App de conexión y confianza financiera con quiz integrado',
    url: 'https://trustlyconnect.lovable.app',
    status: 'beta',
    type: 'web',
    icon: '🤝',
    color: 'from-sky-500 to-blue-600',
  },
];

const statusColors: Record<string, string> = {
  live: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  beta: 'bg-amber-100 text-amber-700 border-amber-300',
  development: 'bg-blue-100 text-blue-700 border-blue-300',
  planned: 'bg-gray-100 text-gray-600 border-gray-300',
};

const statusLabels: Record<string, { es: string; en: string }> = {
  live: { es: '🟢 En Producción', en: '🟢 Live' },
  beta: { es: '🟡 Beta', en: '🟡 Beta' },
  development: { es: '🔵 En Desarrollo', en: '🔵 Development' },
  planned: { es: '⚪ Planeado', en: '⚪ Planned' },
};

// ─── Component ───────────────────────────────────────────────
const AdminCRM = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const [newAppOpen, setNewAppOpen] = useState(false);

  // Fetch summary stats
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
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                {isEs ? '🎯 CRM & Centro de Apps' : '🎯 CRM & App Center'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEs
                  ? 'Gestiona usuarios, leads y suscripciones de todas tus apps desde un solo lugar'
                  : 'Manage users, leads and subscriptions for all your apps from one place'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              {MANAGED_APPS.length} {isEs ? 'apps' : 'apps'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/beta-dashboard')}>
              <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
              {isEs ? 'Beta Dashboard' : 'Beta Dashboard'}
            </Button>
          </div>
        </motion.div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isEs ? 'Usuarios Total' : 'Total Users', value: userCount || 0, icon: Users, gradient: 'from-violet-500 to-purple-600', emoji: '👥' },
            { label: 'Leads', value: leadCount || 0, icon: Target, gradient: 'from-red-500 to-orange-500', emoji: '🎯' },
            { label: isEs ? 'Suscriptores' : 'Subscribers', value: paidCount || 0, icon: CreditCard, gradient: 'from-emerald-500 to-teal-600', emoji: '💳' },
            { label: 'Beta Testers', value: betaCount || 0, icon: Activity, gradient: 'from-amber-500 to-yellow-500', emoji: '🧪' },
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
                <Dialog open={newAppOpen} onOpenChange={setNewAppOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      {isEs ? 'Nueva App' : 'New App'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEs ? '🚀 Integrar Nueva App' : '🚀 Integrate New App'}</DialogTitle>
                      <DialogDescription>
                        {isEs
                          ? 'Proceso paso a paso para conectar una nueva app al ecosistema CRM'
                          : 'Step by step process to connect a new app to the CRM ecosystem'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <h4 className="font-bold text-sm">{isEs ? '📋 Checklist de Integración' : '📋 Integration Checklist'}</h4>
                        {[
                          { step: 1, title: isEs ? 'Crear proyecto en Lovable' : 'Create project in Lovable', desc: isEs ? 'Nuevo proyecto con Cloud habilitado (misma DB)' : 'New project with Cloud enabled (same DB)' },
                          { step: 2, title: isEs ? 'Compartir Supabase project' : 'Share Supabase project', desc: isEs ? 'Conectar al mismo proyecto Cloud para datos unificados' : 'Connect to same Cloud project for unified data' },
                          { step: 3, title: isEs ? 'Configurar auth compartido' : 'Configure shared auth', desc: isEs ? 'Mismo sistema de login, mismos usuarios' : 'Same login system, same users' },
                          { step: 4, title: isEs ? 'Agregar feature flags' : 'Add feature flags', desc: isEs ? 'Flags con prefijo de la app (ej: fokuspark_*)' : 'Flags with app prefix (e.g., fokuspark_*)' },
                          { step: 5, title: isEs ? 'Configurar productos Stripe' : 'Configure Stripe products', desc: isEs ? 'Crear producto y sincronizar IDs en webhooks' : 'Create product and sync IDs in webhooks' },
                          { step: 6, title: isEs ? 'Agregar quiz/landing de captura' : 'Add quiz/capture landing', desc: isEs ? 'Para generar leads en quiz_leads con source=nueva_app' : 'To generate leads in quiz_leads with source=new_app' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 items-start">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">
                              {item.step}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          💡 {isEs
                            ? 'Para agregar apps al registro visual, edita el array MANAGED_APPS en este archivo. Los datos de usuarios, leads y suscripciones se comparten automáticamente via Cloud.'
                            : 'To add apps to the visual registry, edit the MANAGED_APPS array in this file. User, lead and subscription data is shared automatically via Cloud.'}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewAppOpen(false)}>
                        {isEs ? 'Entendido' : 'Got it'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {MANAGED_APPS.map((app, i) => (
                  <motion.div key={app.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer border-2 hover:border-primary/30">
                      <div className={`h-2 bg-gradient-to-r ${app.color}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{app.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg">{app.name}</h3>
                                <Badge className={`text-[10px] ${statusColors[app.status]} border`}>
                                  {statusLabels[app.status][isEs ? 'es' : 'en']}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{app.description}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(app.url, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {app.type === 'web' && <Globe className="h-3 w-3" />}
                            {app.type === 'mobile' && <Smartphone className="h-3 w-3" />}
                            <span className="capitalize">{app.type}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>{app.url.replace('https://', '')}</span>
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

        {/* CRM Main Layout: Tabs + Activity Feed sidebar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Tabs Column */}
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

          {/* Activity Feed Sidebar */}
          <div className="sticky top-6">
            <AdminActivityFeed language={language} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminCRM;
