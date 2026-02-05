import { lazy, Suspense, memo, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaSection } from './AreaSection';
import { FocusSelector } from './FocusSelector';
import { FOCUS_AREA_ORDER, FocusAreaId } from '@/lib/constants/focus-areas';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { Settings2, HelpCircle, Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load area content components for true lazy loading per area
const NegocioAreaContent = lazy(() => import('./areas/NegocioAreaContent').then(m => ({ default: m.NegocioAreaContent })));
const FamiliaAreaContent = lazy(() => import('./areas/FamiliaAreaContent').then(m => ({ default: m.FamiliaAreaContent })));
const DiaDiaAreaContent = lazy(() => import('./areas/DiaDiaAreaContent').then(m => ({ default: m.DiaDiaAreaContent })));
const CrecimientoAreaContent = lazy(() => import('./areas/CrecimientoAreaContent').then(m => ({ default: m.CrecimientoAreaContent })));
const ImpuestosAreaContent = lazy(() => import('./areas/ImpuestosAreaContent').then(m => ({ default: m.ImpuestosAreaContent })));

// Skeletons
const SectionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-[200px]" />
    <Skeleton className="h-[200px]" />
  </div>
);

// Guide content for each area
const AREA_GUIDES: Record<FocusAreaId, { es: string; en: string }> = {
  negocio: {
    es: 'Aquí gestionas todo lo relacionado con tu negocio: clientes, contratos y kilometraje deducible.',
    en: 'Here you manage everything related to your business: clients, contracts, and deductible mileage.',
  },
  familia: {
    es: 'Controla el presupuesto familiar, suscripciones, deudas y analiza cómo fluye el dinero en casa.',
    en: 'Control family budget, subscriptions, debts, and analyze how money flows at home.',
  },
  diadia: {
    es: 'Captura gastos rápidamente, organiza recibos y mantén el control de tus finanzas diarias.',
    en: 'Quickly capture expenses, organize receipts, and keep control of your daily finances.',
  },
  crecimiento: {
    es: 'Planifica tu independencia financiera con calculadoras FIRE, inversiones y mentoría financiera.',
    en: 'Plan your financial independence with FIRE calculators, investments, and financial mentorship.',
  },
  impuestos: {
    es: 'Optimiza tus impuestos con IA, revisa deducciones y mantente al día con el calendario fiscal.',
    en: 'Optimize your taxes with AI, review deductions, and stay on top of the tax calendar.',
  },
};

// Area content component mapping - only renders when area is expanded
const AreaContentRenderer = memo(({ areaId, isCollapsed }: { areaId: FocusAreaId; isCollapsed: boolean }) => {
  // Don't load content at all if collapsed - true lazy loading
  if (isCollapsed) return null;

  const contentMap: Record<FocusAreaId, ReactNode> = {
    negocio: <NegocioAreaContent />,
    familia: <FamiliaAreaContent />,
    diadia: <DiaDiaAreaContent />,
    crecimiento: <CrecimientoAreaContent />,
    impuestos: <ImpuestosAreaContent />,
  };

  return (
    <Suspense fallback={<SectionSkeleton />}>
      {contentMap[areaId]}
    </Suspense>
  );
});

AreaContentRenderer.displayName = 'AreaContentRenderer';

