import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface LeadsExportProps {
  leads: QuizLead[];
  filename?: string;
}

export function LeadsExport({ leads, filename = 'quiz-leads' }: LeadsExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const prepareData = () => {
    return leads.map((lead) => ({
      Nombre: lead.name,
      Email: lead.email,
      Teléfono: lead.phone || '',
      País: lead.country,
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
      'Fecha registro': new Date(lead.created_at).toLocaleDateString('es'),
    }));
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const data = prepareData();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${data.length} leads exportados a Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = prepareData();
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`${data.length} leads exportados a CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  if (leads.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        Exportar
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
          Exportar ({leads.length})
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
