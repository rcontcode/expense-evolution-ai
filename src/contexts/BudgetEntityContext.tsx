import React, { createContext, useContext } from 'react';

interface BudgetEntityContextType {
  /** null = Family, string = specific entity, undefined = all (unified) */
  budgetEntityId: string | null | undefined;
}

const BudgetEntityContext = createContext<BudgetEntityContextType>({ budgetEntityId: undefined });

export const BudgetEntityProvider: React.FC<{
  entityId: string | null | undefined;
  children: React.ReactNode;
}> = ({ entityId, children }) => (
  <BudgetEntityContext.Provider value={{ budgetEntityId: entityId }}>
    {children}
  </BudgetEntityContext.Provider>
);

/**
 * Returns the current budget entity filter.
 * - undefined → show all (unified/no filter)
 * - null → family only (no entity_id)
 * - string → specific entity
 */
export const useBudgetEntity = () => useContext(BudgetEntityContext).budgetEntityId;
