import { useState, useCallback, useEffect, useRef } from 'react';
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
  webglRenderer?: string;
  canvasHash?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  touchSupport?: boolean;
}

interface BehaviorMetrics {
  typingSpeed?: number;
  mouseMovementPattern?: string;
  scrollBehavior?: string;
  sessionDuration?: number;
  interactionRate?: number;
  navigationPattern?: string[];
}

interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
  category?: 'device' | 'location' | 'behavior' | 'transaction' | 'temporal' | 'ml_anomaly';
}

interface LocationInfo {
  country?: string;
  city?: string;
  isVpn?: boolean;
}

interface RiskAssessment {
  id: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  requiresStepUp: boolean;
  stepUpCompleted: boolean;
  location?: LocationInfo;
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
  behaviorMetrics: BehaviorMetrics;
  evaluateRisk: (action?: string, transactionValue?: number) => Promise<RiskAssessment | null>;
  verifyChallenge: (code: string) => Promise<boolean>;
  clearAssessment: () => void;
  startContinuousMonitoring: () => void;
  stopContinuousMonitoring: () => void;
}

function generateDeviceFingerprint(): DeviceFingerprint {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  let webglRenderer = '';
  
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    }
  }

  // Canvas fingerprint
  const ctx = canvas.getContext('2d');
  let canvasHash = '';
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    canvasHash = canvas.toDataURL().slice(-50);
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    webglRenderer,
    canvasHash,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    touchSupport: 'ontouchstart' in window
  };
}

function generateSessionId(): string {
  const existing = sessionStorage.getItem('adaptive_auth_session_id');
  if (existing) return existing;
  
  const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('adaptive_auth_session_id', sessionId);
  return sessionId;
}

async function getClientIp(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    console.log('Could not fetch client IP:', error);
  }
  return null;
}

export function useAdaptiveAuth(): UseAdaptiveAuthReturn {
  const { user } = useAuth();
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Behavior metrics collection
  const [behaviorMetrics, setBehaviorMetrics] = useState<BehaviorMetrics>({});
  const sessionStartTime = useRef<number>(Date.now());
  const keyPressTimestamps = useRef<number[]>([]);
  const interactionCount = useRef<number>(0);
  const navigationHistory = useRef<string[]>([]);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  const sessionId = generateSessionId();

  // Collect typing speed
  useEffect(() => {
    const handleKeyPress = () => {
      keyPressTimestamps.current.push(Date.now());
      interactionCount.current++;
      
      // Keep only last 50 keypresses for analysis
      if (keyPressTimestamps.current.length > 50) {
        keyPressTimestamps.current.shift();
      }
    };

    const handleClick = () => {
      interactionCount.current++;
    };

    const handleNavigation = () => {
      navigationHistory.current.push(window.location.pathname);
      if (navigationHistory.current.length > 20) {
        navigationHistory.current.shift();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('click', handleClick);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  // Calculate current behavior metrics
  const calculateBehaviorMetrics = useCallback((): BehaviorMetrics => {
    const timestamps = keyPressTimestamps.current;
    let typingSpeed = 0;
    
    if (timestamps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      typingSpeed = avgInterval > 0 ? 60000 / avgInterval : 0; // chars per minute
    }

    const sessionDuration = (Date.now() - sessionStartTime.current) / 1000;
    const interactionRate = sessionDuration > 0 
      ? interactionCount.current / sessionDuration 
      : 0;

    return {
      typingSpeed,
      sessionDuration,
      interactionRate,
      navigationPattern: [...navigationHistory.current]
    };
  }, []);

  // Update behavior metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBehaviorMetrics(calculateBehaviorMetrics());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [calculateBehaviorMetrics]);

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
      const clientIp = await getClientIp();
      const currentBehaviorMetrics = calculateBehaviorMetrics();

      const { data, error: fnError } = await supabase.functions.invoke('evaluate-session-risk', {
        body: {
          userId: user.id,
          sessionId,
          deviceFingerprint,
          action,
          transactionValue,
          clientIp,
          behaviorMetrics: currentBehaviorMetrics,
          continuousAuth: monitoringInterval.current !== null
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
  }, [user?.id, sessionId, calculateBehaviorMetrics]);

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

  // Continuous authentication monitoring
  const startContinuousMonitoring = useCallback(() => {
    if (monitoringInterval.current) return;
    
    monitoringInterval.current = setInterval(() => {
      if (user?.id) {
        evaluateRisk();
      }
    }, 5 * 60 * 1000); // Re-evaluate every 5 minutes
  }, [user?.id, evaluateRisk]);

  const stopContinuousMonitoring = useCallback(() => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
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
    behaviorMetrics,
    evaluateRisk,
    verifyChallenge,
    clearAssessment,
    startContinuousMonitoring,
    stopContinuousMonitoring
  };
}
