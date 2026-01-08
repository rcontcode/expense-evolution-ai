import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Sparkles, Receipt, TrendingUp, ChevronDown, Gift, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import evofinzLogo from '@/assets/evofinz-logo.png';
import { 
  emailSchema, 
  passwordSchema, 
  fullNameSchema, 
  getAuthErrorMessage 
} from '@/lib/validations/auth.schema';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Validation error states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Rate limiting
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  
  // Beta code states
  const [showBetaSection, setShowBetaSection] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { signIn, signUp, user } = useAuth();

  // Cooldown timer
  useEffect(() => {
    if (cooldownUntil) {
      const interval = setInterval(() => {
        if (Date.now() >= cooldownUntil) {
          setCooldownUntil(null);
          setFailedAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownUntil]);

  // Calculate remaining cooldown seconds
  const cooldownSeconds = useMemo(() => {
    if (!cooldownUntil) return 0;
    return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }, [cooldownUntil]);

  // Pre-fill beta code from URL
  useEffect(() => {
    const urlBetaCode = searchParams.get('beta');
    if (urlBetaCode) {
      setBetaCode(urlBetaCode.toUpperCase());
      setShowBetaSection(true);
      setIsLogin(false); // Switch to signup mode
      validateBetaCode(urlBetaCode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Real-time email validation
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError(null);
      return;
    }
    const result = emailSchema.safeParse(value);
    setEmailError(result.success ? null : result.error.errors[0]?.message || 'Email inválido');
  };

  // Real-time password validation
  const validatePassword = (value: string) => {
    if (!value || isLogin) {
      setPasswordError(null);
      return;
    }
    const result = passwordSchema.safeParse(value);
    setPasswordError(result.success ? null : result.error.errors[0]?.message || 'Contraseña inválida');
  };

  // Real-time name validation
  const validateName = (value: string) => {
    if (!value || isLogin) {
      setNameError(null);
      return;
    }
    const result = fullNameSchema.safeParse(value);
    setNameError(result.success ? null : result.error.errors[0]?.message || 'Nombre inválido');
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Debounce validation
    const timeoutId = setTimeout(() => validateEmail(value), 300);
    return () => clearTimeout(timeoutId);
  };

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
  };

  // Handle name change with validation
  const handleNameChange = (value: string) => {
    setFullName(value);
    validateName(value);
  };

  const validateBetaCode = async (code: string) => {
    if (!code.trim()) {
      setCodeStatus('idle');
      return;
    }

    setCodeStatus('checking');
    
    try {
      const { data, error } = await supabase.rpc('validate_beta_invitation_code', {
        p_code: code.trim()
      });

      if (error) {
        setCodeStatus('invalid');
        return;
      }

      const result = data as { valid: boolean; reason: string } | null;
      setCodeStatus(result?.valid ? 'valid' : 'invalid');
    } catch {
      setCodeStatus('invalid');
    }
  };

  const handleBetaCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setBetaCode(upperValue);
    
    // Debounce validation
    if (upperValue.length > 5) {
      const timeoutId = setTimeout(() => {
        validateBetaCode(upperValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setCodeStatus('idle');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        toast.error(getAuthErrorMessage(error.message));
      }
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error.message));
    }
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (cooldownUntil) return false;
    
    if (isForgotPassword) {
      return email.length > 0 && !emailError;
    }
    
    if (isLogin) {
      return email.length > 0 && password.length > 0 && !emailError;
    }
    
    // Signup
    return (
      email.length > 0 && 
      password.length >= 6 && 
      fullName.trim().length >= 2 &&
      !emailError && 
      !passwordError && 
      !nameError &&
      acceptedTerms
    );
  }, [email, password, fullName, emailError, passwordError, nameError, isLogin, isForgotPassword, cooldownUntil, acceptedTerms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check cooldown
    if (cooldownUntil && Date.now() < cooldownUntil) {
      toast.error(`Espera ${cooldownSeconds} segundos antes de intentar de nuevo`);
      return;
    }
    
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Validate email
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          setEmailError(emailResult.error.errors[0]?.message || 'Email inválido');
          setLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          toast.error(getAuthErrorMessage(error.message));
        } else {
          toast.success(t('auth.checkEmail'));
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          // Track failed attempts
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);
          
          // Apply cooldown after 3 failed attempts
          if (newAttempts >= 3) {
            const cooldownMs = Math.min(30000, newAttempts * 10000); // Max 30 seconds
            setCooldownUntil(Date.now() + cooldownMs);
            toast.error(`Demasiados intentos fallidos. Espera ${Math.ceil(cooldownMs / 1000)} segundos.`);
          } else {
            toast.error(getAuthErrorMessage(error.message));
          }
        } else {
          setFailedAttempts(0);
          toast.success(t('common.success'));
          navigate('/dashboard');
        }
      } else {
        // Signup - Validate all fields
        const nameResult = fullNameSchema.safeParse(fullName);
        if (!nameResult.success) {
          setNameError(nameResult.error.errors[0]?.message || 'Nombre inválido');
          toast.error('Por favor ingresa un nombre válido');
          setLoading(false);
          return;
        }

        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          setEmailError(emailResult.error.errors[0]?.message || 'Email inválido');
          toast.error('Por favor ingresa un email válido');
          setLoading(false);
          return;
        }

        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success) {
          setPasswordError(passwordResult.error.errors[0]?.message || 'Contraseña inválida');
          toast.error('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(getAuthErrorMessage(error.message));
        } else {
          // Check if beta code was provided and is valid
          if (betaCode.trim() && codeStatus === 'valid') {
            // Wait a moment for the user to be created
            const { data: { user: newUser } } = await supabase.auth.getUser();
            
            if (newUser) {
              // Use the beta code
              const { data: useResult, error: useError } = await supabase.rpc('use_beta_invitation_code', {
                p_code: betaCode.trim(),
                p_user_id: newUser.id
              });

              if (useError) {
                console.error('Error using beta code:', useError);
                toast.error('Error al activar código beta');
              } else {
                const result = useResult as { success: boolean; message?: string } | null;
                if (result?.success) {
                  toast.success('¡Acceso beta activado!');
                  navigate('/beta-welcome');
                  return;
                }
              }
            }
          }
          
          // Normal signup flow
          toast.success('¡Cuenta creada exitosamente!');
          navigate('/onboarding');
        }
      }
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, text: t('auth.smartCapture') },
    { icon: Receipt, text: t('auth.autoCategories') },
    { icon: TrendingUp, text: t('auth.craReports') },
  ];

  // Password strength indicator
  const passwordStrength = useMemo(() => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: t('auth.veryShort'), color: 'bg-red-500', width: '20%' };
    if (password.length < 8) return { label: t('auth.weak'), color: 'bg-orange-500', width: '40%' };
    if (password.length < 10) return { label: t('auth.acceptable'), color: 'bg-yellow-500', width: '60%' };
    if (password.length < 12) return { label: t('auth.good'), color: 'bg-green-500', width: '80%' };
    return { label: t('auth.excellent'), color: 'bg-green-600', width: '100%' };
  }, [password, t]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <img src={evofinzLogo} alt="EvoFinz" className="h-16 w-auto object-contain drop-shadow-lg" />
          </div>

          {/* Main headline */}
          <h2 className="text-5xl font-display font-bold leading-tight mb-6">
            {t('auth.yourFinances')}<br />
            <span className="text-white/90">{t('auth.simplified')}</span>
          </h2>
          
          <p className="text-xl text-white/80 mb-10 max-w-md">
            {t('auth.smartestWay')}
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 text-white/90"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src={evofinzLogo} alt="EvoFinz" className="h-14 w-auto object-contain" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold text-foreground">
              {isForgotPassword 
                ? t('auth.resetPassword') 
                : isLogin 
                  ? t('auth.welcomeBack') 
                  : t('auth.createAccount')}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isForgotPassword 
                ? t('auth.resetPasswordDescription')
                : isLogin 
                  ? t('auth.enterCredentials')
                  : t('auth.startManaging')}
            </p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              {/* Rate limit warning */}
              {cooldownUntil && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Espera {cooldownSeconds}s antes de intentar de nuevo</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && !isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium flex items-center justify-between">
                      {t('auth.fullName')}
                      {fullName && !nameError && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t('auth.fullNamePlaceholder')}
                      value={fullName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required={!isLogin}
                      className={`h-12 rounded-xl ${nameError ? 'border-red-500 focus-visible:ring-red-500' : fullName && !nameError ? 'border-green-500' : ''}`}
                    />
                    {nameError && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {nameError}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center justify-between">
                    {t('auth.email')}
                    {email && !emailError && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    className={`h-12 rounded-xl ${emailError ? 'border-red-500 focus-visible:ring-red-500' : email && !emailError ? 'border-green-500' : ''}`}
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center justify-between">
                      {t('auth.password')}
                      {!isLogin && password.length >= 6 && !passwordError && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      className={`h-12 rounded-xl ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : !isLogin && password.length >= 6 && !passwordError ? 'border-green-500' : ''}`}
                    />
                    {passwordError && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {passwordError}
                      </p>
                    )}
                    {/* Password strength indicator - only on signup */}
                    {!isLogin && !isForgotPassword && passwordStrength && (
                      <div className="space-y-1">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('auth.securityStrength')}: {passwordStrength.label}
                        </p>
                      </div>
                    )}
                    {!isLogin && !isForgotPassword && !password && (
                      <p className="text-xs text-muted-foreground">
                        {t('auth.minChars')}
                      </p>
                    )}
                  </div>
                )}

                {/* Beta Code Section - Only show on signup */}
                {!isLogin && !isForgotPassword && (
                  <Collapsible open={showBetaSection} onOpenChange={setShowBetaSection}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full justify-between text-muted-foreground hover:text-foreground"
                      >
                        <span className="flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          {t('auth.haveInviteCode')}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showBetaSection ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="relative">
                        <Input
                          placeholder="EVOFINZ-BETA-2025-XX"
                          value={betaCode}
                          onChange={(e) => handleBetaCodeChange(e.target.value)}
                          className={`h-12 rounded-xl text-center font-mono uppercase ${
                            codeStatus === 'valid' 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                              : codeStatus === 'invalid'
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                : ''
                          }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {codeStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          {codeStatus === 'valid' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {codeStatus === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
                        </div>
                      </div>
                      {codeStatus === 'valid' && (
                        <p className="text-green-600 text-xs mt-2 text-center">{t('auth.codeValid')}</p>
                      )}
                      {codeStatus === 'invalid' && (
                        <p className="text-red-600 text-xs mt-2 text-center">{t('auth.codeInvalid')}</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Terms & Conditions Checkbox - Only on signup */}
                {!isLogin && !isForgotPassword && (
                  <div className="flex items-start gap-3 py-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                      {language === 'es' ? (
                        <>
                          Acepto los{' '}
                          <Link to="/legal" className="text-primary hover:underline" target="_blank">
                            Términos de Uso
                          </Link>{' '}
                          y la{' '}
                          <Link to="/legal#privacy" className="text-primary hover:underline" target="_blank">
                            Política de Privacidad
                          </Link>
                        </>
                      ) : (
                        <>
                          I accept the{' '}
                          <Link to="/legal" className="text-primary hover:underline" target="_blank">
                            Terms of Use
                          </Link>{' '}
                          and{' '}
                          <Link to="/legal#privacy" className="text-primary hover:underline" target="_blank">
                            Privacy Policy
                          </Link>
                        </>
                      )}
                    </label>
                  </div>
                )}
                
                {isLogin && !isForgotPassword && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                <Button
                  type="submit" 
                  className="w-full h-12" 
                  variant="gradient"
                  disabled={loading || !isFormValid}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : cooldownUntil ? (
                    `Espera ${cooldownSeconds}s...`
                  ) : (
                    <>
                      {isForgotPassword 
                        ? t('auth.resetPassword') 
                        : isLogin 
                          ? t('auth.login') 
                          : codeStatus === 'valid'
                            ? t('auth.createAccountBeta')
                            : t('auth.createAccountBtn')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              
              {!isForgotPassword && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">
                        {t('auth.orContinueWith')}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t('auth.continueWithGoogle')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-sm">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="text-primary hover:underline font-medium"
              >
                ← {t('auth.backToLogin')}
              </button>
            ) : (
              <p className="text-muted-foreground">
                {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    // Reset errors when switching modes
                    setEmailError(null);
                    setPasswordError(null);
                    setNameError(null);
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  {isLogin ? t('auth.signupNow') : t('auth.loginNow')}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
