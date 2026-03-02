import { useState, useEffect, useCallback, useRef } from 'react';

export interface ScrollSpySection {
  id: string;
  label: { es: string; en: string };
  emoji: string;
  color: string; // tailwind gradient class
}

export function useScrollSpy(sectionIds: string[], rootSelector?: string) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) {
              best = entry;
            }
          }
        }
        if (best) {
          setActiveId(best.target.getAttribute('data-section'));
        }
      },
      {
        root: rootSelector ? document.querySelector(rootSelector) : null,
        rootMargin: '-10% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    observerRef.current = observer;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.querySelector(`[data-section="${id}"]`);
        if (el) observer.observe(el);
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [sectionIds, rootSelector]);

  const scrollTo = useCallback((sectionId: string) => {
    const el = document.querySelector(`[data-section="${sectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { activeId, scrollTo };
}
