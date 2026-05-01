import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Database, Trash2, Receipt, DollarSign, Landmark,
  FileText, Users, Car, CalendarCheck, AlertTriangle, Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSampleDataCounts } from '@/hooks/data/useGenerateSampleData';

interface DataSection {
  key: string;
  icon: React.ElementType;
  labelEs: string;
  labelEn: string;
  table: string;
  dependents?: { table: string; fk: string }[];
  extraTables?: string[];
  colorClass: string;
}

const DATA_SECTIONS: DataSection[] = [
  {
    key: 'expenses',
    icon: Receipt,
    labelEs: 'Gastos',
    labelEn: 'Expenses',
    table: 'expenses',
    dependents: [{ table: 'expense_tags', fk: 'expense_id' }],
    colorClass: 'text-destructive',
  },
  {
    key: 'income',
    icon: DollarSign,
    labelEs: 'Ingresos',
    labelEn: 'Income',
    table: 'income',
    colorClass: 'text-emerald-600',
  },
  {
    key: 'bank_transactions',
    icon: Landmark,
    labelEs: 'Transacciones bancarias',
    labelEn: 'Bank transactions',
    table: 'bank_transactions',
    extraTables: ['bank_import_sessions'],
    colorClass: 'text-sky-600',
  },
  {
    key: 'contracts',
    icon: FileText,
    labelEs: 'Contratos',
    labelEn: 'Contracts',
    table: 'contracts',
    colorClass: 'text-violet-600',
  },
  {
    key: 'documents',
    icon: FileText,
    labelEs: 'Documentos / Archivos',
    labelEn: 'Documents / Files',
    table: 'documents',
    colorClass: 'text-blue-600',
  },
  {
    key: 'clients',
    icon: Users,
    labelEs: 'Clientes',
    labelEn: 'Clients',
    table: 'clients',
    colorClass: 'text-orange-600',
  },
  {
    key: 'mileage_logs',
    icon: Car,
    labelEs: 'Kilometraje',
    labelEn: 'Mileage',
    table: 'mileage_logs',
    colorClass: 'text-teal-600',
  },
  {
    key: 'recurring_bills',
    icon: CalendarCheck,
    labelEs: 'Pagos recurrentes',
    labelEn: 'Recurring bills',
    table: 'recurring_bills',
    dependents: [{ table: 'bill_payments', fk: 'bill_id' }],
    colorClass: 'text-amber-600',
  },
];

export function DataManagementCard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const l = language === 'es';

  const [deleteTarget, setDeleteTarget] = useState<DataSection | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmWord = l ? 'ELIMINAR' : 'DELETE';

  // Fetch counts for all sections
  const { data: counts = {} } = useQuery({
    queryKey: ['data-management-counts', user?.id],
    queryFn: async () => {
      const results: Record<string, number> = {};
      const queries = DATA_SECTIONS.map(async (section) => {
        const { count } = await supabase
          .from(section.table as any)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id);
        results[section.key] = count || 0;
      });
      await Promise.all(queries);
      return results;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const handleDelete = async () => {
    if (!deleteTarget || !user || confirmText !== confirmWord) return;
    setIsDeleting(true);

    try {
      // 1. Delete dependents first
      if (deleteTarget.dependents) {
        for (const dep of deleteTarget.dependents) {
          // Get IDs of parent records
          const { data: parentIds } = await supabase
            .from(deleteTarget.table as any)
            .select('id')
            .eq('user_id', user.id);

          if (parentIds && parentIds.length > 0) {
            const ids = parentIds.map((r: any) => r.id);
            // Delete in batches of 200
            for (let i = 0; i < ids.length; i += 200) {
              const batch = ids.slice(i, i + 200);
              await supabase
                .from(dep.table as any)
                .delete()
                .in(dep.fk, batch);
            }
          }
        }
      }

      // 2. Delete main table
      const { error } = await supabase
        .from(deleteTarget.table as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // 3. Delete extra tables
      if (deleteTarget.extraTables) {
        for (const extra of deleteTarget.extraTables) {
          await supabase
            .from(extra as any)
            .delete()
            .eq('user_id', user.id);
        }
      }

      const count = counts[deleteTarget.key] || 0;
      toast.success(
        l
          ? `${count} registros de "${deleteTarget.labelEs}" eliminados`
          : `${count} "${deleteTarget.labelEn}" records deleted`
      );

      // Invalidate all caches
      queryClient.invalidateQueries();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        l
          ? `Error al eliminar: ${err.message}`
          : `Error deleting: ${err.message}`
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setConfirmText('');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">
                {l ? 'Gestión de Datos' : 'Data Management'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {l
                  ? 'Elimina datos por sección si necesitas empezar de cero'
                  : 'Delete data by section if you need to start over'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Help text */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              {l ? '¿Ves datos incorrectos?' : 'See incorrect data?'}
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>{l ? 'Ve a la sección correspondiente y edita o elimina registros individuales' : 'Go to the relevant section and edit or delete individual records'}</li>
              <li>{l ? 'Usa la Papelera para recuperar eliminaciones recientes' : 'Use the Trash to recover recent deletions'}</li>
              <li>{l ? 'Elimina toda una sección aquí si necesitas empezar de cero' : 'Delete an entire section here if you need to start over'}</li>
            </ol>
          </div>

          {/* Section list */}
          <div className="grid gap-2">
            {DATA_SECTIONS.map((section) => {
              const Icon = section.icon;
              const count = counts[section.key] || 0;
              const label = l ? section.labelEs : section.labelEn;
              return (
                <div
                  key={section.key}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className={`p-1.5 rounded-full bg-muted/50 ${section.colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} {l ? 'registros' : 'records'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    disabled={count === 0}
                    onClick={() => setDeleteTarget(section)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">{l ? 'Eliminar' : 'Delete'}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setConfirmText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {l ? 'Confirmar eliminación' : 'Confirm deletion'}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                {l
                  ? `Estás a punto de eliminar TODOS los registros de "${deleteTarget?.labelEs}" (${counts[deleteTarget?.key || ''] || 0} registros). Esta acción no se puede deshacer.`
                  : `You are about to delete ALL "${deleteTarget?.labelEn}" records (${counts[deleteTarget?.key || ''] || 0} records). This action cannot be undone.`}
              </p>
              <p className="font-medium text-foreground">
                {l
                  ? `Escribe "${confirmWord}" para confirmar:`
                  : `Type "${confirmWord}" to confirm:`}
              </p>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmWord}
            className="font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setConfirmText(''); }}>
              {l ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== confirmWord || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting
                ? (l ? 'Eliminando...' : 'Deleting...')
                : (l ? 'Eliminar todo' : 'Delete all')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DataManagementCard;
