// XAMA Continuous Authentication System
// Monitors user behavior and attributes throughout the session

import { AttributeScore, XAMAProfile, applyScoreDecay, calculateOverallTrustScore, determineAAL, determineRiskLevel } from './attributeScoring';

export interface ContinuousAuthConfig {
  verificationInterval: number; // seconds
  behaviorSampleRate: number; // samples per second
  anomalyThreshold: number; // 0-100
  sessionTimeoutWarning: number; // minutes before timeout
  enableMouseTracking: boolean;
  enableKeyboardTracking: boolean;
  enableNavigationTracking: boolean;
}

export const DEFAULT_CONTINUOUS_AUTH_CONFIG: ContinuousAuthConfig = {
  verificationInterval: 60,
  behaviorSampleRate: 2,
  anomalyThreshold: 30,
  sessionTimeoutWarning: 5,
  enableMouseTracking: true,
  enableKeyboardTracking: true,
  enableNavigationTracking: true
};

export interface BehaviorSample {
  timestamp: number;
  mouseSpeed: number;
  mouseAcceleration: number;
  keyPressInterval: number;
  scrollPattern: number;
  navigationDepth: number;
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  anomalyScore: number;
  anomalyType: string[];
  recommendation: 'continue' | 'verify' | 'terminate';
}

// Baseline behavior profile for comparison
export interface BehaviorBaseline {
  avgMouseSpeed: number;
  avgMouseAcceleration: number;
  avgKeyPressInterval: number;
  avgScrollPattern: number;
  stdMouseSpeed: number;
  stdKeyPressInterval: number;
  sampleCount: number;
}

// Initialize empty baseline
export function createEmptyBaseline(): BehaviorBaseline {
  return {
    avgMouseSpeed: 0,
    avgMouseAcceleration: 0,
    avgKeyPressInterval: 0,
    avgScrollPattern: 0,
    stdMouseSpeed: 0,
    stdKeyPressInterval: 0,
    sampleCount: 0
  };
}

// Update baseline with new sample (running average)
export function updateBaseline(baseline: BehaviorBaseline, sample: BehaviorSample): BehaviorBaseline {
  const n = baseline.sampleCount + 1;
  const decay = Math.min(n, 100) / 100; // Weight towards recent samples
  
  return {
    avgMouseSpeed: baseline.avgMouseSpeed * (1 - 1/n) + sample.mouseSpeed / n,
    avgMouseAcceleration: baseline.avgMouseAcceleration * (1 - 1/n) + sample.mouseAcceleration / n,
    avgKeyPressInterval: baseline.avgKeyPressInterval * (1 - 1/n) + sample.keyPressInterval / n,
    avgScrollPattern: baseline.avgScrollPattern * (1 - 1/n) + sample.scrollPattern / n,
    stdMouseSpeed: Math.sqrt(
      baseline.stdMouseSpeed ** 2 * (1 - 1/n) + 
      ((sample.mouseSpeed - baseline.avgMouseSpeed) ** 2) / n
    ),
    stdKeyPressInterval: Math.sqrt(
      baseline.stdKeyPressInterval ** 2 * (1 - 1/n) +
      ((sample.keyPressInterval - baseline.avgKeyPressInterval) ** 2) / n
    ),
    sampleCount: n
  };
}

