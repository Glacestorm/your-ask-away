/**
 * MFA Enforcement Hook
 * Ensures admin roles have MFA enabled
 * ISO 27001 Control A.8.5 - Secure Authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logAuthEvent } from '@/lib/security/auditLogger';

interface MFAStatus {
  required: boolean;
  enabled: boolean;
  method: 'totp' | 'webauthn' | 'sms' | null;
  bypassUntil: Date | null;
}

interface UseMFAEnforcementReturn {
  mfaStatus: MFAStatus | null;
  loading: boolean;
  showMFASetup: boolean;
  requiresMFANow: boolean;
  checkMFAStatus: () => Promise<void>;
  dismissMFAReminder: (hours?: number) => Promise<void>;
  completeMFASetup: (method: 'totp' | 'webauthn') => Promise<boolean>;
}

// Admin roles that require MFA
const ADMIN_ROLES = ['superadmin', 'admin', 'director_comercial', 'responsable_comercial'];

export function useMFAEnforcement(): UseMFAEnforcementReturn | null {
  const auth = useAuth();
  const [mfaStatus, setMFAStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);

  // Handle case where auth context is not ready
  const user = auth?.user ?? null;
  const userRole = auth?.userRole ?? null;
  
  const isAdminRole = userRole ? ADMIN_ROLES.includes(userRole) : false;

  const checkMFAStatus = useCallback(async () => {
    if (!user) {
      setMFAStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user has MFA requirements record
      const { data: mfaReq, error } = await supabase
        .from('mfa_requirements')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as { data: any; error: any };

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking MFA status:', error);
      }

      // Check if user has WebAuthn passkeys
      const passkeysResult = await supabase
        .from('user_passkeys' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('active', true);
      const passkeys = passkeysResult?.data as any[] | null;

      const hasPasskeys = passkeys && passkeys.length > 0;

      // Check Supabase Auth factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasTOTP = factors?.totp && factors.totp.length > 0;

      const mfaEnabled = hasPasskeys || hasTOTP;
      const mfaMethod = hasPasskeys ? 'webauthn' : hasTOTP ? 'totp' : null;

      const status: MFAStatus = {
        required: isAdminRole,
        enabled: mfaEnabled,
        method: mfaMethod,
        bypassUntil: mfaReq?.mfa_bypass_until ? new Date(mfaReq.mfa_bypass_until) : null,
      };

      setMFAStatus(status);

      // If MFA is required but not enabled, and no active bypass, show setup
      if (isAdminRole && !mfaEnabled) {
        const bypassActive = status.bypassUntil && new Date() < status.bypassUntil;
        setShowMFASetup(!bypassActive);
      } else {
        setShowMFASetup(false);
      }

      // Create/update MFA requirements record
      if (!mfaReq && isAdminRole) {
        await supabase.from('mfa_requirements').insert({
          user_id: user.id,
          mfa_required: true,
          mfa_enabled: mfaEnabled,
          mfa_method: mfaMethod,
        });
      } else if (mfaReq) {
        await supabase
          .from('mfa_requirements')
          .update({
            mfa_enabled: mfaEnabled,
            mfa_method: mfaMethod,
          })
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('MFA check error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdminRole]);

  const dismissMFAReminder = useCallback(async (hours: number = 24) => {
    if (!user) return;

    const bypassUntil = new Date();
    bypassUntil.setHours(bypassUntil.getHours() + hours);

    await supabase
      .from('mfa_requirements')
      .upsert({
        user_id: user.id,
        mfa_bypass_until: bypassUntil.toISOString(),
        mfa_required: isAdminRole,
      });

    setShowMFASetup(false);
    setMFAStatus(prev => prev ? { ...prev, bypassUntil } : null);

    await logAuthEvent('mfa_challenge', { 
      action: 'bypass_requested', 
      bypass_hours: hours 
    });
  }, [user, isAdminRole]);

  const completeMFASetup = useCallback(async (method: 'totp' | 'webauthn'): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('mfa_requirements')
        .upsert({
          user_id: user.id,
          mfa_enabled: true,
          mfa_method: method,
          mfa_required: isAdminRole,
          last_mfa_challenge: new Date().toISOString(),
        });

      setMFAStatus(prev => prev ? { ...prev, enabled: true, method } : null);
      setShowMFASetup(false);

      await logAuthEvent('mfa_success', { method });
      return true;
    } catch (err) {
      console.error('MFA setup error:', err);
      return false;
    }
  }, [user, isAdminRole]);

  useEffect(() => {
    checkMFAStatus();
  }, [checkMFAStatus]);

  const requiresMFANow = !!(
    mfaStatus?.required && 
    !mfaStatus?.enabled && 
    (!mfaStatus?.bypassUntil || new Date() >= mfaStatus.bypassUntil)
  );

  return {
    mfaStatus,
    loading,
    showMFASetup,
    requiresMFANow,
    checkMFAStatus,
    dismissMFAReminder,
    completeMFASetup,
  };
}
