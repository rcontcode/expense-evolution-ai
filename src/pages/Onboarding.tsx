import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { SampleDataOfferStep } from '@/components/guidance/SampleDataOfferStep';
import { PhoenixLogo, PhoenixState } from '@/components/ui/phoenix-logo';

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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Get user's first name for personalized greeting
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  // Phoenix state evolves with onboarding progress
  const phoenixState: PhoenixState = useMemo(() => {
    if (step <= 2) return 'flames'; // Crisis/organizing phase
    if (step === 3) return 'smoke'; // Transition/review phase
    return 'rebirth'; // Ready to begin!
  }, [step]);
  
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

  const saveProfileData = async () => {
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
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToSampleDataStep = async () => {
    const success = await saveProfileData();
    if (success) {
      setStep(4); // Go to sample data step
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
              <CardDescription>
                {language === 'es' 
                  ? 'Revisa tu configuración antes de continuar' 
                  : 'Review your setup before continuing'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>{t('onboarding.province')}:</strong> {province || (language === 'es' ? 'No seleccionada' : 'Not selected')}</p>
                <p><strong>{t('onboarding.workType')}:</strong> {workTypes.length > 0 ? workTypes.join(', ') : (language === 'es' ? 'Ninguno' : 'None')}</p>
                {hasClients && (
                  <p><strong>{t('onboarding.hasClients')}:</strong> {clients.filter(c => c.trim()).length}</p>
                )}
              </div>
            </CardContent>
          </>
        );

      case 4:
        return (
          <>
            <CardHeader>
              <CardTitle>
                {language === 'es' ? '¡Último paso!' : 'Last step!'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Decide cómo quieres comenzar tu experiencia' 
                  : 'Decide how you want to start your experience'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SampleDataOfferStep
                userName={firstName}
                onComplete={() => navigate('/dashboard')}
                onSkip={() => navigate('/dashboard')}
              />
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-hero p-4 gap-6">
      {/* Phoenix Logo - Evolves with onboarding progress */}
      <div className="flex flex-col items-center gap-4">
        <PhoenixLogo variant="sidebar" state={phoenixState} />
        
        {/* Stage indicator text */}
        <div className="text-center text-white/80 text-sm">
          {step <= 2 && (language === 'es' ? '🔥 Organizando tu mundo financiero...' : '🔥 Organizing your financial world...')}
          {step === 3 && (language === 'es' ? '💨 Casi listo, revisemos...' : '💨 Almost ready, let\'s review...')}
          {step >= 4 && (language === 'es' ? '✨ ¡Listo para renacer!' : '✨ Ready to be reborn!')}
        </div>
      </div>

      {/* Personalized Welcome */}
      <div className="text-center space-y-2 max-w-2xl">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="h-6 w-6" />
          <span className="text-sm font-medium uppercase tracking-wider">
            {language === 'es' ? 'Bienvenida' : 'Welcome'}
          </span>
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-white">
          {language === 'es' 
            ? `¡Hola${firstName ? `, ${firstName}` : ''}! 👋`
            : `Hello${firstName ? `, ${firstName}` : ''}! 👋`
          }
        </h1>
        <p className="text-white/80">
          {language === 'es'
            ? 'Vamos a configurar tu perfil para optimizar tu gestión financiera'
            : "Let's set up your profile to optimize your financial management"
          }
        </p>
      </div>

      {/* Mentor Quote Banner */}
      <MentorQuoteBanner className="w-full max-w-2xl" />

      <Card className="w-full max-w-2xl shadow-xl">
        {renderStep()}
        
        {/* Navigation - only show for steps 1-3 */}
        {step < 4 && (
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
              <Button onClick={handleProceedToSampleDataStep} disabled={loading} className="ml-auto">
                <Check className="mr-2 h-4 w-4" />
                {loading ? t('common.loading') : t('onboarding.finish')}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