export const OrganizedDashboard = memo(() => {
  const { language } = useLanguage();
  const {
    activeAreas,
    isAreaCollapsed,
    toggleCollapsed,
    showFocusDialog,
    setShowFocusDialog,
    setActiveAreas,
  } = useDisplayPreferences();
  const [focusSelectorOpen, setFocusSelectorOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const dialogShownRef = useRef(false);

  useEffect(() => {
    // Only run once per mount when showFocusDialog is true
    if (showFocusDialog && !dialogShownRef.current) {
      dialogShownRef.current = true;
      setFocusSelectorOpen(true);
      setShowFocusDialog(false);
    }
  }, [showFocusDialog, setShowFocusDialog]);

  const visibleAreas = FOCUS_AREA_ORDER.filter((areaId) => activeAreas.includes(areaId));
  const allCollapsed = visibleAreas.every(areaId => isAreaCollapsed(areaId));

  // Memoized callbacks
  const handleToggleCollapse = useCallback((areaId: FocusAreaId) => {
    toggleCollapsed(areaId);
  }, [toggleCollapsed]);

  const handleExpandAll = useCallback(() => {
    visibleAreas.forEach(areaId => {
      if (isAreaCollapsed(areaId)) {
        toggleCollapsed(areaId);
      }
    });
  }, [visibleAreas, isAreaCollapsed, toggleCollapsed]);

  const handleCollapseAll = useCallback(() => {
    visibleAreas.forEach(areaId => {
      if (!isAreaCollapsed(areaId)) {
        toggleCollapsed(areaId);
      }
    });
  }, [visibleAreas, isAreaCollapsed, toggleCollapsed]);

  return (
    <div className="space-y-6">
      {/* Header with settings */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {language === 'es' ? '🎛️ Centro de Control por Áreas' : '🎛️ Control Center by Areas'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'es'
              ? 'Haz clic en cada sección para colapsar/expandir'
              : 'Click each section to collapse/expand'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGuide(!showGuide)}
                  aria-label={language === 'es' ? 'Mostrar guía' : 'Show guide'}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {language === 'es' ? 'Mostrar/ocultar guía' : 'Show/hide guide'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={allCollapsed ? handleExpandAll : handleCollapseAll}
                  aria-label={allCollapsed 
                    ? (language === 'es' ? 'Expandir todo' : 'Expand all')
                    : (language === 'es' ? 'Colapsar todo' : 'Collapse all')
                  }
                >
                  {allCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {allCollapsed 
                  ? (language === 'es' ? 'Expandir todo' : 'Expand all')
                  : (language === 'es' ? 'Colapsar todo' : 'Collapse all')
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={() => setFocusSelectorOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {language === 'es' ? 'Elegir Áreas' : 'Choose Areas'}
            </span>
          </Button>
        </div>
      </div>

      {/* Contextual Guide */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      {language === 'es' ? '¿Cómo usar el Centro de Control?' : 'How to use the Control Center?'}
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {language === 'es' 
                        ? 'Haz clic en el encabezado de cada área para expandir o colapsar' 
                        : 'Click on each area header to expand or collapse'}</li>
                      <li>• {language === 'es'
                        ? 'Usa "Elegir Áreas" para personalizar qué secciones ver'
                        : 'Use "Choose Areas" to customize which sections to see'}</li>
                      <li>• {language === 'es'
                        ? 'Las áreas colapsadas no cargan contenido, mejorando el rendimiento'
                        : 'Collapsed areas don\'t load content, improving performance'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Area Sections */}
      {visibleAreas.map((areaId) => (
        <AreaSection
          key={areaId}
          areaId={areaId}
          isCollapsed={isAreaCollapsed(areaId)}
          onToggleCollapse={() => handleToggleCollapse(areaId)}
        >
          <AreaContentRenderer areaId={areaId} isCollapsed={isAreaCollapsed(areaId)} />
        </AreaSection>
      ))}

      {/* Empty state */}
      {visibleAreas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Settings2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">
              {language === 'es' ? 'No hay áreas seleccionadas' : 'No areas selected'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'es' 
                ? 'Elige las áreas que quieres ver en tu centro de control personalizado'
                : 'Choose the areas you want to see in your personalized control center'}
            </p>
            <Button onClick={() => setFocusSelectorOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Elegir Áreas' : 'Choose Areas'}
            </Button>
          </CardContent>
        </Card>
      )}

      {focusSelectorOpen && (
        <FocusSelector
          open={focusSelectorOpen}
          onOpenChange={setFocusSelectorOpen}
          activeAreas={activeAreas}
          onSaveActiveAreas={setActiveAreas}
        />
      )}
    </div>
  );
});

OrganizedDashboard.displayName = 'OrganizedDashboard';
