import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllFiles, type UnifiedFile } from '@/hooks/data/useAllFiles';
import { useDeleteFile } from '@/hooks/data/useDeleteFile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { FilePreviewDialog } from '@/components/files/FilePreviewDialog';
import { FileDeleteDialog } from '@/components/files/FileDeleteDialog';
import {
  FileText, Download, ExternalLink, Eye, Files as FilesIcon,
  Clock, CheckCircle2, Image, File, Search, Trash2, CalendarIcon, X,
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

type OriginFilter = 'all' | 'receipt' | 'contract';
type StatusFilter = 'all' | 'pending' | 'processed' | 'approved' | 'rejected';

function getStatusBadge(file: UnifiedFile, lang: string) {
  if (file.origin === 'receipt') {
    const s = file.review_status ?? file.status ?? 'pending';
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
      pending: { label: lang === 'es' ? 'Pendiente' : 'Pending', variant: 'warning' },
      processing: { label: lang === 'es' ? 'Procesando' : 'Processing', variant: 'secondary' },
      processed: { label: lang === 'es' ? 'Procesado' : 'Processed', variant: 'default' },
      approved: { label: lang === 'es' ? 'Aprobado' : 'Approved', variant: 'success' },
      rejected: { label: lang === 'es' ? 'Rechazado' : 'Rejected', variant: 'destructive' },
    };
    const m = map[s] ?? map.pending;
    return <Badge variant={m.variant}>{m.label}</Badge>;
  }
  const s = file.status ?? 'pending_review';
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
    pending_review: { label: lang === 'es' ? 'Pendiente' : 'Pending', variant: 'warning' },
    active: { label: lang === 'es' ? 'Activo' : 'Active', variant: 'success' },
    expired: { label: lang === 'es' ? 'Expirado' : 'Expired', variant: 'secondary' },
    terminated: { label: lang === 'es' ? 'Terminado' : 'Terminated', variant: 'default' },
  };
  const m = map[s] ?? { label: s, variant: 'secondary' as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function fileTypeIcon(ft: string | null) {
  if (!ft) return <File className="h-4 w-4" />;
  const lower = ft.toLowerCase();
  if (lower.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (/jpg|jpeg|png|webp/.test(lower)) return <Image className="h-4 w-4 text-blue-500" />;
  return <File className="h-4 w-4" />;
}

function matchesStatus(file: UnifiedFile, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  const s = (file.review_status ?? file.status ?? '').toLowerCase();
  if (filter === 'pending') return s.includes('pending') || s === '';
  if (filter === 'processed') return s === 'processed' || s === 'processing';
  if (filter === 'approved') return s === 'approved' || s === 'active';
  if (filter === 'rejected') return s === 'rejected' || s === 'terminated' || s === 'expired';
  return true;
}

export default function FilesPage() {
  const { language } = useLanguage();
  const { data: files, isLoading } = useAllFiles();
  const deleteFile = useDeleteFile();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Preview state
  const [previewFile, setPreviewFile] = useState<UnifiedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<UnifiedFile | null>(null);

  const filtered = useMemo(() => {
    if (!files) return [];
    return files.filter((f) => {
      if (originFilter !== 'all' && f.origin !== originFilter) return false;
      if (!matchesStatus(f, statusFilter)) return false;
      if (searchQuery && !f.file_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateFrom) {
        const fileDate = new Date(f.created_at);
        if (isBefore(fileDate, startOfDay(dateFrom))) return false;
      }
      if (dateTo) {
        const fileDate = new Date(f.created_at);
        if (isAfter(fileDate, endOfDay(dateTo))) return false;
      }
      return true;
    });
  }, [files, originFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  const stats = useMemo(() => {
    if (!files) return { total: 0, pending: 0, processed: 0 };
    return {
      total: files.length,
      pending: files.filter((f) => matchesStatus(f, 'pending')).length,
      processed: files.filter((f) => !matchesStatus(f, 'pending')).length,
    };
  }, [files]);

  const handlePreview = useCallback(async (file: UnifiedFile) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewUrl(null);
    const { data } = await supabase.storage.from(file.bucket).createSignedUrl(file.file_path, 3600);
    setPreviewUrl(data?.signedUrl ?? null);
    setPreviewLoading(false);
  }, []);

  const handleDownload = useCallback(async (file: UnifiedFile) => {
    const { data } = await supabase.storage.from(file.bucket).createSignedUrl(file.file_path, 3600);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.file_name;
      a.click();
    }
  }, []);

  const handleGoToSection = useCallback((file: UnifiedFile) => {
    navigate(file.origin === 'receipt' ? '/chaos' : '/contracts');
  }, [navigate]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteFile.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
  }, [deleteTarget, deleteFile]);

  const title = language === 'es' ? 'Centro de Archivos' : 'File Center';
  const desc = language === 'es' ? 'Todos tus archivos subidos en un solo lugar' : 'All your uploaded files in one place';
  const locale = language === 'es' ? es : enUS;

  return (
    <Layout>
      <PageHeader title={title} description={desc} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: FilesIcon, label: language === 'es' ? 'Total' : 'Total', value: stats.total, color: 'text-primary' },
          { icon: Clock, label: language === 'es' ? 'Pendientes' : 'Pending', value: stats.pending, color: 'text-warning' },
          { icon: CheckCircle2, label: language === 'es' ? 'Procesados' : 'Processed', value: stats.processed, color: 'text-success' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[180px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'es' ? 'Buscar por nombre...' : 'Search by name...'}
            className="pl-9 h-9"
          />
        </div>
        <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as OriginFilter)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
            <SelectItem value="receipt">{language === 'es' ? 'Recibos' : 'Receipts'}</SelectItem>
            <SelectItem value="contract">{language === 'es' ? 'Contratos' : 'Contracts'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'es' ? 'Todo estado' : 'All statuses'}</SelectItem>
            <SelectItem value="pending">{language === 'es' ? 'Pendiente' : 'Pending'}</SelectItem>
            <SelectItem value="processed">{language === 'es' ? 'Procesado' : 'Processed'}</SelectItem>
            <SelectItem value="approved">{language === 'es' ? 'Aprobado' : 'Approved'}</SelectItem>
            <SelectItem value="rejected">{language === 'es' ? 'Rechazado' : 'Rejected'}</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, 'dd/MM', { locale }) : (language === 'es' ? 'Desde' : 'From')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={locale} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateTo ? format(dateTo, 'dd/MM', { locale }) : (language === 'es' ? 'Hasta' : 'To')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={locale} />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* File list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FilesIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {language === 'es' ? 'No hay archivos que mostrar' : 'No files to display'}
            </p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((f) => (
            <Card key={`${f.origin}-${f.id}`} className="hover:shadow-md">
              <CardContent className="p-3 flex items-start gap-3">
                {fileTypeIcon(f.file_type)}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePreview(f)}>
                  <p className="text-sm font-medium truncate">{f.file_name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {f.origin === 'receipt' ? (language === 'es' ? 'Recibo' : 'Receipt') : (language === 'es' ? 'Contrato' : 'Contract')}
                    </Badge>
                    {getStatusBadge(f, language)}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(f.created_at), 'dd MMM yyyy', { locale })}
                    </span>
                  </div>
                  {f.client_name && <p className="text-[10px] text-muted-foreground mt-0.5">{f.client_name}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(f)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(f)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">{language === 'es' ? 'Archivo' : 'File'}</th>
                  <th className="p-3">{language === 'es' ? 'Tipo' : 'Type'}</th>
                  <th className="p-3">{language === 'es' ? 'Sección' : 'Section'}</th>
                  <th className="p-3">{language === 'es' ? 'Estado' : 'Status'}</th>
                  <th className="p-3">{language === 'es' ? 'Cliente' : 'Client'}</th>
                  <th className="p-3">{language === 'es' ? 'Fecha' : 'Date'}</th>
                  <th className="p-3">{language === 'es' ? 'Tamaño' : 'Size'}</th>
                  <th className="p-3">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={`${f.origin}-${f.id}`} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => handlePreview(f)}>
                        {fileTypeIcon(f.file_type)}
                        <span className="truncate max-w-[200px] hover:underline">{f.file_name}</span>
                      </div>
                    </td>
                    <td className="p-3 uppercase text-xs text-muted-foreground">{f.file_type ?? '—'}</td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {f.origin === 'receipt' ? (language === 'es' ? 'Recibo' : 'Receipt') : (language === 'es' ? 'Contrato' : 'Contract')}
                      </Badge>
                    </td>
                    <td className="p-3">{getStatusBadge(f, language)}</td>
                    <td className="p-3 text-muted-foreground">{f.client_name ?? '—'}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(f.created_at), 'dd MMM yyyy', { locale })}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(f)} title={language === 'es' ? 'Ver' : 'Preview'}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(f)} title={language === 'es' ? 'Descargar' : 'Download'}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleGoToSection(f)} title={language === 'es' ? 'Ir a sección' : 'Go to section'}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(f)} title={language === 'es' ? 'Eliminar' : 'Delete'}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Inline Preview Dialog */}
      <FilePreviewDialog
        file={previewFile}
        previewUrl={previewUrl}
        isLoading={previewLoading}
        onClose={() => { setPreviewFile(null); setPreviewUrl(null); }}
        onDownload={handleDownload}
        onGoToSection={handleGoToSection}
      />

      {/* Delete Confirmation */}
      <FileDeleteDialog
        file={deleteTarget}
        isDeleting={deleteFile.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
