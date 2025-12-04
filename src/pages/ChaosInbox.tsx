import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  created_at: string;
}

export default function ChaosInbox() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setDocuments(data || []);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('expense-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_path: fileName,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            status: 'pending',
          });

        if (dbError) throw dbError;
      }

      toast.success(t('common.success'));
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'default',
      possible_duplicate: 'destructive',
      classified: 'secondary',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{t(`chaos.${status}`)}</Badge>;
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-3xl font-bold">{t('chaos.title')}</h1>
                <p className="text-muted-foreground mt-2">{t('chaos.subtitle')}</p>
              </div>
              <InfoTooltip content={TOOLTIP_CONTENT.chaosInbox} />
            </div>
            <InfoTooltip content={TOOLTIP_CONTENT.chaosInboxUpload} variant="wrapper">
              <label htmlFor="file-upload">
                <Button disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? t('common.loading') : t('chaos.uploadFiles')}
                  </span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </InfoTooltip>
          </div>

          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('chaos.noDocuments')}</p>
                <p className="text-sm text-muted-foreground">{t('chaos.uploadFirst')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <InfoTooltip content={TOOLTIP_CONTENT.chaosInboxStatus} variant="wrapper">
                        {getStatusBadge(doc.status)}
                      </InfoTooltip>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>
    </Layout>
  );
}
