import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Briefcase, Users, FileText, Check, ArrowRight, Rocket, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useClients } from '@/hooks/data/useClients';
import { useContracts } from '@/hooks/data/useContracts';
import { useFiscalEntities } from '@/hooks/data/useFiscalEntities';
import { ClientDialog } from '@/components/dialogs/ClientDialog';
import { cn } from '@/lib/utils';

/**
 * Short, guided onboarding path shown inside the SimpleDashboard.
 * Helps the user complete the three foundational setup areas:
 *   1. Datos fiscales (profile + fiscal entity)
 *   2. Clientes
 *   3. Contratos
 *
 * Auto-hides when all three are complete.
 */
export function SimpleOnboardingPath() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: profile } = useProfile();
  const { data: clients } = useClients();
  const { data: contracts } = useContracts();
  const { data: fiscalEntities } = useFiscalEntities();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const steps = useMemo(() => {
    const hasFiscal =
      Boolean((profile as any)?.country) &&
      Boolean((profile as any)?.tax_regime || (profile as any)?.business_number) &&
      ((fiscalEntities?.length ?? 0) > 0 || Boolean((profile as any)?.business_name));

    const hasClients = (clients?.length ?? 0) > 0;
    const hasContracts = (contracts?.length ?? 0) > 0;

    return [
      {
        id: 'fiscal',
        label: language === 'es' ? 'Datos fiscales' : 'Tax info',
        description:
          language === 'es'
            ? 'País, régimen y datos del negocio.'
            : 'Country, regime and business info.',
        icon: Briefcase,
        done: hasFiscal,
        path: '/settings?tab=fiscal',
      },
      {
        id: 'clients',
        label: language === 'es' ? 'Clientes' : 'Clients',
        description:
          language === 'es'
            ? 'Agrega al menos un cliente para facturar.'
            : 'Add at least one client to invoice.',
        icon: Users,
        done: hasClients,
        path: '/clients',
      },
      {
        id: 'contracts',
        label: language === 'es' ? 'Contratos' : 'Contracts',
        description:
          language === 'es'
            ? 'Registra un contrato o servicio recurrente.'
            : 'Register a contract or recurring service.',
        icon: FileText,
        done: hasContracts,
        path: '/contracts',
      },
    ];
  }, [profile, clients, contracts, fiscalEntities, language]);

  const completedCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const percent = (completedCount / total) * 100;
  const allDone = completedCount === total;

  // Hide entirely once everything is done
  if (allDone) return null;

  // Find next pending step for the primary CTA
  const nextStep = steps.find((s) => !s.done);

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent shadow-md overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base leading-tight">
              {language === 'es' ? 'Configura tu cuenta' : 'Set up your account'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'es'
                ? `${completedCount} de ${total} pasos completados`
                : `${completedCount} of ${total} steps complete`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={percent} className="h-2" />

        {/* Steps list */}
        <ul className="space-y-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isClientsStep = step.id === 'clients';
            return (
              <li key={step.id}>
                <div
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                    'hover:shadow-md',
                    step.done
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5',
                  )}
                >
                  {/* Step number / check */}
                  <div
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                      step.done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {step.done ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                      step.done
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Text — clickable area to navigate */}
                  <button
                    type="button"
                    onClick={() => navigate(step.path)}
                    className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div
                      className={cn(
                        'text-sm font-semibold leading-tight',
                        step.done && 'line-through text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {step.description}
                    </div>
                  </button>

                  {/* Quick-add for Clients step (only when not done) */}
                  {isClientsStep && !step.done && (
                    <Button
                      size="sm"
                      onClick={() => setClientDialogOpen(true)}
                      className="shrink-0 h-8 gap-1 px-2.5 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">
                        {language === 'es' ? 'Agregar' : 'Add'}
                      </span>
                    </Button>
                  )}

                  {(!isClientsStep || step.done) && (
                    <ArrowRight
                      className={cn(
                        'shrink-0 h-4 w-4 transition-transform',
                        step.done ? 'text-emerald-500' : 'text-muted-foreground',
                      )}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Primary CTA */}
        {nextStep && (
          <Button
            onClick={() => navigate(nextStep.path)}
            className="w-full gap-2 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            size="lg"
          >
            {language === 'es' ? `Continuar: ${nextStep.label}` : `Continue: ${nextStep.label}`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>

      {/* Inline quick-add client dialog */}
      <ClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        client={null}
      />
    </Card>
  );
}
