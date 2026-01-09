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
  TrendingUp,
  Camera,
  Menu,
  X,
  FolderKanban,
  Building2,
  Scale,
  Bell,
  GraduationCap,
  Upload,
  ScanLine
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
import { AuthStatusIndicator } from '@/components/AuthStatusIndicator';
import { useUnreadNotifications } from '@/hooks/data/useUnreadNotifications';
import { ThemeBackground } from '@/components/ThemeBackground';
import evofinzLogo from '@/assets/evofinz-logo.png';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

// Section color themes for visual grouping with 3D icon styles
const sectionThemes = {
  daily: {
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    iconWrapper: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-lg shadow-amber-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-amber-500/20',
  },
  business: {
    gradient: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    iconWrapper: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-blue-500/20',
  },
  wealth: {
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    iconWrapper: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-lg shadow-emerald-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-emerald-500/20',
  },
  growth: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    iconWrapper: 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-purple-500/20',
  },
  system: {
    gradient: 'from-slate-500/20 to-gray-500/20',
    border: 'border-slate-500/30',
    text: 'text-slate-600 dark:text-slate-400',
    iconWrapper: 'bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 shadow-lg shadow-slate-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-slate-500/20',
  },
};

const getNavSections = (language: string) => [
  {
    titleKey: 'layout.daily',
    emoji: '💰',
    themeKey: 'daily' as keyof typeof sectionThemes,
    items: [
      { icon: LayoutDashboard, label: 'nav.dashboard', path: '/dashboard', badge: null, tooltipKey: 'dashboard' as const },
      { icon: TrendingUp, label: 'nav.income', path: '/income', badge: null, tooltipKey: 'income' as const },
      { icon: Receipt, label: 'nav.expenses', path: '/expenses', badge: null, tooltipKey: 'expenses' as const },
      { icon: Inbox, label: 'nav.chaos', path: '/chaos', badgeKey: 'nav.badgeSmart', tooltipKey: 'chaosInbox' as const },
    ]
  },
  {
    titleKey: 'layout.business',
    emoji: '🏢',
    themeKey: 'business' as keyof typeof sectionThemes,
    items: [
      { icon: Users, label: 'nav.clients', path: '/clients', badge: null, tooltipKey: 'clients' as const },
      { icon: FolderKanban, label: 'nav.projects', path: '/projects', badge: null, tooltipKey: 'clients' as const },
      { icon: FileText, label: 'nav.contracts', path: '/contracts', badge: null, tooltipKey: 'contracts' as const },
      { icon: Car, label: 'nav.mileage', path: '/mileage', badgeType: 'tax' as const, tooltipKey: 'mileage' as const },
      { icon: Tag, label: 'nav.tags', path: '/tags', badge: null, tooltipKey: 'tags' as const },
    ]
  },
  {
    titleKey: 'layout.wealth',
    emoji: '📈',
    themeKey: 'wealth' as keyof typeof sectionThemes,
    items: [
      { icon: Scale, label: 'nav.netWorth', path: '/net-worth', badgeKey: 'nav.badgeNew', tooltipKey: 'dashboard' as const },
      { icon: Building2, label: 'nav.banking', path: '/banking', badgeKey: 'nav.badgeSmart', tooltipKey: 'dashboard' as const },
      { icon: RefreshCw, label: 'nav.reconciliation', path: '/reconciliation', badge: null, tooltipKey: 'reconciliation' as const },
    ]
  },
  {
    titleKey: 'layout.growth',
    emoji: '🎓',
    themeKey: 'growth' as keyof typeof sectionThemes,
    items: [
      { icon: GraduationCap, label: 'nav.mentorship', path: '/mentorship', badgeKey: 'nav.badgeNew', tooltipKey: 'dashboard' as const },
      { icon: FileText, label: 'nav.taxCalendar', path: '/tax-calendar', badgeType: 'tax' as const, tooltipKey: 'dashboard' as const },
    ]
  },
  {
    titleKey: 'layout.system',
    emoji: '⚙️',
    themeKey: 'system' as keyof typeof sectionThemes,
    items: [
      { icon: Sparkles, label: 'nav.notifications', path: '/notifications', badge: null, tooltipKey: 'dashboard' as const },
      { icon: Settings, label: 'nav.config', path: '/settings', badge: null, tooltipKey: 'dashboard' as const },
    ]
  },
];

