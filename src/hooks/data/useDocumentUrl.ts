import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

function inferMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
}

export function useDocumentUrl(documentId: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setUrl(null);
      setFileName(null);
      setMimeType(null);
      return;
    }

    let cancelled = false;

    async function fetchDocument() {
      setIsLoading(true);
      setError(null);

      try {
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('file_path, file_name')
          .eq('id', documentId)
          .maybeSingle();

        if (cancelled) return;

        if (docError || !document) {
          setError('Document not found');
          setUrl(null);
          return;
        }

        setFileName(document.file_name);
        const mime = inferMimeType(document.file_name || document.file_path);
        setMimeType(mime);

        // Download as blob to avoid signed URL blocking
        const { data: blob, error: dlError } = await supabase
          .storage
          .from('expense-documents')
          .download(document.file_path);

        if (cancelled) return;

        if (dlError || !blob) {
          setError('Could not load file');
          setUrl(null);
          return;
        }

        // Revoke previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        setUrl(blobUrl);
      } catch {
        if (!cancelled) {
          setError('Error loading document');
          setUrl(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchDocument();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [documentId]);

  return { url, fileName, mimeType, isLoading, error };
}

/**
 * Standalone helper: download a document by ID and return a blob URL.
 * Caller is responsible for revoking the URL when done.
 */
export async function getDocumentBlobUrl(docId: string): Promise<{ blobUrl: string; fileName: string; mimeType: string } | null> {
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, file_name')
    .eq('id', docId)
    .single();

  if (!doc?.file_path) return null;

  const { data: blob } = await supabase
    .storage
    .from('expense-documents')
    .download(doc.file_path);

  if (!blob) return null;

  const mime = inferMimeType(doc.file_name || doc.file_path);
  return {
    blobUrl: URL.createObjectURL(blob),
    fileName: doc.file_name || doc.file_path.split('/').pop() || 'document',
    mimeType: mime,
  };
}
