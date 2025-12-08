// XAMA Attribute Scoring System
// Implements multi-attribute scoring for authentication decisions

export interface AttributeScore {
  attribute: string;
  score: number; // 0-100
  weight: number; // 0-1
  confidence: number; // 0-1
  lastVerified: Date;
  verificationMethod: string;
}

export interface XAMAProfile {
  userId: string;
  attributes: AttributeScore[];
  overallTrustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  authenticationLevel: 'AAL1' | 'AAL2' | 'AAL3';
  continuousAuthStatus: 'active' | 'degraded' | 'expired';
  lastFullVerification: Date;
  sessionStartTime: Date;
}

export interface AttributePolicy {
  requiredAttributes: string[];
  minimumScores: Record<string, number>;
  minimumOverallScore: number;
  maxSessionDuration: number; // minutes
  continuousVerificationInterval: number; // seconds
  requiredAAL: 'AAL1' | 'AAL2' | 'AAL3';
}

// Default policies for different resource sensitivity levels
export const XAMA_POLICIES: Record<string, AttributePolicy> = {
  low: {
    requiredAttributes: ['device', 'session'],
    minimumScores: { device: 50, session: 60 },
    minimumOverallScore: 55,
    maxSessionDuration: 480, // 8 hours
    continuousVerificationInterval: 300, // 5 minutes
    requiredAAL: 'AAL1'
  },
  medium: {
    requiredAttributes: ['device', 'session', 'behavior', 'location'],
    minimumScores: { device: 70, session: 70, behavior: 60, location: 50 },
    minimumOverallScore: 65,
    maxSessionDuration: 120, // 2 hours
    continuousVerificationInterval: 120, // 2 minutes
    requiredAAL: 'AAL2'
  },
  high: {
    requiredAttributes: ['device', 'session', 'behavior', 'location', 'biometric'],
    minimumScores: { device: 80, session: 80, behavior: 70, location: 70, biometric: 75 },
    minimumOverallScore: 75,
    maxSessionDuration: 30, // 30 minutes
    continuousVerificationInterval: 60, // 1 minute
    requiredAAL: 'AAL2'
  },
  critical: {
    requiredAttributes: ['device', 'session', 'behavior', 'location', 'biometric', 'passkey'],
    minimumScores: { device: 90, session: 90, behavior: 80, location: 80, biometric: 85, passkey: 95 },
    minimumOverallScore: 85,
    maxSessionDuration: 15, // 15 minutes
    continuousVerificationInterval: 30, // 30 seconds
    requiredAAL: 'AAL3'
  }
};

