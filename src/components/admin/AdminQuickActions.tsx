import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Settings,
  Users,
  Shield,
  Code,
  FileText,
  RefreshCw,
  ExternalLink,
  Database,
  Sparkles,
  Bell,
  Flag,
  UserPlus,
  Gift,
  Bug,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  badge?: string;
}

/**
 * Admin quick actions panel with one-click shortcuts
 * for common administrative tasks.
 */
export const AdminQuickActions = memo(() => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const isEs = language === 'es';

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast.success(isEs ? '✅ Caché refrescado' : '✅ Cache refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearLocalStorage = () => {
    const keys = [
      'onboarding_completed',
      'weekly_digest_shown',
      'admin-bundle-preview-enabled',
      'phoenix_xp_milestone_shown',
    ];
    keys.forEach((key) => localStorage.removeItem(key));
    toast.success(isEs ? '🧹 Claves de prueba limpiadas' : '🧹 Test keys cleared');
  };

  const quickActions: QuickAction[] = [
    {
      id: 'beta-codes',
      label: isEs ? 'Códigos Beta' : 'Beta Codes',
      icon: UserPlus,
      color: 'text-violet-600 bg-violet-100 hover:bg-violet-200',
      action: () => navigate('/admin/beta-codes'),
    },
    {
      id: 'ecosystem-lab',
      label: isEs ? 'Ecosystem Lab' : 'Ecosystem Lab',
      icon: Sparkles,
      color: 'text-amber-600 bg-amber-100 hover:bg-amber-200',
      action: () => navigate('/admin/ecosystem-lab'),
      badge: 'PRO',
    },
    {
      id: 'crm',
      label: isEs ? 'CRM & Apps' : 'CRM & Apps',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200',
      action: () => navigate('/admin/crm'),
      badge: 'NEW',
    },
    {
      id: 'leads',
      label: isEs ? 'CRM Leads' : 'CRM Leads',
      icon: Users,
      color: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
      action: () => navigate('/admin/leads'),
    },
    {
      id: 'feature-flags',
      label: isEs ? 'Feature Flags' : 'Feature Flags',
      icon: Flag,
      color: 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200',
      action: () => navigate('/settings#admin'),
    },
    {
      id: 'refresh-cache',
      label: isEs ? 'Refrescar Caché' : 'Refresh Cache',
      icon: RefreshCw,
      color: 'text-cyan-600 bg-cyan-100 hover:bg-cyan-200',
      action: handleRefreshAll,
    },
    {
      id: 'clear-test-keys',
      label: isEs ? 'Limpiar Keys Test' : 'Clear Test Keys',
      icon: Trash2,
      color: 'text-rose-600 bg-rose-100 hover:bg-rose-200',
      action: handleClearLocalStorage,
    },
  ];

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          {isEs ? '⚡ Acciones Rápidas' : '⚡ Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="ghost"
                className={`w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 ${action.color} transition-all`}
                onClick={action.action}
                disabled={refreshing && action.id === 'refresh-cache'}
              >
                <div className="relative">
                  <action.icon
                    className={`h-5 w-5 ${refreshing && action.id === 'refresh-cache' ? 'animate-spin' : ''}`}
                  />
                  {action.badge && (
                    <Badge className="absolute -top-2 -right-3 text-[8px] px-1 py-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

AdminQuickActions.displayName = 'AdminQuickActions';
