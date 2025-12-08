import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SyncStatus = 'connecting' | 'connected' | 'disconnected';

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const { user } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    if (!user?.id) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    const channel = supabase
      .channel('sync-status-check')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Channel is working
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subscriptionStatus === 'CLOSED' || subscriptionStatus === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const statusConfig = {
    connecting: {
      icon: RefreshCw,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: language === 'es' ? 'Conectando...' : 'Connecting...',
      description: language === 'es' 
        ? 'Estableciendo conexión en tiempo real' 
        : 'Establishing real-time connection',
      animate: true,
    },
    connected: {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: language === 'es' ? 'Sincronizado' : 'Synced',
      description: language === 'es' 
        ? 'Los cambios se sincronizan automáticamente entre dispositivos' 
        : 'Changes sync automatically across devices',
      animate: false,
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: language === 'es' ? 'Desconectado' : 'Disconnected',
      description: language === 'es' 
        ? 'Sin conexión en tiempo real. Los cambios se guardarán localmente' 
        : 'No real-time connection. Changes will be saved locally',
      animate: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
            config.bgColor,
            config.color
          )}
        >
          <Icon 
            className={cn(
              "h-3 w-3",
              config.animate && "animate-spin"
            )} 
          />
          <span className="hidden sm:inline">{config.label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
