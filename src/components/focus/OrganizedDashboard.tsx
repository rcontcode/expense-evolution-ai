 import { lazy, Suspense, memo, useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';
 import { Skeleton } from '@/components/ui/skeleton';
import { AreaSection } from './AreaSection';
 import { FocusSelector } from './FocusSelector';
 import { ControlCenterHeader } from './ControlCenterHeader';
 import { ContextualGuide } from './ContextualGuide';
 import { EmptyAreaState } from './EmptyAreaState';
 import { AreaErrorBoundary } from './AreaErrorBoundary';
import { FOCUS_AREA_ORDER, FocusAreaId } from '@/lib/constants/focus-areas';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
 import { AnimatePresence } from 'framer-motion';

// Lazy load area content components for true lazy loading per area
const NegocioAreaContent = lazy(() => import('./areas/NegocioAreaContent').then(m => ({ default: m.NegocioAreaContent })));
const FamiliaAreaContent = lazy(() => import('./areas/FamiliaAreaContent').then(m => ({ default: m.FamiliaAreaContent })));
const DiaDiaAreaContent = lazy(() => import('./areas/DiaDiaAreaContent').then(m => ({ default: m.DiaDiaAreaContent })));
const CrecimientoAreaContent = lazy(() => import('./areas/CrecimientoAreaContent').then(m => ({ default: m.CrecimientoAreaContent })));
const ImpuestosAreaContent = lazy(() => import('./areas/ImpuestosAreaContent').then(m => ({ default: m.ImpuestosAreaContent })));

 // Skeleton for lazy-loaded area content
 const AreaSkeleton = () => (
   <div className="space-y-4 animate-pulse">
     <Skeleton className="h-[180px] rounded-lg" />
     <div className="grid gap-4 md:grid-cols-2">
       <Skeleton className="h-[120px] rounded-lg" />
       <Skeleton className="h-[120px] rounded-lg" />
     </div>
   </div>
 );
 
 // Area name mapping for error boundaries
 const AREA_NAMES: Record<FocusAreaId, string> = {
   negocio: 'Negocio',
   familia: 'Familia',
   diadia: 'Día a Día',
   crecimiento: 'Crecimiento',
   impuestos: 'Impuestos',
 };

 // Area content with error boundary - only renders when expanded
 const AreaContentRenderer = memo(({ areaId, isCollapsed }: { areaId: FocusAreaId; isCollapsed: boolean }) => {
   // True lazy loading: don't mount anything if collapsed
   if (isCollapsed) return null;
 
   const contentMap: Record<FocusAreaId, ReactNode> = {
     negocio: <NegocioAreaContent />,
     familia: <FamiliaAreaContent />,
     diadia: <DiaDiaAreaContent />,
     crecimiento: <CrecimientoAreaContent />,
     impuestos: <ImpuestosAreaContent />,
   };
 
   return (
     <AreaErrorBoundary areaName={AREA_NAMES[areaId]}>
       <Suspense fallback={<AreaSkeleton />}>
         {contentMap[areaId]}
       </Suspense>
     </AreaErrorBoundary>
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

   // Memoize derived state
   const visibleAreas = useMemo(
     () => FOCUS_AREA_ORDER.filter((areaId) => activeAreas.includes(areaId)),
     [activeAreas]
   );
   
   const { allCollapsed, expandedCount } = useMemo(() => {
     const collapsed = visibleAreas.filter(areaId => isAreaCollapsed(areaId));
     return {
       allCollapsed: collapsed.length === visibleAreas.length,
       expandedCount: visibleAreas.length - collapsed.length,
     };
   }, [visibleAreas, isAreaCollapsed]);

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
     <div className="space-y-6" role="region" aria-label={language === 'es' ? 'Centro de Control' : 'Control Center'}>
       {/* Header */}
       <ControlCenterHeader
         showGuide={showGuide}
         onToggleGuide={() => setShowGuide(!showGuide)}
         allCollapsed={allCollapsed}
         onExpandAll={handleExpandAll}
         onCollapseAll={handleCollapseAll}
         onOpenSettings={() => setFocusSelectorOpen(true)}
         expandedCount={expandedCount}
         totalCount={visibleAreas.length}
       />
 
       {/* Contextual Guide */}
       <AnimatePresence>
         {showGuide && <ContextualGuide />}
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
         <EmptyAreaState onOpenSettings={() => setFocusSelectorOpen(true)} />
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
