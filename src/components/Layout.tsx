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
  Zap,
  TrendingUp,
  Camera,
  Menu,
  X,
  AlertTriangle,
  FolderKanban,
  UserCircle,
  Building2,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

interface LayoutProps {
  children: ReactNode;
}

const getNavSections = (t: (key: string) => string) => [
  {
    titleKey: 'layout.principal',
    items: [
      { icon: LayoutDashboard, label: 'nav.dashboard', path: '/dashboard', badge: null, tooltipKey: 'dashboard' as const },
      { icon: Inbox, label: 'nav.chaos', path: '/chaos', badge: 'AI', tooltipKey: 'chaosInbox' as const },
    ]
  },
  {
    titleKey: 'layout.management',
    items: [
      { icon: Receipt, label: 'nav.expenses', path: '/expenses', badge: null, tooltipKey: 'expenses' as const },
      { icon: AlertTriangle, label: 'nav.incomplete', path: '/expenses?incomplete=true', badge: '!', tooltipKey: 'expenses' as const },
      { icon: TrendingUp, label: 'nav.income', path: '/income', badge: null, tooltipKey: 'income' as const },
      { icon: Users, label: 'nav.clients', path: '/clients', badge: null, tooltipKey: 'clients' as const },
      { icon: FolderKanban, label: 'nav.projects', path: '/projects', badge: null, tooltipKey: 'clients' as const },
      { icon: Tag, label: 'nav.tags', path: '/tags', badge: null, tooltipKey: 'tags' as const },
      { icon: FileText, label: 'nav.contracts', path: '/contracts', badge: null, tooltipKey: 'contracts' as const },
    ]
  },
  {
    titleKey: 'layout.tracking',
    items: [
      { icon: Scale, label: 'Patrimonio', path: '/net-worth', badge: 'Nuevo', tooltipKey: 'dashboard' as const },
      { icon: Building2, label: 'Bancos', path: '/banking', badge: 'IA', tooltipKey: 'dashboard' as const },
      { icon: Car, label: 'nav.mileage', path: '/mileage', badge: 'CRA', tooltipKey: 'mileage' as const },
      { icon: RefreshCw, label: 'nav.reconciliation', path: '/reconciliation', badge: null, tooltipKey: 'reconciliation' as const },
    ]
  },
];

// Bottom navigation items for mobile
const MOBILE_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Receipt, label: 'Gastos', path: '/expenses' },
  { icon: Camera, label: 'Captura', path: '/capture', primary: true },
  { icon: TrendingUp, label: 'Ingresos', path: '/income' },
  { icon: Settings, label: 'Config', path: '/settings' },
];

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const NAV_SECTIONS = getNavSections(t);
  
  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U';

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">EvoExpense</span>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <SyncStatusIndicator />
              </TooltipProvider>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b flex items-center justify-between">
                    <span className="font-semibold">{t('nav.menu') || 'Menú'}</span>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {NAV_SECTIONS.map((section) => (
                      <div key={section.titleKey}>
                        <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t(section.titleKey)}
                        </h3>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                              <button
                                key={item.path}
                                onClick={() => {
                                  navigate(item.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={cn(
                                  'nav-item w-full',
                                  isActive && 'active'
                                )}
                              >
                                <Icon className={cn("h-5 w-5", isActive && "text-primary-foreground")} />
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
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </nav>

                  <div className="border-t p-4 space-y-3">
                    <LanguageSelector />
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-destructive hover:text-destructive" 
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      {t('layout.logout')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2">
            {MOBILE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              if (item.primary) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center justify-center -mt-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-xs mt-1 font-medium text-primary">{item.label}</span>
                  </button>
                );
              }
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className={cn("text-xs mt-1", isActive && "font-medium")}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Layout
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
                  <span className="text-xs text-muted-foreground">{t('layout.aiFinance')}</span>
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
              <div key={section.titleKey}>
                {!collapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t(section.titleKey)}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const tooltipData = TOOLTIP_CONTENT[item.tooltipKey];
                    
                    const button = (
                      <button
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

                    return (
                      <div key={item.path} className="flex items-center gap-1">
                        {collapsed ? (
                          <Tooltip>
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
                        ) : (
                          <>
                            {button}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="p-1 rounded-full text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                  <HelpCircle className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
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
                          </>
                        )}
                      </div>
                    );
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
                      <p className="font-semibold text-sm">{t('layout.quickCapture')}</p>
                      <p className="text-xs opacity-80">{t('layout.quickCaptureSubtitle')}</p>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-3">
                  <div className="space-y-2">
                    <span className="font-semibold">{TOOLTIP_CONTENT.quickCapture[language].title}</span>
                    <p className="text-xs text-muted-foreground">{TOOLTIP_CONTENT.quickCapture[language].description}</p>
                    <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                      💡 {TOOLTIP_CONTENT.quickCapture[language].howToUse}
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
            {/* Profile Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/business-profile')}
                  className={cn(
                    'nav-item w-full',
                    location.pathname === '/business-profile' && 'active',
                    collapsed && 'justify-center px-0 w-auto'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {userInitial}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <span className="block text-sm font-medium truncate">{profile?.full_name || t('settings.profileTitle')}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {profile?.work_types?.includes('contractor') ? 'Sole Proprietor' : 
                         profile?.work_types?.includes('corporation') ? 'Corporation' : 
                         profile?.work_types?.includes('employee') ? 'Employee' : t('nav.settings')}
                      </span>
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <div className="space-y-2">
                  <span className="font-semibold">{t('businessProfile.title')}</span>
                  <p className="text-xs text-muted-foreground">{t('businessProfile.description')}</p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Settings Button */}
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
                  <span className="font-semibold">{TOOLTIP_CONTENT.settings[language].title}</span>
                  <p className="text-xs text-muted-foreground">{TOOLTIP_CONTENT.settings[language].description}</p>
                  <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                    💡 {TOOLTIP_CONTENT.settings[language].howToUse}
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
                <TooltipContent side={collapsed ? "right" : "top"}>{t('layout.logout')}</TooltipContent>
              </Tooltip>
              {collapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('layout.help')}</TooltipContent>
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
