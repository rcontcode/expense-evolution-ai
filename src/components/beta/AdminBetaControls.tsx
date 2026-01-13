import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Plus,
  Minus,
  Ban,
  Shield,
  ChevronDown,
  ChevronUp,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BetaExpirationBadge } from './BetaExpirationBadge';

interface AdminBetaControlsProps {
  userId: string;
  userName: string;
  userEmail: string;
  expiresAt: string | null;
  isBetaTester: boolean;
}

export const AdminBetaControls = ({
  userId,
  userName,
  userEmail,
  expiresAt,
  isBetaTester,
}: AdminBetaControlsProps) => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [reason, setReason] = useState('');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    es: {
      manageAccess: 'Gestionar Acceso',
      extendAccess: 'Extender Acceso',
      daysToAdd: 'Días a agregar',
      reason: 'Razón (opcional)',
      reasonPlaceholder: 'Ej: Contribuciones excepcionales...',
      extend: 'Extender',
      revokeAccess: 'Revocar Acceso',
      revokeWarning: '¿Estás seguro de revocar el acceso beta?',
      revokeDescription: 'El usuario perderá acceso inmediatamente.',
      revokeReasonLabel: 'Razón de revocación',
      revokeReasonPlaceholder: 'Ej: Violación de términos...',
      cancel: 'Cancelar',
      confirmRevoke: 'Sí, Revocar',
      success: 'Acceso actualizado correctamente',
      error: 'Error al actualizar acceso',
      currentStatus: 'Estado actual',
      active: 'Activo',
      inactive: 'Inactivo',
    },
    en: {
      manageAccess: 'Manage Access',
      extendAccess: 'Extend Access',
      daysToAdd: 'Days to add',
      reason: 'Reason (optional)',
      reasonPlaceholder: 'Ex: Exceptional contributions...',
      extend: 'Extend',
      revokeAccess: 'Revoke Access',
      revokeWarning: 'Are you sure you want to revoke beta access?',
      revokeDescription: 'The user will lose access immediately.',
      revokeReasonLabel: 'Revocation reason',
      revokeReasonPlaceholder: 'Ex: Terms violation...',
      cancel: 'Cancel',
      confirmRevoke: 'Yes, Revoke',
      success: 'Access updated successfully',
      error: 'Error updating access',
      currentStatus: 'Current status',
      active: 'Active',
      inactive: 'Inactive',
    },
  };

  const text = t[language];

  const handleExtendAccess = async () => {
    if (daysToAdd <= 0) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('extend_beta_access', {
        p_user_id: userId,
        p_days: daysToAdd,
        p_reason: reason || null,
      });

      if (error) throw error;

      toast.success(text.success);
      queryClient.invalidateQueries({ queryKey: ['beta-user-stats'] });
      setReason('');
    } catch (error: any) {
      console.error('Error extending access:', error);
      toast.error(text.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('revoke_beta_access', {
        p_user_id: userId,
        p_reason: revokeReason || null,
      });

      if (error) throw error;

      toast.success(text.success);
      queryClient.invalidateQueries({ queryKey: ['beta-user-stats'] });
      setShowRevokeDialog(false);
      setRevokeReason('');
    } catch (error: any) {
      console.error('Error revoking access:', error);
      toast.error(text.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 w-full justify-between">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {text.manageAccess}
            </span>
            {isOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-lg border bg-muted/30 space-y-3"
          >
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{text.currentStatus}:</span>
              <div className="flex items-center gap-2">
                <Badge variant={isBetaTester ? 'default' : 'secondary'}>
                  {isBetaTester ? text.active : text.inactive}
                </Badge>
                {expiresAt && <BetaExpirationBadge expiresAt={expiresAt} />}
              </div>
            </div>

            {/* Extend Access */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Plus className="h-3 w-3 text-emerald-500" />
                {text.extendAccess}
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDaysToAdd(Math.max(1, daysToAdd - 30))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={daysToAdd}
                    onChange={(e) => setDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-8 text-center"
                    min={1}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDaysToAdd(daysToAdd + 30)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-1">{text.daysToAdd}</span>
                </div>
              </div>
              <Textarea
                placeholder={text.reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-16 text-sm resize-none"
              />
              <Button
                size="sm"
                onClick={handleExtendAccess}
                disabled={isLoading || daysToAdd <= 0}
                className="w-full gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Clock className="h-3 w-3" />
                {text.extend} +{daysToAdd} {language === 'es' ? 'días' : 'days'}
              </Button>
            </div>

            {/* Revoke Access */}
            {isBetaTester && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevokeDialog(true)}
                className="w-full gap-1"
              >
                <Ban className="h-3 w-3" />
                {text.revokeAccess}
              </Button>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {text.revokeWarning}
            </DialogTitle>
            <DialogDescription>
              {text.revokeDescription}
              <div className="mt-2 p-2 rounded bg-muted text-sm">
                <span className="font-medium">{userName}</span>
                <br />
                <span className="text-muted-foreground">{userEmail}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">{text.revokeReasonLabel}</label>
            <Textarea
              placeholder={text.revokeReasonPlaceholder}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              {text.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAccess}
              disabled={isLoading}
            >
              {text.confirmRevoke}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
