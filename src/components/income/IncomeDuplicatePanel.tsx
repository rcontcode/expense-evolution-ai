import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIncomeDuplicates, IncomeDuplicateGroup } from '@/hooks/data/useIncomeDuplicates';
import { useDeleteIncome } from '@/hooks/data/useIncome';
import { IncomeWithRelations } from '@/types/income.types';
import { AlertTriangle, Trash2, ShieldCheck, ChevronDown, ChevronUp, Sparkles, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  incomes: IncomeWithRelations[];
}

export function IncomeDuplicatePanel({ incomes }: Props) {
  const { language } = useLanguage();
  const l = language === 'es';
  const { groups, count } = useIncomeDuplicates(incomes);
  const [expanded, setExpanded] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteIncome = useDeleteIncome();
  const dateLocale = l ? es : enUS;

  if (count === 0) return null;

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllSuggested = () => {
    const ids = new Set<string>();
    groups.forEach(g => g.duplicates.forEach(d => ids.add(d.id)));
    setSelectedIds(ids);
  };

  const handleDeleteSelected = async () => {
    setConfirmOpen(false);
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await deleteIncome.mutateAsync(id);
        deleted++;
      } catch (e) {
        console.error('Error deleting income:', e);
      }
    }
    setSelectedIds(new Set());
    toast.success(l ? `${deleted} duplicado(s) eliminado(s)` : `${deleted} duplicate(s) removed`);
  };

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="cursor-pointer py-3 px-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">
              <Copy className="inline h-4 w-4 mr-1 text-amber-500" />
              {l ? `${count} posible(s) duplicado(s) detectado(s)` : `${count} possible duplicate(s) detected`}
            </CardTitle>
            <Badge variant="outline" className="border-amber-500 text-amber-500">
              <Sparkles className="h-3 w-3 mr-1" />
              {l ? 'IA' : 'AI'}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {l
                ? 'Selecciona los registros duplicados que deseas eliminar. La IA sugiere cuáles conservar.'
                : 'Select duplicate records to remove. AI suggests which to keep.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllSuggested}>
                <ShieldCheck className="h-4 w-4 mr-1" />
                {l ? 'Seleccionar sugeridos' : 'Select suggested'}
              </Button>
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {l ? `Eliminar ${selectedIds.size}` : `Delete ${selectedIds.size}`}
                </Button>
              )}
            </div>
          </div>

          {/* Groups */}
          {groups.map((group, idx) => (
            <DuplicateGroupCard
              key={idx}
              group={group}
              selectedIds={selectedIds}
              toggleId={toggleId}
              dateLocale={dateLocale}
              language={language}
            />
          ))}

          {/* Confirm dialog */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {l ? `¿Eliminar ${selectedIds.size} registro(s)?` : `Delete ${selectedIds.size} record(s)?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {l
                    ? 'Los registros seleccionados serán movidos a la papelera. Esta acción se puede deshacer desde el historial.'
                    : 'Selected records will be moved to trash. This can be undone from history.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{l ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  <Trash2 className="h-4 w-4 mr-1" />
                  {l ? 'Eliminar' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      )}
    </Card>
  );
}

function DuplicateGroupCard({
  group,
  selectedIds,
  toggleId,
  dateLocale,
  language,
}: {
  group: IncomeDuplicateGroup;
  selectedIds: Set<string>;
  toggleId: (id: string) => void;
  dateLocale: typeof es;
  language: string;
}) {
  const l = language === 'es';
  const allRecords = [group.keep, ...group.duplicates];

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card">
      {/* Reason */}
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">{l ? group.reason : group.reasonEn}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Sparkles className="inline h-3 w-3 mr-0.5 text-primary" />
            {l ? group.suggestion : group.suggestionEn}
          </p>
          <Badge variant="secondary" className="mt-1 text-xs">
            {l ? `Confianza: ${Math.round(group.confidence * 100)}%` : `Confidence: ${Math.round(group.confidence * 100)}%`}
          </Badge>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-1">
        {allRecords.map((record) => {
          const isKeep = record.id === group.keep.id;
          const isSelected = selectedIds.has(record.id);

          return (
            <div
              key={record.id}
              className={`flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${
                isKeep
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : isSelected
                  ? 'bg-destructive/10 border border-destructive/30'
                  : 'bg-muted/30 border border-transparent hover:bg-muted/50'
              }`}
            >
              {!isKeep && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleId(record.id)}
                />
              )}
              {isKeep && (
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              )}

              <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {format(new Date(record.date), 'PP', { locale: dateLocale })}
                </span>
                <span className="font-medium truncate">{record.source || record.description || '-'}</span>
                <span className="font-bold text-chart-1">${Number(record.amount).toFixed(2)}</span>
                {record.client && (
                  <Badge variant="outline" className="text-xs">{record.client.name}</Badge>
                )}
                {record.project && (
                  <Badge variant="outline" className="text-xs" style={{ borderColor: record.project.color }}>
                    {record.project.name}
                  </Badge>
                )}
              </div>

              {isKeep && (
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 shrink-0">
                  {l ? '✓ Conservar' : '✓ Keep'}
                </Badge>
              )}
              {!isKeep && !isSelected && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 shrink-0">
                  {l ? 'Posible duplicado' : 'Possible duplicate'}
                </Badge>
              )}
              {!isKeep && isSelected && (
                <Badge variant="destructive" className="shrink-0">
                  {l ? 'Eliminar' : 'Remove'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
