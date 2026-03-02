import { memo, useState, useCallback, ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface AreaTab {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  content: ReactNode;
}

interface AreaTabsLayoutProps {
  areaKey: string;
  tabs: AreaTab[];
  footer?: ReactNode;
  accentColor?: string;
  forcedTab?: string | null;
}

const STORAGE_PREFIX = 'evofinz-area-tab-';

export const AreaTabsLayout = memo(({ areaKey, tabs, footer, accentColor, forcedTab }: AreaTabsLayoutProps) => {
  const storageKey = `${STORAGE_PREFIX}${areaKey}`;
  const [activeTab, setActiveTab] = useState(() => {
    if (forcedTab && tabs.some(t => t.id === forcedTab)) return forcedTab;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && tabs.some(t => t.id === saved)) return saved;
    } catch {}
    return tabs[0]?.id || '';
  });

  // React to forcedTab changes (deep-linking)
  useEffect(() => {
    if (forcedTab && tabs.some(t => t.id === forcedTab)) {
      setActiveTab(forcedTab);
      try { localStorage.setItem(storageKey, forcedTab); } catch {}
    }
  }, [forcedTab, tabs, storageKey]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    try { localStorage.setItem(storageKey, value); } catch {}
  }, [storageKey]);

  if (tabs.length === 0) return null;

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex-wrap h-auto gap-1.5 p-2 bg-muted/40 border border-border/50 backdrop-blur-sm">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "text-xs sm:text-sm gap-1.5 px-3 py-2 rounded-lg transition-all duration-200",
                "data-[state=active]:shadow-md data-[state=active]:font-bold",
                "hover:bg-accent/50"
              )}
            >
              {tab.emoji && <span className="text-base">{tab.emoji}</span>}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Active tab description */}
        {activeTabData?.description && (
          <motion.p
            key={activeTabData.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-muted-foreground px-1 pt-2"
          >
            {activeTabData.description}
          </motion.p>
        )}

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tab.content}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>

      {/* Separator between content and footer links */}
      {footer && (
        <>
          <Separator className="my-2 opacity-50" />
          {footer}
        </>
      )}
    </div>
  );
});

AreaTabsLayout.displayName = 'AreaTabsLayout';
