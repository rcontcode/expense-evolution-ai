import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHighlight } from '@/contexts/HighlightContext';

// Mapa RGB para cada color configurable por el usuario
const ARRIVAL_COLOR_RGB: Record<string, [number, number, number]> = {
  orange: [249, 115, 22],
  green:  [34,  197, 94],
  red:    [239, 68,  68],
  blue:   [59,  130, 246],
  purple: [168, 85,  247],
};

interface UseHighlightOnArrivalOptions {
  /** The search param key to check (default: 'tab') */
  paramKey?: string;
  /** Duration of the highlight in ms (default: 3000) */
  duration?: number;
  /** Whether to scroll the highlighted element into view (default: true) */
  scrollIntoView?: boolean;
}

interface HighlightResult {
  /** The value from the URL param that triggered arrival */
  arrivedAt: string | null;
  /** Whether the highlight animation is currently active */
  isHighlighted: boolean;
  /** CSS classes to apply to the highlighted element */
  highlightClass: string;
  /** Ref to attach to the element that should be scrolled into view */
  highlightRef: React.RefObject<HTMLDivElement>;
  /** Manually trigger highlight for a specific value */
  triggerHighlight: (value: string) => void;
  /** Check if a specific tab/section should be highlighted */
  shouldHighlight: (value: string) => boolean;
  /** Get highlight classes for a specific value */
  getHighlightProps: (value: string) => {
    className: string;
    ref?: React.RefObject<HTMLDivElement>;
    'data-highlighted'?: boolean;
  };
}

/**
 * Hook that detects when a user arrives at a page via a shortcut (URL param)
 * and provides highlight animation state for the target section.
 * 
 * Usage:
 * ```tsx
 * const { getHighlightProps, arrivedAt } = useHighlightOnArrival();
 * 
 * <TabsContent {...getHighlightProps('payments')}>
 *   ...
 * </TabsContent>
 * ```
 */
export function useHighlightOnArrival(options: UseHighlightOnArrivalOptions = {}): HighlightResult {
  const { paramKey = 'tab', duration = 5000, scrollIntoView = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null!);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Lee el color configurado por el usuario desde HighlightContext
  const { highlightColor } = useHighlight();

  const arrivedAt = searchParams.get(paramKey);

  // Inyecta las variables CSS RGB al activarse el highlight
  useEffect(() => {
    const rgb = ARRIVAL_COLOR_RGB[highlightColor] ?? ARRIVAL_COLOR_RGB.orange;
    document.documentElement.style.setProperty('--har', String(rgb[0]));
    document.documentElement.style.setProperty('--hag', String(rgb[1]));
    document.documentElement.style.setProperty('--hab', String(rgb[2]));
  }, [highlightColor]);

  // On mount, if param exists, activate highlight with a small delay
  // so the DOM is painted before the CSS animation starts
  useEffect(() => {
    if (arrivedAt) {
      // Pequeño delay para que el browser pinte antes de agregar la clase
      const activateTimer = setTimeout(() => {
        setActiveHighlight(arrivedAt);
        setIsHighlighted(true);
      }, 200);

      // Scroll to top so the tabs are visible
      if (scrollIntoView) {
        const scrollTimer = setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
        return () => {
          clearTimeout(activateTimer);
          clearTimeout(scrollTimer);
        };
      }
      return () => clearTimeout(activateTimer);
    }
  }, [arrivedAt, scrollIntoView]);

  // Auto-clear highlight after duration
  useEffect(() => {
    if (isHighlighted) {
      timeoutRef.current = setTimeout(() => {
        setIsHighlighted(false);
        setActiveHighlight(null);
        // Clean URL param silently
        const newParams = new URLSearchParams(searchParams);
        newParams.delete(paramKey);
        setSearchParams(newParams, { replace: true });
      }, duration);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isHighlighted, duration, paramKey, searchParams, setSearchParams]);

  const triggerHighlight = useCallback((value: string) => {
    setActiveHighlight(value);
    setIsHighlighted(true);
  }, []);

  const shouldHighlight = useCallback((value: string) => {
    return isHighlighted && activeHighlight === value;
  }, [isHighlighted, activeHighlight]);

  const getHighlightProps = useCallback((value: string) => {
    const highlighted = isHighlighted && activeHighlight === value;
    return {
      className: highlighted ? 'highlight-on-arrival' : '',
      ...(highlighted ? { ref: highlightRef, 'data-highlighted': true } : {}),
    };
  }, [isHighlighted, activeHighlight]);

  const highlightClass = isHighlighted ? 'highlight-on-arrival' : '';

  return {
    arrivedAt,
    isHighlighted,
    highlightClass,
    highlightRef,
    triggerHighlight,
    shouldHighlight,
    getHighlightProps,
  };
}
