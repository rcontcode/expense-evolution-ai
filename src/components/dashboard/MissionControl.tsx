import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMissionControl, CategoryMetrics, CategoryStatus, FeatureRequirement, FeatureReadiness, NextAction, ProgressSnapshot, InactivityNudge } from '@/hooks/utils/useMissionControl';
import { ChevronDown, ChevronRight, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2, Rocket, Fuel, Zap, Lock, CircleDot, Info, Clock, TrendingUp, Flame } from 'lucide-react';
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

const READINESS_CONFIG: Record<FeatureReadiness, { bg: string; border: string; text: string; icon: typeof CheckCircle2; labelEs: string; labelEn: string }> = {
  ready: { bg: 'bg-success/8', border: 'border-success/25', text: 'text-success', icon: CheckCircle2, labelEs: 'Activo', labelEn: 'Active' },
  partial: { bg: 'bg-warning/8', border: 'border-warning/25', text: 'text-warning', icon: CircleDot, labelEs: 'Incompleto', labelEn: 'Incomplete' },
  blocked: { bg: 'bg-destructive/8', border: 'border-destructive/25', text: 'text-destructive', icon: Lock, labelEs: 'Inactivo', labelEn: 'Inactive' },
};

const PRIORITY_LABELS = {
  critical: { es: 'Esencial', en: 'Essential' },
  important: { es: 'Importante', en: 'Important' },
  nice: { es: 'Opcional', en: 'Optional' },
};

