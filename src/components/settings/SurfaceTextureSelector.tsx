import { Check, Layers } from 'lucide-react';
import { useSurfaceTexture } from '@/hooks/useSurfaceTexture';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Props {
  compact?: boolean;
  className?: string;
}

/**
 * Visual grid selector for the surface texture (background pattern).
 * Pure UI: persists to localStorage via useSurfaceTexture.
 */
export function SurfaceTextureSelector({ compact = false, className }: Props) {
  const { textureId, textures, setTextureId } = useSurfaceTexture();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Layers className="h-3.5 w-3.5" />
        <span>{isEs ? 'Textura del fondo' : 'Background texture'}</span>
      </div>

      <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-7')}>
        {textures.map((t) => {
          const active = t.id === textureId;
          const previewStyle = t.id === 'none'
            ? { backgroundImage: 'none' }
            : {
                backgroundImage: t.cssImage.trim(),
                backgroundSize: t.cssSize ?? 'auto',
              };
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTextureId(t.id)}
              aria-pressed={active}
              title={isEs ? t.description.es : t.description.en}
              className={cn(
                'relative aspect-square rounded-xl border-2 overflow-hidden transition-all bg-card',
                'hover:scale-[1.04] hover:shadow-md',
                active
                  ? 'border-primary shadow-lg ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <div className="absolute inset-0" style={previewStyle} />
              {active && (
                <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] font-semibold text-center bg-background/85 backdrop-blur-sm border-t border-border/50 truncate">
                {isEs ? t.name.es : t.name.en}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        {isEs
          ? 'Capa sutil sobre el fondo. No afecta tarjetas ni colores.'
          : 'Subtle layer over the background. Does not affect cards or colors.'}
      </p>
    </div>
  );
}
