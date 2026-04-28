import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useNudgeSystem } from '@/hooks/utils/useNudgeSystem';
import { useRecurringBills } from '@/hooks/data/useRecurringBills';
import { useDataHealthCheck } from '@/hooks/data/useDataHealthCheck';
import { useMissionControl } from '@/hooks/utils/useMissionControl';
import { cn } from '@/lib/utils';
import { isPast } from 'date-fns';
import { DashboardNotificationHub } from './DashboardNotificationHub';
import { DataInventoryPanel } from './DataInventoryPanel';
import { MissionControl } from './MissionControl';

type ChipKind = 'avisos' | 'datos' | 'sistema';
type Urgency = 'critical' | 'warning' | 'info' | 'ok';

const URGENCY_STYLES: Record<Urgency, { dot: string; ring: string; badge: string; text: string }> = {
  critical: {
    dot: 'bg-red-500 animate-pulse',
    ring: 'ring-red-500/40 border-red-500/40',
    badge: 'bg-red-500 text-white',
    text: 'text-red-600 dark:text-red-400',
  },
  warning: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/30 border-amber-500/35',
    badge: 'bg-amber-500 text-white',
    text: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    dot: 'bg-blue-500',
    ring: 'border-blue-500/25',
    badge: 'bg-blue-500 text-white',
    text: 'text-blue-600 dark:text-blue-400',
  },
  ok: {
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500/25',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
};

