import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useFiscalEntities, usePrimaryFiscalEntity, type FiscalEntity } from '@/hooks/data/useFiscalEntities';

interface EntityContextType {
  // Current active entity (primary)
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
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: ReactNode }) {
  const { data: entities = [], isLoading: entitiesLoading } = useFiscalEntities();
  const { data: primaryEntity, isLoading: primaryLoading } = usePrimaryFiscalEntity();

  const value = useMemo(() => {
    const activeEntities = entities.filter(e => e.is_active !== false);
    
    return {
      currentEntity: primaryEntity || null,
      entities,
      activeEntities,
      isLoading: entitiesLoading || primaryLoading,
      getEntityById: (id: string) => entities.find(e => e.id === id),
      isMultiEntity: activeEntities.length > 1,
      currentCurrency: primaryEntity?.default_currency || 'CAD',
      currentCountry: primaryEntity?.country || 'CA',
    };
  }, [entities, primaryEntity, entitiesLoading, primaryLoading]);

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
