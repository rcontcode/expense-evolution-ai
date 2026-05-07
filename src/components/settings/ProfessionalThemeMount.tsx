import { useProfessionalTheme } from '@/hooks/useProfessionalTheme';

/** Invisible: applies stored professional theme on mount. */
export function ProfessionalThemeMount() {
  useProfessionalTheme({ autoApply: true });
  return null;
}
