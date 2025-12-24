// XAMA - eXtended Attribute Multi-factor Authentication Hook
// Orchestrates multiple authentication factors and continuous verification

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { KBStatus, KBError } from '@/hooks/core/types';
import { parseError, collectTelemetry } from '@/hooks/core/useKBBase';

export type XAMAError = KBError;
import { useBehavioralBiometrics } from './useBehavioralBiometrics';
import { useAdaptiveAuth } from './useAdaptiveAuth';
import { useWebAuthn } from './useWebAuthn';
import {
  AttributeScore,
  XAMAProfile,
  AttributePolicy,
  XAMA_POLICIES,
  calculateOverallTrustScore,
  determineRiskLevel,
  determineAAL,
  evaluatePolicy,
  scoreDeviceFingerprint,
  scoreLocation,
  scoreSession
} from '@/lib/xama/attributeScoring';
import {
  ContinuousAuthConfig,
  DEFAULT_CONTINUOUS_AUTH_CONFIG,
  BehaviorSample,
  BehaviorBaseline,
  createEmptyBaseline,
  updateBaseline,
  detectAnomalies,
  updateProfileWithContinuousAuth,
  generateSessionHealthReport
} from '@/lib/xama/continuousAuth';

export interface XAMAState {
  profile: XAMAProfile | null;
  isVerifying: boolean;
  requiresStepUp: boolean;
  pendingResource: string | null;
  sessionHealth: ReturnType<typeof generateSessionHealthReport> | null;
  lastAnomalyDetection: ReturnType<typeof detectAnomalies> | null;
}

export interface UseXAMAReturn {
  state: XAMAState;
  initializeProfile: () => Promise<void>;
  verifyAttribute: (attribute: string) => Promise<boolean>;
  verifyForResource: (resourceSensitivity: 'low' | 'medium' | 'high' | 'critical') => Promise<boolean>;
  refreshAllAttributes: () => Promise<void>;
  addPasskeyVerification: () => Promise<boolean>;
  getRequiredVerifications: (sensitivity: 'low' | 'medium' | 'high' | 'critical') => string[];
  terminateSession: () => void;
  isAuthorizedForResource: (sensitivity: 'low' | 'medium' | 'high' | 'critical') => boolean;
  // === KB 2.0 RETURN ===
  status: KBStatus;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: KBError | null;
  lastRefresh: Date | null;
  lastSuccess: Date | null;
  retryCount: number;
  clearError: () => void;
  reset: () => void;
}

