import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useContracts } from '@/hooks/data/useContracts';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Clock, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiringContract {
  id: string;
  title: string;
  endDate: Date;
  daysLeft: number;
  value: number | null;
  autoRenew: boolean;
}

export function ContractRenewalCountdown() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency: fc } = useFormatCurrency();
  const { data: contracts } = useContracts();

  const expiring = useMemo(() => {
    if (!contracts) return [];

    const now = new Date();
    const results: ExpiringContract[] = [];

    contracts.forEach((c: any) => {
      if (!c.end_date || c.status === 'cancelled' || c.deleted_at) return;
      const endDate = parseISO(c.end_date);
      const daysLeft = differenceInDays(endDate, now);
      if (daysLeft >= 0 && daysLeft <= 90) {
        results.push({
          id: c.id,
          title: c.title || c.file_name,
          endDate,
          daysLeft,
          value: c.value,
          autoRenew: c.auto_renew || false,
        });
      }
    });

    return results.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [contracts]);

  if (expiring.length === 0) return null;

  const getUrgency = (days: number) => {
    if (days <= 7) return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: l ? '¡Urgente!' : 'Urgent!' };
    if (days <= 30) return { color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: l ? 'Pronto' : 'Soon' };
    return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', label: l ? 'Próximo' : 'Upcoming' };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-amber-500" />
          {l ? 'Contratos por Vencer' : 'Expiring Contracts'}
          <Badge variant="secondary" className="ml-auto">{expiring.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiring.slice(0, 5).map((contract, i) => {
          const urgency = getUrgency(contract.daysLeft);
          const progressPct = Math.max(0, Math.min(100, ((90 - contract.daysLeft) / 90) * 100));

          return (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("p-3 rounded-lg border", urgency.border, urgency.bg)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={cn("h-4 w-4 shrink-0", urgency.color)} />
                  <span className="text-sm font-medium truncate">{contract.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {contract.autoRenew && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {l ? 'Auto-renueva' : 'Auto-renew'}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", urgency.color)}>
                    {urgency.label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>
                  {contract.daysLeft === 0
                    ? (l ? 'Vence hoy' : 'Expires today')
                    : `${contract.daysLeft} ${l ? 'días restantes' : 'days left'}`}
                </span>
                <span>{format(contract.endDate, 'PP', { locale: l ? es : enUS })}</span>
              </div>

              <Progress value={progressPct} className="h-1.5" />

              {contract.value && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {l ? 'Valor:' : 'Value:'} {fc(contract.value)}
                </p>
              )}
            </motion.div>
          );
        })}

        {expiring.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            +{expiring.length - 5} {l ? 'más' : 'more'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
