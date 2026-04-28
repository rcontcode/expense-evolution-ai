import { ReactNode, useState, useCallback, useEffect } from 'react';
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
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.mobile-app-main')?.scrollTo({ top: 0, behavior: 'auto' });
    });
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

  useEffect(() => {
    if (paramValue && tabs.some(t => t.id === paramValue) && paramValue !== activeTab) {
      setActiveTab(paramValue);
    }
  }, [paramValue, tabs, activeTab]);

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
    <div className={cn('mobile-tab-layout', className)}>
      {/* Hide scrollbar across all browsers (scoped to this layout) */}
      <style>{`.mobile-tab-layout .mtl-scroll::-webkit-scrollbar{display:none!important;height:0!important;width:0!important;background:transparent!important}`}</style>
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 -mx-3 px-3 py-1">
        <div
          className="mtl-scroll flex gap-1 overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors',
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
      <div className="mt-2 mobile-compact">
        {activeContent}
      </div>
    </div>
  );
}
