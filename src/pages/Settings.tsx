import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
          <p className="text-muted-foreground mt-2">Manage your preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t('common.language')}</Label>
              <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}