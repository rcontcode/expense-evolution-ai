import { createContext, useContext } from 'react';
import type { EcosystemDashboardData } from '@/hooks/data/useEcosystemDashboard';

interface EcosystemContextValue {
  data: EcosystemDashboardData | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const EcosystemContext = createContext<EcosystemContextValue>({
  data: null,
  isLoading: false,
  isError: false,
  refetch: () => {},
});

export const useEcosystemData = () => useContext(EcosystemContext);
