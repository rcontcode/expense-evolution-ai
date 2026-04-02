import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMissionControl, CategoryMetrics, CategoryStatus, FeatureRequirement, FeatureReadiness } from '@/hooks/utils/useMissionControl';
import { ChevronDown, ChevronRight, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2, Rocket, Fuel, Zap, Lock, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionControlProps {
  compact?: boolean;
}

const STATUS_BG: Record<CategoryStatus, string> = {
  complete: 'bg-success/10',
  good: 'bg-primary/10',
  needs_attention: 'bg-warning/10',
  urgent: 'bg-destructive/10',
};

const READINESS_CONFIG: Record<FeatureReadiness, { bg: string; text: string; icon: typeof CheckCircle2; labelEs: string; labelEn: string }> = {
  ready: { bg: 'bg-success/10 border-success/20', text: 'text-success', icon: CheckCircle2, labelEs: 'Listo', labelEn: 'Ready' },
  partial: { bg: 'bg-warning/10 border-warning/20', text: 'text-warning', icon: CircleDot, labelEs: 'Parcial', labelEn: 'Partial' },
  blocked: { bg: 'bg-destructive/10 border-destructive/20', text: 'text-destructive', icon: Lock, labelEs: 'Bloqueado', labelEn: 'Blocked' },
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

function FeatureReadinessCard({ feature, language }: { feature: FeatureRequirement; language: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const l = language === 'es';
  const config = READINESS_CONFIG[feature.readiness];
  const Icon = config.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn('rounded-lg border p-2.5 transition-colors', config.bg)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2.5 text-left">
            <span className="text-lg">{feature.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">
                  {l ? feature.name.es : feature.name.en}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 border-current', config.text)}>
                    <Icon className="h-2.5 w-2.5 mr-0.5" />
                    {l ? config.labelEs : config.labelEn}
                  </Badge>
                  {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {feature.missingData.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {l ? 'Necesita:' : 'Needs:'}
              </span>
              {feature.missingData.map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 text-xs hover:bg-accent/50 rounded px-1 py-0.5 transition-colors text-left"
                  onClick={() => navigate(item.actionUrl)}
                >
                  {item.priority === 'critical' ? (
                    <Zap className="h-3 w-3 text-destructive shrink-0" />
                  ) : item.priority === 'important' ? (
                    <AlertCircle className="h-3 w-3 text-warning shrink-0" />
                  ) : (
                    <CircleDot className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <span className="flex-1">{l ? item.label.es : item.label.en}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
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
  const [activeTab, setActiveTab] = useState<'data' | 'features'>('features');

  if (data.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  // Don't show if everything is perfect and compact mode
  if (compact && data.globalScore >= 95 && data.urgentTotal === 0 && data.systemFuelScore >= 95) {
    return null;
  }

  const levelLabel = l ? data.globalLevel.es : data.globalLevel.en;
  const blockedFeatures = data.featureReadiness.filter(f => f.readiness === 'blocked').length;
  const partialFeatures = data.featureReadiness.filter(f => f.readiness === 'partial').length;
  const readyFeatures = data.featureReadiness.filter(f => f.readiness === 'ready').length;

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
              <Badge variant={blockedFeatures > 0 ? 'destructive' : data.urgentTotal > 0 ? 'warning' : 'secondary'} className="text-[10px]">
                <Fuel className="h-2.5 w-2.5 mr-0.5" />
                {data.systemFuelScore}%
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {blockedFeatures > 0 && (
                <span className="text-destructive font-medium">🔒 {blockedFeatures}</span>
              )}
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

        {/* Dual progress: Data quality + System fuel */}
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                📊 {l ? 'Calidad de datos' : 'Data quality'}
              </span>
              <span className="text-xs font-bold">{data.globalScore}%</span>
            </div>
            <Progress value={data.globalScore} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Fuel className="h-3 w-3" /> {l ? 'Combustible del sistema' : 'System fuel'}
              </span>
              <span className="text-xs font-bold">{data.systemFuelScore}%</span>
            </div>
            <Progress value={data.systemFuelScore} className="h-2" />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-3 bg-muted/50 rounded-lg p-0.5">
          <button
            className={cn(
              'flex-1 text-xs py-1.5 px-2 rounded-md transition-colors font-medium',
              activeTab === 'features' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('features')}
          >
            <Fuel className="h-3 w-3 inline mr-1" />
            {l ? 'Qué necesita la app' : 'What the app needs'}
            {blockedFeatures > 0 && <Badge variant="destructive" className="text-[9px] ml-1 px-1 py-0">{blockedFeatures}</Badge>}
          </button>
          <button
            className={cn(
              'flex-1 text-xs py-1.5 px-2 rounded-md transition-colors font-medium',
              activeTab === 'data' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('data')}
          >
            📊 {l ? 'Estado de datos' : 'Data status'}
            {data.urgentTotal > 0 && <Badge variant="destructive" className="text-[9px] ml-1 px-1 py-0">{data.urgentTotal}</Badge>}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {activeTab === 'features' ? (
          <>
            {/* Feature readiness explanation */}
            <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground">
              {l
                ? '🎯 Sin tu información, estas funciones no pueden generar cálculos ni recomendaciones. Alimenta el sistema para desbloquearlas.'
                : '🎯 Without your data, these features can\'t generate calculations or recommendations. Feed the system to unlock them.'}
            </div>

            {/* Feature cards */}
            {data.featureReadiness.map(feat => (
              <FeatureReadinessCard key={feat.key} feature={feat} language={language} />
            ))}

            {/* Feature summary */}
            <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
              {blockedFeatures > 0 && (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-destructive" />
                  {l ? 'Bloqueadas' : 'Blocked'} ({blockedFeatures})
                </span>
              )}
              {partialFeatures > 0 && (
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-warning" />
                  {l ? 'Parciales' : 'Partial'} ({partialFeatures})
                </span>
              )}
              {readyFeatures > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  {l ? 'Listas' : 'Ready'} ({readyFeatures})
                </span>
              )}
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
