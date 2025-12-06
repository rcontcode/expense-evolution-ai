import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const PROVINCES = [
  'British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba',
  'Ontario', 'Quebec', 'New Brunswick', 'Nova Scotia',
  'Prince Edward Island', 'Newfoundland and Labrador'
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [province, setProvince] = useState('');
  const [workTypes, setWorkTypes] = useState<('employee' | 'contractor' | 'corporation')[]>([]);
  const [hasClients, setHasClients] = useState(false);
  const [clients, setClients] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  

  const handleWorkTypeToggle = (type: 'employee' | 'contractor' | 'corporation') => {
    setWorkTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const addClient = () => {
    setClients([...clients, '']);
  };

  const updateClient = (index: number, value: string) => {
    const newClients = [...clients];
    newClients[index] = value;
    setClients(newClients);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          province,
          work_types: workTypes,
          onboarding_completed: true,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Create clients if any
      if (hasClients) {
        const validClients = clients.filter(c => c.trim());
        if (validClients.length > 0) {
          const { error: clientsError } = await supabase
            .from('clients')
            .insert(
              validClients.map(name => ({
                user_id: user?.id,
                name: name.trim(),
              }))
            );

          if (clientsError) throw clientsError;
        }
      }

      toast.success(t('common.success'));
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle>{t('onboarding.step1')}</CardTitle>
              <CardDescription>{t('onboarding.province')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('onboarding.province')}</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('onboarding.workType')}</Label>
                <div className="space-y-2">
                  {(['employee', 'contractor', 'corporation'] as const).map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={workTypes.includes(type)}
                        onCheckedChange={() => handleWorkTypeToggle(type)}
                      />
                      <label htmlFor={type} className="text-sm cursor-pointer">
                        {t(`onboarding.${type}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        );

      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle>{t('onboarding.step2')}</CardTitle>
              <CardDescription>{t('onboarding.hasClients')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasClients"
                  checked={hasClients}
                  onCheckedChange={(checked) => setHasClients(!!checked)}
                />
                <label htmlFor="hasClients" className="text-sm cursor-pointer">
                  {t('onboarding.hasClients')}
                </label>
              </div>

              {hasClients && (
                <div className="space-y-2">
                  {clients.map((client, index) => (
                    <Input
                      key={index}
                      value={client}
                      onChange={(e) => updateClient(index, e.target.value)}
                      placeholder={t('onboarding.clientName')}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addClient}
                    className="w-full"
                  >
                    {t('onboarding.addClient')}
                  </Button>
                </div>
              )}
            </CardContent>
          </>
        );

      case 3:
        return (
          <>
            <CardHeader>
              <CardTitle>{t('onboarding.step5')}</CardTitle>
              <CardDescription>Ready to start tracking your expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>{t('onboarding.province')}:</strong> {province}</p>
                <p><strong>{t('onboarding.workType')}:</strong> {workTypes.join(', ')}</p>
                {hasClients && (
                  <p><strong>{t('onboarding.hasClients')}:</strong> {clients.filter(c => c.trim()).length}</p>
                )}
              </div>
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        {renderStep()}
        
        <div className="flex justify-between p-6 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('onboarding.back')}
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="ml-auto">
              {t('onboarding.next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading} className="ml-auto">
              <Check className="mr-2 h-4 w-4" />
              {loading ? t('common.loading') : t('onboarding.finish')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}