// ── Next Action Banner ──
function NextActionBanner({ action, language }: { action: NextAction; language: string }) {
  const navigate = useNavigate();
  const l = language === 'es';

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          {l ? 'Tu siguiente paso' : 'Your next step'}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{action.emoji}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">
            {l ? action.title.es : action.title.en}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {l ? action.description.es : action.description.en}
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => navigate(action.actionUrl)}>
              {l ? 'Hacer ahora' : 'Do it now'} <ArrowRight className="h-3 w-3" />
            </Button>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> ~{action.estimatedMinutes} min
            </span>
            {action.unlocksFeatures.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-primary">
                <Lock className="h-3 w-3" />
                {l ? `Desbloquea ${action.unlocksFeatures.length} función${action.unlocksFeatures.length > 1 ? 'es' : ''}` : `Unlocks ${action.unlocksFeatures.length} feature${action.unlocksFeatures.length > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inactivity Nudge ──
function InactivityNudgeBanner({ nudge, language }: { nudge: InactivityNudge; language: string }) {
  const l = language === 'es';
  if (!nudge.show) return null;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
      <div className="flex items-start gap-2.5">
        <Flame className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-warning">
            {l
              ? `Llevas ${nudge.daysSinceLastEntry} días sin alimentar tu sistema`
              : `${nudge.daysSinceLastEntry} days without feeding your system`}
          </p>
          {nudge.missingOpportunities.map((opp, i) => (
            <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="text-warning">•</span> {l ? opp.es : opp.en}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Progress History Mini Chart ──
function ProgressHistoryChart({ history, language }: { history: ProgressSnapshot[]; language: string }) {
  const l = language === 'es';
  if (history.length < 2) return null;

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const delta = last.globalScore - prev.globalScore;
  const maxScore = Math.max(...history.map(h => h.globalScore), 1);

  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> {l ? 'Progreso semanal' : 'Weekly progress'}
        </span>
        <span className={cn('text-[10px] font-bold', delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {delta > 0 ? '+' : ''}{delta}%
        </span>
      </div>
      <div className="flex items-end gap-0.5 h-8">
        {history.slice(-8).map((snap, i) => (
          <div key={snap.weekKey} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className={cn(
                'w-full rounded-sm transition-all min-h-[2px]',
                i === history.slice(-8).length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
              style={{ height: `${(snap.globalScore / maxScore) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">{history.slice(-8)[0]?.weekKey?.replace(/^\d+-W/, 'S')}</span>
        <span className="text-[9px] text-muted-foreground">{l ? 'Hoy' : 'Now'}</span>
      </div>
    </div>
  );
}

// ── Category Card ──
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
                <span className="font-medium text-sm">{l ? category.label.es : category.label.en}</span>
                <div className="flex items-center gap-2">
                  {category.urgentCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {category.urgentCount} {l ? 'urgente' : 'urgent'}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground font-mono">{category.percentage}%</span>
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
                {detail.isUrgent
                  ? <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  : <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />}
                <span>{detail.label}</span>
              </div>
            ))}
            {category.details.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{l ? 'Todo completo' : 'All complete'}</span>
              </div>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 mt-1" onClick={() => navigate(category.actionUrl)}>
              {l ? 'Ir a completar' : 'Go to complete'} <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ── Feature Card ──
function FeatureReadinessCard({ feature, language }: { feature: FeatureRequirement; language: string }) {
  const [open, setOpen] = useState(feature.readiness === 'blocked');
  const navigate = useNavigate();
  const l = language === 'es';
  const config = READINESS_CONFIG[feature.readiness];
  const Icon = config.icon;

  // Estimate time for missing data items
  const estimatedMinutes = feature.missingData.reduce((sum, item) => {
    if (item.priority === 'critical') return sum + 3;
    if (item.priority === 'important') return sum + 2;
    return sum + 1;
  }, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn('rounded-lg border p-3 transition-all', config.bg, config.border)}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{feature.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm">{l ? feature.name.es : feature.name.en}</span>
                  <div className="flex items-center gap-1.5">
                    {estimatedMinutes > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" /> ~{estimatedMinutes}m
                      </span>
                    )}
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-current gap-0.5', config.text)}>
                      <Icon className="h-2.5 w-2.5" />
                      {l ? config.labelEs : config.labelEn}
                    </Badge>
                    {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {l ? feature.description.es : feature.description.en}
                </p>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {feature.missingData.length > 0 ? (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {l ? 'Para activar esta función necesitas:' : 'To activate this feature you need:'}
                </span>
              </div>
              {feature.missingData.map((item, i) => {
                const priorityLabel = l ? PRIORITY_LABELS[item.priority].es : PRIORITY_LABELS[item.priority].en;
                return (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2.5 text-xs hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors text-left group"
                    onClick={() => navigate(item.actionUrl)}
                  >
                    {item.priority === 'critical'
                      ? <Zap className="h-3.5 w-3.5 text-destructive shrink-0" />
                      : item.priority === 'important'
                      ? <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                      : <CircleDot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span>{l ? item.label.es : item.label.en}</span>
                      <Badge variant="outline" className="text-[9px] ml-1.5 px-1 py-0 opacity-60">{priorityLabel}</Badge>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{l ? '¡Todos los datos necesarios están listos! Esta función está operativa.' : 'All required data is ready! This feature is operational.'}</span>
              </div>
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
  const [panelOpen, setPanelOpen] = useState(() => {
    const saved = localStorage.getItem('mission-control-open');
    return saved !== null ? saved === 'true' : !compact;
  });
  const [expanded, setExpanded] = useState(!compact);
  const [activeTab, setActiveTab] = useState<'data' | 'features'>('features');

  const togglePanel = () => {
    const next = !panelOpen;
    setPanelOpen(next);
    localStorage.setItem('mission-control-open', String(next));
  };

  if (data.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (compact && data.globalScore >= 95 && data.urgentTotal === 0 && data.systemFuelScore >= 95 && !data.inactivityNudge.show) {
    return null;
  }

  const levelLabel = l ? data.globalLevel.es : data.globalLevel.en;
  const blockedFeatures = data.featureReadiness.filter(f => f.readiness === 'blocked').length;
  const partialFeatures = data.featureReadiness.filter(f => f.readiness === 'partial').length;
  const readyFeatures = data.featureReadiness.filter(f => f.readiness === 'ready').length;
  const totalFeatures = data.featureReadiness.length;

  if (compact && !expanded) {
    return (
      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setExpanded(true)}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Mission Control</span>
              <Badge variant={blockedFeatures > 0 ? 'destructive' : data.urgentTotal > 0 ? 'warning' : 'secondary'} className="text-[10px]">
                <Fuel className="h-2.5 w-2.5 mr-0.5" />
                {readyFeatures}/{totalFeatures} {l ? 'activas' : 'active'}
              </Badge>
              {data.inactivityNudge.show && (
                <Badge variant="warning" className="text-[10px]">
                  <Flame className="h-2.5 w-2.5 mr-0.5" />
                  {data.inactivityNudge.daysSinceLastEntry}d
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {blockedFeatures > 0 && <span className="text-destructive font-medium">🔒 {blockedFeatures}</span>}
              {partialFeatures > 0 && <span className="text-warning font-medium">🟡 {partialFeatures}</span>}
              {readyFeatures > 0 && <span className="text-success font-medium">✅ {readyFeatures}</span>}
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
            <CardTitle className="text-base">Mission Control</CardTitle>
            <Badge variant="outline" className="text-[10px]">{levelLabel}</Badge>
          </div>
          {compact && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(false)}>
              {l ? 'Minimizar' : 'Minimize'}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {l
            ? 'Esta app aprende de tus datos para generar proyecciones, alertas y reportes inteligentes. Mientras más información ingreses, más poderosas serán las herramientas disponibles.'
            : 'This app learns from your data to generate projections, alerts, and smart reports. The more information you enter, the more powerful the available tools become.'}
        </p>

        {/* Dual progress bars + history */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/30 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Fuel className="h-3 w-3" /> {l ? 'Funciones activas' : 'Active features'}
              </span>
              <span className="text-sm font-bold">{readyFeatures}/{totalFeatures}</span>
            </div>
            <Progress value={(readyFeatures / Math.max(totalFeatures, 1)) * 100} className="h-2" />
          </div>
          {data.progressHistory.length >= 2 ? (
            <ProgressHistoryChart history={data.progressHistory} language={language} />
          ) : (
            <div className="rounded-lg bg-muted/30 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  📊 {l ? 'Calidad de datos' : 'Data quality'}
                </span>
                <span className="text-sm font-bold">{data.globalScore}%</span>
              </div>
              <Progress value={data.globalScore} className="h-2" />
            </div>
          )}
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
            {l ? 'Funciones' : 'Features'}
            {blockedFeatures > 0 && <Badge variant="destructive" className="text-[9px] ml-1 px-1 py-0">{blockedFeatures}</Badge>}
          </button>
          <button
            className={cn(
              'flex-1 text-xs py-1.5 px-2 rounded-md transition-colors font-medium',
              activeTab === 'data' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('data')}
          >
            📊 {l ? 'Mis datos' : 'My data'}
            {data.urgentTotal > 0 && <Badge variant="destructive" className="text-[9px] ml-1 px-1 py-0">{data.urgentTotal}</Badge>}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {/* Inactivity nudge — always visible regardless of tab */}
        <InactivityNudgeBanner nudge={data.inactivityNudge} language={language} />

        {/* Next action — always visible when there is one */}
        {data.nextAction && <NextActionBanner action={data.nextAction} language={language} />}

        {activeTab === 'features' ? (
          <>
            {blockedFeatures > 0 && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive mb-0.5">
                      {l
                        ? `${blockedFeatures} ${blockedFeatures === 1 ? 'función está inactiva' : 'funciones están inactivas'} por falta de datos`
                        : `${blockedFeatures} ${blockedFeatures === 1 ? 'feature is inactive' : 'features are inactive'} due to missing data`}
                    </p>
                    <p className="text-muted-foreground">
                      {l
                        ? 'Expande cada función para ver exactamente qué información necesitas ingresar para activarla.'
                        : 'Expand each feature to see exactly what information you need to enter to activate it.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {blockedFeatures === 0 && partialFeatures > 0 && (
              <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <CircleDot className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning mb-0.5">{l ? '¡Casi listo!' : 'Almost there!'}</p>
                    <p className="text-muted-foreground">
                      {l
                        ? `${partialFeatures} ${partialFeatures === 1 ? 'función funciona' : 'funciones funcionan'} parcialmente. Completa los datos faltantes para aprovecharlas al 100%.`
                        : `${partialFeatures} ${partialFeatures === 1 ? 'feature works' : 'features work'} partially. Complete the missing data to take full advantage.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {blockedFeatures === 0 && partialFeatures === 0 && (
              <div className="rounded-lg bg-success/5 border border-success/20 p-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-success">{l ? '🎉 ¡Todas las funciones están activas!' : '🎉 All features are active!'}</p>
                    <p className="text-muted-foreground">
                      {l
                        ? 'Tu sistema está completamente alimentado. Sigue ingresando datos para mantener tus análisis actualizados.'
                        : 'Your system is fully fed. Keep entering data to keep your analyses up to date.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.featureReadiness.map(feat => (
              <FeatureReadinessCard key={feat.key} feature={feat} language={language} />
            ))}

            <div className="flex items-center justify-center gap-4 pt-2 border-t text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-destructive" /> {l ? 'Esencial' : 'Essential'}</span>
              <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-warning" /> {l ? 'Importante' : 'Important'}</span>
              <span className="flex items-center gap-1"><CircleDot className="h-3 w-3 text-muted-foreground" /> {l ? 'Opcional' : 'Optional'}</span>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground">
              {l
                ? '📊 Estado de los datos que has ingresado: qué se ha procesado, qué falta por revisar y qué necesita tu atención urgente.'
                : '📊 Status of the data you\'ve entered: what has been processed, what needs review, and what requires urgent attention.'}
            </div>

            {data.categories.map(cat => (
              <CategoryCard key={cat.key} category={cat} language={language} />
            ))}

            {data.categories.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                {l ? 'Empieza agregando datos para ver tu progreso' : 'Start adding data to see your progress'}
              </div>
            )}

            {data.unapprovedInUse.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {l ? 'Datos no aprobados en uso' : 'Unapproved data in use'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  {l
                    ? 'Estos gastos fueron creados desde documentos que aún no has revisado. Están siendo usados en tus cálculos y reportes.'
                    : 'These expenses were created from documents you haven\'t reviewed yet. They\'re being used in your calculations and reports.'}
                </p>
                <div className="space-y-1">
                  {data.unapprovedInUse.slice(0, 5).map(item => (
                    <div key={item.id} className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>{item.vendor}</span>
                      <span className="font-mono">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {data.unapprovedInUse.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{data.unapprovedInUse.length - 5} {l ? 'más' : 'more'}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
              {data.urgentTotal > 0 && (
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> {l ? 'Urgente' : 'Urgent'} ({data.urgentTotal})</span>
              )}
              {data.pendingTotal > 0 && (
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> {l ? 'Pendiente' : 'Pending'} ({data.pendingTotal})</span>
              )}
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> OK ({data.okTotal})</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
