/**
 * MFA Enforcement Hook - KB 2.0
 * Ensures admin roles have MFA enabled
 * ISO 27001 Control A.8.5 - Secure Authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logAuthEvent } from '@/lib/security/auditLogger';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

// === ERROR TIPADO KB 2.0 ===
export type MFAEnforcementError = KBError;

interface MFAStatus {
  required: boolean;
  enabled: boolean;
  method: 'totp' | 'webauthn' | 'sms' | null;
  bypassUntil: Date | null;
}

interface UseMFAEnforcementReturn {
  mfaStatus: MFAStatus | null;
  showMFASetup: boolean;
  requiresMFANow: boolean;
  checkMFAStatus: () => Promise<void>;
  dismissMFAReminder: (hours?: number) => Promise<void>;
  completeMFASetup: (method: 'totp' | 'webauthn') => Promise<boolean>;
  // === KB 2.0 STATE ===
  status: KBStatus;
  isIdle: boolean;
  loading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
}

// Admin roles that require MFA
const ADMIN_ROLES = ['superadmin', 'admin', 'director_comercial', 'responsable_comercial'];

// Lazy import to avoid circular dependency issues
let useAuthHook: (() => any) | null = null;

export function useMFAEnforcement(): UseMFAEnforcementReturn | null {
  const [mfaStatus, setMFAStatus] = useState<MFAStatus | null>(null);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('loading');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const loading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 CLEAR ERROR ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);
  
  // Safely get auth context
  useEffect(() => {
    const loadAuth = async () => {
      try {
        if (!useAuthHook) {
          const authModule = await import('./useAuth');
          useAuthHook = authModule.useAuth;
        }
      } catch (e) {
        console.warn('Could not load auth hook:', e);
      }
    };
    loadAuth();
  }, []);

  // Get current session directly from Supabase
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch role
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();
        setUserRole(data?.role ?? null);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdminRole = userRole ? ADMIN_ROLES.includes(userRole) : false;

  const checkMFAStatus = useCallback(async () => {
    if (!user) {
      setMFAStatus(null);
      setStatus('idle');
      return;
    }

    const startTime = Date.now();
    try {
      setStatus('loading');
      setError(null);

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
      
      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      setRetryCount(0);
      collectTelemetry('useMFAEnforcement', 'checkMFAStatus', 'success', Date.now() - startTime);
    } catch (err) {
      console.error('MFA check error:', err);
      const parsedErr = parseError(err);
      const kbError = createKBError('MFA_CHECK_ERROR', parsedErr.message, { originalError: String(err) });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useMFAEnforcement', 'checkMFAStatus', 'error', Date.now() - startTime, kbError);
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
    showMFASetup,
    requiresMFANow,
    checkMFAStatus,
    dismissMFAReminder,
    completeMFASetup,
    // === KB 2.0 STATE ===
    status,
    isIdle,
    loading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
  };
}
