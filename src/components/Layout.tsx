import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { preloadRoute } from '@/App';
import { QuickCaptureDialog } from '@/components/dialogs/QuickCaptureDialog';
import { GlobalSearch } from '@/components/search/GlobalSearch';
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
  ChevronDown,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Camera,
  Menu,
  X,
  CalendarCheck,
  FolderKanban,
  Building2,
  Scale,
  Bell,
  GraduationCap,
  Upload,
  FolderOpen,
  ScanLine,
  Sun,
  Moon,
  Search,
  Wallet,
  Trash2,
  HeartPulse,
  Briefcase,
  BookOpen,
  Circle,
  Trophy,
  MessageSquare,
  CreditCard,
  Landmark,
  PiggyBank,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useEntity } from '@/contexts/EntityContext';
import { useTheme, ThemeStyle } from '@/contexts/ThemeContext';
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
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Link } from 'react-router-dom';
import { MobileMenuEntitySelector, MobileMenuLanguageSelector } from '@/components/mobile';
import { EntitySelector } from '@/components/EntitySelector';
import { useGlobalReminders } from '@/hooks/utils/useGlobalReminders';
import { useAutoReminders } from '@/hooks/data/useAutoReminders';
import { useHighlight } from '@/contexts/HighlightContext';
import { ContactForm } from '@/components/ContactForm';
import { SocialLinks } from '@/components/SocialLinks';
import { ChatAssistant } from '@/components/chat/ChatAssistant';
import { CountryFlag } from '@/components/ui/country-flag';

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
  analytics: {
    gradient: 'from-rose-500/20 to-orange-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    iconWrapper: 'bg-gradient-to-br from-rose-400 via-red-500 to-orange-600 shadow-lg shadow-rose-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-rose-500/20',
  },
  growth: {
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    border: 'border-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400',
    iconWrapper: 'bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-violet-500/20',
  },
  system: {
    gradient: 'from-sky-500/20 to-indigo-500/20',
    border: 'border-sky-500/30',
    text: 'text-sky-600 dark:text-sky-400',
    iconWrapper: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-lg shadow-sky-500/50',
    iconColor: 'text-white drop-shadow-md',
    glow: 'shadow-sky-500/20',
  },
};

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: string | null;
  badgeKey?: string;
  badgeType?: 'tax';
  tooltipKey: keyof typeof TOOLTIP_CONTENT;
  children?: NavChild[];
}

