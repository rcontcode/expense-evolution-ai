import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-muted/50 border-b border-border p-3 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton 
            key={`header-${i}`} 
            className={`h-4 ${i === 0 ? 'w-24' : i === columns - 1 ? 'w-16' : 'flex-1'}`} 
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="flex items-center border-b border-border p-3 gap-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={`h-4 ${colIndex === 0 ? 'w-24' : colIndex === columns - 1 ? 'w-16' : 'flex-1'}`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

export function CardSkeleton({ count = 4, showHeader = true }: CardSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          {showHeader && (
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          )}
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
