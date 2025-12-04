import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  Receipt, 
  Users,
  Tag,
  FileText, 
  Car, 
  RefreshCw, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';

interface LayoutProps {
  children: ReactNode;
}

const NAV_SECTIONS = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'nav.dashboard', path: '/dashboard', badge: null, tooltipKey: 'dashboard' as const },
      { icon: Inbox, label: 'nav.chaos', path: '/chaos', badge: 'AI', tooltipKey: 'chaosInbox' as const },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { icon: Receipt, label: 'nav.expenses', path: '/expenses', badge: null, tooltipKey: 'expenses' as const },
      { icon: Users, label: 'nav.clients', path: '/clients', badge: null, tooltipKey: 'clients' as const },
      { icon: Tag, label: 'nav.tags', path: '/tags', badge: null, tooltipKey: 'tags' as const },
      { icon: FileText, label: 'nav.contracts', path: '/contracts', badge: null, tooltipKey: 'contracts' as const },
    ]
  },
  {
    title: 'Seguimiento',
    items: [
      { icon: Car, label: 'nav.mileage', path: '/mileage', badge: 'CRA', tooltipKey: 'mileage' as const },
      { icon: RefreshCw, label: 'nav.reconciliation', path: '/reconciliation', badge: null, tooltipKey: 'reconciliation' as const },
    ]
  },
];

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside 
          className={cn(
            "relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-out",
            collapsed ? "w-[72px]" : "w-72"
          )}
        >
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-border px-4 transition-all",
            collapsed ? "justify-center" : "px-6"
          )}>
            {collapsed ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-display font-bold gradient-text">EvoExpense</h1>
                  <span className="text-xs text-muted-foreground">AI Finance</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-secondary transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    const button = (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'nav-item w-full',
                          isActive && 'active',
                          collapsed && 'justify-center px-0'
                        )}
                      >
                        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{t(item.label)}</span>
                            {item.badge && (
                              <Badge 
                                variant={item.badge === 'AI' ? 'default' : 'secondary'} 
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  item.badge === 'AI' && "bg-gradient-primary border-0"
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    );

                    const tooltipData = TOOLTIP_CONTENT[item.tooltipKey];

                    return collapsed ? (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs p-3">
                          <div className="space-y-2">
                            <span className="font-semibold">{tooltipData.title}</span>
                            <p className="text-xs text-muted-foreground">{tooltipData.description}</p>
                            {tooltipData.howToUse && (
                              <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                                💡 {tooltipData.howToUse}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : button;
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Quick Capture CTA */}
          {!collapsed && (
            <div className="p-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate('/expenses')}
                    className="w-full p-4 rounded-xl bg-gradient-hero text-primary-foreground flex items-center gap-3 hover:opacity-90 transition-opacity shadow-glow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Captura de Gastos</p>
                      <p className="text-xs opacity-80">Foto, voz o texto</p>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-3">
                  <div className="space-y-2">
                    <span className="font-semibold">{TOOLTIP_CONTENT.quickCapture.title}</span>
                    <p className="text-xs text-muted-foreground">{TOOLTIP_CONTENT.quickCapture.description}</p>
                    <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                      💡 {TOOLTIP_CONTENT.quickCapture.howToUse}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Bottom actions */}
          <div className={cn(
            "border-t border-border p-3 space-y-2",
            collapsed && "flex flex-col items-center"
          )}>
            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/settings')}
                  className={cn(
                    'nav-item w-full',
                    location.pathname === '/settings' && 'active',
                    collapsed && 'justify-center px-0 w-auto'
                  )}
                >
                  <Settings className="h-5 w-5" />
                  {!collapsed && <span className="flex-1 text-left">{t('nav.settings')}</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <div className="space-y-2">
                  <span className="font-semibold">{TOOLTIP_CONTENT.settings.title}</span>
                  <p className="text-xs text-muted-foreground">{TOOLTIP_CONTENT.settings.description}</p>
                  <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                    💡 {TOOLTIP_CONTENT.settings.howToUse}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            <div className={cn(
              "flex items-center gap-2 pt-2",
              collapsed ? "flex-col" : "justify-between"
            )}>
              {!collapsed && <LanguageSelector />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={signOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>Cerrar sesión</TooltipContent>
              </Tooltip>
              {collapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Ayuda</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};
