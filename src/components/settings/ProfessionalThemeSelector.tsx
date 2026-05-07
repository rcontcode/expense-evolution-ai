import { Check, Sun, Moon, Sparkles } from 'lucide-react';
import { useProfessionalTheme } from '@/hooks/useProfessionalTheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { ProfessionalThemePreset } from '@/config/professionalThemePresets';

interface Props { className?: string }

/**
 * Phone-mockup grid of professional theme presets, split Light / Dark.
 * Selecting 'none' reverts to the default EvoFinz theme.
 */
export function ProfessionalThemeSelector({ className }: Props) {
  const { presetId, presets, setPresetId } = useProfessionalTheme();
  const { language } = useLanguage();
  const isEs = language === 'es';

  const lightPresets = presets.filter((p) => p.id !== 'none' && p.mode === 'light');
  const darkPresets = presets.filter((p) => p.id !== 'none' && p.mode === 'dark');
  const defaultPreset = presets.find((p) => p.id === 'none')!;

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <p className="text-xs text-muted-foreground leading-snug">
          {isEs
            ? 'Temas profesionales sobrios. Mantienen el modo claro/oscuro y se combinan con tu color de acento.'
            : 'Sober professional themes. They keep light/dark mode and combine with your accent color.'}
        </p>
      </div>

      {/* Default */}
      <div className="space-y-2">
        <PresetCard
          preset={defaultPreset}
          active={presetId === 'none'}
          onClick={() => setPresetId('none')}
          isEs={isEs}
          isDefault
        />
      </div>

      {/* Light section */}
      <Section icon={<Sun className="h-3.5 w-3.5" />} label={isEs ? 'CLARO' : 'LIGHT'} count={lightPresets.length}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {lightPresets.map((p) => (
            <PresetCard key={p.id} preset={p} active={presetId === p.id} onClick={() => setPresetId(p.id)} isEs={isEs} />
          ))}
        </div>
      </Section>

      {/* Dark section */}
      <Section icon={<Moon className="h-3.5 w-3.5" />} label={isEs ? 'OSCURO' : 'DARK'} count={darkPresets.length}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {darkPresets.map((p) => (
            <PresetCard key={p.id} preset={p} active={presetId === p.id} onClick={() => setPresetId(p.id)} isEs={isEs} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, label, count, children }: { icon: React.ReactNode; label: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
        <span className="text-muted-foreground/60">· {count}</span>
      </div>
      {children}
    </div>
  );
}

function PresetCard({
  preset, active, onClick, isEs, isDefault = false,
}: { preset: ProfessionalThemePreset; active: boolean; onClick: () => void; isEs: boolean; isDefault?: boolean }) {
  const isDark = preset.mode === 'dark';
  const tone = preset.tokens;
  // Build phone mockup colors. For 'none' use neutral default.
  const screenBg = isDefault
    ? (isDark ? 'hsl(222 35% 8%)' : 'hsl(210 20% 98%)')
    : `hsl(${tone.background})`;
  const cardBg = isDefault
    ? (isDark ? 'hsl(222 30% 14%)' : 'hsl(0 0% 100%)')
    : `hsl(${tone.card})`;
  const accent = isDefault
    ? (isDark ? 'hsl(217 91% 60%)' : 'hsl(217 91% 50%)')
    : `hsl(${tone.primary})`;
  const fg = isDefault
    ? (isDark ? 'hsl(0 0% 96%)' : 'hsl(222 35% 12%)')
    : `hsl(${tone.foreground})`;
  const borderClr = isDefault
    ? (isDark ? 'hsl(222 30% 22%)' : 'hsl(210 22% 86%)')
    : `hsl(${tone.border})`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={isEs ? preset.description.es : preset.description.en}
      className={cn(
        'group relative rounded-xl border-2 p-2.5 transition-all bg-card text-left',
        'hover:scale-[1.04] hover:shadow-lg',
        active ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40',
      )}
    >
      {active && (
        <div className="absolute top-1.5 right-1.5 z-10 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Phone mockup */}
      <div
        className="mx-auto w-full max-w-[88px] aspect-[9/16] rounded-lg border-2 overflow-hidden flex flex-col"
        style={{ background: screenBg, borderColor: borderClr }}
      >
        {/* Notch */}
        <div className="flex justify-center pt-1.5 pb-0.5">
          <div className="w-6 h-1 rounded-full" style={{ background: borderClr }} />
        </div>
        {/* Title bar */}
        <div className="px-2 pt-1">
          <div className="h-1.5 w-2/3 rounded-full" style={{ background: accent }} />
        </div>
        {/* Card */}
        <div className="mx-2 mt-1.5 flex-1 rounded-md p-1.5 flex flex-col justify-end gap-0.5"
             style={{ background: cardBg, border: `1px solid ${borderClr}` }}>
          <div className="flex items-end gap-0.5 h-6">
            <div className="flex-1 rounded-sm" style={{ background: accent, height: '40%' }} />
            <div className="flex-1 rounded-sm" style={{ background: accent, height: '70%', opacity: 0.7 }} />
            <div className="flex-1 rounded-sm" style={{ background: accent, height: '55%', opacity: 0.8 }} />
            <div className="flex-1 rounded-sm" style={{ background: accent, height: '90%' }} />
            <div className="flex-1 rounded-sm" style={{ background: accent, height: '50%', opacity: 0.6 }} />
          </div>
          <div className="h-1 w-1/2 rounded-full mt-1" style={{ background: fg, opacity: 0.4 }} />
        </div>
        <div className="h-1.5" />
      </div>

      <div className="mt-2 text-center">
        <div className="text-[11px] font-semibold leading-tight truncate flex items-center justify-center gap-1">
          {isDefault && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
          <span className="truncate">{isEs ? preset.name.es : preset.name.en}</span>
        </div>
      </div>
    </button>
  );
}