export function SystemStatusStrip() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [openChip, setOpenChip] = useState<ChipKind | null>(null);

  // ── Avisos: count of unread notifications + critical/warning alerts ──
  const { pendingDocuments, incompleteExpenses, expenseMissingReceipt, expensePendingClassification, expenseNoCategory } = useNudgeSystem();
  const { data: bills = [] } = useRecurringBills();
  const { data: healthData } = useDataHealthCheck();
  const { data: notifications = [] } = useQuery({
    queryKey: ['dashboard-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications').select('id, created_at')
        .eq('user_id', user.id).eq('read', false).eq('muted', false)
        .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
        .is('completed_at', null).limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user, refetchInterval: 60000,
  });

  const overdueBills = bills.filter(b => b.status === 'active' && b.next_due_date && isPast(new Date(b.next_due_date))).length;
  const dataHealthIssues = (healthData?.totalIssues || 0) + expenseMissingReceipt + expensePendingClassification + expenseNoCategory;

  const avisosCount = notifications.length + pendingDocuments + incompleteExpenses + overdueBills + (dataHealthIssues > 0 ? 1 : 0);
  const avisosUrgency: Urgency = useMemo(() => {
    if (overdueBills > 0 || incompleteExpenses > 0 || dataHealthIssues > 0) return 'critical';
    if (pendingDocuments > 0 || notifications.length > 0) return 'warning';
    if (avisosCount === 0) return 'ok';
    return 'info';
  }, [overdueBills, incompleteExpenses, dataHealthIssues, pendingDocuments, notifications.length, avisosCount]);

  // ── Datos: count of populated categories / total ──
  const { data: inv } = useQuery({
    queryKey: ['data-inventory-strip', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const tables = ['documents', 'expenses', 'income', 'contracts', 'clients', 'bank_transactions', 'recurring_bills'] as const;
      const results = await Promise.all(
        tables.map(t => supabase.from(t).select('id', { count: 'exact', head: true }).eq('user_id', user.id))
      );
      const counts = results.map(r => r.count || 0);
      const populated = counts.filter(c => c > 0).length;
      const total = counts.reduce((a, b) => a + b, 0);
      return { populated, totalCategories: tables.length, total };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const datosUrgency: Urgency = useMemo(() => {
    if (!inv) return 'info';
    if (inv.populated <= 2) return 'warning';
    if (inv.populated >= inv.totalCategories) return 'ok';
    return 'info';
  }, [inv]);

  // ── Sistema: Mission Control readiness ──
  const mc = useMissionControl();
  const blockedFeatures = mc.featureReadiness?.filter(f => f.readiness === 'blocked').length ?? 0;
  const partialFeatures = mc.featureReadiness?.filter(f => f.readiness === 'partial').length ?? 0;
  const readyFeatures = mc.featureReadiness?.filter(f => f.readiness === 'ready').length ?? 0;
  const totalFeatures = mc.featureReadiness?.length ?? 0;

  const sistemaUrgency: Urgency = useMemo(() => {
    if (mc.isLoading) return 'info';
    if (blockedFeatures > 0 || mc.urgentTotal > 0) return 'critical';
    if (partialFeatures > 0 || mc.inactivityNudge?.show) return 'warning';
    if (readyFeatures === totalFeatures && totalFeatures > 0) return 'ok';
    return 'info';
  }, [mc.isLoading, blockedFeatures, mc.urgentTotal, partialFeatures, mc.inactivityNudge, readyFeatures, totalFeatures]);

  const chips: Array<{
    kind: ChipKind;
    emoji: string;
    label: string;
    sublabel: string;
    badge: string | number | null;
    urgency: Urgency;
  }> = [
    {
      kind: 'avisos',
      emoji: '📋',
      label: isEs ? 'Avisos' : 'Alerts',
      sublabel: avisosCount > 0
        ? (isEs ? `${avisosCount} pendiente${avisosCount > 1 ? 's' : ''}` : `${avisosCount} pending`)
        : (isEs ? 'Todo al día' : 'All clear'),
      badge: avisosCount > 0 ? avisosCount : null,
      urgency: avisosUrgency,
    },
    {
      kind: 'datos',
      emoji: '🗂️',
      label: isEs ? 'Mis Datos' : 'My Data',
      sublabel: inv
        ? (isEs ? `${inv.populated}/${inv.totalCategories} categorías · ${inv.total} registros` : `${inv.populated}/${inv.totalCategories} categories · ${inv.total} records`)
        : (isEs ? 'Cargando…' : 'Loading…'),
      badge: inv ? `${inv.populated}/${inv.totalCategories}` : null,
      urgency: datosUrgency,
    },
    {
      kind: 'sistema',
      emoji: '🚀',
      label: isEs ? 'Mi Sistema' : 'My System',
      sublabel: totalFeatures > 0
        ? (isEs ? `${readyFeatures}/${totalFeatures} funciones activas` : `${readyFeatures}/${totalFeatures} features active`)
        : (isEs ? 'Configurando…' : 'Setting up…'),
      badge: totalFeatures > 0 ? `${readyFeatures}/${totalFeatures}` : null,
      urgency: sistemaUrgency,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {chips.map(chip => {
          const s = URGENCY_STYLES[chip.urgency];
          return (
            <button
              key={chip.kind}
              type="button"
              onClick={() => setOpenChip(chip.kind)}
              className={cn(
                'group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border bg-card text-left transition-all',
                'hover:shadow-md hover:-translate-y-0.5',
                s.ring,
                chip.urgency === 'critical' && 'ring-1',
              )}
              aria-label={`${chip.label} — ${chip.sublabel}`}
            >
              <div className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50 shrink-0">
                <span className="text-lg leading-none">{chip.emoji}</span>
                <span className={cn('absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card', s.dot)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground truncate">{chip.label}</span>
                  {chip.badge !== null && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none', s.badge)}>
                      {chip.badge}
                    </span>
                  )}
                </div>
                <p className={cn('text-[10.5px] truncate mt-0.5', s.text)}>{chip.sublabel}</p>
              </div>
              <span className="text-muted-foreground/60 text-xs shrink-0 group-hover:translate-x-0.5 transition-transform">›</span>
            </button>
          );
        })}
      </div>

      {/* Sheets — render the full existing panels inside */}
      <Sheet open={openChip === 'avisos'} onOpenChange={(o) => !o && setOpenChip(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>📋 {isEs ? 'Centro de Avisos' : 'Notification Center'}</SheetTitle>
            <SheetDescription>
              {isEs ? 'Recordatorios, alertas y notificaciones que requieren tu atención.' : 'Reminders, alerts and notifications that need your attention.'}
            </SheetDescription>
          </SheetHeader>
          <ForceExpanded>
            <DashboardNotificationHub />
          </ForceExpanded>
        </SheetContent>
      </Sheet>

      <Sheet open={openChip === 'datos'} onOpenChange={(o) => !o && setOpenChip(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>🗂️ {isEs ? 'Mi Inventario de Datos' : 'My Data Inventory'}</SheetTitle>
            <SheetDescription>
              {isEs ? 'Todo lo que tu sistema sabe sobre ti, organizado por categoría.' : 'Everything your system knows about you, organized by category.'}
            </SheetDescription>
          </SheetHeader>
          <ForceExpanded>
            <DataInventoryPanel />
          </ForceExpanded>
        </SheetContent>
      </Sheet>

      <Sheet open={openChip === 'sistema'} onOpenChange={(o) => !o && setOpenChip(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>🚀 {isEs ? 'Mission Control' : 'Mission Control'}</SheetTitle>
            <SheetDescription>
              {isEs ? 'Estado de tus funciones, qué está activo y qué te falta para desbloquear más.' : 'Status of your features — what is active and what you need to unlock more.'}
            </SheetDescription>
          </SheetHeader>
          <ForceExpanded>
            <MissionControl />
          </ForceExpanded>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Wrapper that auto-clicks the first collapsible trigger so panels open by default inside Sheet. */
function ForceExpanded({ children }: { children: React.ReactNode }) {
  return (
    <div
      ref={(el) => {
        if (!el) return;
        // Open all immediate collapsible triggers so users see content right away in the Sheet
        requestAnimationFrame(() => {
          const triggers = el.querySelectorAll<HTMLElement>('[aria-expanded="false"]');
          triggers.forEach(t => {
            // Only auto-open the top-level panel header (first one), not nested rows
            if (t.closest('[data-section]') || t.tagName === 'BUTTON') {
              const isTopLevel = !t.parentElement?.closest('[aria-expanded]');
              if (isTopLevel) t.click();
            }
          });
        });
      }}
    >
      {children}
    </div>
  );
}
