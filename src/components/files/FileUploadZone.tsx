import { useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FileUploadZone() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(async (fileList: FileList) => {
    if (!user?.id || fileList.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from('expense-documents')
        .upload(path, file);

      if (storageErr) {
        toast.error(`Error: ${file.name}`);
        continue;
      }

      const { error: dbErr } = await supabase.from('documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: path,
        file_type: ext,
        file_size: file.size,
        status: 'pending',
      });

      if (dbErr) {
        toast.error(`DB error: ${file.name}`);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(language === 'es' ? `${successCount} archivo(s) subido(s)` : `${successCount} file(s) uploaded`);
      queryClient.invalidateQueries({ queryKey: ['all-files'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
    setUploading(false);
  }, [user?.id, language, queryClient]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-lg p-4 mb-4 text-center transition-colors cursor-pointer',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        uploading && 'opacity-60 pointer-events-none'
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {uploading
          ? (language === 'es' ? 'Subiendo...' : 'Uploading...')
          : (language === 'es' ? 'Arrastra archivos aquí o haz clic para subir' : 'Drag files here or click to upload')}
      </p>
      <p className="text-xs text-muted-foreground/60 mt-0.5">PDF, JPG, PNG, WEBP</p>
    </div>
  );
}
