import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile, useUpdateProfile } from '@/hooks/data/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Briefcase,
  Receipt,
  Hash,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { formatBusinessNumber, validateBusinessNumber } from '@/lib/validations/business-number';
import { validateRut, formatRut } from '@/lib/validations/rut';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCountryConfig, getAvailableCountries, CHILE_TAX_REGIMES, type CountryCode } from '@/lib/constants/country-tax-config';

type WorkType = Database['public']['Enums']['work_type'];

const FISCAL_YEAR_ENDS = [
  'January 31', 'February 28', 'March 31', 'April 30', 'May 31', 'June 30',
  'July 31', 'August 31', 'September 30', 'October 31', 'November 30', 'December 31'
];

// Work type mapping for Canada (database enum values)
const CANADA_WORK_TYPES: { value: WorkType; labelKey: string; descriptionKey: string; icon: string }[] = [
  { value: 'employee', labelKey: 'employee', descriptionKey: 'employeeDesc', icon: '👤' },
  { value: 'contractor', labelKey: 'contractor', descriptionKey: 'contractorDesc', icon: '🔧' },
  { value: 'corporation', labelKey: 'corporation', descriptionKey: 'corporationDesc', icon: '🏢' },
];

export default function BusinessProfile() {
  const { t, language } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Form state
  const [country, setCountry] = useState<CountryCode>('CA');
  const [fullName, setFullName] = useState('');
  const [province, setProvince] = useState<string>('');
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessNumberError, setBusinessNumberError] = useState<string | null>(null);
  const [gstHstRegistered, setGstHstRegistered] = useState(false);
  const [businessStartDate, setBusinessStartDate] = useState('');
  const [fiscalYearEnd, setFiscalYearEnd] = useState('December 31');
  // Chile-specific
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState<string | null>(null);
  const [taxRegime, setTaxRegime] = useState('general');

  const countryConfig = getCountryConfig(country);
  const availableCountries = getAvailableCountries();

  useEffect(() => {
    if (profile) {
      setCountry((profile.country as CountryCode) || 'CA');
      setFullName(profile.full_name || '');
      setProvince(profile.province || '');
      setWorkTypes(profile.work_types || []);
      setBusinessName(profile.business_name || '');
      setBusinessNumber(profile.business_number || '');
      setGstHstRegistered(profile.gst_hst_registered || false);
      setBusinessStartDate(profile.business_start_date || '');
      setFiscalYearEnd(profile.fiscal_year_end || 'December 31');
      // Chile-specific
      setRut(profile.rut || '');
      setTaxRegime(profile.tax_regime || 'general');
    }
  }, [profile]);

  // Reset province when country changes (only on user action, not on initial load)
  const handleCountryChange = (newCountry: CountryCode) => {
    if (newCountry !== country) {
      setCountry(newCountry);
      setProvince('');
      setBusinessNumber('');
      setRut('');
      setBusinessNumberError(null);
      setRutError(null);
    }
  };

  const handleBusinessNumberChange = (value: string) => {
    if (country === 'CA') {
      const formatted = formatBusinessNumber(value);
      setBusinessNumber(formatted);
      
      const validation = validateBusinessNumber(formatted);
      if (!validation.valid && validation.error) {
        setBusinessNumberError(t(`businessProfile.${validation.error}`));
      } else {
        setBusinessNumberError(null);
      }
    }
  };

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value);
    setRut(formatted);
    
    if (formatted && !validateRut(formatted)) {
      setRutError(language === 'es' ? 'RUT inválido' : 'Invalid RUT');
    } else {
      setRutError(null);
    }
  };

  const handleWorkTypeToggle = (type: WorkType) => {
    setWorkTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSaveProfile = () => {
    // Validate based on country
    if (country === 'CA' && businessNumber) {
      const validation = validateBusinessNumber(businessNumber);
      if (!validation.valid) {
        toast.error(t('businessProfile.fixErrors'));
        return;
      }
    }
    
    if (country === 'CL' && rut && !validateRut(rut)) {
      toast.error(language === 'es' ? 'Por favor corrige el RUT' : 'Please fix the RUT');
      return;
    }

    updateProfile.mutate({
      full_name: fullName,
      province: province || null,
      work_types: workTypes,
      business_name: businessName || null,
      business_number: country === 'CA' ? (businessNumber || null) : null,
      gst_hst_registered: country === 'CA' ? gstHstRegistered : false,
      business_start_date: businessStartDate || null,
      fiscal_year_end: fiscalYearEnd || null,
      country: country,
      rut: country === 'CL' ? (rut || null) : null,
      tax_regime: country === 'CL' ? taxRegime : null,
    });
  };

  const isBusinessUser = workTypes.includes('contractor') || workTypes.includes('corporation');
  const selectedRegion = countryConfig.regions.find(r => r.name === province || r.code === province);
  
  // Calculate profile completeness
  const getCompleteness = () => {
    let total = 4; // fullName, country, province, workTypes
    let filled = 0;
    
    if (fullName) filled++;
    if (country) filled++;
    if (province) filled++;
    if (workTypes.length > 0) filled++;
    
    if (isBusinessUser) {
      total += 3; // businessName, businessStartDate, fiscalYearEnd
      if (businessName) filled++;
      if (businessStartDate) filled++;
      if (fiscalYearEnd) filled++;
      
      // Country-specific fields
      if (country === 'CL') {
        total += 1; // RUT
        if (rut) filled++;
      }
    }
    
    return Math.round((filled / total) * 100);
  };

  const completeness = getCompleteness();

  if (profileLoading) {
    return (
      <Layout>
        <div className="p-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title={t('businessProfile.title')}
          description={t('businessProfile.description')}
        >
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{t('businessProfile.completeness')}</div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="font-semibold text-primary">{completeness}%</span>
            </div>
          </div>
        </PageHeader>

        {/* Country Selection Section */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{language === 'es' ? 'País' : 'Country'}</CardTitle>
            </div>
            <CardDescription>
              {language === 'es' 
                ? 'Selecciona tu país para ver las reglas fiscales correspondientes' 
                : 'Select your country to see the corresponding tax rules'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={country} onValueChange={(v) => handleCountryChange(v as CountryCode)}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center gap-2">
                      <span>{c.code === 'CA' ? '🇨🇦' : '🇨🇱'}</span>
                      <span>{language === 'es' ? c.name.es : c.name.en}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline">
                {countryConfig.taxAuthority.name}
              </Badge>
              <Badge variant="secondary">
                {countryConfig.currency}
              </Badge>
              {country === 'CL' && (
                <Badge variant="default">
                  IVA 19%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{t('businessProfile.personalInfo')}</CardTitle>
            </div>
            <CardDescription>{t('businessProfile.personalInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('settings.fullName')}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('settings.fullNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email')}</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label>{country === 'CA' ? t('settings.province') : (language === 'es' ? 'Región' : 'Region')}</Label>
              </div>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue placeholder={country === 'CA' ? t('settings.provincePlaceholder') : (language === 'es' ? 'Selecciona una región' : 'Select a region')} />
                </SelectTrigger>
                <SelectContent>
                  {countryConfig.regions.map(region => (
                    <SelectItem key={region.code} value={region.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{region.name}</span>
                        {country === 'CA' && region.taxRate !== undefined && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {((region.taxRate || 0) * 100 + 5).toFixed(0)}% HST/GST
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRegion && country === 'CA' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  {t('businessProfile.provinceHstNote').replace('{rate}', String(((selectedRegion.taxRate || 0) * 100 + 5).toFixed(1)))}
                </p>
              )}
              {country === 'CL' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  {language === 'es' ? 'IVA 19% aplicable a todo Chile' : '19% VAT applies across all of Chile'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Type Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>{t('businessProfile.workType')}</CardTitle>
            </div>
            <CardDescription>{t('businessProfile.workTypeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {CANADA_WORK_TYPES.map(({ value, labelKey, descriptionKey, icon }) => (
                <div 
                  key={value} 
                  className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    workTypes.includes(value) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleWorkTypeToggle(value)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <Checkbox
                      checked={workTypes.includes(value)}
                      onCheckedChange={() => handleWorkTypeToggle(value)}
                    />
                  </div>
                  <Label className="cursor-pointer font-semibold">
                    {t(`settings.${labelKey}`)}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(`settings.${descriptionKey}`)}
                  </p>
                </div>
              ))}
            </div>
            
            {workTypes.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('businessProfile.selectWorkType')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Business Information Section - Only for contractors/corporations */}
        {isBusinessUser && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>{t('businessProfile.businessInfo')}</CardTitle>
              </div>
              <CardDescription>{t('businessProfile.businessInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {t('businessProfile.businessIdentity')}
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{t('settings.businessName')}</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={t('settings.businessNamePlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">{t('settings.businessNameHelp')}</p>
                  </div>
                  
                  {/* Canada: Business Number */}
                  {country === 'CA' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="businessNumber">{t('settings.businessNumber')}</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{t('businessProfile.businessNumberTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="businessNumber"
                          value={businessNumber}
                          onChange={(e) => handleBusinessNumberChange(e.target.value)}
                          placeholder="123456789 RT0001"
                          className={`pl-9 ${businessNumberError ? 'border-destructive' : ''}`}
                          maxLength={16}
                        />
                      </div>
                      {businessNumberError ? (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {businessNumberError}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('settings.businessNumberHelp')}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Chile: RUT */}
                  {country === 'CL' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="rut">RUT</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{language === 'es' ? 'Rol Único Tributario - Identificador fiscal chileno' : 'Chilean Tax ID Number'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="rut"
                          value={rut}
                          onChange={(e) => handleRutChange(e.target.value)}
                          placeholder="12.345.678-9"
                          className={`pl-9 ${rutError ? 'border-destructive' : ''}`}
                          maxLength={12}
                        />
                      </div>
                      {rutError ? (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {rutError}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {language === 'es' ? 'Formato: XX.XXX.XXX-X' : 'Format: XX.XXX.XXX-X'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Tax Registration - Country specific */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  {t('businessProfile.taxRegistration')}
                </div>

                {/* Canada: GST/HST Registration */}
                {country === 'CA' && (
                  <>
                    <div 
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        gstHstRegistered ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setGstHstRegistered(!gstHstRegistered)}
                    >
                      <Checkbox
                        id="gstHstRegistered"
                        checked={gstHstRegistered}
                        onCheckedChange={(checked) => setGstHstRegistered(!!checked)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="gstHstRegistered" className="cursor-pointer font-medium">
                            {t('settings.gstHstRegistered')}
                          </Label>
                          {gstHstRegistered && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t('businessProfile.registered')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('settings.gstHstRegisteredHelp')}
                        </p>
                      </div>
                    </div>

                    {gstHstRegistered && (
                      <Alert className="bg-primary/5 border-primary/20">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-sm">
                          {t('businessProfile.gstHstBenefits')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {/* Chile: Tax Regime */}
                {country === 'CL' && (
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Régimen Tributario' : 'Tax Regime'}</Label>
                    <Select value={taxRegime} onValueChange={setTaxRegime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHILE_TAX_REGIMES.map(regime => (
                          <SelectItem key={regime.value} value={regime.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{language === 'es' ? regime.label.es : regime.label.en}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {(regime.rate * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {language === 'es' 
                        ? 'El régimen Pro PyME ofrece tasa reducida del 25% para pequeñas empresas'
                        : 'Pro SME regime offers reduced 25% rate for small businesses'}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Fiscal Year */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t('businessProfile.fiscalPeriod')}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessStartDate">{t('settings.businessStartDate')}</Label>
                    <Input
                      id="businessStartDate"
                      type="date"
                      value={businessStartDate}
                      onChange={(e) => setBusinessStartDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t('settings.businessStartDateHelp')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.fiscalYearEnd')}</Label>
                    <Select value={fiscalYearEnd} onValueChange={setFiscalYearEnd}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FISCAL_YEAR_ENDS.map(date => (
                          <SelectItem key={date} value={date}>{date}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t('settings.fiscalYearEndHelp')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveProfile} 
            disabled={updateProfile.isPending || !!businessNumberError || !!rutError}
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {t('businessProfile.saveProfile')}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
