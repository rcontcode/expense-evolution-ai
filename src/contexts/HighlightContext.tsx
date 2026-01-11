import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type HighlightColor = 'orange' | 'green' | 'red' | 'blue' | 'purple';

export interface HighlightTarget {
  selector: string; // CSS selector or data-highlight attribute
  label?: string; // Optional label to show
}

interface HighlightContextType {
  activeHighlights: HighlightTarget[];
  highlightColor: HighlightColor;
  setHighlightColor: (color: HighlightColor) => void;
  highlight: (targets: HighlightTarget | HighlightTarget[]) => void;
  clearHighlights: () => void;
  isHighlightEnabled: boolean;
  toggleHighlightEnabled: () => void;
}

const HighlightContext = createContext<HighlightContextType | undefined>(undefined);

const STORAGE_KEY = 'evofinz_highlight_preferences';

const HIGHLIGHT_COLORS: Record<HighlightColor, { border: string; bg: string; glow: string }> = {
  orange: { 
    border: 'rgba(249, 115, 22, 0.9)', 
    bg: 'rgba(249, 115, 22, 0.15)', 
    glow: '0 0 20px rgba(249, 115, 22, 0.6)' 
  },
  green: { 
    border: 'rgba(34, 197, 94, 0.9)', 
    bg: 'rgba(34, 197, 94, 0.15)', 
    glow: '0 0 20px rgba(34, 197, 94, 0.6)' 
  },
  red: { 
    border: 'rgba(239, 68, 68, 0.9)', 
    bg: 'rgba(239, 68, 68, 0.15)', 
    glow: '0 0 20px rgba(239, 68, 68, 0.6)' 
  },
  blue: { 
    border: 'rgba(59, 130, 246, 0.9)', 
    bg: 'rgba(59, 130, 246, 0.15)', 
    glow: '0 0 20px rgba(59, 130, 246, 0.6)' 
  },
  purple: { 
    border: 'rgba(168, 85, 247, 0.9)', 
    bg: 'rgba(168, 85, 247, 0.15)', 
    glow: '0 0 20px rgba(168, 85, 247, 0.6)' 
  },
};

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [activeHighlights, setActiveHighlights] = useState<HighlightTarget[]>([]);
  const [highlightColor, setHighlightColorState] = useState<HighlightColor>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.color || 'orange';
      }
    } catch (e) {
      console.error('Failed to load highlight preferences:', e);
    }
    return 'orange';
  });
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.enabled !== false;
      }
    } catch (e) {
      console.error('Failed to load highlight preferences:', e);
    }
    return true;
  });

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        color: highlightColor, 
        enabled: isHighlightEnabled 
      }));
    } catch (e) {
      console.error('Failed to save highlight preferences:', e);
    }
  }, [highlightColor, isHighlightEnabled]);

  // Apply highlight styles to elements with retry logic for elements that might not be rendered yet
  useEffect(() => {
    // Clear previous highlights first
    const clearAllHighlights = () => {
      document.querySelectorAll('[data-evofinz-highlighted]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.removeProperty('outline');
        htmlEl.style.removeProperty('outline-offset');
        htmlEl.style.removeProperty('box-shadow');
        htmlEl.style.removeProperty('background-color');
        htmlEl.style.removeProperty('z-index');
        htmlEl.style.removeProperty('position');
        htmlEl.style.removeProperty('transition');
        htmlEl.removeAttribute('data-evofinz-highlighted');
      });
    };

    if (!isHighlightEnabled || activeHighlights.length === 0) {
      clearAllHighlights();
      return;
    }

    // Function to apply highlights with retry
    const applyHighlights = (attempt: number = 0) => {
      // Clear before applying new highlights
      clearAllHighlights();

      const colors = HIGHLIGHT_COLORS[highlightColor];
      let firstHighlightedElement: HTMLElement | null = null;
      let foundAny = false;
      
      activeHighlights.forEach((target, index) => {
        // Try multiple selector strategies
        let elements: NodeListOf<Element> | null = null;
        
        // Strategy 1: data-highlight attribute (preferred)
        elements = document.querySelectorAll(`[data-highlight="${target.selector}"]`);
        
        // Strategy 2: CSS selector fallback
        if (elements.length === 0) {
          try {
            elements = document.querySelectorAll(target.selector);
          } catch (e) {
            console.warn('Invalid selector:', target.selector);
          }
        }
        
        // Strategy 3: ID selector
        if (elements && elements.length === 0) {
          const byId = document.getElementById(target.selector);
          if (byId) {
            elements = document.querySelectorAll(`#${target.selector}`);
          }
        }

        if (elements && elements.length > 0) {
          foundAny = true;
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.setAttribute('data-evofinz-highlighted', 'true');
            htmlEl.style.transition = 'all 0.3s ease-in-out';
            htmlEl.style.outline = `3px solid ${colors.border}`;
            htmlEl.style.outlineOffset = '4px';
            htmlEl.style.boxShadow = `${colors.glow}, inset 0 0 30px ${colors.bg}`;
            htmlEl.style.backgroundColor = colors.bg;
            htmlEl.style.zIndex = '100';
            htmlEl.style.borderRadius = '8px';
            if (htmlEl.style.position === 'static' || !htmlEl.style.position) {
              htmlEl.style.position = 'relative';
            }
            
            // Store first element for scrolling
            if (index === 0 && !firstHighlightedElement) {
              firstHighlightedElement = htmlEl;
            }
          });
        }
      });

      // If no elements found and we have retries left, try again after a delay
      if (!foundAny && attempt < 5) {
        console.log(`[Highlight] No elements found, retry ${attempt + 1}/5...`);
        setTimeout(() => applyHighlights(attempt + 1), 300 * (attempt + 1));
        return;
      }

      // Scroll to first highlighted element with a slight delay for DOM updates
      if (firstHighlightedElement) {
        setTimeout(() => {
          if (firstHighlightedElement) {
            // Get element position and scroll with offset for better visibility
            const rect = firstHighlightedElement.getBoundingClientRect();
            const isInViewport = (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );

            // Only scroll if element is not fully visible
            if (!isInViewport) {
              firstHighlightedElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            }
          }
        }, 150);
      }
    };

    // Start applying highlights with initial delay to allow for page render
    const initialDelay = setTimeout(() => applyHighlights(0), 100);

    // Cleanup function
    return () => {
      clearTimeout(initialDelay);
      clearAllHighlights();
    };
  }, [activeHighlights, highlightColor, isHighlightEnabled]);

  const highlight = useCallback((targets: HighlightTarget | HighlightTarget[]) => {
    if (!isHighlightEnabled) return;
    const targetArray = Array.isArray(targets) ? targets : [targets];
    setActiveHighlights(targetArray);

    // Auto-clear after 10 seconds
    setTimeout(() => {
      setActiveHighlights([]);
    }, 10000);
  }, [isHighlightEnabled]);

  const clearHighlights = useCallback(() => {
    setActiveHighlights([]);
  }, []);

  const setHighlightColor = useCallback((color: HighlightColor) => {
    setHighlightColorState(color);
  }, []);

  const toggleHighlightEnabled = useCallback(() => {
    setIsHighlightEnabled(prev => !prev);
  }, []);

  return (
    <HighlightContext.Provider
      value={{
        activeHighlights,
        highlightColor,
        setHighlightColor,
        highlight,
        clearHighlights,
        isHighlightEnabled,
        toggleHighlightEnabled,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight() {
  const context = useContext(HighlightContext);
  if (context === undefined) {
    throw new Error('useHighlight must be used within a HighlightProvider');
  }
  return context;
}

// Helper map for common UI elements that can be highlighted
export const HIGHLIGHTABLE_ELEMENTS = {
  // Mileage page
  'add-trip-button': 'add-trip-button',
  'mileage-table': 'mileage-table',
  'mileage-summary': 'mileage-summary',
  'year-selector': 'year-selector',
  'import-button': 'import-button',
  
  // Expenses page
  'add-expense-button': 'add-expense-button',
  'expenses-table': 'expenses-table',
  'expense-filters': 'expense-filters',
  'quick-capture': 'quick-capture',
  'bulk-assign-button': 'bulk-assign-button',
  'reimbursement-report': 'reimbursement-report',
  'export-button': 'export-button',
  
  // Income page
  'add-income-button': 'add-income-button',
  'income-table': 'income-table',
  
  // Dashboard
  'balance-card': 'balance-card',
  'control-center': 'control-center',
  'timeline-chart': 'timeline-chart',
  
  // Clients
  'add-client-button': 'add-client-button',
  'clients-grid': 'clients-grid',
  
  // Projects
  'add-project-button': 'add-project-button',
  'projects-grid': 'projects-grid',
  
  // Net Worth
  'assets-section': 'assets-section',
  'liabilities-section': 'liabilities-section',
  'net-worth-chart': 'net-worth-chart',
  
  // Banking
  'bank-import-guide': 'bank-import-guide',
  'bank-analysis-dashboard': 'bank-analysis-dashboard',
  
  // Contracts
  'upload-contract-button': 'upload-contract-button',
  'contracts-table': 'contracts-table',
  
  // Mentorship
  'mentorship-level': 'mentorship-level',
  'mentorship-tabs': 'mentorship-tabs',
  'mentor-selector': 'mentor-selector',
  'financial-library': 'financial-library',
  
  // Tax Calendar
  'tax-status-cards': 'tax-status-cards',
  'tax-tabs': 'tax-tabs',
  'tax-tab-list': 'tax-tab-list',
  'tax-estimator': 'tax-estimator',
  
  // Capture
  'capture-photo-button': 'capture-photo-button',
  'capture-file-button': 'capture-file-button',
  'capture-voice-button': 'capture-voice-button',
  
  // General
  'sidebar-nav': 'sidebar-nav',
  'entity-selector': 'entity-selector',
  'chat-assistant': 'chat-assistant',
} as const;
