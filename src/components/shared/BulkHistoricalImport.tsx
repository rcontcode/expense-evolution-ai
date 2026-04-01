import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Upload, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EXPENSE_CATEGORIES } from '@/lib/constants/expense-categories';
import { MAX_BULK_IMPORT_ROWS, BATCH_INSERT_SIZE } from '@/lib/constants/resource-limits';

interface HistoricalRow {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  vendor: string;
}

interface BulkHistoricalImportProps {
  open: boolean;
  onClose: () => void;
  type: 'expense' | 'income';
  onComplete?: () => void;
}

const newRow = (): HistoricalRow => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  description: '',
  category: 'other',
  vendor: '',
});

export function BulkHistoricalImport({ open, onClose, type, onComplete }: BulkHistoricalImportProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentEntity } = useEntity();
  const l = language === 'es';

  const [rows, setRows] = useState<HistoricalRow[]>([newRow(), newRow(), newRow()]);
  const [saving, setSaving] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const addRow = () => setRows(r => [...r, newRow()]);
  const removeRow = (id: string) => setRows(r => r.filter(row => row.id !== id));
  const updateRow = (id: string, field: keyof HistoricalRow, value: any) => {
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split('\n');
    const parsed: HistoricalRow[] = lines.map(line => {
      const parts = line.split(/[\t,;]/).map(s => s.trim());
      return {
        id: crypto.randomUUID(),
        date: parts[0] || new Date().toISOString().split('T')[0],
        amount: parseFloat(parts[1]) || 0,
        description: parts[2] || '',
        category: parts[3] || 'other',
        vendor: parts[4] || '',
      };
    }).filter(r => r.amount > 0);

    if (parsed.length > 0) {
      setRows(parsed);
      setPasteMode(false);
      setPasteText('');
      toast.success(l ? `${parsed.length} filas importadas` : `${parsed.length} rows imported`);
    }
  };

  const validRows = rows.filter(r => r.amount > 0 && r.date);

  const handleSave = async () => {
    if (!user || validRows.length === 0) return;
    setSaving(true);
    try {
      const currency = currentEntity?.default_currency || 'CAD';

      if (type === 'expense') {
        const { error } = await supabase.from('expenses').insert(
          validRows.map(r => ({
            user_id: user.id,
            date: r.date,
            amount: r.amount,
            description: r.description || null,
            category: r.category,
            vendor: r.vendor || null,
            currency,
            entity_id: currentEntity?.id || null,
          }))
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from('income').insert(
          validRows.map(r => ({
            user_id: user.id,
            date: r.date,
            amount: r.amount,
            description: r.description || null,
            source: r.vendor || 'Other',
            income_type: 'other' as const,
            currency,
            entity_id: currentEntity?.id || null,
          }))
        );
        if (error) throw error;
      }

      toast.success(l
        ? `✅ ${validRows.length} registros históricos importados`
        : `✅ ${validRows.length} historical records imported`
      );
      onComplete?.();
      onClose();
      setRows([newRow(), newRow(), newRow()]);
    } catch (err) {
      console.error(err);
      toast.error(l ? 'Error al importar' : 'Error importing');
    } finally {
      setSaving(false);
    }
  };

  const isExpense = type === 'expense';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {l
              ? `Importar ${isExpense ? 'Gastos' : 'Ingresos'} Históricos`
              : `Import Historical ${isExpense ? 'Expenses' : 'Income'}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 border border-accent">
          <p className="text-xs text-muted-foreground">
            {l
              ? 'Agrega registros con fechas pasadas para completar tu historial financiero. Puedes escribirlos manualmente o pegar desde Excel/CSV.'
              : 'Add records with past dates to complete your financial history. You can type them manually or paste from Excel/CSV.'}
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          <Button
            variant={pasteMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPasteMode(!pasteMode)}
          >
            <Upload className="h-3 w-3 mr-1" />
            {l ? 'Pegar desde Excel' : 'Paste from Excel'}
          </Button>
          <Badge variant="secondary" className="self-center">
            {validRows.length} {l ? 'válidos' : 'valid'}
          </Badge>
        </div>

        {pasteMode && (
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {l
                ? 'Pega datos con formato: fecha, monto, descripción, categoría, vendedor (separados por tab o coma)'
                : 'Paste data in format: date, amount, description, category, vendor (tab or comma separated)'}
            </p>
            <Textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={5}
              placeholder={l
                ? '2024-01-15\t50.00\tSupermercado\tgroceries\tWalmart'
                : '2024-01-15\t50.00\tGroceries\tgroceries\tWalmart'}
            />
            <Button size="sm" onClick={handlePaste}>
              {l ? 'Procesar' : 'Process'}
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-[100px_80px_1fr_100px_32px] gap-2 items-end">
              <div>
                {i === 0 && <Label className="text-[10px]">{l ? 'Fecha' : 'Date'}</Label>}
                <Input
                  type="date"
                  value={row.date}
                  onChange={e => updateRow(row.id, 'date', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                {i === 0 && <Label className="text-[10px]">{l ? 'Monto' : 'Amount'}</Label>}
                <Input
                  type="number"
                  step="0.01"
                  value={row.amount || ''}
                  onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                {i === 0 && <Label className="text-[10px]">{l ? 'Descripción' : 'Description'}</Label>}
                <Input
                  value={row.description}
                  onChange={e => updateRow(row.id, 'description', e.target.value)}
                  className="h-8 text-xs"
                  placeholder={isExpense ? (l ? 'Gasto...' : 'Expense...') : (l ? 'Ingreso...' : 'Income...')}
                />
              </div>
              <div>
                {i === 0 && <Label className="text-[10px]">{isExpense ? (l ? 'Categoría' : 'Category') : (l ? 'Fuente' : 'Source')}</Label>}
                {isExpense ? (
                  <Select value={row.category} onValueChange={v => updateRow(row.id, 'category', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={row.vendor}
                    onChange={e => updateRow(row.id, 'vendor', e.target.value)}
                    className="h-8 text-xs"
                    placeholder={l ? 'Fuente' : 'Source'}
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeRow(row.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="h-3 w-3 mr-1" /> {l ? 'Agregar fila' : 'Add row'}
        </Button>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>{l ? 'Cancelar' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={saving || validRows.length === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {l ? `Importar ${validRows.length} registros` : `Import ${validRows.length} records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
