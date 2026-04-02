import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMissionControl, CategoryMetrics, CategoryStatus } from '@/hooks/utils/useMissionControl';
import { ChevronDown, ChevronRight, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionControlProps {
  compact?: boolean;
}

const STATUS_COLORS: Record<CategoryStatus, string> = {
  complete: 'text-success',
  good: 'text-primary',
  needs_attention: 'text-warning',
  urgent: 'text-destructive',
};

const STATUS_BG: Record<CategoryStatus, string> = {
  complete: 'bg-success/10',
  good: 'bg-primary/10',
  needs_attention: 'bg-warning/10',
  urgent: 'bg-destructive/10',
};

function CategoryCard({ category, language }: { category: CategoryMetrics; language: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const l = language === 'es';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn('rounded-lg border p-3 transition-colors', STATUS_BG[category.status])}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 text-left">
            <span className="text-xl">{category.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {l ? category.label.es : category.label.en}
                </span>
                <div className="flex items-center gap-2">
                  {category.urgentCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {category.urgentCount} {l ? 'urgente' : 'urgent'}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">
                    {category.percentage}%
                  </span>
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>
              <Progress value={category.percentage} className="h-1.5" />
              {/* Pipeline */}
              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                {category.pipeline.map((stage, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    {i > 0 && <span className="mx-0.5">→</span>}
                    <span className="font-medium">{stage.count}</span>
                    <span>{l ? stage.label.es : stage.label.en}</span>
                  </span>
                ))}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
            {category.details.map((detail, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {detail.isUrgent ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                )}
                <span>{detail.label}</span>
              </div>
            ))}
            {category.details.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{l ? 'Todo completo' : 'All complete'}</span>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 mt-1"
              onClick={() => navigate(category.actionUrl)}
            >
              {l ? 'Ir a completar' : 'Go to complete'} <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function MissionControl({ compact = false }: MissionControlProps) {
  const { language } = useLanguage();
  const l = language === 'es';
  const data = useMissionControl();
  const [expanded, setExpanded] = useState(!compact);

  if (data.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  // Don't show if everything is perfect and compact mode
  if (compact && data.globalScore >= 95 && data.urgentTotal === 0) {
    return null;
  }

  const levelLabel = l ? data.globalLevel.es : data.globalLevel.en;

  if (compact && !expanded) {
    return (
      <Card
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setExpanded(true)}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Mission Control</span>
              <Badge variant={data.urgentTotal > 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                {data.globalScore}%
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {data.urgentTotal > 0 && (
                <span className="text-destructive font-medium">🔴 {data.urgentTotal}</span>
              )}
              {data.pendingTotal > 0 && (
                <span className="text-warning font-medium">🟡 {data.pendingTotal}</span>
              )}
              <span className="text-success">✅ {data.okTotal}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-section="mission-control">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              Mission Control
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {levelLabel}
            </Badge>
          </div>
          {compact && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(false)}>
              {l ? 'Minimizar' : 'Minimize'}
            </Button>
          )}
        </div>
        {/* Global progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {l ? 'Progreso general' : 'Overall progress'}
            </span>
            <span className="text-sm font-bold">{data.globalScore}%</span>
          </div>
          <Progress value={data.globalScore} className="h-2.5" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {/* Category cards */}
        {data.categories.map(cat => (
          <CategoryCard key={cat.key} category={cat} language={language} />
        ))}

        {data.categories.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
            {l ? 'Empieza agregando datos para ver tu progreso' : 'Start adding data to see your progress'}
          </div>
        )}

        {/* Unapproved data in use */}
        {data.unapprovedInUse.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {l ? 'Datos no aprobados en uso' : 'Unapproved data in use'}
              </span>
            </div>
            <div className="space-y-1">
              {data.unapprovedInUse.slice(0, 5).map(item => (
                <div key={item.id} className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{item.vendor}</span>
                  <span className="font-mono">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              {data.unapprovedInUse.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{data.unapprovedInUse.length - 5} {l ? 'más' : 'more'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary footer */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          {data.urgentTotal > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              {l ? 'Urgente' : 'Urgent'} ({data.urgentTotal})
            </span>
          )}
          {data.pendingTotal > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {l ? 'Pendiente' : 'Pending'} ({data.pendingTotal})
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            OK ({data.okTotal})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