// Detect behavioral anomalies
export function detectAnomalies(
  sample: BehaviorSample,
  baseline: BehaviorBaseline,
  threshold: number = 30
): AnomalyDetection {
  if (baseline.sampleCount < 10) {
    // Not enough data for comparison
    return {
      isAnomaly: false,
      anomalyScore: 0,
      anomalyType: [],
      recommendation: 'continue'
    };
  }
  
  const anomalyTypes: string[] = [];
  let anomalyScore = 0;
  
  // Check mouse speed deviation
  const mouseSpeedZScore = Math.abs(sample.mouseSpeed - baseline.avgMouseSpeed) / 
    (baseline.stdMouseSpeed || 1);
  if (mouseSpeedZScore > 3) {
    anomalyTypes.push('mouse_speed_anomaly');
    anomalyScore += Math.min(40, mouseSpeedZScore * 10);
  }
  
  // Check keyboard timing deviation
  const keyIntervalZScore = Math.abs(sample.keyPressInterval - baseline.avgKeyPressInterval) /
    (baseline.stdKeyPressInterval || 1);
  if (keyIntervalZScore > 3) {
    anomalyTypes.push('keyboard_timing_anomaly');
    anomalyScore += Math.min(40, keyIntervalZScore * 10);
  }
  
  // Check for bot-like patterns (too consistent)
  if (baseline.stdMouseSpeed < 0.5 && baseline.sampleCount > 50) {
    anomalyTypes.push('bot_pattern_suspected');
    anomalyScore += 30;
  }
  
  // Check for rapid navigation (scraping pattern)
  if (sample.navigationDepth > 10 && sample.mouseSpeed < 5) {
    anomalyTypes.push('scraping_pattern_suspected');
    anomalyScore += 25;
  }
  
  const isAnomaly = anomalyScore >= threshold;
  
  let recommendation: 'continue' | 'verify' | 'terminate' = 'continue';
  if (anomalyScore >= 70) {
    recommendation = 'terminate';
  } else if (isAnomaly) {
    recommendation = 'verify';
  }
  
  return {
    isAnomaly,
    anomalyScore: Math.min(100, anomalyScore),
    anomalyType: anomalyTypes,
    recommendation
  };
}

// Update XAMA profile with continuous verification results
export function updateProfileWithContinuousAuth(
  profile: XAMAProfile,
  behaviorScore: number,
  anomalyDetection: AnomalyDetection
): XAMAProfile {
  // Apply decay to all attributes
  const decayedAttributes = profile.attributes.map(attr => applyScoreDecay(attr));
  
  // Update behavior attribute
  const behaviorIndex = decayedAttributes.findIndex(a => a.attribute === 'behavior');
  const behaviorAttribute: AttributeScore = {
    attribute: 'behavior',
    score: Math.max(0, behaviorScore - anomalyDetection.anomalyScore / 2),
    weight: 0.25,
    confidence: anomalyDetection.isAnomaly ? 0.6 : 0.9,
    lastVerified: new Date(),
    verificationMethod: 'continuous_monitoring'
  };
  
  if (behaviorIndex >= 0) {
    decayedAttributes[behaviorIndex] = behaviorAttribute;
  } else {
    decayedAttributes.push(behaviorAttribute);
  }
  
  const newTrustScore = calculateOverallTrustScore(decayedAttributes);
  
  // Determine continuous auth status
  let continuousAuthStatus: 'active' | 'degraded' | 'expired' = 'active';
  if (anomalyDetection.recommendation === 'verify') {
    continuousAuthStatus = 'degraded';
  } else if (anomalyDetection.recommendation === 'terminate') {
    continuousAuthStatus = 'expired';
  }
  
  return {
    ...profile,
    attributes: decayedAttributes,
    overallTrustScore: newTrustScore,
    riskLevel: determineRiskLevel(newTrustScore),
    authenticationLevel: determineAAL(decayedAttributes),
    continuousAuthStatus
  };
}

// Generate session health report
export function generateSessionHealthReport(profile: XAMAProfile): {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  timeUntilExpiry: number; // minutes
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check trust score
  if (profile.overallTrustScore < 50) {
    issues.push('Low trust score detected');
    recommendations.push('Complete additional verification');
  }
  
  // Check for degraded attributes
  const degradedAttrs = profile.attributes.filter(a => a.score < 60);
  if (degradedAttrs.length > 0) {
    issues.push(`${degradedAttrs.length} attribute(s) below threshold`);
    recommendations.push('Refresh expired verifications');
  }
  
  // Check continuous auth status
  if (profile.continuousAuthStatus === 'degraded') {
    issues.push('Behavioral anomalies detected');
    recommendations.push('Verify identity to continue');
  }
  
  // Calculate time until session expiry based on decay
  const oldestVerification = Math.min(
    ...profile.attributes.map(a => a.lastVerified.getTime())
  );
  const minutesSinceOldest = (Date.now() - oldestVerification) / 60000;
  const timeUntilExpiry = Math.max(0, 120 - minutesSinceOldest); // 2 hour max
  
  if (timeUntilExpiry < 10) {
    issues.push('Session expiring soon');
    recommendations.push('Re-authenticate to extend session');
  }
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (issues.length > 2 || profile.continuousAuthStatus === 'expired') {
    status = 'critical';
  } else if (issues.length > 0) {
    status = 'warning';
  }
  
  return {
    status,
    issues,
    recommendations,
    timeUntilExpiry
  };
}
