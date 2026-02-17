import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllFiles, type UnifiedFile } from '@/hooks/data/useAllFiles';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  FileText, Download, ExternalLink, Eye, Files as FilesIcon,
  Clock, CheckCircle2, AlertCircle, Image, File,
} from 'lucide-react';
import { format } from 'date-fns';
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
  if (lower.includes('jpg') || lower.includes('jpeg') || lower.includes('png') || lower.includes('webp'))
    return <Image className="h-4 w-4 text-blue-500" />;
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    if (!files) return [];
    return files.filter((f) => {
      if (originFilter !== 'all' && f.origin !== originFilter) return false;
      if (!matchesStatus(f, statusFilter)) return false;
      return true;
    });
  }, [files, originFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!files) return { total: 0, pending: 0, processed: 0 };
    return {
      total: files.length,
      pending: files.filter((f) => matchesStatus(f, 'pending')).length,
      processed: files.filter((f) => !matchesStatus(f, 'pending')).length,
    };
  }, [files]);

  const handlePreview = async (file: UnifiedFile) => {
    const { data } = await supabase.storage.from(file.bucket).createSignedUrl(file.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleDownload = async (file: UnifiedFile) => {
    const { data } = await supabase.storage.from(file.bucket).createSignedUrl(file.file_path, 3600);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.file_name;
      a.click();
    }
  };

  const handleGoToSection = (file: UnifiedFile) => {
    navigate(file.origin === 'receipt' ? '/chaos' : '/contracts');
  };

  const title = language === 'es' ? 'Centro de Archivos' : 'File Center';
  const desc = language === 'es'
    ? 'Todos tus archivos subidos en un solo lugar'
    : 'All your uploaded files in one place';

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

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as OriginFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
            <SelectItem value="receipt">{language === 'es' ? 'Recibos' : 'Receipts'}</SelectItem>
            <SelectItem value="contract">{language === 'es' ? 'Contratos' : 'Contracts'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[150px]">
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
        /* Mobile: compact cards */
        <div className="space-y-2">
          {filtered.map((f) => (
            <Card key={`${f.origin}-${f.id}`} className="hover:shadow-md">
              <CardContent className="p-3 flex items-start gap-3">
                {fileTypeIcon(f.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file_name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {f.origin === 'receipt' ? (language === 'es' ? 'Recibo' : 'Receipt') : (language === 'es' ? 'Contrato' : 'Contract')}
                    </Badge>
                    {getStatusBadge(f, language)}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(f.created_at), 'dd MMM yyyy', { locale: language === 'es' ? es : enUS })}
                    </span>
                  </div>
                  {f.client_name && <p className="text-[10px] text-muted-foreground mt-0.5">{f.client_name}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(f)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleGoToSection(f)}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop: table */
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
                    <td className="p-3 flex items-center gap-2">
                      {fileTypeIcon(f.file_type)}
                      <span className="truncate max-w-[200px]">{f.file_name}</span>
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
                      {format(new Date(f.created_at), 'dd MMM yyyy', { locale: language === 'es' ? es : enUS })}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  );
}
