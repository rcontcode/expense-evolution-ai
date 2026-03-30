import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { calculateLeadScore, getLeadPriority, getPriorityLabel } from '@/hooks/admin/useLeadScoring';

interface LeadsExportProps {
  leads: QuizLead[];
  filename?: string;
}

export function LeadsExport({ leads, filename = 'quiz-leads' }: LeadsExportProps) {
  const { language } = useLanguage();
  const es = language === 'es';
  const [isExporting, setIsExporting] = useState(false);

  const prepareData = () => {
    return leads.map((lead) => {
      const score = calculateLeadScore(lead);
      const priority = getLeadPriority(score);
      
      return {
        Nombre: lead.name,
        Email: lead.email,
        Teléfono: lead.phone || '',
        País: lead.country,
        'Lead Score': score,
        Prioridad: getPriorityLabel(priority),
        Situación: lead.situation,
        Meta: lead.goal,
        Obstáculo: lead.obstacle,
        'Nivel Quiz': lead.quiz_level,
        'Score Quiz': `${lead.quiz_score}%`,
        'Tiempo invertido': lead.time_spent || '',
        'Preguntas fallidas': lead.failed_questions?.join(', ') || '',
        Contactado: lead.contacted_at ? 'Sí' : 'No',
        'Fecha contacto': lead.contacted_at
          ? new Date(lead.contacted_at).toLocaleDateString('es')
          : '',
        'Notas contacto': lead.contact_notes || '',
        'Comentarios del quiz': lead.comments || '',
        Convertido: lead.converted_to_user ? 'Sí' : 'No',
        'Sincronizado GHL': lead.ghl_synced ? 'Sí' : 'No',
        Fuente: lead.source === 'fokuspark' ? 'Fokuspark' : lead.source === 'evofinz' || !lead.source ? 'EvoFinz' : lead.source,
        'Fecha registro': new Date(lead.created_at).toLocaleDateString('es'),
      };
    });
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const ExcelJS = await import('exceljs');
      const data = prepareData();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Leads');

      // Add headers
      const headers = Object.keys(data[0] || {});
      ws.columns = headers.map((h) => ({ header: h, key: h, width: Math.max(h.length, 15) }));
      ws.getRow(1).font = { bold: true };

      // Add data rows
      data.forEach((row) => ws.addRow(row));

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(es ? `${data.length} leads exportados a Excel` : `${data.length} leads exported to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(es ? 'Error al exportar' : 'Export error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = prepareData();
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.map((h) => `"${h}"`).join(','),
        ...data.map((row) =>
          headers.map((h) => {
            const val = String((row as Record<string, unknown>)[h] ?? '');
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        ),
      ];
      const csv = csvRows.join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(es ? `${data.length} leads exportados a CSV` : `${data.length} leads exported to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(es ? 'Error al exportar' : 'Export error');
    } finally {
      setIsExporting(false);
    }
  };

  if (leads.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        {es ? 'Exportar' : 'Export'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {es ? 'Exportar' : 'Export'} ({leads.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar a Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar a CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
