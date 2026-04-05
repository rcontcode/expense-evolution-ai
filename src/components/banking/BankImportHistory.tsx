import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { History, ChevronDown, FileSpreadsheet, Image, File, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const SOURCE_ICONS: Record<string, React.ElementType> = {
  csv: FileSpreadsheet,
  pdf: File,
  photo: Image,
};

export function BankImportHistory() {
  const { language } = useLanguage();
  const l = language === 'es';
  const { formatCurrency } = useFormatCurrency();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: sessions = [] } = useQuery({
    queryKey: ['bank-import-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('bank_import_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('imported_at', { ascending: false })
        .limit(20) as any;
      return data || [];
    },
    enabled: !!user,
  });

  const totals = useMemo(() => {
    return sessions.reduce((acc: any, s: any) => ({
      transactions: acc.transactions + (s.total_transactions || 0),
      expenses: acc.expenses + (s.expenses_created || 0),
      income: acc.income + (s.income_created || 0),
    }), { transactions: 0, expenses: 0, income: 0 });
  }, [sessions]);

  if (sessions.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  {l ? 'Historial de Importaciones' : 'Import History'}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {sessions.length} {l ? 'sesiones' : 'sessions'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {totals.transactions} {l ? 'transacciones totales' : 'total transactions'}
                </Badge>
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-2 pt-0">
            {sessions.map((session: any) => {
              const Icon = SOURCE_ICONS[session.source_type] || FileSpreadsheet;
              return (
                <div key={session.id} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {session.file_name || session.source_type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(session.imported_at), 'dd MMM yyyy HH:mm', { locale: l ? es : undefined })}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">{l ? 'Total:' : 'Total:'}</span>
                      <span className="font-medium">{session.total_transactions}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>{session.income_created || session.income_count} {l ? 'ing' : 'inc'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      <span>{session.expenses_created || session.expense_count} {l ? 'gas' : 'exp'}</span>
                    </div>
                    {session.recurring_count > 0 && (
                      <div className="flex items-center gap-1 text-primary">
                        <RotateCcw className="h-3 w-3" />
                        <span>{session.recurring_count} {l ? 'rec' : 'rec'}</span>
                      </div>
                    )}
                  </div>

                  {session.duplicates_found > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {l ? `${session.duplicates_found} duplicados detectados` : `${session.duplicates_found} duplicates detected`}
                    </p>
                  )}

                  <div className="flex gap-3 text-xs">
                    <span className="text-emerald-600 font-medium">
                      +{formatCurrency(Number(session.income_total) || 0)}
                    </span>
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(Number(session.expense_total) || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
