import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  country: string;
  province: string;
  created_at: string;
}

export default function Clients() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setClients(data || []);
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('clients.title')}</h1>
            <p className="text-muted-foreground mt-2">Manage your client relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('clients.addClient')}
          </Button>
        </div>

        {clients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('clients.noClients')}</p>
              <p className="text-sm text-muted-foreground">{t('clients.addFirst')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{client.country}</p>
                    <p>{client.province}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}