const getNavSections = (language: string, isBetaTester: boolean = false) => {
  const systemItems: NavItem[] = [
    { icon: Sparkles, label: 'nav.notifications', path: '/notifications', badge: null, tooltipKey: 'notifications' as const },
    { icon: FolderOpen, label: 'nav.files', path: '/files', badge: null, tooltipKey: 'files' as const },
    { icon: Settings, label: 'nav.config', path: '/settings', badge: null, tooltipKey: 'settings' as const },
    { icon: Trash2, label: 'nav.trash', path: '/trash', badge: null, tooltipKey: 'trash' as const },
    { icon: HeartPulse, label: 'nav.dataHealth', path: '/data-health', badge: null, tooltipKey: 'dataHealth' as const },
    { icon: BookOpen, label: 'nav.userGuide', path: '/user-guide', badge: null, tooltipKey: 'userGuide' as const },
  ];

  // Only show Beta Feedback to beta testers
  if (isBetaTester) {
    systemItems.push({ icon: MessageSquare, label: language === 'es' ? 'Beta Feedback' : 'Beta Feedback', path: '/beta-feedback', badge: null, tooltipKey: 'betaFeedback' as const });
    systemItems.push({ icon: BookOpen, label: language === 'es' ? 'Guía Beta' : 'Beta Guide', path: '/beta-guide', badge: null, tooltipKey: 'betaGuide' as const });
  }

  return [
  {
    titleKey: 'layout.daily',
    emoji: '💰',
    themeKey: 'daily' as keyof typeof sectionThemes,
    items: [
      { icon: LayoutDashboard, label: 'nav.dashboard', path: '/dashboard', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '📅 Timeline Anual' : '📅 Year Timeline', path: '/dashboard#timeline' },
          { label: language === 'es' ? '🌐 Ecosistema' : '🌐 Ecosystem', path: '/dashboard#ecosystem' },
          { label: language === 'es' ? '⚡ Workflows' : '⚡ Workflows', path: '/dashboard#workflows' },
          { label: language === 'es' ? '🔔 Alertas' : '🔔 Alerts', path: '/dashboard#alerts' },
          { label: language === 'es' ? '🎮 Aventura' : '🎮 Adventure', path: '/dashboard#gamification' },
        ],
      },
      { icon: TrendingUp, label: 'nav.income', path: '/income', badge: null, tooltipKey: 'income' as const },
      { icon: Receipt, label: 'nav.expenses', path: '/expenses', badge: null, tooltipKey: 'expenses' as const,
        children: [
          { label: language === 'es' ? '📊 Gráficos Día a Día' : '📊 Daily Charts', path: '/dashboard?area=diadia' },
        ],
      },
      { icon: Wallet, label: 'nav.budget', path: '/budget', badge: null, tooltipKey: 'budget' as const,
        children: [
          { label: language === 'es' ? '📊 Presupuesto Global' : '📊 Global Budget', path: '/dashboard?area=familia&atab=budget' },
          { label: language === 'es' ? '📊 Análisis Familiar' : '📊 Family Analysis', path: '/dashboard?area=familia&atab=analysis' },
          { label: language === 'es' ? '🔄 Suscripciones' : '🔄 Subscriptions', path: '/dashboard?area=familia&atab=subscriptions' },
        ],
      },
      { icon: CalendarCheck, label: language === 'es' ? 'Pagos Fijos' : 'Bills', path: '/bills', badge: null, tooltipKey: 'bills' as const },
      { icon: RefreshCw, label: language === 'es' ? 'Suscripciones' : 'Subscriptions', path: '/subscriptions', badge: null, tooltipKey: 'subscriptions' as const },
      { icon: Inbox, label: 'nav.chaos', path: '/chaos', badge: null, tooltipKey: 'chaosInbox' as const },
      { icon: Camera, label: language === 'es' ? 'Captura Rápida' : 'Quick Capture', path: '/capture', badge: null, tooltipKey: 'quickCaptureNav' as const },
    ]
  },
  {
    titleKey: 'layout.business',
    emoji: '🏢',
    themeKey: 'business' as keyof typeof sectionThemes,
    items: [
      { icon: Users, label: 'nav.clients', path: '/clients', badge: null, tooltipKey: 'clients' as const,
        children: [
          { label: language === 'es' ? '📊 Gráficos Negocio' : '📊 Business Charts', path: '/dashboard?area=negocio&atab=charts' },
        ],
      },
      { icon: FolderKanban, label: 'nav.projects', path: '/projects', badge: null, tooltipKey: 'clients' as const },
      { icon: FileText, label: 'nav.contracts', path: '/contracts', badge: null, tooltipKey: 'contracts' as const },
      { icon: Car, label: 'nav.mileage', path: '/mileage', badge: null, tooltipKey: 'mileage' as const,
        children: [
          { label: language === 'es' ? '🛣️ Resumen Kilometraje' : '🛣️ Mileage Summary', path: '/dashboard?area=negocio&atab=mileage' },
        ],
      },
      { icon: Tag, label: 'nav.tags', path: '/tags', badge: null, tooltipKey: 'tags' as const },
      { icon: Building2, label: language === 'es' ? 'Perfil Empresa' : 'Business Profile', path: '/business-profile', badge: null, tooltipKey: 'dashboard' as const },
    ]
  },
   {
    titleKey: 'layout.wealth',
    emoji: '📈',
    themeKey: 'wealth' as keyof typeof sectionThemes,
    items: [
      { icon: Scale, label: 'nav.netWorth', path: '/net-worth', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '📊 Análisis Familiar' : '📊 Family Analysis', path: '/dashboard?area=familia&atab=analysis' },
        ],
      },
      { icon: CreditCard, label: language === 'es' ? 'Deudas' : 'Debts', path: '/dashboard?area=familia&atab=debts', badge: null, tooltipKey: 'dashboard' as const },
      { icon: PiggyBank, label: language === 'es' ? 'Ahorro' : 'Savings', path: '/budget?tab=savings', badge: null, tooltipKey: 'dashboard' as const },
      { icon: Building2, label: 'nav.banking', path: '/banking', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '🔄 Conciliación' : '🔄 Reconciliation', path: '/reconciliation' },
        ],
      },
    ]
  },
  {
    titleKey: 'layout.analytics',
    emoji: '📊',
    themeKey: 'analytics' as keyof typeof sectionThemes,
    items: [
      { icon: Scale, label: language === 'es' ? 'Análisis' : 'Analytics', path: '/analytics', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '📊 Ingresos vs Gastos' : '📊 Income vs Expenses', path: '/analytics#income-vs-expenses' },
          { label: language === 'es' ? '🔮 Predicciones' : '🔮 Predictions', path: '/analytics#predictions' },
          { label: language === 'es' ? '💰 Cash Flow' : '💰 Cash Flow', path: '/analytics#cashflow' },
          { label: language === 'es' ? '📈 Rentabilidad' : '📈 Profitability', path: '/analytics#profitability' },
          { label: language === 'es' ? '🎛️ Simulador' : '🎛️ Simulator', path: '/analytics#simulator' },
        ],
      },
      { icon: FileText, label: 'nav.taxCalendar', path: '/tax-calendar', badge: null, tooltipKey: 'dashboard' as const },
      { icon: Receipt, label: language === 'es' ? 'Impuestos' : 'Taxes', path: '/tax-optimizer', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '🛡️ Optimización Fiscal' : '🛡️ Tax Optimization', path: '/dashboard?area=impuestos&atab=optimization' },
          { label: language === 'es' ? '📋 Resumen Fiscal' : '📋 Tax Summary', path: '/dashboard?area=impuestos&atab=summary' },
        ],
      },
    ]
  },
  {
    titleKey: 'layout.growth',
    emoji: '🎓',
    themeKey: 'growth' as keyof typeof sectionThemes,
    items: [
      { icon: GraduationCap, label: 'nav.mentorship', path: '/mentorship', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '📚 Biblioteca' : '📚 Library', path: '/mentorship?tab=library' },
          { label: language === 'es' ? '⚛️ Hábitos Atómicos' : '⚛️ Atomic Habits', path: '/mentorship?tab=atomic' },
          { label: language === 'es' ? '💰 Kiyosaki' : '💰 Kiyosaki', path: '/mentorship?tab=kiyosaki' },
          { label: language === 'es' ? '🌟 Jim Rohn' : '🌟 Jim Rohn', path: '/mentorship?tab=rohn' },
          { label: language === 'es' ? '🎯 Brian Tracy' : '🎯 Brian Tracy', path: '/mentorship?tab=tracy' },
          { label: language === 'es' ? '🧘 Bienestar' : '🧘 Wellbeing', path: '/mentorship?tab=wellbeing' },
        ],
      },
      { icon: Briefcase, label: language === 'es' ? 'Inversiones' : 'Investments', path: '/investments', badge: null, tooltipKey: 'dashboard' as const,
        children: [
          { label: language === 'es' ? '🔥 Calculadora FIRE' : '🔥 FIRE Calculator', path: '/dashboard?area=crecimiento&atab=investments&tool=fire' },
          { label: language === 'es' ? '💼 Portafolio' : '💼 Portfolio', path: '/dashboard?area=crecimiento&atab=investments&tool=portfolio' },
          { label: language === 'es' ? '🎯 Metas SMART' : '🎯 SMART Goals', path: '/dashboard?area=crecimiento&atab=goals' },
          { label: language === 'es' ? '📓 Diario Financiero' : '📓 Financial Journal', path: '/dashboard?area=crecimiento&atab=goals' },
          { label: language === 'es' ? '💵 Págate Primero' : '💵 Pay Yourself First', path: '/mentorship?tab=atomic' },
          { label: language === 'es' ? '💳 Clasificación Deuda' : '💳 Debt Classification', path: '/mentorship?tab=kiyosaki' },
        ],
      },
      { icon: Trophy, label: language === 'es' ? 'Aventura' : 'Adventure', path: '/adventure', badge: null, tooltipKey: 'dashboard' as const },
    ]
  },
  {
    titleKey: 'layout.system',
    emoji: '⚙️',
    themeKey: 'system' as keyof typeof sectionThemes,
    items: systemItems,
  },
];
};

