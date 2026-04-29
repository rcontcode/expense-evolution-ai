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
        'pointer-events-none absolute bottom-1.5 right-1.5 z-50 hidden md:block',
        className,
      )}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" className="text-muted-foreground/70">
        <path
          d="M17 1L1 17M17 6L6 17M17 11L11 17"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
