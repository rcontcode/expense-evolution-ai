import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDocumentUrl(documentId: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setUrl(null);
      return;
    }

    async function fetchDocumentUrl() {
      setIsLoading(true);
      setError(null);

      try {
        // First get the document to find the file_path
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('file_path, file_name')
          .eq('id', documentId)
          .single();

        if (docError || !document) {
          setError('Document not found');
          setUrl(null);
          return;
        }

        // Get signed URL from storage
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('expense-documents')
          .createSignedUrl(document.file_path, 3600); // 1 hour expiry

        if (urlError) {
          setError('Could not load image');
          setUrl(null);
          return;
        }

        setUrl(urlData.signedUrl);
      } catch (err) {
        setError('Error loading document');
        setUrl(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocumentUrl();
  }, [documentId]);

  return { url, isLoading, error };
}
