import { useMemo, useState } from 'react';
import { ExpenseWithRelations } from '@/types/expense.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  DollarSign, 
  FileText, 
  Download,
  Calendar,
  CalendarIcon,
  X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface ClientReimbursementReportProps {
  expenses: ExpenseWithRelations[];
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  expenses: ExpenseWithRelations[];
  total: number;
  count: number;
  categories: Record<string, { count: number; total: number }>;
}

const REIMBURSABLE_STATUSES = ['reimbursable', 'pending', 'under_review'];

const CATEGORY_LABELS: Record<string, string> = {
  meals: 'Comidas',
  travel: 'Viajes',
  equipment: 'Equipos',
  software: 'Software',
  mileage: 'Kilometraje',
  home_office: 'Oficina en casa',
  professional_services: 'Servicios profesionales',
  office_supplies: 'Suministros de oficina',
  utilities: 'Servicios públicos',
  other: 'Otros',
};

export function ClientReimbursementReport({ expenses }: ClientReimbursementReportProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { clientGroups, totalReimbursable, totalExpenses, filteredExpenses } = useMemo(() => {
    // First filter by date range
    let filtered = expenses;
    if (dateRange.from && dateRange.to) {
      filtered = expenses.filter((e) => {
        const expenseDate = parseISO(e.date);
        return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to! });
      });
    } else if (dateRange.from) {
      filtered = expenses.filter((e) => parseISO(e.date) >= dateRange.from!);
    } else if (dateRange.to) {
      filtered = expenses.filter((e) => parseISO(e.date) <= dateRange.to!);
    }

    // Then filter reimbursable with client
    const reimbursableExpenses = filtered.filter(
      (e) => e.client_id && (REIMBURSABLE_STATUSES.includes(e.status || '') || e.status === 'classified')
    );

    const grouped = reimbursableExpenses.reduce((acc, expense) => {
      const clientId = expense.client_id || 'unknown';
      const clientName = expense.client?.name || 'Cliente desconocido';

      if (!acc[clientId]) {
        acc[clientId] = {
          clientId,
          clientName,
          expenses: [],
          total: 0,
          count: 0,
          categories: {},
        };
      }

      acc[clientId].expenses.push(expense);
      acc[clientId].total += Number(expense.amount);
      acc[clientId].count += 1;

      const category = expense.category || 'other';
      if (!acc[clientId].categories[category]) {
        acc[clientId].categories[category] = { count: 0, total: 0 };
      }
      acc[clientId].categories[category].count += 1;
      acc[clientId].categories[category].total += Number(expense.amount);

      return acc;
    }, {} as Record<string, ClientGroup>);

    const groups = Object.values(grouped).sort((a, b) => b.total - a.total);
    const total = groups.reduce((sum, g) => sum + g.total, 0);

    return {
      clientGroups: groups,
      totalReimbursable: total,
      totalExpenses: groups.reduce((sum, g) => sum + g.count, 0),
      filteredExpenses: reimbursableExpenses,
    };
  }, [expenses, dateRange]);

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = clientGroups.map((group) => ({
      Cliente: group.clientName,
      'Total Gastos': group.count,
      'Monto Total': group.total,
      'Promedio por Gasto': group.total / group.count,
    }));
    summaryData.push({
      Cliente: 'TOTAL',
      'Total Gastos': totalExpenses,
      'Monto Total': totalReimbursable,
      'Promedio por Gasto': totalReimbursable / totalExpenses || 0,
    });
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen por Cliente');

    // Detailed sheet
    const detailData = clientGroups.flatMap((group) =>
      group.expenses.map((expense) => ({
        Cliente: group.clientName,
        Fecha: expense.date,
        Vendedor: expense.vendor || '',
        Categoría: CATEGORY_LABELS[expense.category || 'other'] || expense.category,
        Descripción: expense.description || '',
        Monto: Number(expense.amount),
        Estado: expense.status || 'pending',
        Notas: expense.notes || '',
      }))
    );
    const detailSheet = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle de Gastos');

    // Category breakdown per client
    const categoryData = clientGroups.flatMap((group) =>
      Object.entries(group.categories).map(([category, data]) => ({
        Cliente: group.clientName,
        Categoría: CATEGORY_LABELS[category] || category,
        'Cantidad de Gastos': data.count,
        'Monto Total': data.total,
      }))
    );
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoría');

    const dateStr = dateRange.from && dateRange.to 
      ? `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`
      : format(new Date(), 'yyyy-MM-dd');
    const filename = `reporte-reembolsos-cliente-${dateStr}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (clientGroups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No hay gastos reembolsables</p>
          <p className="text-sm text-muted-foreground">
            Asigna gastos a clientes con estado reembolsable para ver el reporte
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">—</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button variant="ghost" size="icon" onClick={clearDateRange}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {dateRange.from && dateRange.to && (
              <Badge variant="secondary">
                {format(dateRange.from, "dd MMM", { locale: dateLocale })} - {format(dateRange.to, "dd MMM yyyy", { locale: dateLocale })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{clientGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gastos</p>
                <p className="text-2xl font-bold">{totalExpenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reembolsable</p>
                <p className="text-2xl font-bold">${totalReimbursable.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToExcel} variant="outline" disabled={clientGroups.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte Excel
        </Button>
      </div>

      {/* Client Groups */}
      <div className="space-y-4">
        {clientGroups.map((group) => (
          <Card key={group.clientId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.clientName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {group.count} gastos registrados
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ${group.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total a reembolsar</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category breakdown */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(group.categories).map(([category, data]) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[category] || category}: {data.count} (${data.total.toFixed(2)})
                  </Badge>
                ))}
              </div>

              <Separator />

              {/* Expense details */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Detalle de gastos</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {group.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(new Date(expense.date), 'dd MMM yyyy', { locale: dateLocale })}
                        </span>
                        <span className="font-medium">{expense.vendor || 'Sin vendedor'}</span>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[expense.category || 'other'] || expense.category}
                        </Badge>
                      </div>
                      <span className="font-semibold">${Number(expense.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
