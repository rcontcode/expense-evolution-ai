import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollSpy, type ScrollSpySection } from '@/hooks/utils/useScrollSpy';
import { cn } from '@/lib/utils';

const RESUMEN_SECTIONS: ScrollSpySection[] = [
  { id: 'timeline', label: { es: 'Timeline', en: 'Timeline' }, emoji: '📅', color: 'from-amber-400 to-orange-500' },
  { id: 'quick-actions', label: { es: 'Acciones', en: 'Actions' }, emoji: '⚡', color: 'from-emerald-400 to-teal-500' },
  { id: 'gamification', label: { es: 'Aventura', en: 'Adventure' }, emoji: '🏆', color: 'from-yellow-400 to-amber-500' },
  { id: 'ecosystem', label: { es: 'Ecosistema', en: 'Ecosystem' }, emoji: '🌐', color: 'from-cyan-400 to-blue-500' },
];

const CONTROL_SECTIONS: ScrollSpySection[] = [
  { id: 'area-negocio', label: { es: 'Negocio', en: 'Business' }, emoji: '🏢', color: 'from-blue-400 to-indigo-500' },
  { id: 'area-familia', label: { es: 'Familia', en: 'Family' }, emoji: '👨‍👩‍👧', color: 'from-pink-400 to-rose-500' },
  { id: 'area-diario', label: { es: 'Día a Día', en: 'Daily' }, emoji: '☀️', color: 'from-amber-400 to-orange-500' },
  { id: 'area-crecimiento', label: { es: 'Crecimiento', en: 'Growth' }, emoji: '🌱', color: 'from-emerald-400 to-green-500' },
  { id: 'area-impuestos', label: { es: 'Impuestos', en: 'Taxes' }, emoji: '📋', color: 'from-slate-400 to-gray-500' },
];

interface MobileSectionPillsProps {
  activeView: 'resumen' | 'control';
}

export function MobileSectionPills({ activeView }: MobileSectionPillsProps) {
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const sections = activeView === 'resumen' ? RESUMEN_SECTIONS : CONTROL_SECTIONS;
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { activeId, scrollTo } = useScrollSpy(sectionIds);

  // Auto-scroll the pill bar to keep the active pill visible
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector(`[data-pill="${activeId}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {sections.map((section) => {
        const isActive = activeId === section.id;
        return (
          <button
            key={section.id}
            data-pill={section.id}
            onClick={() => scrollTo(section.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0',
              isActive
                ? 'bg-primary/15 text-foreground shadow-sm border border-primary/30'
                : 'bg-muted/60 text-muted-foreground border border-transparent hover:bg-muted'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="mobile-pill-active"
                className="absolute inset-0 rounded-full bg-primary/10 border border-primary/25"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <div className={cn(
              'w-1.5 h-1.5 rounded-full bg-gradient-to-br relative z-10 shrink-0',
              section.color,
              isActive && 'scale-125'
            )} />
            <span className="relative z-10">{section.emoji}</span>
            <span className="relative z-10">{section.label[language as 'es' | 'en']}</span>
          </button>
        );
      })}
    </div>
  );
}
