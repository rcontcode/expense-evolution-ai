import { useRecMode } from '@/hooks/useRecMode';
import { useIsAdmin } from '@/hooks/data/useIsAdmin';
import { Video, VideoOff } from 'lucide-react';

/**
 * Floating button to toggle REC Mode (identity masking for video recordings).
 * Only visible to admins.
 */
export function RecModeFab() {
  const { data: isAdmin } = useIsAdmin();
  const { active, toggle } = useRecMode();

  if (!isAdmin) return null;

  return (
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
  );
}
