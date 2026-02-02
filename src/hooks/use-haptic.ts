/**
 * Haptic Feedback Hook
 * Provides tactile feedback for mobile interactions using the Vibration API
 */

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticFeedbackType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30, 10, 30],
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [30, 20, 30, 20, 30],
  selection: [5],
};

export function useHaptic() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (type: HapticFeedbackType = 'light') => {
    if (!isSupported) return false;
    
    try {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
      return true;
    } catch {
      return false;
    }
  };

  const cancel = () => {
    if (!isSupported) return;
    navigator.vibrate(0);
  };

  return {
    isSupported,
    trigger,
    cancel,
    // Convenience methods
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
    selection: () => trigger('selection'),
  };
}

// Standalone function for use outside React components
export function hapticFeedback(type: HapticFeedbackType = 'light'): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }
  
  try {
    const pattern = hapticPatterns[type];
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}
