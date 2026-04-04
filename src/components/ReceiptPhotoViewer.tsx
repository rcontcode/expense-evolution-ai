import { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentPreviewRenderer } from '@/components/shared/DocumentPreviewRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  ImageOff, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Maximize2,
  Move,
  RefreshCw,
  Download
} from 'lucide-react';
import { useDocumentUrl } from '@/hooks/data/useDocumentUrl';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReceiptPhotoViewerProps {
  documentId: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showButton?: boolean;
}

export function ReceiptPhotoViewer({ documentId, size = 'sm', showButton = true }: ReceiptPhotoViewerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const { url, fileName, isLoading, error } = useDocumentUrl(open ? documentId : null);
  const isPdf = fileName?.toLowerCase().endsWith('.pdf');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsFullscreen(false);
    }
  }, [open]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(prev => Math.max(0.25, Math.min(5, prev + delta)));
  }, []);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  // Handle drag move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Rotation handlers
  const rotateLeft = () => setRotation(prev => prev - 90);
  const rotateRight = () => setRotation(prev => prev + 90);

  // Reset all transformations
  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(5, prev + 0.25));
  const zoomOut = () => setZoom(prev => Math.max(0.25, prev - 0.25));

  // Toggle fullscreen
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  // Download file
  const downloadFile = () => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || (isPdf ? 'document.pdf' : 'receipt.jpg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!documentId) {
    if (!showButton) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted cursor-not-allowed opacity-50">
              <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('expenses.noReceipt')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className={`flex items-center justify-center ${sizeClasses[size]} rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer`}
            >
              <Camera className={`${iconSizes[size]} text-primary`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('expenses.viewReceipt')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className={`p-0 overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? 'max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none m-0' 
              : 'max-w-5xl max-h-[95vh]'
          }`}
        >
          <DialogHeader className="p-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <DialogTitle className="text-sm font-medium">{t('expenses.receiptPhoto')}</DialogTitle>
              
              {/* Control toolbar */}
              <div className="flex items-center gap-1 flex-wrap">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={zoomOut}
                        disabled={zoom <= 0.25}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Alejar (scroll ↓)</TooltipContent>
                  </Tooltip>
                  
                  <span className="text-xs font-mono w-12 text-center text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={zoomIn}
                        disabled={zoom >= 5}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Acercar (scroll ↑)</TooltipContent>
                  </Tooltip>
                </div>

                {/* Rotation controls */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={rotateLeft}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rotar izquierda</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={rotateRight}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rotar derecha</TooltipContent>
                  </Tooltip>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={resetView}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Restablecer vista</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleFullscreen}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pantalla completa</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={downloadFile}
                        disabled={!url}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Descargar</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            
            {/* Instructions hint */}
            {zoom > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-primary/5 rounded-md px-2 py-1">
                <Move className="h-3 w-3" />
                <span>Arrastra para mover la imagen • Scroll para zoom</span>
              </div>
            )}
          </DialogHeader>
          
          <div 
            ref={containerRef}
            className={`flex-1 overflow-hidden bg-muted/30 flex items-center justify-center ${
              isFullscreen ? 'h-[calc(100vh-80px)]' : 'min-h-[500px] max-h-[75vh]'
            } ${zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-sm">{t('common.loading')}...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ImageOff className="h-16 w-16" />
                <p className="text-sm">{error}</p>
              </div>
            ) : url && isPdf ? (
              <DocumentPreviewRenderer
                url={url}
                fileName={fileName || undefined}
                mimeType="application/pdf"
                className="w-full h-full"
                pdfWidth={700}
                onDownload={downloadFile}
              />
            ) : url ? (
              <img
                ref={imageRef}
                src={url}
                alt="Receipt"
                draggable={false}
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
              />
            ) : null}
          </div>
          
          {/* Zoom slider at bottom for mobile */}
          <div className="p-3 border-t bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min="25"
                max="500"
                value={zoom * 100}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
