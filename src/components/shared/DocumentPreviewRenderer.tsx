import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use CDN worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentPreviewRendererProps {
  url: string | null;
  fileName?: string;
  mimeType?: string | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  /** For images: apply transform styles (zoom, rotate, pan) */
  imageStyle?: React.CSSProperties;
  imageClassName?: string;
  /** Show all pages or just page 1 (thumbnail mode) */
  allPages?: boolean;
  /** Max width for PDF pages */
  pdfWidth?: number;
  /** Called when download is requested */
  onDownload?: () => void;
}

export function DocumentPreviewRenderer({
  url,
  fileName,
  mimeType,
  isLoading,
  error,
  className,
  imageStyle,
  imageClassName,
  allPages = true,
  pdfWidth = 600,
  onDownload,
}: DocumentPreviewRendererProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState(false);

  const isPdf = mimeType === 'application/pdf' ||
    fileName?.toLowerCase().endsWith('.pdf');

  // Reset PDF state when URL changes
  useEffect(() => {
    setNumPages(null);
    setPdfError(false);
  }, [url]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground", className)}>
        <FileText className="h-12 w-12 opacity-50" />
        <p className="text-sm">{error || 'No preview available'}</p>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
        )}
      </div>
    );
  }

  if (isPdf) {
    if (pdfError) {
      return (
        <div className={cn("flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground", className)}>
          <FileText className="h-12 w-12 opacity-50" />
          <p className="text-sm">{fileName || 'PDF'}</p>
          <p className="text-xs">No se pudo renderizar este PDF.</p>
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" />
              Descargar PDF
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col items-center overflow-auto", className)}>
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={() => setPdfError(true)}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          {allPages && numPages
            ? Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  width={pdfWidth}
                  className="mb-2"
                />
              ))
            : <Page pageNumber={1} width={pdfWidth} />
          }
        </Document>
      </div>
    );
  }

  // Image
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img
        src={url}
        alt={fileName || 'Document'}
        draggable={false}
        style={imageStyle}
        className={cn("max-w-full max-h-full object-contain select-none", imageClassName)}
      />
    </div>
  );
}
