import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Camera,
  CameraOff,
  ChevronDown,
  ChevronRight,
  Copy,
  Zap,
  Tag,
  Trash2,
  Link,
  Upload,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpenseWithRelations } from '@/types/expense.types';
import { DuplicateGroup } from '@/hooks/data/useExpenseDuplicates';
import { cn } from '@/lib/utils';

interface ExpenseHealthPanelProps {
  expenses: ExpenseWithRelations[];
  duplicates: { groups: DuplicateGroup[]; count: number };
  onOpenClassify: () => void;
  onOpenLinkReceipt: (expenseIds: string[]) => void;
  onSelectExpenses: (ids: string[]) => void;
  onDeleteDuplicate: (id: string) => void;
}

export const ExpenseHealthPanel = memo(function ExpenseHealthPanel({
  expenses,
  duplicates,
  onOpenClassify,
  onOpenLinkReceipt,
  onSelectExpenses,
  onDeleteDuplicate,
}: ExpenseHealthPanelProps) {
  const { language } = useLanguage();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const stats = useMemo(() => {
    const noReceipt = expenses.filter(e => !e.document_id);
    const unclassified = expenses.filter(e => e.reimbursement_type === 'pending_classification');
    const noCategory = expenses.filter(e => !e.category);
    return { noReceipt, unclassified, noCategory };
  }, [expenses]);

  const totalIssues = stats.noReceipt.length + stats.unclassified.length + duplicates.count + stats.noCategory.length;

  if (totalIssues === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {language === 'es'
            ? '✨ Todos los gastos están completos y listos para reportes'
            : '✨ All expenses are complete and ready for reports'}
        </p>
      </motion.div>
    );
  }

  const sections = [
    {
      key: 'noReceipt',
      show: stats.noReceipt.length > 0,
      icon: CameraOff,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      badgeBg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
      count: stats.noReceipt.length,
      title: language === 'es' ? 'Sin recibo / comprobante' : 'Missing receipt',
      description: language === 'es'
        ? '⚠️ Los gastos sin recibo no son válidos para CRA/T2125. Para que tu declaración sea correcta, cada gasto debe tener un comprobante.'
        : '⚠️ Expenses without receipts are not valid for CRA/T2125. Each expense needs a receipt for your tax return to be accurate.',
      actions: (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenLinkReceipt(stats.noReceipt.map(e => e.id))} className="text-xs">
            <Link className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Vincular existente' : 'Link existing'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSelectExpenses(stats.noReceipt.map(e => e.id))} className="text-xs text-destructive">
            <Trash2 className="h-3 w-3 mr-1" />
            {language === 'es' ? 'Seleccionar para eliminar' : 'Select for deletion'}
          </Button>
        </div>
      ),
      items: stats.noReceipt.slice(0, 5),
    },
    {
      key: 'duplicates',
      show: duplicates.count > 0,
      icon: Copy,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      badgeBg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      count: duplicates.count,
      title: language === 'es' ? 'Posibles duplicados' : 'Possible duplicates',
      description: language === 'es'
        ? '🔍 Gastos con mismo monto, fecha y proveedor similar. Revisa si son realmente duplicados o transacciones separadas.'
        : '🔍 Expenses with same amount, date and similar vendor. Check if they are actual duplicates or separate transactions.',
      actions: null,
      duplicateGroups: duplicates.groups.slice(0, 3),
    },
    {
      key: 'unclassified',
      show: stats.unclassified.length > 0,
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      count: stats.unclassified.length,
      title: language === 'es' ? 'Sin clasificar' : 'Unclassified',
      description: language === 'es'
        ? '📋 Estos gastos necesitan ser clasificados como Reembolsable, Deducible CRA o Personal para generar reportes correctos.'
        : '📋 These expenses need to be classified as Reimbursable, CRA Deductible or Personal to generate accurate reports.',
      actions: (
        <Button size="sm" onClick={onOpenClassify} className="text-xs bg-amber-600 hover:bg-amber-700">
          <Zap className="h-3 w-3 mr-1" />
          {language === 'es' ? `Clasificar ${stats.unclassified.length} gastos` : `Classify ${stats.unclassified.length} expenses`}
        </Button>
      ),
    },
    {
      key: 'noCategory',
      show: stats.noCategory.length > 0,
      icon: Tag,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      count: stats.noCategory.length,
      title: language === 'es' ? 'Sin categoría' : 'No category',
      description: language === 'es'
        ? '🏷️ Asignar categoría permite agrupar gastos en el formulario T2125 (ej. comidas, viajes, equipo).'
        : '🏷️ Assigning a category groups expenses in the T2125 form (e.g., meals, travel, equipment).',
      actions: (
        <Button size="sm" variant="outline" onClick={() => onSelectExpenses(stats.noCategory.map(e => e.id))} className="text-xs">
          {language === 'es' ? 'Seleccionar para editar' : 'Select to edit'}
        </Button>
      ),
    },
  ].filter(s => s.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Summary header */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {language === 'es'
              ? `${totalIssues} ${totalIssues === 1 ? 'problema detectado' : 'problemas detectados'} en tus gastos`
              : `${totalIssues} ${totalIssues === 1 ? 'issue detected' : 'issues detected'} in your expenses`}
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
            {language === 'es'
              ? 'Resuelve estos problemas para reportes fiscales precisos'
              : 'Resolve these issues for accurate tax reports'}
          </p>
        </div>
        <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 border-0">
          {totalIssues}
        </Badge>
      </div>

      {/* Issue sections */}
      {sections.map((section) => {
        const Icon = section.icon;
        const isOpen = openSections[section.key] ?? false;

        return (
          <Collapsible key={section.key} open={isOpen} onOpenChange={() => toggle(section.key)}>
            <div className={cn('rounded-xl border overflow-hidden', section.border, section.bg)}>
              <CollapsibleTrigger className="w-full p-3 flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <Icon className={cn('h-4 w-4 shrink-0', section.color)} />
                <span className={cn('text-sm font-medium flex-1 text-left', section.color)}>
                  {section.title}
                </span>
                <Badge className={cn('border-0 text-xs', section.badgeBg)}>
                  {section.count}
                </Badge>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-3">
                  {/* Description / advice */}
                  <div className="flex gap-2 p-2 rounded-lg bg-white/60 dark:bg-black/20">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{section.description}</p>
                  </div>

                  {/* Duplicate groups */}
                  {'duplicateGroups' in section && section.duplicateGroups && (
                    <div className="space-y-2">
                      {section.duplicateGroups.map((group, idx) => (
                        <div key={idx} className="p-2 rounded-lg border border-red-200 dark:border-red-800 bg-white/50 dark:bg-black/20 space-y-1.5">
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <p className="font-medium">{group.original.vendor}</p>
                              <p className="text-muted-foreground">{group.original.date} · ${Number(group.original.amount).toFixed(2)}</p>
                            </div>
                            <Badge variant="destructive" className="text-[10px]">
                              {language === 'es' ? 'Duplicado' : 'Duplicate'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { /* keep both - just close */ }}>
                              {language === 'es' ? 'Mantener ambos' : 'Keep both'}
                            </Button>
                            <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => onDeleteDuplicate(group.duplicate.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Eliminar duplicado' : 'Delete duplicate'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview items for no-receipt */}
                  {'items' in section && section.items && (
                    <div className="space-y-1">
                      {section.items.map((e: ExpenseWithRelations) => (
                        <div key={e.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-white/40 dark:bg-black/10">
                          <span className="truncate flex-1">{e.vendor || '—'}</span>
                          <span className="font-medium ml-2">${Number(e.amount).toFixed(2)}</span>
                        </div>
                      ))}
                      {section.count > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{section.count - 5} {language === 'es' ? 'más' : 'more'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {section.actions && <div>{section.actions}</div>}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </motion.div>
  );
});
