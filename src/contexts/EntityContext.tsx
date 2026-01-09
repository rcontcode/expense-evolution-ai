import { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react';
import { useFiscalEntities, usePrimaryFiscalEntity, type FiscalEntity } from '@/hooks/data/useFiscalEntities';

interface EntityContextType {
  // Current active entity (selected or primary)
  currentEntity: FiscalEntity | null;
  // All user entities
  entities: FiscalEntity[];
  // Active entities only
  activeEntities: FiscalEntity[];
  // Loading state
  isLoading: boolean;
  // Helper to get entity by ID
  getEntityById: (id: string) => FiscalEntity | undefined;
  // Check if multi-entity mode is enabled
  isMultiEntity: boolean;
  // Current entity's currency
  currentCurrency: string;
  // Current entity's country
  currentCountry: string;
  // View mode: show all entities or just current
  showAllEntities: boolean;
  // Toggle view mode
  setShowAllEntities: (showAll: boolean) => void;
  // Select a specific entity
  selectEntity: (entityId: string) => void;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: ReactNode }) {
  const { data: entities = [], isLoading: entitiesLoading } = useFiscalEntities();
  const { data: primaryEntity, isLoading: primaryLoading } = usePrimaryFiscalEntity();
  
  // State for view mode and selected entity
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const selectEntity = useCallback((entityId: string) => {
    setSelectedEntityId(entityId);
    setShowAllEntities(false); // When selecting a specific entity, disable "all" view
  }, []);

  const value = useMemo(() => {
    const activeEntities = entities.filter(e => e.is_active !== false);
    
    // Determine current entity: selected > primary > first active
    let currentEntity: FiscalEntity | null = null;
    if (selectedEntityId) {
      currentEntity = entities.find(e => e.id === selectedEntityId) || null;
    }
    if (!currentEntity) {
      currentEntity = primaryEntity || activeEntities[0] || null;
    }
    
    return {
      currentEntity,
      entities,
      activeEntities,
      isLoading: entitiesLoading || primaryLoading,
      getEntityById: (id: string) => entities.find(e => e.id === id),
      isMultiEntity: activeEntities.length > 1,
      currentCurrency: currentEntity?.default_currency || 'CAD',
      currentCountry: currentEntity?.country || 'CA',
      showAllEntities,
      setShowAllEntities,
      selectEntity,
    };
  }, [entities, primaryEntity, entitiesLoading, primaryLoading, showAllEntities, selectedEntityId, selectEntity]);

  return (
    <EntityContext.Provider value={value}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  return context;
}

// Optional hook that doesn't throw if used outside provider
export function useEntityOptional() {
  return useContext(EntityContext);
}
