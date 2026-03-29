import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_ATTEMPTS = 3;

/**
 * Tracks unauthorized admin access attempts per session.
 * Logs to audit_log and blocks after MAX_ATTEMPTS.
 */
export function useAdminAccessGuard() {
  const [attempts, setAttempts] = useState(0);
  const isBlocked = attempts >= MAX_ATTEMPTS;

  const logUnauthorizedAttempt = useCallback(async (userId: string, path: string) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    try {
      await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'unauthorized_admin_access',
        entity_type: 'admin_route',
        entity_name: path,
        new_values: { attempt_number: newAttempts, blocked: newAttempts >= MAX_ATTEMPTS },
      });
    } catch (err) {
      console.error('[AdminGuard] Failed to log attempt:', err);
    }
  }, [attempts]);

  return { attempts, isBlocked, logUnauthorizedAttempt };
}
