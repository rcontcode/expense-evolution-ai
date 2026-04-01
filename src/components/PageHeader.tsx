import { ChevronLeft, ChevronRight, Home, Sun, Moon, Undo2, Redo2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUndoRedo } from '@/contexts/UndoRedoContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  children?: React.ReactNode;
}

// Route configuration for breadcrumbs
const ROUTE_CONFIG: Record<string, { labelEs: string; labelEn: string; parent?: string }> = {
  '/dashboard': { labelEs: 'Dashboard', labelEn: 'Dashboard' },
  '/chaos': { labelEs: 'Bandeja de Entrada', labelEn: 'Chaos Inbox', parent: '/dashboard' },
  '/expenses': { labelEs: 'Gastos', labelEn: 'Expenses', parent: '/dashboard' },
  '/income': { labelEs: 'Ingresos', labelEn: 'Income', parent: '/dashboard' },
  '/clients': { labelEs: 'Clientes', labelEn: 'Clients', parent: '/dashboard' },
  '/projects': { labelEs: 'Proyectos', labelEn: 'Projects', parent: '/dashboard' },
  '/tags': { labelEs: 'Etiquetas', labelEn: 'Tags', parent: '/dashboard' },
  '/contracts': { labelEs: 'Contratos', labelEn: 'Contracts', parent: '/dashboard' },
  '/mileage': { labelEs: 'Kilometraje', labelEn: 'Mileage', parent: '/dashboard' },
  '/reconciliation': { labelEs: 'Conciliación', labelEn: 'Reconciliation', parent: '/dashboard' },
  '/net-worth': { labelEs: 'Patrimonio Neto', labelEn: 'Net Worth', parent: '/dashboard' },
  '/banking': { labelEs: 'Análisis Bancario', labelEn: 'Banking Analysis', parent: '/dashboard' },
  '/mentorship': { labelEs: 'Mentoría Financiera', labelEn: 'Financial Mentorship', parent: '/dashboard' },
  '/notifications': { labelEs: 'Notificaciones', labelEn: 'Notifications', parent: '/dashboard' },
  '/settings': { labelEs: 'Configuración', labelEn: 'Settings', parent: '/dashboard' },
  '/business-profile': { labelEs: 'Perfil de Negocio', labelEn: 'Business Profile', parent: '/settings' },
  '/capture': { labelEs: 'Captura Rápida', labelEn: 'Quick Capture', parent: '/expenses' },
  '/budget': { labelEs: 'Presupuesto', labelEn: 'Budget', parent: '/dashboard' },
  '/bills': { labelEs: 'Pagos Fijos', labelEn: 'Fixed Payments', parent: '/dashboard' },
  '/tax-calendar': { labelEs: 'Calendario Fiscal', labelEn: 'Tax Calendar', parent: '/dashboard' },
  '/adventure': { labelEs: 'Aventura Financiera', labelEn: 'Financial Adventure', parent: '/dashboard' },
  '/files': { labelEs: 'Centro de Archivos', labelEn: 'File Center', parent: '/dashboard' },
  '/trash': { labelEs: 'Papelera', labelEn: 'Trash', parent: '/dashboard' },
  '/reports': { labelEs: 'Reportes', labelEn: 'Reports', parent: '/dashboard' },
  '/data-health': { labelEs: 'Salud de Datos', labelEn: 'Data Health', parent: '/dashboard' },
  '/beta-feedback': { labelEs: 'Feedback Beta', labelEn: 'Beta Feedback', parent: '/dashboard' },
  '/beta-guide': { labelEs: 'Guía Beta', labelEn: 'Beta Guide', parent: '/dashboard' },
  // Admin routes
  '/admin/crm': { labelEs: 'CRM & Apps', labelEn: 'CRM & Apps', parent: '/settings' },
  '/admin/beta-dashboard': { labelEs: 'Beta Dashboard', labelEn: 'Beta Dashboard', parent: '/settings' },
  '/admin/leads': { labelEs: 'Gestión de Leads', labelEn: 'Leads Management', parent: '/admin/crm' },
  '/admin/beta-codes': { labelEs: 'Códigos Beta', labelEn: 'Beta Codes', parent: '/admin/beta-dashboard' },
  '/admin/ecosystem-lab': { labelEs: 'Lab Ecosistema', labelEn: 'Ecosystem Lab', parent: '/settings' },
};

export function PageHeader({ title, description, showBack = true, children }: PageHeaderProps) {
  const navigate = useSafeNavigation();
  const location = useLocation();
  const { language } = useLanguage();
  const { resolvedMode, setMode } = useTheme();
  const isMobile = useIsMobile();
  
  const GlobalControls = () => (
    <div className="flex items-center gap-1">
      <LanguageSelector />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}
        className="h-8 w-8"
      >
        {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
  
  const currentPath = location.pathname;
  const currentRoute = ROUTE_CONFIG[currentPath];
  
  // Build breadcrumb trail
  const buildBreadcrumbs = () => {
    const breadcrumbs: { path: string; label: string }[] = [];
    let path = currentPath;
    
    while (path && ROUTE_CONFIG[path]) {
      const route = ROUTE_CONFIG[path];
      breadcrumbs.unshift({
        path,
        label: language === 'es' ? route.labelEs : route.labelEn,
      });
      path = route.parent || '';
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = buildBreadcrumbs();
  const canGoBack = breadcrumbs.length > 1 || window.history.length > 1;
  
  const handleBack = () => {
    // If there's real browser history (user navigated here from another page), go back
    // window.history.state?.idx > 0 means there's a previous entry in this session
    const hasRealHistory = window.history.state?.idx > 0;
    if (hasRealHistory) {
      window.history.back();
    } else if (currentRoute?.parent) {
      navigate(currentRoute.parent);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className={cn("mb-4", isMobile ? "space-y-2" : "space-y-2 mb-6")}>
      {/* Breadcrumb Navigation - Hidden on mobile for cleaner look */}
      {!isMobile && (
        <div className="flex items-center gap-2">
          {showBack && canGoBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="h-8 w-8 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-3.5 w-3.5" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isDashboard = crumb.path === '/dashboard';
              
              // Skip dashboard in breadcrumbs since we have home icon
              if (isDashboard) return null;
              
              return (
                <div key={crumb.path} className="flex items-center">
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(crumb.path);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      )}
      
      {/* Mobile: Large native title - hide back on main routes */}
      {isMobile && (() => {
        const mainRoutes = ['/dashboard', '/expenses', '/budget', '/income', '/clients'];
        const isMainRoute = mainRoutes.includes(currentPath);
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {showBack && canGoBack && !isMainRoute && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBack}
                  className="h-8 w-8 shrink-0 -ml-1.5"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {children}
              <GlobalControls />
            </div>
          </div>
        );
      })()}
      
      {/* Desktop: Title and Description */}
      {!isMobile && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-start sm:justify-end">
            {children}
            <GlobalControls />
          </div>
        </div>
      )}
    </div>
  );
}
