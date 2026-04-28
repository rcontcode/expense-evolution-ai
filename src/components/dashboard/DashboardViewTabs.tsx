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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="tablist">
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
              'group relative overflow-hidden text-left rounded-xl border px-3 py-2.5 transition-all duration-300',
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

            <div className="relative z-10 flex items-center gap-2.5">
              <div
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors',
                  isActive
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/15',
                )}
              >
                <span className="text-base leading-none" aria-hidden>{tab.emoji}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white/90' : 'text-primary')} />
                  <h3 className={cn('text-sm font-bold leading-tight', isActive ? 'text-white' : 'text-foreground')}>
                    {tab.label}
                  </h3>
                  <span className={cn('text-[11px] truncate', isActive ? 'text-white/85' : 'text-muted-foreground')}>
                    · {tab.tagline}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/25 text-white">
                      {isEs ? 'Activo' : 'Active'}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform',
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
