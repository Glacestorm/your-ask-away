import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
}

interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
}

interface RiskAssessment {
  id: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  requiresStepUp: boolean;
  stepUpCompleted: boolean;
}

interface Challenge {
  id: string;
  type: string;
  expiresAt: string;
}

interface UseAdaptiveAuthReturn {
  riskAssessment: RiskAssessment | null;
  challenge: Challenge | null;
  isEvaluating: boolean;
  isVerifying: boolean;
  error: string | null;
  evaluateRisk: (action?: string, transactionValue?: number) => Promise<RiskAssessment | null>;
  verifyChallenge: (code: string) => Promise<boolean>;
  clearAssessment: () => void;
}

function generateDeviceFingerprint(): DeviceFingerprint {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1'
  };
}

function generateSessionId(): string {
  const existing = sessionStorage.getItem('adaptive_auth_session_id');
  if (existing) return existing;
  
  const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('adaptive_auth_session_id', sessionId);
  return sessionId;
}

export function useAdaptiveAuth(): UseAdaptiveAuthReturn {
  const { user } = useAuth();
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = generateSessionId();

  const evaluateRisk = useCallback(async (
    action?: string,
    transactionValue?: number
  ): Promise<RiskAssessment | null> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return null;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const deviceFingerprint = generateDeviceFingerprint();

      const { data, error: fnError } = await supabase.functions.invoke('evaluate-session-risk', {
        body: {
          userId: user.id,
          sessionId,
          deviceFingerprint,
          action,
          transactionValue
        }
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
        return null;
      }

      const assessment = data.assessment as RiskAssessment;
      setRiskAssessment(assessment);

      if (data.challenge) {
        setChallenge(data.challenge);
      }

      return assessment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error evaluando riesgo';
      setError(message);
      console.error('Adaptive auth error:', err);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  }, [user?.id, sessionId]);

  const verifyChallenge = useCallback(async (code: string): Promise<boolean> => {
    if (!challenge?.id) {
      setError('No hay desafío activo');
      return false;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-step-up-challenge', {
        body: {
          challengeId: challenge.id,
          code,
          sessionId
        }
      });

      if (fnError) throw fnError;

      if (!data.success) {
        setError(data.error || 'Verificación fallida');
        return false;
      }

      // Update local state
      setRiskAssessment(prev => prev ? {
        ...prev,
        stepUpCompleted: true
      } : null);
      setChallenge(null);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error verificando código';
      setError(message);
      console.error('Verify challenge error:', err);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [challenge?.id, sessionId]);

  const clearAssessment = useCallback(() => {
    setRiskAssessment(null);
    setChallenge(null);
    setError(null);
  }, []);

  // Automatically evaluate risk on mount if user is authenticated
  useEffect(() => {
    if (user?.id && !riskAssessment) {
      evaluateRisk();
    }
  }, [user?.id]);

  return {
    riskAssessment,
    challenge,
    isEvaluating,
    isVerifying,
    error,
    evaluateRisk,
    verifyChallenge,
    clearAssessment
  };
}
