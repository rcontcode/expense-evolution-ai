import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { ChevronRight, ChevronLeft, Check, Sparkles, FileText, MessageCircle } from 'lucide-react';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { SampleDataOfferStep } from '@/components/guidance/SampleDataOfferStep';
import { PhoenixLogo, PhoenixState } from '@/components/ui/phoenix-logo';
import { ConversationalOnboarding } from '@/components/onboarding/ConversationalOnboarding';
import { getCountryConfig, getAvailableCountries, CountryCode, WorkTypeOption } from '@/lib/constants/country-tax-config';

// Work type enum values that match the database
type WorkTypeEnum = 'employee' | 'contractor' | 'corporation';

// Map work type values to DB enum values
const mapWorkTypesToEnum = (
  workTypes: string[], 
  country: CountryCode
): WorkTypeEnum[] => {
  const config = getCountryConfig(country);
  
  return workTypes.map(type => {
    const found = config.workTypes.find(wt => wt.value === type);
    return found?.enumValue || 'contractor';
  }).filter(Boolean) as WorkTypeEnum[];
};

export default function Onboarding() {
  const [mode, setMode] = useState<'select' | 'traditional' | 'conversational'>('select');
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<CountryCode>('CA');
  const [province, setProvince] = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [hasClients, setHasClients] = useState(false);
  const [clients, setClients] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Get country config for dynamic regions and work types
  const countryConfig = useMemo(() => getCountryConfig(country), [country]);
  const availableCountries = useMemo(() => getAvailableCountries(), []);

  // Get user's first name for personalized greeting
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  // Phoenix state evolves with onboarding progress
  const phoenixState: PhoenixState = useMemo(() => {
    if (step <= 2) return 'flames'; // Crisis/organizing phase
    if (step === 3) return 'smoke'; // Transition/review phase
    return 'rebirth'; // Ready to begin!
  }, [step]);
  
  const handleWorkTypeToggle = (typeValue: string) => {
    setWorkTypes(prev =>
      prev.includes(typeValue) ? prev.filter(t => t !== typeValue) : [...prev, typeValue]
    );
  };
  
  // Reset province and work types when country changes
  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    setProvince(''); // Reset province when country changes
    setWorkTypes([]); // Reset work types when country changes
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
      // Map work types to DB enum values
      const mappedWorkTypes = mapWorkTypesToEnum(workTypes, country);
      
      // Update profile with country, province, work_types, and display_currency
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          country,
          province,
          work_types: mappedWorkTypes,
          display_currency: countryConfig.currency,
          onboarding_completed: true,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Create primary fiscal entity
      const entityName = language === 'es' ? 'Mi Entidad Principal' : 'My Primary Entity';
      
      // Check if primary entity already exists
      const { data: existingEntity } = await supabase
        .from('fiscal_entities')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_primary', true)
        .single();
      
      const entityData = {
        country,
        province,
        default_currency: countryConfig.currency,
      };
      
      if (!existingEntity) {
        // Create new primary fiscal entity
        await supabase.from('fiscal_entities').insert({
          user_id: user?.id,
          name: entityName,
          entity_type: 'personal',
          is_primary: true,
          is_active: true,
          ...entityData,
        });
      } else {
        // Update existing primary entity
        await supabase.from('fiscal_entities')
          .update(entityData)
          .eq('id', existingEntity.id);
      }

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
                country, // Associate client with same country
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
              <CardTitle>{language === 'es' ? 'Configuración Fiscal' : 'Tax Setup'}</CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Selecciona tu país, provincia y tipo de trabajo'
                  : 'Select your country, province and work type'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  🌎 {language === 'es' ? 'País' : 'Country'}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableCountries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleCountryChange(c.code)}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        country === c.code 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img 
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={c.code}
                        className="w-8 h-6 object-cover rounded"
                      />
                      <span className="font-medium">
                        {language === 'es' ? c.name.es : c.name.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Province/Region Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  📍 {language === 'es' ? 'Provincia / Región' : 'Province / Region'}
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger className={!province ? 'border-destructive/50' : ''}>
                    <SelectValue placeholder={language === 'es' ? 'Selecciona...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {countryConfig.regions.map(region => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!province && (
                  <p className="text-xs text-destructive">
                    {language === 'es' ? 'Por favor selecciona una provincia/región' : 'Please select a province/region'}
                  </p>
                )}
              </div>

              {/* Work Type Selection - Dynamic based on country */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  💼 {language === 'es' ? 'Tipo de Trabajo' : 'Work Type'}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === 'es' 
                    ? 'Puedes seleccionar múltiples opciones'
                    : 'You can select multiple options'
                  }
                </p>
                <div className={`space-y-2 ${workTypes.length === 0 ? 'border border-destructive/30 rounded-lg p-2' : ''}`}>
                  {countryConfig.workTypes.map(workType => (
                    <div key={workType.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={workType.value}
                        checked={workTypes.includes(workType.value)}
                        onCheckedChange={() => handleWorkTypeToggle(workType.value)}
                      />
                      <label htmlFor={workType.value} className="text-sm cursor-pointer flex flex-col">
                        <span className="font-medium">
                          {language === 'es' ? workType.label.es : workType.label.en}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {language === 'es' ? workType.description.es : workType.description.en}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                {workTypes.length === 0 && (
                  <p className="text-xs text-destructive">
                    {language === 'es' ? 'Por favor selecciona al menos un tipo de trabajo' : 'Please select at least one work type'}
                  </p>
                )}
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
        // Get display names for work types
        const selectedWorkTypeLabels = workTypes.map(wt => {
          const found = countryConfig.workTypes.find(w => w.value === wt);
          return found ? (language === 'es' ? found.label.es : found.label.en) : wt;
        });
        
        // Get province/region display name
        const selectedRegion = countryConfig.regions.find(r => r.code === province);
        const regionDisplay = selectedRegion?.name || province;
        
        // Get country display name
        const countryDisplay = language === 'es' ? countryConfig.name.es : countryConfig.name.en;
        
        return (
          <>
            <CardHeader>
              <CardTitle>{language === 'es' ? 'Revisión' : 'Review'}</CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Revisa tu configuración antes de continuar' 
                  : 'Review your setup before continuing'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <img 
                    src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
                    alt={country}
                    className="w-6 h-4 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{countryDisplay}</p>
                    <p className="text-xs text-muted-foreground">{regionDisplay}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">💼 {language === 'es' ? 'Tipo de Trabajo' : 'Work Type'}</p>
                  <p className="text-muted-foreground">
                    {selectedWorkTypeLabels.length > 0 
                      ? selectedWorkTypeLabels.join(', ') 
                      : (language === 'es' ? 'No seleccionado' : 'Not selected')
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">💰 {language === 'es' ? 'Moneda' : 'Currency'}</p>
                  <p className="text-muted-foreground">{countryConfig.currency}</p>
                </div>
                
                {hasClients && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">👥 {language === 'es' ? 'Clientes' : 'Clients'}</p>
                    <p className="text-muted-foreground">{clients.filter(c => c.trim()).length}</p>
                  </div>
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

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-hero p-4 gap-6">
        <div className="flex flex-col items-center gap-4">
          <PhoenixLogo variant="sidebar" state="flames" />
        </div>

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
              ? '¿Cómo prefieres configurar tu perfil?'
              : 'How would you like to set up your profile?'
            }
          </p>
        </div>

        <MentorQuoteBanner className="w-full max-w-2xl" />

        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle>
              {language === 'es' ? 'Elige tu experiencia' : 'Choose your experience'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Ambas opciones te llevan al mismo resultado'
                : 'Both options lead to the same result'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('traditional')}
              className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left space-y-3"
            >
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">
                  {language === 'es' ? 'Formulario rápido' : 'Quick form'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? '~2 minutos • Preguntas directas'
                    : '~2 minutes • Direct questions'
                  }
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('conversational')}
              className="p-6 rounded-lg border-2 border-primary bg-primary/10 hover:bg-primary/15 transition-all text-left space-y-3"
            >
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">
                  {language === 'es' ? 'Conversar con Phoenix' : 'Chat with Phoenix'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' 
                    ? '~5 minutos • Más personalizado'
                    : '~5 minutes • More personalized'
                  }
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                {language === 'es' ? 'Recomendado' : 'Recommended'}
              </span>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Conversational mode
  if (mode === 'conversational') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-hero p-4 gap-6">
        <ConversationalOnboarding 
          onComplete={() => navigate('/dashboard')}
          onBack={() => setMode('select')}
        />
      </div>
    );
  }

  // Traditional form mode
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
            {step === 1 ? (
              <Button variant="outline" onClick={() => setMode('select')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t('onboarding.back')}
              </Button>
            ) : step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t('onboarding.back')}
              </Button>
            ) : null}
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                disabled={step === 1 && (!province || workTypes.length === 0)}
                className="ml-auto"
              >
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
