import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AuthStatusIndicatorProps {
  collapsed?: boolean;
  compact?: boolean;
}

export function AuthStatusIndicator({ collapsed = false, compact = false }: AuthStatusIndicatorProps) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isEs = language === 'es';

  const isAuthenticated = !!user;

  const statusConfig = {
    loading: {
      icon: Loader2,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      label: isEs ? 'Verificando...' : 'Checking...',
      description: isEs ? 'Verificando estado de sesión' : 'Checking session status',
      animate: true,
    },
    authenticated: {
      icon: UserCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      label: user?.email?.split('@')[0] || (isEs ? 'Conectado' : 'Connected'),
      description: user?.email || (isEs ? 'Sesión activa' : 'Session active'),
      animate: false,
    },
    unauthenticated: {
      icon: UserX,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: isEs ? 'Sin sesión' : 'Not logged in',
      description: isEs ? 'Haz clic para iniciar sesión' : 'Click to log in',
      animate: false,
    },
  };

  const status = loading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated';
  const config = statusConfig[status];
  const Icon = config.icon;

  const handleClick = () => {
    if (!isAuthenticated && !loading) {
      navigate('/auth');
    }
  };

  const content = (
    <button
      onClick={handleClick}
      disabled={loading || isAuthenticated}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md transition-all',
        config.bgColor,
        !isAuthenticated && !loading && 'cursor-pointer hover:opacity-80',
        (loading || isAuthenticated) && 'cursor-default',
        collapsed && 'px-1.5',
        compact && 'py-1'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          config.color,
          config.animate && 'animate-spin'
        )}
      />
      {!collapsed && !compact && (
        <span className={cn('text-xs font-medium truncate max-w-[120px]', config.color)}>
          {config.label}
        </span>
      )}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side={collapsed ? 'right' : 'top'} className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium text-sm">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {!isAuthenticated && !loading && (
            <p className="text-xs text-primary">
              {isEs ? '→ Clic para iniciar sesión' : '→ Click to log in'}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
