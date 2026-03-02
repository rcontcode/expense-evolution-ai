import { memo, useState, useCallback, useEffect, ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';

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
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Flow indicator: shows all tabs as a breadcrumb-style flow */}
      <div className="flex items-center gap-1.5 px-1 flex-wrap">
        {tabs.map((tab, i) => (
          <div key={tab.id} className="flex items-center gap-1.5">
            <button
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-all duration-200 cursor-pointer",
                tab.id === activeTab
                  ? "text-primary font-bold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span className="text-sm">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
            {i < tabs.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              {tab.emoji && <span className="text-base">{tab.emoji}</span>}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Active tab description card */}
        {activeTabData?.description && (
          <motion.div
            key={activeTabData.id}
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {activeTabData.description}
                </p>
                {/* Step counter */}
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  📍 {activeIndex + 1} / {tabs.length} — {tabs.map(t => t.emoji).join(' → ')}
                </p>
              </div>
            </div>
          </motion.div>
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
