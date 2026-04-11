import confetti from 'canvas-confetti';
import { useUserSettings } from '@/hooks/data/useUserSettings';

/**
 * Centralized confetti hook that respects gamification_enabled preference.
 * Only fires confetti when gamification is enabled in user settings.
 */
export function useConfetti() {
  const { data: settings } = useUserSettings();
  const prefs = (settings?.user_preferences as Record<string, unknown>) || {};
  const enabled = prefs.gamification_enabled !== false;

  const fire = (options?: confetti.Options) => {
    if (!enabled) return;
    confetti(options);
  };

  return { fire, enabled };
}
