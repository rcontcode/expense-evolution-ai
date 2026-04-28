import { memo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { BarChart3, LayoutGrid, ChevronRight } from 'lucide-react';

interface DashboardViewTabsProps {
  activeTab: 'resumen' | 'control';
  onTabChange: (tab: 'resumen' | 'control') => void;
}

export const DashboardViewTabs = memo(({ activeTab, onTabChange }: DashboardViewTabsProps) => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const tabs = [
    {
      id: 'resumen' as const,
      icon: BarChart3,
      emoji: '📊',
      label: isEs ? 'Resumen' : 'Summary',
      tagline: isEs ? 'Mira cómo va tu mes' : 'See how your month is going',
      description: isEs
        ? 'Línea de tiempo, narrativa del mes, ingresos vs. gastos y movimientos recientes.'
        : 'Timeline, monthly narrative, income vs. expenses and recent activity.',
      gradient: 'from-blue-500 via-primary to-indigo-500',
      activeRing: 'ring-blue-400/40',
    },
    {
      id: 'control' as const,
      icon: LayoutGrid,
      emoji: '🎛️',
      label: isEs ? 'Control' : 'Control',
      tagline: isEs ? 'Toma acción y organiza' : 'Take action and organize',
      description: isEs
        ? 'Áreas de trabajo, herramientas, configuración y accesos directos para gestionar tu dinero.'
        : 'Work areas, tools, settings and shortcuts to manage your money.',
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
      activeRing: 'ring-fuchsia-400/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <motion.button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'group relative overflow-hidden text-left rounded-2xl border p-4 sm:p-5 transition-all duration-300',
              isActive
                ? cn('text-white border-transparent shadow-xl ring-2', tab.activeRing)
                : 'bg-card border-border/60 hover:border-primary/30 hover:shadow-md text-foreground',
            )}
          >
            {/* Active gradient background */}
            {isActive && (
              <motion.div
                layoutId="dashboard-tab-bg"
                className={cn('absolute inset-0 bg-gradient-to-br', tab.gradient)}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            {/* Subtle decorative glow */}
            {isActive && (
              <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/15 blur-2xl pointer-events-none" />
            )}

            <div className="relative z-10 flex items-start gap-3">
              <div
                className={cn(
                  'flex items-center justify-center h-11 w-11 rounded-xl shrink-0 transition-colors',
                  isActive
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/15',
                )}
              >
                <span className="text-xl leading-none" aria-hidden>{tab.emoji}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white/90' : 'text-primary')} />
                  <h3 className={cn('text-base sm:text-lg font-bold leading-tight', isActive ? 'text-white' : 'text-foreground')}>
                    {tab.label}
                  </h3>
                  {isActive && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white">
                      {isEs ? 'Activo' : 'Active'}
                    </span>
                  )}
                </div>
                <p className={cn('text-xs sm:text-sm font-semibold mt-0.5', isActive ? 'text-white/95' : 'text-primary')}>
                  {tab.tagline}
                </p>
                <p className={cn('text-[11px] sm:text-xs mt-1 leading-snug', isActive ? 'text-white/80' : 'text-muted-foreground')}>
                  {tab.description}
                </p>
              </div>

              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 mt-1 transition-transform',
                  isActive ? 'text-white/70 translate-x-0.5' : 'text-muted-foreground group-hover:translate-x-0.5',
                )}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});

DashboardViewTabs.displayName = 'DashboardViewTabs';
