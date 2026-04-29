import { cn } from '@/lib/utils';

/**
 * Visual hint placed in the bottom-right corner of a resizable container.
 * Decorative only — the actual resize behavior comes from CSS `resize: both`
 * on the parent (see `.dialog-resizable` in index.css).
 */
export function ResizeHandle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute bottom-1 right-1 z-50 hidden md:block',
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" className="text-muted-foreground/60">
        <path d="M13 1L1 13M13 5L5 13M13 9L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
