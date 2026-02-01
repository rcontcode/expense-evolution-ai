import { CountryContent } from '@/components/country/CountryContent';
import { RrspTfsaOptimizerCard } from '@/components/dashboard/RrspTfsaOptimizerCard';
import { ApvOptimizerCard } from './ApvOptimizerCard';

/**
 * Country-aware savings optimizer that shows:
 * - RRSP/TFSA for Canada
 * - APV/Cuenta 2 for Chile
 */
export function SavingsOptimizerSection() {
  return (
    <CountryContent
      CA={<RrspTfsaOptimizerCard />}
      CL={<ApvOptimizerCard />}
    >
      {/* Fallback for unknown countries - show Canada by default */}
      <RrspTfsaOptimizerCard />
    </CountryContent>
  );
}
