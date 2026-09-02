import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Trash2, Loader2, Shield, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


// Las 61 tablas que guardan datos de la persona (todas las que tienen columna `user_id`).
// Es la misma lista que borra la funcion `delete-my-account`: si se agrega una tabla nueva con
// datos de usuario, va en las dos.
const TABLAS_DE_LA_PERSONA = [
  'audit_log',
  'feature_usage_logs',
  'bank_import_sessions',
  'beta_bug_reports',
  'beta_feedback',
  'beta_goal_completions',
  'beta_reward_redemptions',
  'beta_tester_points',
  'beta_referral_codes',
  'bill_payments',
  'budget_rollovers',
  'budget_alert_rules',
  'savings_contributions',
  'financial_focus_sessions',
  'financial_worry_entries',
  'mission_control_history',
  'ecosystem_leaderboard',
  'ecosystem_notifications',
  'ecosystem_streaks',
  'notification_preferences',
  'tax_knowledge_assessment',
  'user_library_favorites',
  'user_life_profile',
  'education_daily_logs',
  'education_practice_logs',
  'financial_habit_logs',
  'financial_habits',
  'financial_journal',
  'financial_education',
  'user_achievements',
  'user_financial_level',
  'user_financial_profile',
  'pay_yourself_first_settings',
  'notifications',
  'net_worth_snapshots',
  'export_logs',
  'ai_usage_logs',
  'usage_tracking',
  'bank_transactions',
  'documents',
  'expenses',
  'income',
  'mileage',
  'contracts',
  'projects',
  'clients',
  'assets',
  'liabilities',
  'savings_goals',
  'investment_goals',
  'category_budgets',
  'tags',
  'settings',
  'user_roles',
  'scan_sessions',
  'user_addresses',
  'decoded_codes',
  'cross_border_transfers',
  'recurring_bills',
  'fiscal_entities',
  'user_subscriptions',
] as const;

export function DataPrivacyCard() {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const CONFIRM_WORD = language === 'es' ? 'ELIMINAR' : 'DELETE';

  const handleExportData = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      // 1-sep-2026: la exportacion entregaba 12 tablas de las 61 que guardan datos de la
      // persona. Ahora recorre las 61 (la misma lista que borra `delete-my-account`) y deja
      // constancia de las que no se pudieron leer, en vez de callarlas.
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const tablas: Record<string, unknown[]> = {};
      const sinLeer: string[] = [];

      await Promise.all(
        TABLAS_DE_LA_PERSONA.map(async (tabla) => {
          const { data, error } = await supabase
            .from(tabla as any)
            .select('*')
            .eq('user_id', user.id);
          if (error) {
            sinLeer.push(tabla);
            return;
          }
          tablas[tabla] = (data as unknown[]) ?? [];
        }),
      );

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
        ...tablas,
        ...(sinLeer.length > 0 ? { _tablasQueNoSePudieronLeer: sinLeer.sort() } : {}),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evofinz-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        language === 'es' 
          ? '¡Datos exportados exitosamente!' 
          : 'Data exported successfully!'
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        language === 'es' 
          ? 'Error al exportar datos' 
          : 'Error exporting data'
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== CONFIRM_WORD) return;
    
    setDeleting(true);
    try {
      // 1-sep-2026: el borrado ya no se hace desde aqui. Vivia en el navegador, recorria 37
      // tablas de las 61 que guardan datos de la persona, tres de esas 37 fallaban por columna
      // inexistente, cada fallo caia en un `catch {}` vacio, y el usuario de autenticacion nunca
      // se borraba. Ahora lo hace la funcion `delete-my-account` con la llave de servicio, y si
      // algo queda sin borrar responde con error en vez de felicitar a nadie.
      const { data, error } = await supabase.functions.invoke('delete-my-account');
      if (error || !data?.ok) {
        throw new Error(data?.message || error?.message || 'delete failed');
      }

      // El usuario de autenticacion ya no existe, asi que cerrar sesion puede fallar; que falle
      // no significa que el borrado no se hiciera.
      try {
        await signOut();
      } catch {
        // sin ruido: la cuenta ya esta eliminada
      }

      toast.success(
        language === 'es' 
          ? 'Cuenta eliminada. Adiós y buena suerte.' 
          : 'Account deleted. Goodbye and good luck.'
      );
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(
        language === 'es' 
          ? 'Error al eliminar cuenta. Contacta soporte.' 
          : 'Error deleting account. Contact support.'
      );
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>
                {language === 'es' ? 'Privacidad y Datos' : 'Privacy & Data'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Exporta tus datos o elimina tu cuenta (GDPR/PIPEDA)' 
                  : 'Export your data or delete your account (GDPR/PIPEDA)'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <h4 className="font-medium">
                {language === 'es' ? 'Exportar mis datos' : 'Export my data'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === 'es' 
                  ? 'Descarga todos tus datos en formato JSON' 
                  : 'Download all your data in JSON format'}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {language === 'es' ? 'Exportar' : 'Export'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <h4 className="font-medium text-destructive">
                {language === 'es' ? 'Eliminar mi cuenta' : 'Delete my account'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === 'es' 
                  ? 'Elimina permanentemente tu cuenta y todos tus datos' 
                  : 'Permanently delete your account and all your data'}
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {language === 'es' ? 'Eliminar' : 'Delete'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {language === 'es' ? '¿Eliminar cuenta permanentemente?' : 'Delete account permanently?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {language === 'es' 
                    ? 'Esta acción es irreversible. Se eliminarán permanentemente:' 
                    : 'This action is irreversible. The following will be permanently deleted:'}
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>{language === 'es' ? 'Todos tus gastos e ingresos' : 'All your expenses and income'}</li>
                  <li>{language === 'es' ? 'Clientes, proyectos y contratos' : 'Clients, projects and contracts'}</li>
                  <li>{language === 'es' ? 'Kilometraje y documentos' : 'Mileage and documents'}</li>
                  <li>{language === 'es' ? 'Metas de ahorro e inversión' : 'Savings and investment goals'}</li>
                  <li>{language === 'es' ? 'Tu perfil y configuración' : 'Your profile and settings'}</li>
                </ul>
                <div className="pt-3">
                  <Label className="text-sm font-medium">
                    {language === 'es' 
                      ? `Escribe "${CONFIRM_WORD}" para confirmar:` 
                      : `Type "${CONFIRM_WORD}" to confirm:`}
                  </Label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder={CONFIRM_WORD}
                    className="mt-2"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmText !== CONFIRM_WORD || deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {language === 'es' ? 'Eliminar permanentemente' : 'Delete permanently'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
