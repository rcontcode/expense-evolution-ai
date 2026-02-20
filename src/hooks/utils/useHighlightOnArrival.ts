import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

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
  const { paramKey = 'tab', duration = 3500, scrollIntoView = true } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null!);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const arrivedAt = searchParams.get(paramKey);

  // On mount, if param exists, activate highlight
  useEffect(() => {
    if (arrivedAt) {
      setActiveHighlight(arrivedAt);
      setIsHighlighted(true);

      // Scroll into view after a short delay for rendering
      if (scrollIntoView) {
        const scrollTimer = setTimeout(() => {
          highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
        return () => clearTimeout(scrollTimer);
      }
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
