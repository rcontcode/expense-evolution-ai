import { useLocation } from 'react-router-dom';
import { useRecMode } from '@/hooks/useRecMode';
import { useIsAdmin } from '@/hooks/data/useIsAdmin';
import { Video, VideoOff } from 'lucide-react';

/**
 * Floating button to toggle REC Mode (identity masking for video recordings).
 * Only visible to admins. When active, also renders a red viewport border + DEMO MODE label.
 */
export function RecModeFab() {
  const { data: isAdmin } = useIsAdmin();
  const { active, quietMode, captureMode, toggle } = useRecMode();
  const { pathname } = useLocation();

  if (!isAdmin) return null;

  /**
   * 2-sep-2026: en «modo captura» el distintivo se esconde para que no salga en la foto.
   * El boton se sigue mostrando dentro del propio Demo Studio, que es donde se apaga: si se
   * escondiera en todas partes, quedaria la app enmascarada sin ninguna forma visible de volver.
   */
  const enDemoStudio = pathname.startsWith('/admin/demo-studio');
  const ocultarDistintivo = active && captureMode && !enDemoStudio;

  return (
    <>
      {/* Viewport overlay when REC active */}
      {active && !ocultarDistintivo && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9998] border-2 border-destructive/70 rounded-sm"
          style={{ boxShadow: 'inset 0 0 24px hsl(var(--destructive) / 0.15)' }}
        >
          <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground shadow-lg">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Demo Mode
            {quietMode && <span className="opacity-80">· Quiet</span>}
          </div>
        </div>
      )}

      {/* Toggle FAB */}
      {!ocultarDistintivo && (
      <button
        onClick={toggle}
        title={active ? 'Desactivar REC Mode' : 'Activar REC Mode (oculta tu identidad para grabaciones)'}
        aria-label="Toggle REC Mode"
        className={`fixed bottom-20 right-4 z-[9999] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg transition-all hover:scale-105 ${
          active
            ? 'bg-destructive text-destructive-foreground animate-pulse'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        {active ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        {active ? '● REC' : 'REC OFF'}
      </button>
      )}
    </>
  );
}
