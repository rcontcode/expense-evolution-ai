import { memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Settings2 } from 'lucide-react';
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
      description: language === 'es' ? 'Timeline y detalle mensual' : 'Timeline & monthly detail',
    },
    {
      id: 'control' as const,
      label: language === 'es' ? 'Centro de Control' : 'Control Center',
      emoji: '🎛️',
      description: language === 'es' ? 'Áreas y herramientas' : 'Areas & tools',
    },
  ];

  return (
    <div className="relative flex gap-2 p-1.5 rounded-2xl bg-muted/60 backdrop-blur-sm border border-border/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-colors duration-200 z-10',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="dashboard-tab-bg"
                className="absolute inset-0 rounded-xl shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                  boxShadow: '0 4px 15px hsl(var(--primary) / 0.35), 0 0 20px hsl(var(--primary) / 0.15)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-base">{tab.emoji}</span>
            <div className="relative z-10 flex flex-col items-start">
              <span className="leading-tight">{tab.label}</span>
              <span className={cn(
                'text-[10px] font-normal leading-tight',
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
