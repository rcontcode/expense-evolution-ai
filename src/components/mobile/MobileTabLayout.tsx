import { ReactNode, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface MobileTab {
  id: string;
  label: string;
  emoji?: string;
  content: ReactNode;
}

interface MobileTabLayoutProps {
  tabs: MobileTab[];
  paramKey?: string; // URL search param key, defaults to 'mtab'
  defaultTab?: string;
  className?: string;
}

export function MobileTabLayout({ tabs, paramKey = 'mtab', defaultTab, className }: MobileTabLayoutProps) {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const paramValue = searchParams.get(paramKey);
  const initialTab = paramValue && tabs.some(t => t.id === paramValue) ? paramValue : (defaultTab || tabs[0]?.id);
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tabId === (defaultTab || tabs[0]?.id)) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, tabId);
      }
      return next;
    }, { replace: true });
  }, [paramKey, defaultTab, tabs, setSearchParams]);

  // Desktop: render all content sequentially
  if (!isMobile) {
    return (
      <>
        {tabs.map(tab => (
          <div key={tab.id}>{tab.content}</div>
        ))}
      </>
    );
  }

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Sticky tab bar */}
      <div className="sticky top-[52px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 -mx-4 px-4 py-1.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground'
              )}
            >
              {tab.emoji && <span className="text-xs">{tab.emoji}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active tab content */}
      <div className="mt-3">
        {activeContent}
      </div>
    </div>
  );
}