// Mobile navigation - 5 core items + FAB for native feel
const getMobileNavItems = (language: string) => [
  { 
    icon: LayoutDashboard, 
    label: language === 'es' ? 'Inicio' : 'Home',
    path: '/dashboard',
    type: 'nav' as const
  },
  { 
    icon: Receipt, 
    label: language === 'es' ? 'Gastos' : 'Expenses',
    path: '/expenses',
    type: 'nav' as const
  },
  { 
    icon: Camera, 
    label: '',
    path: '/mobile-capture', 
    type: 'fab' as const
  },
  { 
    icon: Wallet, 
    label: language === 'es' ? 'Budget' : 'Budget',
    path: '/budget',
    type: 'nav' as const
  },
  { 
    icon: Menu, 
    label: language === 'es' ? 'Más' : 'More',
    type: 'drawer' as const
  },
];

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useSafeNavigation();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { currentCountry } = useEntity();
  const { mode, setMode, setStyle } = useTheme();
  const { highlightColor } = useHighlight();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const isBetaTester = !!profile?.is_beta_tester;
  const NAV_SECTIONS = getNavSections(language, isBetaTester);
  const MOBILE_NAV_ITEMS = getMobileNavItems(language);
  const { data: unreadCount = 0 } = useUnreadNotifications();
  const sidebarNavRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = '__sidebar_scroll__';

  // Inject highlight CSS color vars based on user preference
  const ARRIVAL_COLOR_RGB: Record<string, [number, number, number]> = {
    orange: [249, 115, 22],
    green:  [34,  197, 94],
    red:    [239, 68,  68],
    blue:   [59,  130, 246],
    purple: [168, 85,  247],
  };

  useEffect(() => {
    const rgb = ARRIVAL_COLOR_RGB[highlightColor] ?? ARRIVAL_COLOR_RGB.orange;
    document.documentElement.style.setProperty('--har', String(rgb[0]));
    document.documentElement.style.setProperty('--hag', String(rgb[1]));
    document.documentElement.style.setProperty('--hab', String(rgb[2]));
  }, [highlightColor]);

  // Persist sidebar scroll while user navigates between pages
  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav || isMobile) return;

    const handleScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
    };

    nav.addEventListener('scroll', handleScroll, { passive: true });
    return () => nav.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Re-apply scroll position after route/content updates
  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav || isMobile) return;

    const saved = Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) ?? '0');
    if (!Number.isFinite(saved) || saved <= 0) return;

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      nav.scrollTop = saved;
      raf2 = window.requestAnimationFrame(() => {
        nav.scrollTop = saved;
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [location.pathname, collapsed, isMobile]);
  
  // Global reminders - works even when chat is closed
  useGlobalReminders();
  // Auto-reminders: bills, contracts, tax deadlines, budget alerts
  useAutoReminders();
  
  // Keyboard shortcut for global search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stability-first mode: disable non-essential animations in authenticated app
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('stability-mode');
    return () => root.classList.remove('stability-mode');
  }, []);

  // Unified submenu navigation handler with highlight effect (8 seconds)
  const handleSubmenuNavigation = useCallback((path: string) => {
    const hashIndex = path.indexOf('#');
    if (hashIndex !== -1) {
      const basePath = path.substring(0, hashIndex);
      const hash = path.substring(hashIndex + 1);
      navigate(basePath);
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('highlight-on-arrival');
          setTimeout(() => el.classList.remove('highlight-on-arrival'), 8000);
        }
      }, 300);
    } else if (path.startsWith('/dashboard?')) {
      window.location.href = path;
    } else {
      navigate(path);
    }
  }, [navigate]);
  
  // Toggle submenu
  const toggleSubmenu = useCallback((path: string) => {
    setExpandedSubmenus(prev => {
      const next = { ...prev, [path]: !prev[path] };
      return next;
    });
  }, []);
  // Toggle theme between light/dark with optimized themes
  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    setStyle(newMode === 'dark' ? 'evo-dark' as ThemeStyle : 'evo-light' as ThemeStyle);
  };
  
  // Get tax authority badge based on country
  const taxBadge = currentCountry === 'CL' ? 'SII' : currentCountry === 'CA' ? 'CRA' : null;
  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U';

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background relative">
        <ThemeBackground />
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 backdrop-blur-2xl border-b border-border/30 px-4 py-2" style={{ background: 'hsl(var(--background) / 0.98)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoenixLogo variant="mini" />
              <span className="text-base font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">EvoFinz</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Global Search Button - Mobile */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9"
                onClick={() => setGlobalSearchOpen(true)}
              >
                <Search className="h-4.5 w-4.5" />
              </Button>
              
              {/* Notification Bell - Mobile */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="right" className="w-[300px] p-0 flex flex-col border-0 shadow-2xl bg-background">
                {/* Header with status indicators moved here from header */}
                <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2.5">
                    <PhoenixLogo variant="mini" />
                    <span className="font-bold text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">EvoFinz</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TooltipProvider>
                      <SyncStatusIndicator />
                      <AuthStatusIndicator compact />
                    </TooltipProvider>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </div>
                
                {/* Entity Selector */}
                <div className="px-3 py-2 border-b border-border/20">
                  <MobileMenuEntitySelector onNavigate={() => setMobileMenuOpen(false)} />
                </div>
                
                {/* Theme Toggle */}
                <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{language === 'es' ? 'Tema' : 'Theme'}</span>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5" onClick={toggleTheme}>
                    {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="text-xs">{mode === 'dark' ? (language === 'es' ? 'Claro' : 'Light') : (language === 'es' ? 'Oscuro' : 'Dark')}</span>
                  </Button>
                </div>
                
                {/* Quick Access Grid - 4 columns with vibrant 3D icons */}
                <div className="px-3 py-2.5 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50">
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { icon: LayoutDashboard, label: language === 'es' ? 'Panel' : 'Home', path: '/dashboard', gradient: 'from-amber-400 via-orange-500 to-red-500', shadow: 'shadow-amber-500/40' },
                      { icon: Receipt, label: language === 'es' ? 'Gastos' : 'Expenses', path: '/expenses', gradient: 'from-red-400 via-rose-500 to-pink-500', shadow: 'shadow-red-500/40' },
                      { icon: TrendingUp, label: language === 'es' ? 'Ingresos' : 'Income', path: '/income', gradient: 'from-emerald-400 via-green-500 to-teal-500', shadow: 'shadow-emerald-500/40' },
                      { icon: CalendarCheck, label: language === 'es' ? 'Pagos' : 'Bills', path: '/bills', gradient: 'from-violet-400 via-purple-500 to-indigo-500', shadow: 'shadow-violet-500/40' },
                      { icon: Inbox, label: language === 'es' ? 'Inbox' : 'Inbox', path: '/chaos', gradient: 'from-blue-400 via-cyan-500 to-sky-500', shadow: 'shadow-blue-500/40' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                          className={cn(
                            "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all",
                            isActive 
                              ? "bg-background shadow-lg border border-primary/30 scale-[1.02]" 
                              : "bg-background/70 hover:bg-background border border-border/40 hover:scale-[1.02]"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-md",
                            item.gradient,
                            item.shadow
                          )}>
                            <Icon className="h-4 w-4 text-white drop-shadow-sm" />
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold leading-tight",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* All Menu Items - Grouped & Compact with Visual Warmth */}
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {NAV_SECTIONS.slice(1).map((section) => {
                    const theme = sectionThemes[section.themeKey];
                    return (
                      <div 
                        key={section.titleKey}
                        className={cn(
                          "rounded-lg p-2 border transition-all",
                          theme.gradient,
                          theme.border,
                          "bg-gradient-to-r backdrop-blur-sm"
                        )}
                      >
                        {/* Section Header with icon accent */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs",
                            theme.iconWrapper
                          )}>
                            <span className="drop-shadow-sm">{section.emoji}</span>
                          </div>
                          <span className={cn("text-xs font-bold uppercase tracking-wider", theme.text)}>
                            {t(section.titleKey).replace(/^[^\s]+\s/, '')}
                          </span>
                        </div>
                        
                {/* Items - single column for full text visibility */}
                        <div className="space-y-0.5">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.path.includes('?')
                              ? location.pathname + location.search === item.path
                              : location.pathname === item.path;
                            const hasChildren = 'children' in item && item.children && item.children.length > 0;
                            const isSubmenuOpen = hasChildren && expandedSubmenus[item.path];
                            
                            return (
                              <div key={item.path}>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                                    className={cn(
                                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left group flex-1",
                                      isActive 
                                        ? cn("bg-background shadow-md border", theme.border)
                                        : "hover:bg-background/80 bg-background/40"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                      theme.iconWrapper
                                    )}>
                                      <Icon className="h-4 w-4 text-white drop-shadow-sm" />
                                    </div>
                                    <span className={cn(
                                      "text-sm font-medium transition-colors flex-1",
                                      isActive ? theme.text : "text-foreground/80 group-hover:text-foreground"
                                    )}>
                                      {t(item.label)}
                                    </span>
                                  </button>
                                  {hasChildren && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleSubmenu(item.path); }}
                                      className={cn(
                                        "p-2.5 rounded-xl transition-all shrink-0 border",
                                        isSubmenuOpen 
                                          ? "bg-primary/15 text-primary border-primary/30 shadow-sm" 
                                          : "text-muted-foreground bg-muted/40 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                      )}
                                    >
                                      <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isSubmenuOpen && "rotate-180")} />
                                    </button>
                                  )}
                                </div>
                                {hasChildren && isSubmenuOpen && (
                                  <div className={cn("ml-9 mt-0.5 mb-1 space-y-0.5 pl-2 border-l-2", theme.border)}>
                                    {item.children!.map((child: NavChild, ci: number) => (
                                      <button
                                        key={`${child.path}-${ci}`}
                                        onClick={() => {
                                          handleSubmenuNavigation(child.path);
                                          setMobileMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-background/60 transition-all"
                                      >
                                        <span className={cn("w-1.5 h-1.5 rounded-full bg-current opacity-40", theme.text)} />
                                        <span className="truncate">{child.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </nav>

                {/* Footer - Language + Logout */}
                <div className="border-t border-border/30 px-3 py-2 flex items-center justify-between bg-muted/20 safe-area-bottom">
                  <MobileMenuLanguageSelector />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs" 
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{language === 'es' ? 'Salir' : 'Logout'}</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 overscroll-y-contain">
          <div className="min-h-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - All tools visible, icon-only compact */}
        <nav className="mobile-bottom-nav">
          <div className="flex items-center justify-around h-full max-h-16">
            {MOBILE_NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              
              // FAB (Central capture button)
              if (item.type === 'fab') {
                return (
                  <button
                    key={`fab-${index}`}
                    onClick={() => navigate(item.path!)}
                    className="mobile-bottom-nav-fab"
                  >
                    <div className="mobile-bottom-nav-fab-button">
                      <Icon className="h-5 w-5" />
                    </div>
                  </button>
                );
              }
              
              // Drawer button
              if (item.type === 'drawer') {
                return (
                  <button
                    key={`drawer-${index}`}
                    onClick={() => setMobileMenuOpen(true)}
                    className="mobile-bottom-nav-item"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mobile-bottom-nav-label">{item.label}</span>
                  </button>
                );
              }
              
              // Standard navigation item with label
              const isActive = location.pathname === item.path || 
                (item.path && item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path!)}
                  className={cn(
                    "mobile-bottom-nav-item",
                    isActive && "active"
                  )}
                >
                  <div className="mobile-bottom-nav-icon-wrap">
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
                  </div>
                  <span className="mobile-bottom-nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        
        {/* Global Search Dialog - Mobile */}
        <GlobalSearch 
          open={globalSearchOpen} 
          onOpenChange={setGlobalSearchOpen}
          onQuickCapture={() => setQuickCaptureOpen(true)}
        />
        
        {/* Chat Assistant */}
        <ChatAssistant />
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
            "relative flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-out",
            "shadow-xl shadow-black/5 dark:shadow-black/20",
            collapsed ? "w-[72px]" : "w-72"
          )}
        >
          {/* Logo */}
          <div className={cn(
            "flex h-20 items-center border-b border-border/40 px-4 transition-all gap-3",
            "bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
            collapsed ? "justify-center" : "px-4"
          )}>
            <PhoenixLogo variant={collapsed ? "mini" : "sidebar"} />
            {!collapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-cyan-500 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">
                EvoFinz
              </span>
            )}
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary/20 bg-card shadow-lg shadow-primary/10 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-primary/30 transition-all duration-200 hover:scale-110"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Top Action Buttons - Uniform sizing */}
          <div className={cn("px-2 pt-2 space-y-1.5", collapsed && "flex flex-col items-center")}>
            {/* Quick Capture */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setQuickCaptureOpen(true)}
                  className={cn(
                    "group rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white transition-all shadow-md hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0.5",
                    collapsed ? "w-10 h-10 flex items-center justify-center p-0" : "w-full h-12 flex items-center gap-2.5 px-3"
                  )}
                >
                  {collapsed ? (
                    <Camera className="h-5 w-5" />
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                          <Camera className="h-3.5 w-3.5" />
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                          <Upload className="h-3.5 w-3.5" />
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                          <Mic className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <span className="font-bold text-xs truncate">{t('layout.quickCapture')}</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
                <div className="space-y-2">
                  <span className="font-semibold">{TOOLTIP_CONTENT.quickCapture[language].title}</span>
                  <p className="text-xs text-muted-foreground">{TOOLTIP_CONTENT.quickCapture[language].description}</p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Global Search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setGlobalSearchOpen(true)}
                  className={cn(
                    "group rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] active:translate-y-0.5",
                    collapsed ? "w-10 h-10 flex items-center justify-center p-0" : "w-full h-12 flex items-center gap-2.5 px-3"
                  )}
                >
                  {collapsed ? (
                    <Search className="h-5 w-5" />
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-xs leading-tight">{language === 'es' ? 'Buscar' : 'Search'}</p>
                        <p className="text-[9px] opacity-80 font-medium truncate">{language === 'es' ? 'Gastos, clientes, proyectos…' : 'Expenses, clients, projects…'}</p>
                      </div>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
                <div className="space-y-2">
                  <span className="font-semibold">{language === 'es' ? 'Búsqueda Global' : 'Global Search'}</span>
                  <p className="text-xs text-muted-foreground">{language === 'es' ? 'Busca gastos, clientes y proyectos en tiempo real' : 'Search expenses, clients and projects in real time'}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Entity/Jurisdiction Selector */}
          <div data-highlight="entity-selector">
            <EntitySelector collapsed={collapsed} />
          </div>

          {/* Navigation */}
          <nav ref={sidebarNavRef} className="flex-1 py-2 px-2 space-y-2 overflow-y-auto scrollbar-thin" data-highlight="sidebar-nav">
            {NAV_SECTIONS.map((section) => {
              const theme = sectionThemes[section.themeKey];
              return (
              <div 
                key={section.titleKey}
                className={cn(
                  "rounded-2xl transition-all duration-300 overflow-hidden",
                  collapsed ? "p-1" : "p-2.5",
                  `bg-gradient-to-br ${theme.gradient}`,
                  `border-2 ${theme.border}`,
                  `hover:shadow-xl ${theme.glow}`,
                  "backdrop-blur-sm",
                  "hover:scale-[1.01] hover:-translate-y-0.5",
                  "shadow-md shadow-black/5 dark:shadow-black/15"
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
                    "px-2 mb-1.5 text-xs font-bold flex items-center gap-2",
                    theme.text
                  )}>
                    <span className="text-sm drop-shadow-sm">{section.emoji}</span>
                    <span className="uppercase tracking-widest text-[10px] font-extrabold">{t(section.titleKey).replace(/^[^\s]+\s/, '')}</span>
                    {!collapsed && <span className="flex-1 h-px bg-current opacity-15 ml-1" />}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path.includes('?')
                      ? location.pathname + location.search === item.path
                      : location.pathname === item.path;

                    const tooltipEntry = TOOLTIP_CONTENT[item.tooltipKey];
                    const tooltipText = tooltipEntry?.[language] ?? tooltipEntry?.es;

                    // Determine badge: use tax badge if badgeType is 'tax', otherwise use badgeKey/badge
                    let badgeText: string | null = null;
                    if ('badgeType' in item && item.badgeType === 'tax') {
                      badgeText = taxBadge;
                    } else if ('badgeKey' in item && item.badgeKey) {
                      badgeText = t(item.badgeKey);
                    } else if ('badge' in item) {
                      badgeText = item.badge;
                    }
                    
                    const hasChildren = 'children' in item && item.children && item.children.length > 0;
                    const isSubmenuOpen = hasChildren && expandedSubmenus[item.path];
                    
                    const button = (
                      <button
                        onClick={() => {
                          const nav = sidebarNavRef.current;
                          if (nav) {
                            sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
                          }
                          navigate(item.path);
                        }}
                        onMouseEnter={() => preloadRoute(item.path)}
                        onFocus={() => preloadRoute(item.path)}
                        className={cn(
                          'flex items-center gap-2 flex-1 px-2.5 py-2 rounded-xl text-sm transition-all duration-200',
                          'hover:bg-background/70 hover:shadow-md hover:-translate-y-0.5',
                          'active:translate-y-0.5 active:shadow-none active:scale-[0.98]',
                          isActive && 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-[1.03] font-bold ring-1 ring-primary/20',
                          collapsed && 'justify-center px-0 w-full'
                        )}
                      >
                        <span className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 group-hover:scale-110 group-hover:rotate-3",
                          isActive ? "bg-primary-foreground/20 shadow-inner ring-1 ring-white/30" : cn(theme.iconWrapper, "ring-1 ring-white/20")
                        )}>
                          <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground drop-shadow-md" : theme.iconColor)} />
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

                    // Chevron toggle for items with children — more visible and prominent
                    const chevronButton = hasChildren && !collapsed ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSubmenu(item.path); }}
                        className={cn(
                          "p-2 rounded-lg transition-all duration-200 shrink-0 border",
                          isSubmenuOpen 
                            ? "bg-primary/15 text-primary border-primary/30 shadow-sm" 
                            : "text-muted-foreground bg-muted/40 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        )}
                        title={isSubmenuOpen ? (language === 'es' ? 'Ocultar herramientas' : 'Hide tools') : (language === 'es' ? 'Ver herramientas' : 'Show tools')}
                      >
                        <ChevronDown className={cn("h-4.5 w-4.5 transition-transform duration-300", isSubmenuOpen && "rotate-180")} />
                      </button>
                    ) : null;

                    // Submenu children — enhanced visual style with colored left border
                    const submenu = hasChildren && !collapsed && isSubmenuOpen ? (
                      <div 
                        className={cn(
                          "ml-5 mt-1 mb-1 space-y-0.5 pl-3 py-1 rounded-r-md transition-all duration-200",
                          "border-l-2",
                          theme.border,
                          "bg-background/40"
                        )}
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 pb-1">
                          {language === 'es' ? '🔧 Herramientas' : '🔧 Tools'}
                        </p>
                        {item.children!.map((child: NavChild, childIdx: number) => (
                          <button
                            key={`${child.path}-${childIdx}`}
                             onClick={() => handleSubmenuNavigation(child.path)}
                            className={cn(
                              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] transition-all duration-150",
                              "text-muted-foreground hover:text-foreground",
                              "hover:bg-background/80 hover:shadow-sm",
                              "group/child"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover/child:scale-150",
                              theme.text,
                              "bg-current opacity-40 group-hover/child:opacity-100"
                            )} />
                            <span className="truncate">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null;

                    // When sidebar collapsed and item has children, show children in tooltip
                    if (collapsed && hasChildren) {
                      return (
                        <div key={item.path}>
                          <Tooltip>
                            <TooltipTrigger asChild>{button}</TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
                              <div className="space-y-2">
                                <span className="font-semibold">{t(item.label)}</span>
                                <div className="space-y-1 pt-1 border-t border-border/50">
                                  {item.children!.map((child: NavChild, ci: number) => (
                                    <button
                                      key={`${child.path}-${ci}`}
                                      onClick={() => handleSubmenuNavigation(child.path)}
                                      className="flex items-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground py-0.5"
                                    >
                                      <Circle className="h-1.5 w-1.5 fill-current opacity-50" />
                                      {child.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }

                    // If we don't have tooltip content configured, render without help bubble.
                    if (!tooltipText) {
                      return (
                        <div key={item.path}>
                          <div className="flex items-center gap-0.5">
                            {button}
                            {chevronButton}
                          </div>
                          {submenu}
                        </div>
                      );
                    }

                    return (
                      <div key={item.path}>
                        <div className="flex items-center gap-0.5">
                          {collapsed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{button}</TooltipTrigger>
                              <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
                                <div className="space-y-2">
                                  <span className="font-semibold">{tooltipText.title}</span>
                                  <p className="text-xs text-muted-foreground">{tooltipText.description}</p>
                                  {tooltipText.howToUse && (
                                    <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                                      💡 {tooltipText.howToUse}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              {button}
                              {chevronButton}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 rounded-full text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8} className="z-[100] max-w-xs p-3 bg-popover border shadow-lg">
                                  <div className="space-y-2">
                                    <span className="font-semibold">{tooltipText.title}</span>
                                    <p className="text-xs text-muted-foreground">{tooltipText.description}</p>
                                    {tooltipText.howToUse && (
                                      <p className="text-xs text-primary/80 pt-1 border-t border-border/50">
                                        💡 {tooltipText.howToUse}
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                        {submenu}
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </nav>

          {/* Quick Capture Dialog */}
          <QuickCaptureDialog 
            open={quickCaptureOpen} 
            onClose={() => setQuickCaptureOpen(false)} 
          />

          {/* Bottom actions - Compact */}
          <div className={cn(
            "border-t border-border/40 p-2.5 space-y-1.5 bg-gradient-to-t from-muted/30 to-transparent",
            collapsed && "flex flex-col items-center"
          )}>
            {/* Profile Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/business-profile')}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm transition-all duration-200 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-sm',
                    location.pathname === '/business-profile' && 'bg-primary text-primary-foreground shadow-md shadow-primary/30',
                    collapsed && 'justify-center px-0 w-auto'
                  )}
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md">
                      {userInitial}
                    </div>
                    {currentCountry && (
                      <span className="absolute -bottom-1.5 -right-1.5 drop-shadow-md">
                        <CountryFlag code={currentCountry} size="xs" className="rounded-full ring-2 ring-background" />
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <span className="block text-xs font-semibold truncate">{profile?.full_name || t('settings.profileTitle')}</span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        {currentCountry && <CountryFlag code={currentCountry} size="xs" />}
                        {currentCountry === 'CA' ? 'Canada' : currentCountry === 'CL' ? 'Chile' : currentCountry === 'US' ? 'USA' : ''}
                      </span>
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
              
              {/* Global Search */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => setGlobalSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>
                  {language === 'es' ? 'Buscar' : 'Search'}
                </TooltipContent>
              </Tooltip>
              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={toggleTheme}
                  >
                    {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>
                  {mode === 'dark' 
                    ? (language === 'es' ? 'Modo Claro' : 'Light Mode')
                    : (language === 'es' ? 'Modo Oscuro' : 'Dark Mode')}
                </TooltipContent>
              </Tooltip>

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
            <div className="flex flex-col gap-3">
              {/* Top row: Disclaimer and version */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <p className="text-center md:text-left">
                    {language === 'es' 
                      ? 'Esta aplicación es solo para fines educativos e informativos. No constituye asesoría profesional.'
                      : 'This application is for educational and informational purposes only. It does not constitute professional advice.'}
                  </p>
                  <span className="hidden md:inline text-muted-foreground/50">•</span>
                  <span className="hidden md:inline text-muted-foreground/70">v1.0.0</span>
                </div>
                
                {/* Social Links */}
                <SocialLinks iconSize="sm" />
              </div>
              
              {/* Bottom row: Links */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <Link to="/legal" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Términos de Uso' : 'Terms of Use'}
                </Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Privacidad' : 'Privacy'}
                </Link>
                <Link to="/legal#disclaimer" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Aviso Legal' : 'Legal Notice'}
                </Link>
                <ContactForm 
                  trigger={
                    <button className="hover:text-foreground transition-colors text-xs">
                      {language === 'es' ? 'Contacto' : 'Contact'}
                    </button>
                  }
                />
                <a href="mailto:support@evofinz.com" className="hover:text-foreground transition-colors">
                  {language === 'es' ? 'Soporte' : 'Support'}
                </a>
              </div>
            </div>
          </footer>
        </main>
        
        {/* Global Search Dialog */}
        <GlobalSearch 
          open={globalSearchOpen} 
          onOpenChange={setGlobalSearchOpen}
          onQuickCapture={() => setQuickCaptureOpen(true)}
        />
        
        {/* Chat Assistant */}
        <ChatAssistant />
      </div>
    </TooltipProvider>
  );
};