// Calculate weighted average of attribute scores
export function calculateOverallTrustScore(attributes: AttributeScore[]): number {
  if (attributes.length === 0) return 0;
  
  const totalWeight = attributes.reduce((sum, attr) => sum + attr.weight * attr.confidence, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = attributes.reduce(
    (sum, attr) => sum + attr.score * attr.weight * attr.confidence,
    0
  );
  
  return Math.round(weightedSum / totalWeight);
}

// Determine risk level based on trust score
export function determineRiskLevel(trustScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (trustScore >= 80) return 'low';
  if (trustScore >= 60) return 'medium';
  if (trustScore >= 40) return 'high';
  return 'critical';
}

// Determine AAL based on verified attributes
export function determineAAL(attributes: AttributeScore[]): 'AAL1' | 'AAL2' | 'AAL3' {
  const hasPasskey = attributes.some(a => a.attribute === 'passkey' && a.score >= 80);
  const hasBiometric = attributes.some(a => a.attribute === 'biometric' && a.score >= 70);
  const hasBehavior = attributes.some(a => a.attribute === 'behavior' && a.score >= 60);
  const hasDevice = attributes.some(a => a.attribute === 'device' && a.score >= 70);
  
  if (hasPasskey && hasBiometric) return 'AAL3';
  if ((hasPasskey || hasBiometric) && hasDevice && hasBehavior) return 'AAL2';
  return 'AAL1';
}

// Check if profile meets policy requirements
export function evaluatePolicy(
  profile: XAMAProfile,
  policy: AttributePolicy
): { passed: boolean; failedRequirements: string[] } {
  const failedRequirements: string[] = [];
  
  // Check overall score
  if (profile.overallTrustScore < policy.minimumOverallScore) {
    failedRequirements.push(`Overall trust score ${profile.overallTrustScore} < ${policy.minimumOverallScore}`);
  }
  
  // Check AAL
  const aalOrder = { 'AAL1': 1, 'AAL2': 2, 'AAL3': 3 };
  if (aalOrder[profile.authenticationLevel] < aalOrder[policy.requiredAAL]) {
    failedRequirements.push(`AAL ${profile.authenticationLevel} < required ${policy.requiredAAL}`);
  }
  
  // Check required attributes
  for (const required of policy.requiredAttributes) {
    const attr = profile.attributes.find(a => a.attribute === required);
    if (!attr) {
      failedRequirements.push(`Missing required attribute: ${required}`);
    } else if (attr.score < (policy.minimumScores[required] || 0)) {
      failedRequirements.push(`${required} score ${attr.score} < ${policy.minimumScores[required]}`);
    }
  }
  
  // Check session duration
  const sessionDuration = (Date.now() - profile.sessionStartTime.getTime()) / 60000;
  if (sessionDuration > policy.maxSessionDuration) {
    failedRequirements.push(`Session duration ${Math.round(sessionDuration)}min > ${policy.maxSessionDuration}min`);
  }
  
  return {
    passed: failedRequirements.length === 0,
    failedRequirements
  };
}

// Score decay over time (attributes become less trusted)
export function applyScoreDecay(attribute: AttributeScore, decayRate: number = 0.1): AttributeScore {
  const minutesSinceVerification = (Date.now() - attribute.lastVerified.getTime()) / 60000;
  const decayFactor = Math.max(0.5, 1 - (minutesSinceVerification * decayRate / 60));
  
  return {
    ...attribute,
    score: Math.round(attribute.score * decayFactor),
    confidence: Math.max(0.3, attribute.confidence * decayFactor)
  };
}

// Generate device fingerprint score
export function scoreDeviceFingerprint(
  currentFingerprint: string,
  trustedFingerprints: string[]
): AttributeScore {
  const isTrusted = trustedFingerprints.includes(currentFingerprint);
  
  return {
    attribute: 'device',
    score: isTrusted ? 95 : 40,
    weight: 0.2,
    confidence: isTrusted ? 0.95 : 0.6,
    lastVerified: new Date(),
    verificationMethod: isTrusted ? 'trusted_device' : 'new_device'
  };
}

// Generate location score based on risk assessment
export function scoreLocation(
  country: string,
  isVPN: boolean,
  trustedCountries: string[] = ['AD', 'ES', 'FR', 'PT']
): AttributeScore {
  let score = 70;
  let confidence = 0.8;
  
  if (!trustedCountries.includes(country)) {
    score -= 30;
    confidence -= 0.2;
  }
  
  if (isVPN) {
    score -= 20;
    confidence -= 0.1;
  }
  
  return {
    attribute: 'location',
    score: Math.max(0, score),
    weight: 0.15,
    confidence: Math.max(0.4, confidence),
    lastVerified: new Date(),
    verificationMethod: isVPN ? 'vpn_detected' : 'direct_connection'
  };
}

// Generate session score
export function scoreSession(
  sessionAge: number, // minutes
  activityLevel: number, // 0-1
  hasRecentInteraction: boolean
): AttributeScore {
  let score = 100;
  
  // Decay based on session age
  score -= Math.min(40, sessionAge / 2);
  
  // Boost for activity
  score += activityLevel * 20;
  
  // Penalty for inactivity
  if (!hasRecentInteraction) {
    score -= 30;
  }
  
  return {
    attribute: 'session',
    score: Math.max(0, Math.min(100, Math.round(score))),
    weight: 0.15,
    confidence: hasRecentInteraction ? 0.9 : 0.6,
    lastVerified: new Date(),
    verificationMethod: 'session_analysis'
  };
}
