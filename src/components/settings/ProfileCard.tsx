import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useProfile, useUpdateProfile } from '@/hooks/data/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Save, Loader2 } from 'lucide-react';

export function ProfileCard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  useEffect(() => {
    setHasChanges(fullName !== (profile?.full_name ?? ''));
  }, [fullName, profile?.full_name]);

  const handleSave = () => {
    if (!hasChanges) return;
    updateProfile.mutate({ full_name: fullName });
  };

  const es = language === 'es';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">
              {es ? 'Mi Perfil' : 'My Profile'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {es ? 'Administra tu nombre y datos de usuario' : 'Manage your name and user details'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full-name">{es ? 'Nombre completo' : 'Full name'}</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={es ? 'Tu nombre completo' : 'Your full name'}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label>{es ? 'Correo electrónico' : 'Email'}</Label>
          <Input
            value={user?.email ?? ''}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">
            {es ? 'El correo no se puede cambiar desde aquí' : 'Email cannot be changed here'}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
          className="min-h-[44px]"
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {es ? 'Guardar' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
