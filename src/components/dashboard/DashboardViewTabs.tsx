import { memo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DashboardViewTabsProps {
  activeTab: 'resumen' | 'control';
  onTabChange: (tab: 'resumen' | 'control') => void;
}

export const DashboardViewTabs = memo(({ activeTab, onTabChange }: DashboardViewTabsProps) => {
  const { language } = useLanguage();

  const tabs = [
    {
      id: 'resumen' as const,
      label: language === 'es' ? 'Resumen' : 'Summary',
      emoji: '📊',
      description: language === 'es' ? 'Timeline y detalle' : 'Timeline & detail',
    },
    {
      id: 'control' as const,
      label: language === 'es' ? 'Control' : 'Control',
      emoji: '🎛️',
      description: language === 'es' ? 'Áreas y herramientas' : 'Areas & tools',
    },
  ];

  return (
    <div className="relative flex gap-1.5 p-1 rounded-xl bg-muted/60 backdrop-blur-sm border border-border/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-200 z-10',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dashboard-tab-bg"
                className="absolute inset-0 rounded-lg shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                  boxShadow: '0 4px 15px hsl(var(--primary) / 0.35)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-sm">{tab.emoji}</span>
            <div className="relative z-10 flex flex-col items-start">
              <span className="leading-tight">{tab.label}</span>
              <span className={cn(
                'text-[9px] font-normal leading-tight hidden sm:block',
                isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70'
              )}>
                {tab.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

DashboardViewTabs.displayName = 'DashboardViewTabs';
