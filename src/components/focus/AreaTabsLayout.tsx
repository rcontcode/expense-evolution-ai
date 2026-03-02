import { memo, useState, useCallback, lazy, Suspense, ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export interface AreaTab {
  id: string;
  label: string;
  emoji?: string;
  content: ReactNode;
}

interface AreaTabsLayoutProps {
  areaKey: string;
  tabs: AreaTab[];
  footer?: ReactNode;
}

const STORAGE_PREFIX = 'evofinz-area-tab-';

export const AreaTabsLayout = memo(({ areaKey, tabs, footer }: AreaTabsLayoutProps) => {
  const storageKey = `${STORAGE_PREFIX}${areaKey}`;
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && tabs.some(t => t.id === saved)) return saved;
    } catch {}
    return tabs[0]?.id || '';
  });

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    try { localStorage.setItem(storageKey, value); } catch {}
  }, [storageKey]);

  if (tabs.length === 0) return null;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm gap-1">
              {tab.emoji && <span>{tab.emoji}</span>}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <Suspense fallback={<Skeleton className="h-[200px] rounded-xl" />}>
              {tab.content}
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
      {footer}
    </div>
  );
});

AreaTabsLayout.displayName = 'AreaTabsLayout';