export function useXAMA(config: Partial<ContinuousAuthConfig> = {}): UseXAMAReturn {
  const fullConfig = { ...DEFAULT_CONTINUOUS_AUTH_CONFIG, ...config };
  
  const { user } = useAuth();
  const { currentProfile: behaviorProfile, matchScore: behaviorMatchScore, startCollection, stopCollection } = useBehavioralBiometrics();
  const { riskAssessment, evaluateRisk } = useAdaptiveAuth();
  const { authenticateWithPasskey, isSupported: passkeySupported } = useWebAuthn();
  
  const [state, setState] = useState<XAMAState>({
    profile: null,
    isVerifying: false,
    requiresStepUp: false,
    pendingResource: null,
    sessionHealth: null,
    lastAnomalyDetection: null
  });
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccessState = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);
  
  const baselineRef = useRef<BehaviorBaseline>(createEmptyBaseline());
  const continuousAuthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date>(new Date());
  const lastInteractionRef = useRef<number>(Date.now());
  
  // Track user interactions
  useEffect(() => {
    const updateLastInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    
    window.addEventListener('mousemove', updateLastInteraction);
    window.addEventListener('keydown', updateLastInteraction);
    window.addEventListener('click', updateLastInteraction);
    window.addEventListener('scroll', updateLastInteraction);
    
    return () => {
      window.removeEventListener('mousemove', updateLastInteraction);
      window.removeEventListener('keydown', updateLastInteraction);
      window.removeEventListener('click', updateLastInteraction);
      window.removeEventListener('scroll', updateLastInteraction);
    };
  }, []);
  
  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback((): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('XAMA fingerprint', 2, 2);
    }
    
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency?.toString() || '',
      (navigator as any).deviceMemory?.toString() || ''
    ];
    
    // Simple hash
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }, []);
  
  // Get trusted device fingerprints from localStorage
  const getTrustedDevices = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem('xama_trusted_devices');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);
  
  // Add current device as trusted
  const trustCurrentDevice = useCallback(() => {
    const fingerprint = generateDeviceFingerprint();
    const trusted = getTrustedDevices();
    if (!trusted.includes(fingerprint)) {
      trusted.push(fingerprint);
      localStorage.setItem('xama_trusted_devices', JSON.stringify(trusted.slice(-5))); // Keep last 5
    }
  }, [generateDeviceFingerprint, getTrustedDevices]);
  
  // Initialize XAMA profile
  const initializeProfile = useCallback(async () => {
    if (!user) return;
    
    setState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Start behavioral collection
      startCollection();
      
      // Collect initial attributes
      const deviceFingerprint = generateDeviceFingerprint();
      const trustedDevices = getTrustedDevices();
      const deviceScore = scoreDeviceFingerprint(deviceFingerprint, trustedDevices);
      
      // Get location info from adaptive auth
      await evaluateRisk('session_init');
      const locationFactor = riskAssessment?.riskFactors?.find(f => f.factor === 'location');
      const locationScore = scoreLocation(
        (locationFactor as any)?.details || 'AD',
        riskAssessment?.riskFactors?.some(f => f.factor === 'vpn_detected') || false
      );
      
      // Session score
      const sessionScore = scoreSession(0, 1.0, true);
      
      // Initial behavior score (will improve over time)
      const behaviorScore: AttributeScore = {
        attribute: 'behavior',
        score: 50, // Start neutral
        weight: 0.25,
        confidence: 0.5,
        lastVerified: new Date(),
        verificationMethod: 'initial'
      };
      
      const attributes = [deviceScore, locationScore, sessionScore, behaviorScore];
      
      const profile: XAMAProfile = {
        userId: user.id,
        attributes,
        overallTrustScore: calculateOverallTrustScore(attributes),
        riskLevel: determineRiskLevel(calculateOverallTrustScore(attributes)),
        authenticationLevel: determineAAL(attributes),
        continuousAuthStatus: 'active',
        lastFullVerification: new Date(),
        sessionStartTime: sessionStartRef.current
      };
      
      const sessionHealth = generateSessionHealthReport(profile);
      
      setLastRefresh(new Date());
      setState(prev => ({
        ...prev,
        profile,
        sessionHealth,
        isVerifying: false
      }));
      
      // Start continuous monitoring
      startContinuousAuth();
      
    } catch (err) {
      console.error('XAMA initialization error:', err);
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      setState(prev => ({ ...prev, isVerifying: false }));
    }
  }, [user, startCollection, generateDeviceFingerprint, getTrustedDevices, evaluateRisk, riskAssessment]);
  
  // Continuous authentication loop
  const startContinuousAuth = useCallback(() => {
    if (continuousAuthIntervalRef.current) {
      clearInterval(continuousAuthIntervalRef.current);
    }
    
    continuousAuthIntervalRef.current = setInterval(() => {
      if (!state.profile || !behaviorProfile) return;
      
      // Create behavior sample from current profile
      const bp = behaviorProfile as any;
      const sample: BehaviorSample = {
        timestamp: Date.now(),
        mouseSpeed: bp.mouseBehavior?.averageSpeed || bp.mouseMovements?.averageSpeed || 0,
        mouseAcceleration: bp.mouseBehavior?.acceleration || bp.mouseMovements?.acceleration || 0,
        keyPressInterval: bp.typingPattern?.averageKeyPressTime || bp.typingDynamics?.averageKeyPressTime || 0,
        scrollPattern: bp.mouseBehavior?.scrollSpeed || bp.scrollBehavior?.averageScrollSpeed || 0,
        navigationDepth: bp.navigationPattern?.pageViewCount || 0
      };
      
      // Update baseline
      baselineRef.current = updateBaseline(baselineRef.current, sample);
      
      // Detect anomalies
      const anomalyDetection = detectAnomalies(sample, baselineRef.current, fullConfig.anomalyThreshold);
      
      // Calculate behavior score from match
      const behaviorScore = behaviorMatchScore || 70;
      
      // Update profile
      const updatedProfile = updateProfileWithContinuousAuth(
        state.profile,
        behaviorScore,
        anomalyDetection
      );
      
      // Update session attribute
      const sessionAge = (Date.now() - sessionStartRef.current.getTime()) / 60000;
      const hasRecentInteraction = (Date.now() - lastInteractionRef.current) < 60000;
      const activityLevel = hasRecentInteraction ? 0.8 : 0.3;
      const newSessionScore = scoreSession(sessionAge, activityLevel, hasRecentInteraction);
      
      const sessionIndex = updatedProfile.attributes.findIndex(a => a.attribute === 'session');
      if (sessionIndex >= 0) {
        updatedProfile.attributes[sessionIndex] = newSessionScore;
      }
      
      // Recalculate overall score
      updatedProfile.overallTrustScore = calculateOverallTrustScore(updatedProfile.attributes);
      updatedProfile.riskLevel = determineRiskLevel(updatedProfile.overallTrustScore);
      
      const sessionHealth = generateSessionHealthReport(updatedProfile);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        sessionHealth,
        lastAnomalyDetection: anomalyDetection,
        requiresStepUp: anomalyDetection.recommendation === 'verify'
      }));
      
      // Auto-terminate on critical anomaly
      if (anomalyDetection.recommendation === 'terminate') {
        terminateSession();
      }
      
    }, fullConfig.verificationInterval * 1000);
  }, [state.profile, behaviorProfile, behaviorMatchScore, fullConfig]);
  
  // Verify specific attribute
  const verifyAttribute = useCallback(async (attribute: string): Promise<boolean> => {
    if (!state.profile) return false;
    
    setState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      let newScore: AttributeScore | null = null;
      
      switch (attribute) {
        case 'device':
          const fingerprint = generateDeviceFingerprint();
          const trusted = getTrustedDevices();
          newScore = scoreDeviceFingerprint(fingerprint, trusted);
          if (newScore.score >= 70) trustCurrentDevice();
          break;
          
        case 'passkey':
          if (passkeySupported && user) {
            const success = await authenticateWithPasskey(user.email || '');
            newScore = {
              attribute: 'passkey',
              score: success ? 98 : 0,
              weight: 0.3,
              confidence: success ? 0.99 : 0,
              lastVerified: new Date(),
              verificationMethod: success ? 'webauthn_verified' : 'webauthn_failed'
            };
          }
          break;
          
        case 'biometric':
          // Biometric verification through passkey with user verification
          if (passkeySupported && user) {
            const success = await authenticateWithPasskey(user.email || '');
            newScore = {
              attribute: 'biometric',
              score: success ? 90 : 0,
              weight: 0.25,
              confidence: success ? 0.95 : 0,
              lastVerified: new Date(),
              verificationMethod: success ? 'biometric_verified' : 'biometric_failed'
            };
          }
          break;
          
        case 'behavior':
          const behaviorScore = behaviorMatchScore || 50;
          newScore = {
            attribute: 'behavior',
            score: behaviorScore,
            weight: 0.25,
            confidence: behaviorScore > 70 ? 0.9 : 0.6,
            lastVerified: new Date(),
            verificationMethod: 'behavioral_analysis'
          };
          break;
      }
      
      if (newScore) {
        const updatedAttrs = [...state.profile.attributes];
        const existingIndex = updatedAttrs.findIndex(a => a.attribute === attribute);
        
        if (existingIndex >= 0) {
          updatedAttrs[existingIndex] = newScore;
        } else {
          updatedAttrs.push(newScore);
        }
        
        const updatedProfile: XAMAProfile = {
          ...state.profile,
          attributes: updatedAttrs,
          overallTrustScore: calculateOverallTrustScore(updatedAttrs),
          riskLevel: determineRiskLevel(calculateOverallTrustScore(updatedAttrs)),
          authenticationLevel: determineAAL(updatedAttrs),
          lastFullVerification: new Date()
        };
        
        setState(prev => ({
          ...prev,
          profile: updatedProfile,
          sessionHealth: generateSessionHealthReport(updatedProfile),
          isVerifying: false
        }));
        
        return newScore.score >= 60;
      }
      
      setState(prev => ({ ...prev, isVerifying: false }));
      return false;
      
    } catch (err) {
      console.error('Attribute verification error:', err);
      const kbError = parseError(err);
      setError(kbError);
      setStatus('error');
      setState(prev => ({ ...prev, isVerifying: false }));
      return false;
    }
  }, [state.profile, generateDeviceFingerprint, getTrustedDevices, trustCurrentDevice, passkeySupported, user, authenticateWithPasskey, behaviorMatchScore]);
  
  // Verify for resource access
  const verifyForResource = useCallback(async (
    resourceSensitivity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> => {
    if (!state.profile) return false;
    
    const policy = XAMA_POLICIES[resourceSensitivity];
    const evaluation = evaluatePolicy(state.profile, policy);
    
    if (evaluation.passed) return true;
    
    setState(prev => ({ ...prev, pendingResource: resourceSensitivity, requiresStepUp: true }));
    
    // Auto-verify missing attributes
    for (const requirement of evaluation.failedRequirements) {
      const attrMatch = requirement.match(/Missing required attribute: (\w+)/);
      if (attrMatch) {
        await verifyAttribute(attrMatch[1]);
      }
    }
    
    // Re-evaluate after verification attempts
    if (state.profile) {
      const reEvaluation = evaluatePolicy(state.profile, policy);
      setState(prev => ({ ...prev, requiresStepUp: !reEvaluation.passed, pendingResource: null }));
      return reEvaluation.passed;
    }
    
    return false;
  }, [state.profile, verifyAttribute]);
  
  // Refresh all attributes
  const refreshAllAttributes = useCallback(async () => {
    if (!state.profile) return;
    
    for (const attr of state.profile.attributes) {
      await verifyAttribute(attr.attribute);
    }
  }, [state.profile, verifyAttribute]);
  
  // Add passkey verification
  const addPasskeyVerification = useCallback(async (): Promise<boolean> => {
    return verifyAttribute('passkey');
  }, [verifyAttribute]);
  
  // Get required verifications for sensitivity level
  const getRequiredVerifications = useCallback((
    sensitivity: 'low' | 'medium' | 'high' | 'critical'
  ): string[] => {
    if (!state.profile) return XAMA_POLICIES[sensitivity].requiredAttributes;
    
    const policy = XAMA_POLICIES[sensitivity];
    const evaluation = evaluatePolicy(state.profile, policy);
    
    return evaluation.failedRequirements;
  }, [state.profile]);
  
  // Check if authorized for resource
  const isAuthorizedForResource = useCallback((
    sensitivity: 'low' | 'medium' | 'high' | 'critical'
  ): boolean => {
    if (!state.profile) return false;
    
    const policy = XAMA_POLICIES[sensitivity];
    const evaluation = evaluatePolicy(state.profile, policy);
    
    return evaluation.passed;
  }, [state.profile]);
  
  // Terminate session
  const terminateSession = useCallback(() => {
    if (continuousAuthIntervalRef.current) {
      clearInterval(continuousAuthIntervalRef.current);
    }
    
    stopCollection();
    
    setState({
      profile: null,
      isVerifying: false,
      requiresStepUp: false,
      pendingResource: null,
      sessionHealth: null,
      lastAnomalyDetection: null
    });
    
    baselineRef.current = createEmptyBaseline();
  }, [stopCollection]);
  
  // Initialize on user login
  useEffect(() => {
    if (user && !state.profile) {
      initializeProfile();
    } else if (!user && state.profile) {
      terminateSession();
    }
  }, [user, state.profile, initializeProfile, terminateSession]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (continuousAuthIntervalRef.current) {
        clearInterval(continuousAuthIntervalRef.current);
      }
    };
  }, []);
  
  return {
    state,
    initializeProfile,
    verifyAttribute,
    verifyForResource,
    refreshAllAttributes,
    addPasskeyVerification,
    getRequiredVerifications,
    terminateSession,
    isAuthorizedForResource,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess: isSuccessState,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset
  };
}
