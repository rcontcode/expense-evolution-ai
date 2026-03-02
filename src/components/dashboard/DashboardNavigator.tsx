import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollSpy, type ScrollSpySection } from '@/hooks/utils/useScrollSpy';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

// Sections for "Resumen" view
const RESUMEN_SECTIONS: ScrollSpySection[] = [
  { id: 'timeline', label: { es: 'Timeline', en: 'Timeline' }, emoji: '📅', color: 'from-amber-400 to-orange-500' },
  { id: 'ecosystem', label: { es: 'Ecosistema', en: 'Ecosystem' }, emoji: '🌐', color: 'from-cyan-400 to-blue-500' },
  { id: 'quick-actions', label: { es: 'Acciones', en: 'Actions' }, emoji: '⚡', color: 'from-emerald-400 to-teal-500' },
  { id: 'workflows', label: { es: 'Flujos', en: 'Workflows' }, emoji: '🔄', color: 'from-violet-400 to-purple-500' },
  { id: 'alerts', label: { es: 'Alertas', en: 'Alerts' }, emoji: '🔔', color: 'from-rose-400 to-red-500' },
  { id: 'gamification', label: { es: 'Aventura', en: 'Adventure' }, emoji: '🏆', color: 'from-yellow-400 to-amber-500' },
  { id: 'advanced-tools', label: { es: 'Herramientas', en: 'Tools' }, emoji: '🛠️', color: 'from-blue-400 to-indigo-500' },
];

// Sections for "Control" view
const CONTROL_SECTIONS: ScrollSpySection[] = [
  { id: 'area-negocio', label: { es: 'Negocio', en: 'Business' }, emoji: '🏢', color: 'from-blue-400 to-indigo-500' },
  { id: 'area-familia', label: { es: 'Familia', en: 'Family' }, emoji: '👨‍👩‍👧', color: 'from-pink-400 to-rose-500' },
  { id: 'area-diario', label: { es: 'Día a Día', en: 'Daily' }, emoji: '☀️', color: 'from-amber-400 to-orange-500' },
  { id: 'area-crecimiento', label: { es: 'Crecimiento', en: 'Growth' }, emoji: '🌱', color: 'from-emerald-400 to-green-500' },
  { id: 'area-impuestos', label: { es: 'Impuestos', en: 'Taxes' }, emoji: '📋', color: 'from-slate-400 to-gray-500' },
];

interface DashboardNavigatorProps {
  viewMode: 'resumen' | 'control';
}

export function DashboardNavigator({ viewMode }: DashboardNavigatorProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = viewMode === 'resumen' ? RESUMEN_SECTIONS : CONTROL_SECTIONS;
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { activeId, scrollTo } = useScrollSpy(sectionIds);

  return (
    <motion.div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ width: 16, opacity: 0.7 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 16, opacity: 0.7 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-l-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border/30 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-primary truncate">
                {language === 'es' ? 'Navegador' : 'Navigator'}
              </span>
            </div>

            {/* Section Items */}
            <div className="py-1.5 px-1.5 space-y-0.5 max-h-[60vh] overflow-y-auto">
              {sections.map((section) => {
                const isActive = activeId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-200 group',
                      isActive
                        ? 'bg-primary/10 shadow-sm'
                        : 'hover:bg-muted/60'
                    )}
                  >
                    {/* Color dot */}
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full bg-gradient-to-br shrink-0 transition-transform',
                      section.color,
                      isActive && 'scale-125 ring-2 ring-primary/30'
                    )} />

                    {/* Label */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{section.emoji}</span>
                      <span className={cn(
                        'text-xs font-medium truncate transition-colors',
                        isActive ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground'
                      )}>
                        {section.label[language as 'es' | 'en']}
                      </span>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1 py-3 px-1.5 bg-card/80 backdrop-blur-xl border border-border/30 rounded-l-xl shadow-lg"
          >
            {sections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  className="group relative"
                  title={section.label[language as 'es' | 'en']}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full bg-gradient-to-br transition-all duration-200',
                    section.color,
                    isActive ? 'scale-150 ring-2 ring-primary/40' : 'opacity-50 group-hover:opacity-100 group-hover:scale-125'
                  )} />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
