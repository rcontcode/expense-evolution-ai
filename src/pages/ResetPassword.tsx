import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
        setChecking(false);
      }
    });

    // Also check if user already has a session (recovery link already processed)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check URL hash for recovery type indicator
        const hash = window.location.hash;
        const isRecovery = hash.includes('type=recovery') || hash.includes('type=magiclink');
        if (isRecovery) {
          setIsRecoverySession(true);
        } else {
          // User has a session but this isn't a recovery flow — allow them to set password anyway
          // This handles the case where the recovery event already fired
          setIsRecoverySession(true);
        }
      }
      setChecking(false);
    };

    // Small delay to let onAuthStateChange fire first
    const timer = setTimeout(checkSession, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(
        language === 'es'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        language === 'es'
          ? 'Las contraseñas no coinciden'
          : 'Passwords do not match'
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      toast.success(
        language === 'es'
          ? '¡Contraseña actualizada exitosamente!'
          : 'Password updated successfully!'
      );

      // Redirect to dashboard after a short delay
      setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(
        language === 'es'
          ? 'Error al actualizar la contraseña. Intenta de nuevo.'
          : 'Error updating password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRecoverySession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              {language === 'es'
                ? 'Enlace inválido o expirado'
                : 'Invalid or expired link'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'es'
                ? 'Este enlace de restablecimiento ya no es válido. Solicita uno nuevo desde la página de inicio de sesión.'
                : 'This reset link is no longer valid. Request a new one from the login page.'}
            </p>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              {language === 'es' ? 'Ir al inicio de sesión' : 'Go to login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              {language === 'es'
                ? '¡Contraseña actualizada!'
                : 'Password updated!'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'es'
                ? 'Redirigiendo al dashboard...'
                : 'Redirecting to dashboard...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-6">
            <PhoenixLogo className="h-12 w-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-foreground">
              {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'es'
                ? 'Ingresa tu nueva contraseña para tu cuenta'
                : 'Enter your new password for your account'}
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Nueva contraseña' : 'New password'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">
                {language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'es' ? 'Actualizar Contraseña' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