// Bottom navigation items for mobile - uses translation keys
const getMobileNavItems = (language: string) => [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: Receipt, labelKey: 'nav.expenses', path: '/expenses' },
  { icon: Camera, labelKey: 'nav.capture', path: '/capture', primary: true },
  { icon: TrendingUp, labelKey: 'nav.income', path: '/income' },
  { icon: Settings, labelKey: 'nav.config', path: '/settings' },
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
  const NAV_SECTIONS = getNavSections(language);
  const MOBILE_NAV_ITEMS = getMobileNavItems(language);
  const { data: unreadCount = 0 } = useUnreadNotifications();
  
  // Get tax authority badge based on country
  const taxBadge = profile?.country === 'CL' ? 'SII' : profile?.country === 'CA' ? 'CRA' : null;
  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U';

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background relative">
        <ThemeBackground />
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={evofinzLogo} alt="EvoFinz" className="h-20 w-auto object-contain" />
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <SyncStatusIndicator />
                <AuthStatusIndicator compact />
              </TooltipProvider>
              
              {/* Notification Bell - Mobile */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

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
                  
                  <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                    {NAV_SECTIONS.map((section) => {
                      const theme = sectionThemes[section.themeKey];
                      return (
                        <div key={section.titleKey} className={cn(
                          "rounded-xl p-3 transition-all duration-300",
                          `bg-gradient-to-br ${theme.gradient}`,
                          `border ${theme.border}`
                        )}>
                          <h3 className={cn(
                            "px-2 mb-2 text-sm font-bold flex items-center gap-2",
                            theme.text
                          )}>
                            <span className="text-base">{section.emoji}</span>
                            <span className="uppercase tracking-wider text-xs">{t(section.titleKey).replace(/^[^\s]+\s/, '')}</span>
                          </h3>
                          <div className="space-y-1">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = location.pathname === item.path;
                              // Determine badge for mobile menu
                              let badgeText: string | null = null;
                              if ('badgeType' in item && item.badgeType === 'tax') {
                                badgeText = taxBadge;
                              } else if ('badgeKey' in item && item.badgeKey) {
                                badgeText = t(item.badgeKey);
                              } else if ('badge' in item) {
                                badgeText = item.badge;
                              }
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
                                  <span className={cn(
                                    "flex items-center justify-center w-7 h-7 rounded-lg transition-transform duration-200 hover:scale-110",
                                    isActive ? "bg-primary-foreground/20" : theme.iconWrapper
                                  )}>
                                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : theme.iconColor)} />
                                  </span>
                                  <span className="flex-1 text-left">{t(item.label)}</span>
                                  {badgeText && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      {badgeText}
                                    </Badge>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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
                    <span className="text-xs mt-1 font-medium text-primary">{t(item.labelKey)}</span>
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
                  <span className={cn("text-xs mt-1", isActive && "font-medium")}>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen bg-background relative">
        <ThemeBackground />
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
              <img src={evofinzLogo} alt="EvoFinz" className="h-12 w-auto object-contain" />
            ) : (
              <img src={evofinzLogo} alt="EvoFinz" className="h-20 w-auto object-contain" />
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
          <nav className="flex-1 py-2 px-2 space-y-1.5">
            {NAV_SECTIONS.map((section) => {
              const theme = sectionThemes[section.themeKey];
              return (
              <div 
                key={section.titleKey}
                className={cn(
                  "rounded-lg transition-all duration-300",
                  collapsed ? "p-1" : "p-2",
                  `bg-gradient-to-br ${theme.gradient}`,
                  `border ${theme.border}`,
                  `hover:shadow-md ${theme.glow}`
                )}
              >
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex justify-center py-1 text-sm cursor-default rounded transition-colors",
                        `hover:bg-gradient-to-br ${theme.gradient}`
                      )}>
                        {section.emoji}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className={cn("z-[100] font-semibold bg-popover border shadow-lg", theme.text)}>
                      {t(section.titleKey)}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <h3 className={cn(
                    "px-1.5 mb-1 text-xs font-bold flex items-center gap-1.5",
                    theme.text
                  )}>
                    <span className="text-sm">{section.emoji}</span>
                    <span className="uppercase tracking-wider text-[10px]">{t(section.titleKey).replace(/^[^\s]+\s/, '')}</span>
                  </h3>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const tooltipData = TOOLTIP_CONTENT[item.tooltipKey];
                    // Determine badge: use tax badge if badgeType is 'tax', otherwise use badgeKey/badge
                    let badgeText: string | null = null;
                    if ('badgeType' in item && item.badgeType === 'tax') {
                      badgeText = taxBadge;
                    } else if ('badgeKey' in item && item.badgeKey) {
                      badgeText = t(item.badgeKey);
                    } else if ('badge' in item) {
                      badgeText = item.badge;
                    }
                    
                    const button = (
                      <button
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-all',
                          'hover:bg-background/60',
                          isActive && 'bg-primary text-primary-foreground shadow-sm',
                          collapsed && 'justify-center px-0'
                        )}
                      >
                        <span className={cn(
                          "flex items-center justify-center w-6 h-6 rounded transition-transform duration-200 hover:scale-105",
                          isActive ? "bg-primary-foreground/20" : theme.iconWrapper
                        )}>
                          <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-primary-foreground" : theme.iconColor)} />
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left text-xs">{t(item.label)}</span>
                            {badgeText && (
                              <Badge 
                                variant="secondary" 
                                className="text-[9px] px-1 py-0 h-4"
                              >
                                {badgeText}
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
                            <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
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
                              <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
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
              );
            })}
          </nav>

          {/* Quick Capture CTA - Vibrant with capture method icons */}
          {!collapsed && (
            <div className="px-2 pb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate('/expenses')}
                    className="w-full p-2.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                        <Camera className="h-3.5 w-3.5" />
                      </div>
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                        <Upload className="h-3.5 w-3.5" />
                      </div>
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                        <ScanLine className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-xs">{t('layout.quickCapture')}</p>
                      <p className="text-[10px] opacity-90">{language === 'es' ? 'Foto · Archivo · Escanear' : 'Photo · File · Scan'}</p>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-3">
                  <div className="space-y-2">
                    <span className="font-semibold">{TOOLTIP_CONTENT.quickCapture[language].title}</span>
                    <p className="text-xs text-muted-foreground">{TOOLTIP_CONTENT.quickCapture[language].description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Bottom actions - Compact */}
          <div className={cn(
            "border-t border-border p-2 space-y-1",
            collapsed && "flex flex-col items-center"
          )}>
            {/* Profile Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/business-profile')}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-all hover:bg-muted/50',
                    location.pathname === '/business-profile' && 'bg-primary text-primary-foreground',
                    collapsed && 'justify-center px-0 w-auto'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                    {userInitial}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <span className="block text-xs font-medium truncate">{profile?.full_name || t('settings.profileTitle')}</span>
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="font-semibold text-xs">{t('businessProfile.title')}</span>
              </TooltipContent>
            </Tooltip>

            {/* Compact action row */}
            <div className={cn(
              "flex items-center gap-1",
              collapsed ? "flex-col" : "justify-between"
            )}>
              {!collapsed && <LanguageSelector />}
              
              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-7 w-7 relative", location.pathname === '/notifications' && 'bg-primary text-primary-foreground')}
                    onClick={() => navigate('/notifications')}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>{t('nav.notifications')}</TooltipContent>
              </Tooltip>

              {/* Logout */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>{t('layout.logout')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10">
          <div className="flex-1">
            {children}
          </div>
          
          {/* Global Footer */}
          <footer className="border-t bg-muted/30 py-4 px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <p>
                  {language === 'es' 
                    ? 'Esta aplicación es solo para fines educativos e informativos. No constituye asesoría profesional.'
                    : 'This application is for educational and informational purposes only. It does not constitute professional advice.'}
                </p>
                <span className="hidden md:inline text-muted-foreground/50">•</span>
                <span className="hidden md:inline text-muted-foreground/70">v1.0.0</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/legal" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Términos de Uso' : 'Terms of Use'}
                </Link>
                <Link to="/legal#privacy" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Privacidad' : 'Privacy'}
                </Link>
                <Link to="/legal#disclaimer" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Aviso Legal' : 'Legal Notice'}
                </Link>
                <a href="mailto:support@evofinz.com" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Soporte' : 'Support'}
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
};
