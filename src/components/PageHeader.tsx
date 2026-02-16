import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
};

export function PageHeader({ title, description, showBack = true, children }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  
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
    if (currentRoute?.parent) {
      navigate(currentRoute.parent);
    } else {
      navigate(-1);
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
      
      {/* Mobile: Back button + Title inline */}
      {isMobile && showBack && canGoBack && (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="h-8 w-8 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold truncate">{title}</h1>
        </div>
      )}
      
      {/* Title and Description */}
      <div className={cn(
        "flex flex-col gap-3",
        !isMobile && "sm:flex-row sm:items-start justify-between"
      )}>
        {/* Only show title block if not already shown in mobile back button row */}
        {!(isMobile && showBack && canGoBack) && (
          <div className="min-w-0">
            <h1 className={cn(
              "font-bold truncate",
              isMobile ? "text-lg" : "text-xl sm:text-2xl lg:text-3xl"
            )}>{title}</h1>
            {description && (
              <p className={cn(
                "text-muted-foreground mt-0.5 line-clamp-1",
                isMobile ? "text-xs" : "text-sm"
              )}>{description}</p>
            )}
          </div>
        )}
        {/* Description for mobile when title is in back button row */}
        {isMobile && showBack && canGoBack && description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        )}
        {children && (
          <div className={cn(
            "flex items-center gap-1.5 shrink-0 flex-wrap",
            isMobile ? "justify-start" : "sm:gap-2 justify-start sm:justify-end"
          )}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
