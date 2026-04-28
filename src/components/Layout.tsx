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
  BarChart3,
  FileBarChart,
  CalendarDays,
  Calculator,
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
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
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
import { UiModeToggle } from '@/components/layout/UiModeToggle';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { isEssentialPath } from '@/lib/constants/focus-areas';

interface LayoutProps {
  children: ReactNode;
}

// Section color themes for visual grouping with 3D icon styles
const sectionThemes = {
  daily: {
    gradient: 'from-transparent to-transparent',
    border: 'border-border/40',
    text: 'text-amber-600 dark:text-amber-400',
    iconWrapper: 'bg-gradient-to-br from-amber-400 to-orange-500',
    iconColor: 'text-white',
    glow: '',
  },
  business: {
    gradient: 'from-transparent to-transparent',
    border: 'border-border/40',
    text: 'text-blue-600 dark:text-blue-400',
    iconWrapper: 'bg-gradient-to-br from-cyan-400 to-blue-600',
    iconColor: 'text-white',
    glow: '',
  },
  wealth: {
    gradient: 'from-transparent to-transparent',
    border: 'border-border/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    iconWrapper: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    iconColor: 'text-white',
    glow: '',
  },
  analytics: {
    gradient: 'from-transparent to-transparent',
    border: 'border-border/40',
    text: 'text-rose-600 dark:text-rose-400',
    iconWrapper: 'bg-gradient-to-br from-rose-400 to-orange-500',
    iconColor: 'text-white',
    glow: '',
  },
  growth: {
    gradient: 'from-transparent to-transparent',
    border: 'border-border/40',
    text: 'text-violet-600 dark:text-violet-400',
    iconWrapper: 'bg-gradient-to-br from-purple-400 to-fuchsia-600',
    iconColor: 'text-white',
    glow: '',
  },
  system: {
    gradient: 'from-transparent to-transparent',
    border: 'border-border/40',
    text: 'text-sky-600 dark:text-sky-400',
    iconWrapper: 'bg-gradient-to-br from-sky-400 to-indigo-600',
    iconColor: 'text-white',
    glow: '',
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
      { icon: Receipt, label: 'nav.expenses', path: '/expenses', badge: null, tooltipKey: 'expenses' as const },
      { icon: Wallet, label: 'nav.budget', path: '/budget', badge: null, tooltipKey: 'budget' as const,
        children: [
          { label: language === 'es' ? '🎯 Metas de Ahorro' : '🎯 Savings Goals', path: '/budget?tab=savings' },
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
          { label: language === 'es' ? '📊 Rentabilidad Clientes' : '📊 Client Profitability', path: '/analytics#profitability' },
        ],
      },
      { icon: FolderKanban, label: 'nav.projects', path: '/projects', badge: null, tooltipKey: 'projects' as const },
      { icon: FileText, label: 'nav.contracts', path: '/contracts', badge: null, tooltipKey: 'contracts' as const },
      { icon: Car, label: 'nav.mileage', path: '/mileage', badge: null, tooltipKey: 'mileage' as const },
      { icon: Tag, label: 'nav.tags', path: '/tags', badge: null, tooltipKey: 'tags' as const },
      { icon: Building2, label: language === 'es' ? 'Perfil Empresa' : 'Business Profile', path: '/business-profile', badge: null, tooltipKey: 'businessProfile' as const },
    ]
  },
   {
    titleKey: 'layout.wealth',
    emoji: '📈',
    themeKey: 'wealth' as keyof typeof sectionThemes,
    items: [
      { icon: Scale, label: 'nav.netWorth', path: '/net-worth', badge: null, tooltipKey: 'netWorth' as const,
        children: [
          { label: language === 'es' ? '💳 Deudas' : '💳 Debts', path: '/net-worth' },
        ],
      },
      { icon: PiggyBank, label: language === 'es' ? 'Ahorro' : 'Savings', path: '/budget?tab=savings', badge: null, tooltipKey: 'savings' as const },
      { icon: Building2, label: 'nav.banking', path: '/banking', badge: null, tooltipKey: 'banking' as const,
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
      { icon: BarChart3, label: language === 'es' ? 'Análisis' : 'Analytics', path: '/analytics', badge: null, tooltipKey: 'analytics' as const,
        children: [
          { label: language === 'es' ? '📊 Ingresos vs Gastos' : '📊 Income vs Expenses', path: '/analytics#income-vs-expenses' },
          { label: language === 'es' ? '🔮 Predicciones' : '🔮 Predictions', path: '/analytics#predictions' },
          { label: language === 'es' ? '💰 Cash Flow' : '💰 Cash Flow', path: '/analytics#cashflow' },
          { label: language === 'es' ? '📈 Rentabilidad' : '📈 Profitability', path: '/analytics#profitability' },
          { label: language === 'es' ? '🎛️ Simulador' : '🎛️ Simulator', path: '/analytics#simulator' },
        ],
      },
      { icon: CalendarDays, label: 'nav.taxCalendar', path: '/tax-calendar', badge: null, tooltipKey: 'taxCalendar' as const },
      { icon: Calculator, label: language === 'es' ? 'Impuestos' : 'Taxes', path: '/tax-optimizer', badge: null, tooltipKey: 'taxes' as const,
        children: [
          { label: language === 'es' ? '📋 Flujo Reporte Contador' : '📋 Accountant Report Flow', path: '/tax-report-flow' },
        ],
      },
      { icon: FileBarChart, label: language === 'es' ? 'Reportes' : 'Reports', path: '/reports', badge: null, tooltipKey: 'reports' as const },
    ]
  },
  {
    titleKey: 'layout.growth',
    emoji: '🎓',
    themeKey: 'growth' as keyof typeof sectionThemes,
    items: [
      { icon: GraduationCap, label: 'nav.mentorship', path: '/mentorship', badge: null, tooltipKey: 'mentorship' as const,
        children: [
          { label: language === 'es' ? '📚 Biblioteca' : '📚 Library', path: '/mentorship?tab=library' },
          { label: language === 'es' ? '⚛️ Micro-Hábitos' : '⚛️ Micro-Habits', path: '/mentorship?tab=atomic' },
          { label: language === 'es' ? '💰 Activos' : '💰 Assets', path: '/mentorship?tab=kiyosaki' },
          { label: language === 'es' ? '🌟 Desarrollo' : '🌟 Growth', path: '/mentorship?tab=rohn' },
          { label: language === 'es' ? '🎯 Metas' : '🎯 Goals', path: '/mentorship?tab=tracy' },
          { label: language === 'es' ? '🧘 Bienestar' : '🧘 Wellbeing', path: '/mentorship?tab=wellbeing' },
        ],
      },
      { icon: Briefcase, label: language === 'es' ? 'Inversiones' : 'Investments', path: '/investments', badge: null, tooltipKey: 'investments' as const,
        children: [
          { label: language === 'es' ? '🔥 Calculadora FIRE' : '🔥 FIRE Calculator', path: '/investments#fire' },
          { label: language === 'es' ? '💼 Portafolio' : '💼 Portfolio', path: '/investments#portfolio' },
        ],
      },
      { icon: Trophy, label: language === 'es' ? 'Aventura' : 'Adventure', path: '/adventure', badge: null, tooltipKey: 'adventure' as const },
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
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const isBetaTester = !!profile?.is_beta_tester;
  const NAV_SECTIONS = getNavSections(language, isBetaTester);
  const MOBILE_NAV_ITEMS = getMobileNavItems(language);
  const { data: unreadCount = 0 } = useUnreadNotifications();
  const { uiMode } = useDisplayPreferences();
  const isSimpleMode = uiMode === 'simple';

  // Collapsible sidebar sections (Advanced mode) — persist in localStorage
  const SIDEBAR_SECTIONS_KEY = 'sidebar-collapsed-sections';
  const DEFAULT_COLLAPSED_SECTIONS = ['layout.growth', 'layout.system'];
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default: collapse secondary sections to reduce visual noise on first load
    return DEFAULT_COLLAPSED_SECTIONS.reduce((acc, k) => ({ ...acc, [k]: true }), {});
  });
  const toggleSection = useCallback((titleKey: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [titleKey]: !prev[titleKey] };
      try { localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // In Simple Mode, filter sidebar items to only essential routes
  const NAV_SECTIONS_VISIBLE = isSimpleMode
    ? NAV_SECTIONS
        .map((section) => ({
          ...section,
          items: section.items.filter((it: any) => isEssentialPath(it.path)),
        }))
        .filter((section) => section.items.length > 0)
    : NAV_SECTIONS;

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

  // Mobile app shell owns vertical scroll. Prevent body/window from competing with it.
  useEffect(() => {
    document.body.classList.toggle('app-mobile-scroll-lock', isMobile);
    document.documentElement.classList.toggle('app-mobile-scroll-lock', isMobile);
    return () => {
      document.body.classList.remove('app-mobile-scroll-lock');
      document.documentElement.classList.remove('app-mobile-scroll-lock');
    };
  }, [isMobile]);

  // Unified submenu navigation handler with highlight effect (8 seconds)
  const handleSubmenuNavigation = useCallback((path: string) => {
    const hashIndex = path.indexOf('#');
    if (hashIndex !== -1) {
      const basePath = path.substring(0, hashIndex);
      const hash = path.substring(hashIndex + 1);
      
      const scrollToElement = (retriesLeft: number) => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('highlight-on-arrival');
          setTimeout(() => el.classList.remove('highlight-on-arrival'), 8000);
        } else if (retriesLeft > 0) {
          setTimeout(() => scrollToElement(retriesLeft - 1), 400);
        }
      };

      // Navigate with view=summary param so Dashboard switches to summary tab
      navigate(`${basePath}?view=summary#${hash}`);
      setTimeout(() => scrollToElement(8), 600);
    } else if (path.includes('?')) {
      navigate(path);
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
      <div className="mobile-app-shell flex flex-col h-[100dvh] bg-background relative overflow-hidden">
        <ThemeBackground />
        {/* Mobile Header */}
        <header className="mobile-app-header shrink-0 z-50 backdrop-blur-2xl border-b border-border/30 px-3 py-1.5" style={{ background: 'hsl(var(--background) / 0.98)' }}>
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
              
              {/* UI Mode Toggle - Mobile (compact, always visible) */}
              <UiModeToggle compact />

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
              <SheetContent
                side="right"
                hideDefaultClose
                overlayClassName="bg-transparent"
                className="w-screen max-w-none p-0 flex flex-col border-0 shadow-none bg-background"
              >
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
                  <div className="flex items-center gap-2.5">
                    <PhoenixLogo variant="mini" />
                    <span className="font-bold text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">EvoFinz</span>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" aria-label={language === 'es' ? 'Cerrar menú' : 'Close menu'}>
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                
                {/* Entity Selector */}
                <div className="px-3 py-2 border-b border-border/30">
                  <MobileMenuEntitySelector onNavigate={() => setMobileMenuOpen(false)} />
                </div>
                
                {/* Theme Toggle */}
                <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{language === 'es' ? 'Tema' : 'Theme'}</span>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5" onClick={toggleTheme}>
                    {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="text-xs">{mode === 'dark' ? (language === 'es' ? 'Claro' : 'Light') : (language === 'es' ? 'Oscuro' : 'Dark')}</span>
                  </Button>
                </div>
                
                {/* Quick Access Grid - 5 columns */}
                <div className="px-3 py-3 border-b border-border/30">
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { icon: LayoutDashboard, label: language === 'es' ? 'Panel' : 'Home', path: '/dashboard', gradient: 'from-amber-400 to-orange-500' },
                      { icon: Receipt, label: language === 'es' ? 'Gastos' : 'Expenses', path: '/expenses', gradient: 'from-rose-400 to-pink-500' },
                      { icon: TrendingUp, label: language === 'es' ? 'Ingresos' : 'Income', path: '/income', gradient: 'from-emerald-400 to-teal-500' },
                      { icon: CalendarCheck, label: language === 'es' ? 'Pagos' : 'Bills', path: '/bills', gradient: 'from-violet-400 to-indigo-500' },
                      { icon: Inbox, label: language === 'es' ? 'Inbox' : 'Inbox', path: '/chaos', gradient: 'from-sky-400 to-cyan-500' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onPointerDown={() => preloadRoute(item.path)}
                          onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                          className={cn(
                            "flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all min-w-0",
                            isActive 
                              ? "bg-muted/60 ring-1 ring-primary/30" 
                              : "hover:bg-muted/40"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                            item.gradient
                          )}>
                            <Icon className="h-[18px] w-[18px] text-white" />
                          </div>
                          <span className={cn(
                            "text-[10px] font-medium leading-tight truncate w-full text-center",
                            isActive ? "text-primary" : "text-foreground/80"
                          )}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* All Menu Items - clean collapsible sections */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
                  {NAV_SECTIONS_VISIBLE.slice(isSimpleMode ? 0 : 1).map((section) => {
                    const theme = sectionThemes[section.themeKey];
                    const sectionKey = `mobile-section-${section.titleKey}`;
                    const isOpen = collapsedSections[sectionKey] !== true; // default open
                    const sectionLabel = t(section.titleKey).replace(/^[^\s]+\s/, '');
                    return (
                      <div key={section.titleKey} className="rounded-xl bg-muted/20">
                        {/* Section Header — collapsible trigger */}
                        <button
                          type="button"
                          onClick={() => setCollapsedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/40 transition-colors"
                        >
                          <span className={cn("text-[10px] font-bold uppercase tracking-[0.1em]", theme.text)}>
                            {sectionLabel}
                          </span>
                          <div className="flex-1 h-px bg-border/30" />
                          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", !isOpen && "-rotate-90")} />
                        </button>

                        {/* Items */}
                        {isOpen && (
                          <div className="px-1.5 pb-2 pt-0.5 space-y-0.5">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = item.path.includes('?')
                                ? location.pathname + location.search === item.path
                                : location.pathname === item.path;
                              const hasChildren = 'children' in item && item.children && item.children.length > 0;
                              const isSubmenuOpen = hasChildren && expandedSubmenus[item.path];

                              return (
                                <div key={item.path}>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onPointerDown={() => preloadRoute(item.path)}
                                      onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                                      className={cn(
                                        "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left flex-1 min-w-0",
                                        isActive
                                          ? "bg-background shadow-sm"
                                          : "hover:bg-background/60"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                        theme.iconWrapper
                                      )}>
                                        <Icon className="h-3.5 w-3.5 text-white" />
                                      </div>
                                      <span className={cn(
                                        "text-sm font-medium truncate",
                                        isActive ? theme.text : "text-foreground/85"
                                      )}>
                                        {t(item.label)}
                                      </span>
                                    </button>
                                    {hasChildren && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleSubmenu(item.path); }}
                                        className={cn(
                                          "h-8 w-8 flex items-center justify-center rounded-lg transition-colors shrink-0",
                                          isSubmenuOpen
                                            ? "bg-background text-foreground"
                                            : "text-muted-foreground hover:bg-background/60"
                                        )}
                                      >
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", isSubmenuOpen && "rotate-180")} />
                                      </button>
                                    )}
                                  </div>
                                  {hasChildren && isSubmenuOpen && (
                                    <div className="ml-9 mt-0.5 mb-1 space-y-0.5 pl-3">
                                      {item.children!.map((child: NavChild, ci: number) => (
                                        <button
                                          key={`${child.path}-${ci}`}
                                          onClick={() => {
                                            handleSubmenuNavigation(child.path);
                                            setMobileMenuOpen(false);
                                          }}
                                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
                                        >
                                          <span className={cn("w-1 h-1 rounded-full bg-current opacity-50", theme.text)} />
                                          <span className="truncate">{child.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
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

        <main className="mobile-app-main flex-1 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden">
          <div className="min-h-full w-full max-w-full min-w-0 overflow-x-hidden pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px)+1rem)]">
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
                    onPointerDown={() => item.path && preloadRoute(item.path)}
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

          {/* UI Mode toggle (Simple/Advanced) — desktop sidebar */}
          {!collapsed && (
            <div className="px-3 pt-2 flex justify-center">
              <UiModeToggle />
            </div>
          )}
          <button
            onClick={() => { const next = !collapsed; setCollapsed(next); try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {} }}
            className="absolute -right-3 top-20 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary/20 bg-card shadow-lg shadow-primary/10 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-primary/30 transition-all duration-200 hover:scale-110"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Top Action Buttons - Premium 3D style, aligned with nav sections */}
          <div className={cn("px-3 pt-2 space-y-1.5", collapsed && "flex flex-col items-center gap-1.5 space-y-0 px-1")}>
            {/* Quick Capture */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setQuickCaptureOpen(true)}
                  className={cn(
                    "group rounded-xl text-white transition-all duration-200 cursor-pointer",
                    "bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600",
                    "shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.15)]",
                    "hover:shadow-[0_6px_20px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.15)]",
                    "hover:scale-[1.02] hover:-translate-y-0.5",
                    "active:scale-[0.97] active:translate-y-0.5 active:shadow-[0_2px_6px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)]",
                    "border border-emerald-300/30",
                    collapsed ? "w-10 h-10 flex items-center justify-center p-0" : "w-full h-11 flex items-center gap-1.5 px-2"
                  )}
                >
                  {collapsed ? (
                    <Camera className="h-5 w-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-300 via-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_3px_8px_rgba(6,182,212,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)] border border-cyan-200/40 group-hover:shadow-[0_4px_12px_rgba(6,182,212,0.6),inset_0_1px_0_rgba(255,255,255,0.5)] transition-shadow">
                          <Camera className="h-4 w-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 flex items-center justify-center shadow-[0_3px_8px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)] border border-amber-200/40 group-hover:shadow-[0_4px_12px_rgba(245,158,11,0.6),inset_0_1px_0_rgba(255,255,255,0.5)] transition-shadow">
                          <Upload className="h-4 w-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-500 flex items-center justify-center shadow-[0_3px_8px_rgba(236,72,153,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)] border border-pink-200/40 group-hover:shadow-[0_4px_12px_rgba(236,72,153,0.6),inset_0_1px_0_rgba(255,255,255,0.5)] transition-shadow">
                          <Mic className="h-4 w-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                        </div>
                      </div>
                      <span className="font-extrabold text-[11px] truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{t('layout.quickCapture')}</span>
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
                    "group rounded-xl text-white transition-all duration-200 cursor-pointer",
                    "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600",
                    "shadow-[0_4px_12px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.15)]",
                    "hover:shadow-[0_6px_20px_rgba(99,102,241,0.5),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.15)]",
                    "hover:scale-[1.02] hover:-translate-y-0.5",
                    "active:scale-[0.97] active:translate-y-0.5 active:shadow-[0_2px_6px_rgba(99,102,241,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)]",
                    "border border-indigo-300/30",
                    collapsed ? "w-10 h-10 flex items-center justify-center p-0" : "w-full h-11 flex items-center gap-2 px-2"
                  )}
                >
                  {collapsed ? (
                    <Search className="h-5 w-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-300 via-indigo-400 to-blue-500 flex items-center justify-center shadow-[0_3px_8px_rgba(99,102,241,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)] border border-indigo-200/40 group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.6),inset_0_1px_0_rgba(255,255,255,0.5)] transition-shadow shrink-0">
                        <Search className="h-4 w-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-extrabold text-[11px] leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{language === 'es' ? 'Buscar' : 'Search'}</p>
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
            {NAV_SECTIONS_VISIBLE.map((section) => {
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
                  <button
                    type="button"
                    onClick={() => toggleSection(section.titleKey)}
                    className={cn(
                      "w-full px-2 mb-1.5 text-xs font-bold flex items-center gap-2 rounded-md hover:bg-background/40 transition-colors py-0.5",
                      theme.text
                    )}
                    title={collapsedSections[section.titleKey] ? (language === 'es' ? 'Expandir sección' : 'Expand section') : (language === 'es' ? 'Colapsar sección' : 'Collapse section')}
                  >
                    <span className="text-sm drop-shadow-sm">{section.emoji}</span>
                    <span className="uppercase tracking-widest text-[10px] font-extrabold">{t(section.titleKey).replace(/^[^\s]+\s/, '')}</span>
                    <span className="flex-1 h-px bg-current opacity-15 ml-1" />
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
                      collapsedSections[section.titleKey] && "-rotate-90"
                    )} />
                  </button>
                )}
                {(collapsed || !collapsedSections[section.titleKey]) && (
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
                )}
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
                      <span className="block text-xs font-semibold truncate" data-pii="name">{profile?.full_name || t('settings.profileTitle')}</span>
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
