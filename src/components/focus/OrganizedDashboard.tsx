 import { lazy, Suspense, memo, useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';
 import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
 import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
 import { Skeleton } from '@/components/ui/skeleton';
 import { SortableAreaWrapper } from './SortableAreaWrapper';
 import { SwipeableAreaSection } from './SwipeableAreaSection';
 import { AreaSearchBar } from './AreaSearchBar';
 import { FocusSelector } from './FocusSelector';
 import { ControlCenterHeader } from './ControlCenterHeader';
 import { ContextualGuide } from './ContextualGuide';
 import { EmptyAreaState } from './EmptyAreaState';
 import { AreaErrorBoundary } from './AreaErrorBoundary';
 import { AreaSection } from './AreaSection';
 import { FOCUS_AREA_ORDER, FOCUS_AREAS, FocusAreaId } from '@/lib/constants/focus-areas';
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
  const AreaContentRenderer = memo(({ areaId, isCollapsed, forcedTab }: { areaId: FocusAreaId; isCollapsed: boolean; forcedTab?: string | null }) => {
    // True lazy loading: don't mount anything if collapsed
    if (isCollapsed) return null;
  
    const contentMap: Record<FocusAreaId, ReactNode> = {
      negocio: <NegocioAreaContent forcedTab={forcedTab} />,
      familia: <FamiliaAreaContent forcedTab={forcedTab} />,
      diadia: <DiaDiaAreaContent forcedTab={forcedTab} />,
      crecimiento: <CrecimientoAreaContent forcedTab={forcedTab} />,
      impuestos: <ImpuestosAreaContent forcedTab={forcedTab} />,
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

interface OrganizedDashboardProps {
  deepLinkArea?: string | null;
  deepLinkTab?: string | null;
  deepLinkKey?: number;
}

export const OrganizedDashboard = memo(({ deepLinkArea, deepLinkTab, deepLinkKey }: OrganizedDashboardProps) => {
  const { language } = useLanguage();
   const [searchQuery, setSearchQuery] = useState('');
   const [isMobile, setIsMobile] = useState(false);
 
   // Detect mobile for swipe gestures
   useEffect(() => {
     const checkMobile = () => setIsMobile(window.innerWidth < 768);
     checkMobile();
     window.addEventListener('resize', checkMobile);
     return () => window.removeEventListener('resize', checkMobile);
   }, []);
 
   const {
    activeAreas,
    isAreaCollapsed,
    toggleCollapsed,
    showFocusDialog,
    setShowFocusDialog,
    setActiveAreas,
     areaOrder,
     setAreaOrder,
   } = useDisplayPreferences();
  const [focusSelectorOpen, setFocusSelectorOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const dialogShownRef = useRef(false);
  const lastDeepLinkKeyRef = useRef(0);

  // Deep-link: auto-expand the target area when deepLinkArea is provided
  useEffect(() => {
    if (deepLinkArea && deepLinkKey && deepLinkKey !== lastDeepLinkKeyRef.current) {
      lastDeepLinkKeyRef.current = deepLinkKey;
      const areaId = deepLinkArea as FocusAreaId;
      // Ensure the area is expanded
      if (isAreaCollapsed(areaId)) {
        toggleCollapsed(areaId);
      }
      // Scroll to the area after a brief delay
      setTimeout(() => {
        const el = document.querySelector(`[data-area-id="${areaId}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [deepLinkArea, deepLinkKey, isAreaCollapsed, toggleCollapsed]);

  useEffect(() => {
    // Only run once per mount when showFocusDialog is true
    if (showFocusDialog && !dialogShownRef.current) {
      dialogShownRef.current = true;
      setFocusSelectorOpen(true);
      setShowFocusDialog(false);
    }
  }, [showFocusDialog, setShowFocusDialog]);

 // Drag and drop sensors
   const sensors = useSensors(
     useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
   );
 
   // Memoize derived state with custom order
   const orderedAreas = useMemo(() => {
     const baseOrder = areaOrder || FOCUS_AREA_ORDER;
     return baseOrder.filter((areaId) => activeAreas.includes(areaId));
   }, [activeAreas, areaOrder]);
 
   // Filter by search query
   const visibleAreas = useMemo(() => {
     if (!searchQuery.trim()) return orderedAreas;
     const query = searchQuery.toLowerCase();
     return orderedAreas.filter((areaId) => {
       const area = FOCUS_AREAS[areaId];
       return (
         area?.name.es.toLowerCase().includes(query) ||
         area?.name.en.toLowerCase().includes(query) ||
         area?.description.es.toLowerCase().includes(query) ||
         area?.description.en.toLowerCase().includes(query)
       );
     });
   }, [orderedAreas, searchQuery]);
   
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
 
   // Handle drag end for reordering
   const handleDragEnd = useCallback((event: DragEndEvent) => {
     const { active, over } = event;
     if (over && active.id !== over.id) {
       const oldIndex = orderedAreas.indexOf(active.id as FocusAreaId);
       const newIndex = orderedAreas.indexOf(over.id as FocusAreaId);
       const newOrder = arrayMove(orderedAreas, oldIndex, newIndex);
       // Preserve any inactive areas in their original positions
       const fullOrder = FOCUS_AREA_ORDER.map(areaId => 
         newOrder.includes(areaId) ? newOrder[newOrder.indexOf(areaId)] : areaId
       ).filter((v, i, a) => a.indexOf(v) === i) as FocusAreaId[];
       setAreaOrder(fullOrder);
     }
   }, [orderedAreas, setAreaOrder]);

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
       {/* Search and Guide */}
       <div className="flex items-center gap-4">
         <AreaSearchBar value={searchQuery} onChange={setSearchQuery} />
         <AnimatePresence>
           {showGuide && <ContextualGuide />}
         </AnimatePresence>
       </div>

       {/* Area Sections with Drag & Drop */}
       <DndContext
         sensors={sensors}
         collisionDetection={closestCenter}
         onDragEnd={handleDragEnd}
       >
          <SortableContext items={visibleAreas} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 lg:space-y-5">
            {visibleAreas.map((areaId, index) => (
              <SortableAreaWrapper key={areaId} id={areaId} index={index} data-area-id={areaId}>
               {isMobile ? (
                 <SwipeableAreaSection
                   areaId={areaId}
                   isCollapsed={isAreaCollapsed(areaId)}
                   onToggleCollapse={() => handleToggleCollapse(areaId)}
                 >
                    <AreaContentRenderer areaId={areaId} isCollapsed={isAreaCollapsed(areaId)} forcedTab={deepLinkArea === areaId ? deepLinkTab : undefined} />
                 </SwipeableAreaSection>
               ) : (
                 <AreaSection
                   areaId={areaId}
                   isCollapsed={isAreaCollapsed(areaId)}
                   onToggleCollapse={() => handleToggleCollapse(areaId)}
                 >
                   <AreaContentRenderer areaId={areaId} isCollapsed={isAreaCollapsed(areaId)} forcedTab={deepLinkArea === areaId ? deepLinkTab : undefined} />
                 </AreaSection>
               )}
             </SortableAreaWrapper>
           ))}
            </div>
          </SortableContext>
       </DndContext>

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
