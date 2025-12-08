import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TransactionContext {
  amount: number;
  currency: string;
  type: 'transfer' | 'payment' | 'withdrawal' | 'deposit' | 'trade' | 'other';
  recipientId?: string;
  recipientCountry?: string;
  merchantCategory?: string;
  channel: 'web' | 'mobile' | 'api' | 'branch';
  ipAddress?: string;
  deviceId?: string;
  timestamp: Date;
}

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  rule: string;
  recommendation: string;
}

interface AMLAlert {
  id: string;
  type: 'structuring' | 'layering' | 'smurfing' | 'velocity' | 'unusual_pattern' | 'sanctioned_country' | 'pep' | 'high_risk_merchant';
  severity: 'info' | 'warning' | 'alert' | 'critical';
  description: string;
  transactionIds: string[];
  totalAmount: number;
  timeframe: string;
  recommendations: string[];
}

interface RiskProfile {
  overallScore: number;
  kycStatus: 'verified' | 'pending' | 'expired' | 'failed';
  pepStatus: boolean;
  sanctionsCheck: 'clear' | 'match' | 'potential_match';
  adverseMedia: boolean;
  transactionRiskScore: number;
  behaviorRiskScore: number;
  geographicRiskScore: number;
  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
}

interface UseAMLFraudDetectionReturn {
  isAnalyzing: boolean;
  fraudIndicators: FraudIndicator[];
  amlAlerts: AMLAlert[];
  riskProfile: RiskProfile | null;
  overallFraudScore: number;
  analyzeTransaction: (context: TransactionContext) => Promise<{
    approved: boolean;
    score: number;
    indicators: FraudIndicator[];
    requiresReview: boolean;
    blockReason?: string;
  }>;
  checkAMLCompliance: (amount: number, recipientCountry?: string) => Promise<{
    compliant: boolean;
    alerts: AMLAlert[];
    requiresEnhancedDueDiligence: boolean;
  }>;
  getUserRiskProfile: () => Promise<RiskProfile>;
  reportSuspiciousActivity: (description: string, evidence: any) => Promise<boolean>;
}

// High-risk countries for AML purposes (FATF grey/black list)
const HIGH_RISK_COUNTRIES = [
  'KP', 'IR', 'MM', 'SY', 'YE', 'AF', 'PK', 'VE', 'NG', 'ZW'
];

// Sanctioned countries
const SANCTIONED_COUNTRIES = ['KP', 'IR', 'SY', 'CU', 'RU', 'BY'];

// High-risk merchant categories (MCC)
const HIGH_RISK_MCCS = [
  '7995', // Gambling
  '7801', // Government-licensed casinos
  '5967', // Direct marketing - telemarketing
  '4829', // Money transfer
  '6012', // Financial institutions - merchandise and services
];

export function useAMLFraudDetection(): UseAMLFraudDetectionReturn {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fraudIndicators, setFraudIndicators] = useState<FraudIndicator[]>([]);
  const [amlAlerts, setAmlAlerts] = useState<AMLAlert[]>([]);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [overallFraudScore, setOverallFraudScore] = useState(0);

  // Velocity analysis - check transaction frequency patterns
  const analyzeVelocity = useCallback(async (
    userId: string,
    amount: number,
    timeWindowMinutes: number = 60
  ): Promise<{ suspicious: boolean; indicator?: FraudIndicator }> => {
    try {
      const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();
      
      // Mock transaction count - in production would query actual transactions
      // For demo purposes, we'll use session data
      const recentTransactions = Math.floor(Math.random() * 5);
      const totalAmount = recentTransactions * (amount * 0.8);

      // Check for velocity anomalies
      if (recentTransactions >= 5) {
        return {
          suspicious: true,
          indicator: {
            type: 'velocity_high',
            severity: 'high',
            score: 35,
            description: `${recentTransactions} transacciones en ${timeWindowMinutes} minutos`,
            rule: 'VELOCITY_001',
            recommendation: 'Verificar identidad del usuario y confirmar actividad legítima'
          }
        };
      }

      // Check for structuring (splitting large amounts)
      if (amount >= 2500 && amount <= 3000 && recentTransactions >= 2) {
        return {
          suspicious: true,
          indicator: {
            type: 'potential_structuring',
            severity: 'critical',
            score: 50,
            description: 'Posible fraccionamiento para evitar reportes (€3000 threshold)',
            rule: 'AML_STRUCT_001',
            recommendation: 'Escalar a Compliance Officer para revisión manual'
          }
        };
      }

      return { suspicious: false };
    } catch (error) {
      console.error('Velocity analysis error:', error);
      return { suspicious: false };
    }
  }, []);

  // Geographic risk analysis
  const analyzeGeographicRisk = useCallback((
    recipientCountry?: string,
    ipCountry?: string
  ): { score: number; indicators: FraudIndicator[] } => {
    const indicators: FraudIndicator[] = [];
    let score = 0;

    if (recipientCountry) {
      if (SANCTIONED_COUNTRIES.includes(recipientCountry)) {
        score += 100;
        indicators.push({
          type: 'sanctioned_country',
          severity: 'critical',
          score: 100,
          description: `Destinatario en país sancionado: ${recipientCountry}`,
          rule: 'SANCTION_001',
          recommendation: 'BLOQUEAR TRANSACCIÓN - País bajo sanciones internacionales'
        });
      } else if (HIGH_RISK_COUNTRIES.includes(recipientCountry)) {
        score += 40;
        indicators.push({
          type: 'high_risk_country',
          severity: 'high',
          score: 40,
          description: `Destinatario en país de alto riesgo: ${recipientCountry}`,
          rule: 'GEO_RISK_001',
          recommendation: 'Requiere Enhanced Due Diligence (EDD)'
        });
      }
    }

    // Check for IP/recipient country mismatch
    if (ipCountry && recipientCountry && ipCountry !== recipientCountry) {
      const bothHighRisk = HIGH_RISK_COUNTRIES.includes(ipCountry) || HIGH_RISK_COUNTRIES.includes(recipientCountry);
      if (bothHighRisk) {
        score += 25;
        indicators.push({
          type: 'geo_mismatch',
          severity: 'medium',
          score: 25,
          description: `IP desde ${ipCountry} enviando a ${recipientCountry}`,
          rule: 'GEO_MISMATCH_001',
          recommendation: 'Verificar ubicación del usuario'
        });
      }
    }

    return { score, indicators };
  }, []);

  // Merchant category risk analysis
  const analyzeMerchantRisk = useCallback((
    mcc?: string
  ): { score: number; indicator?: FraudIndicator } => {
    if (!mcc) return { score: 0 };

    if (HIGH_RISK_MCCS.includes(mcc)) {
      return {
        score: 30,
        indicator: {
          type: 'high_risk_merchant',
          severity: 'medium',
          score: 30,
          description: `Categoría de comercio de alto riesgo: ${mcc}`,
          rule: 'MCC_RISK_001',
          recommendation: 'Aplicar controles adicionales para esta categoría'
        }
      };
    }

    return { score: 0 };
  }, []);

  // Amount anomaly detection
  const analyzeAmountAnomaly = useCallback(async (
    userId: string,
    amount: number
  ): Promise<{ anomaly: boolean; indicator?: FraudIndicator }> => {
    try {
      // Get user's typical transaction patterns
      const { data: patterns } = await supabase
        .from('user_behavior_patterns')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!patterns) {
        // New user - flag large transactions
        if (amount > 5000) {
          return {
            anomaly: true,
            indicator: {
              type: 'large_first_transaction',
              severity: 'high',
              score: 35,
              description: `Primera transacción grande: €${amount.toFixed(2)}`,
              rule: 'NEW_USER_LARGE_001',
              recommendation: 'Verificar identidad y fuente de fondos'
            }
          };
        }
        return { anomaly: false };
      }

      // Compare with historical patterns (mock calculation)
      const avgTransaction = 500; // Would come from actual data
      const stdDev = 200;
      const zScore = (amount - avgTransaction) / stdDev;

      if (zScore > 3) {
        return {
          anomaly: true,
          indicator: {
            type: 'amount_anomaly',
            severity: 'high',
            score: 30,
            description: `Monto ${(zScore).toFixed(1)}x superior al promedio del usuario`,
            rule: 'AMOUNT_ANOM_001',
            recommendation: 'Confirmar transacción con el cliente'
          }
        };
      }

      return { anomaly: false };
    } catch (error) {
      console.error('Amount analysis error:', error);
      return { anomaly: false };
    }
  }, []);

  // Main transaction analysis
  const analyzeTransaction = useCallback(async (
    context: TransactionContext
  ): Promise<{
    approved: boolean;
    score: number;
    indicators: FraudIndicator[];
    requiresReview: boolean;
    blockReason?: string;
  }> => {
    if (!user?.id) {
      return {
        approved: false,
        score: 100,
        indicators: [],
        requiresReview: false,
        blockReason: 'Usuario no autenticado'
      };
    }

    setIsAnalyzing(true);
    const indicators: FraudIndicator[] = [];
    let totalScore = 0;

    try {
      // 1. Velocity analysis
      const velocityResult = await analyzeVelocity(user.id, context.amount);
      if (velocityResult.suspicious && velocityResult.indicator) {
        indicators.push(velocityResult.indicator);
        totalScore += velocityResult.indicator.score;
      }

      // 2. Geographic risk
      const geoResult = analyzeGeographicRisk(context.recipientCountry);
      indicators.push(...geoResult.indicators);
      totalScore += geoResult.score;

      // 3. Merchant risk
      const merchantResult = analyzeMerchantRisk(context.merchantCategory);
      if (merchantResult.indicator) {
        indicators.push(merchantResult.indicator);
        totalScore += merchantResult.score;
      }

      // 4. Amount anomaly
      const amountResult = await analyzeAmountAnomaly(user.id, context.amount);
      if (amountResult.anomaly && amountResult.indicator) {
        indicators.push(amountResult.indicator);
        totalScore += amountResult.indicator.score;
      }

      // 5. Time-based risk (unusual hours)
      const hour = context.timestamp.getHours();
      if (hour >= 1 && hour <= 5 && context.amount > 1000) {
        const nightIndicator: FraudIndicator = {
          type: 'unusual_time',
          severity: 'medium',
          score: 15,
          description: `Transacción nocturna de alto valor (${hour}:00)`,
          rule: 'TIME_RISK_001',
          recommendation: 'Verificar que el usuario realizó la transacción'
        };
        indicators.push(nightIndicator);
        totalScore += 15;
      }

      // 6. Channel risk
      if (context.channel === 'api' && context.amount > 3000) {
        const apiIndicator: FraudIndicator = {
          type: 'api_high_value',
          severity: 'medium',
          score: 20,
          description: 'Transacción de alto valor via API',
          rule: 'CHANNEL_API_001',
          recommendation: 'Verificar autenticación API y permisos'
        };
        indicators.push(apiIndicator);
        totalScore += 20;
      }

      setFraudIndicators(indicators);
      setOverallFraudScore(Math.min(100, totalScore));

      // Decision logic
      let approved = true;
      let blockReason: string | undefined;
      let requiresReview = false;

      if (totalScore >= 80) {
        approved = false;
        blockReason = 'Puntuación de riesgo crítica - transacción bloqueada';
        requiresReview = true;
      } else if (totalScore >= 50) {
        requiresReview = true;
      }

      // Log the analysis
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'FRAUD_ANALYSIS',
        table_name: 'transactions',
        new_data: {
          score: totalScore,
          approved,
          indicators: indicators.map(i => i.type),
          amount: context.amount,
          channel: context.channel
        }
      });

      return {
        approved,
        score: totalScore,
        indicators,
        requiresReview,
        blockReason
      };
    } catch (error) {
      console.error('Transaction analysis error:', error);
      return {
        approved: false,
        score: 100,
        indicators: [],
        requiresReview: true,
        blockReason: 'Error en análisis - requiere revisión manual'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [user?.id, analyzeVelocity, analyzeGeographicRisk, analyzeMerchantRisk, analyzeAmountAnomaly]);

  // AML compliance check
  const checkAMLCompliance = useCallback(async (
    amount: number,
    recipientCountry?: string
  ): Promise<{
    compliant: boolean;
    alerts: AMLAlert[];
    requiresEnhancedDueDiligence: boolean;
  }> => {
    const alerts: AMLAlert[] = [];
    let requiresEDD = false;

    // Check reporting thresholds
    if (amount >= 10000) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'velocity',
        severity: 'warning',
        description: 'Transacción supera umbral de reporte obligatorio (€10,000)',
        transactionIds: [],
        totalAmount: amount,
        timeframe: 'single_transaction',
        recommendations: [
          'Generar CTR (Currency Transaction Report)',
          'Verificar fuente de fondos documentada'
        ]
      });
    }

    // Check for sanctioned country
    if (recipientCountry && SANCTIONED_COUNTRIES.includes(recipientCountry)) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'sanctioned_country',
        severity: 'critical',
        description: `País destinatario bajo sanciones: ${recipientCountry}`,
        transactionIds: [],
        totalAmount: amount,
        timeframe: 'immediate',
        recommendations: [
          'BLOQUEAR TRANSACCIÓN INMEDIATAMENTE',
          'Reportar a SEPBLAC/autoridad competente',
          'Congelar cuenta temporalmente'
        ]
      });
      requiresEDD = true;
    }

    // High-risk country EDD
    if (recipientCountry && HIGH_RISK_COUNTRIES.includes(recipientCountry)) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'high_risk_merchant',
        severity: 'alert',
        description: `Transacción a país de alto riesgo AML: ${recipientCountry}`,
        transactionIds: [],
        totalAmount: amount,
        timeframe: 'transaction',
        recommendations: [
          'Aplicar Enhanced Due Diligence',
          'Documentar propósito de la transacción',
          'Verificar origen de fondos'
        ]
      });
      requiresEDD = true;
    }

    // Potential structuring detection (multiple amounts just under threshold)
    if (amount >= 9000 && amount < 10000) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'structuring',
        severity: 'warning',
        description: 'Monto cercano a umbral de reporte - posible fraccionamiento',
        transactionIds: [],
        totalAmount: amount,
        timeframe: 'potential_pattern',
        recommendations: [
          'Revisar transacciones recientes del cliente',
          'Evaluar si existe patrón de fraccionamiento',
          'Considerar SAR si se confirma patrón'
        ]
      });
    }

    setAmlAlerts(alerts);

    const hasCritical = alerts.some(a => a.severity === 'critical');

    return {
      compliant: !hasCritical,
      alerts,
      requiresEnhancedDueDiligence: requiresEDD
    };
  }, []);

  // Get user risk profile
  const getUserRiskProfile = useCallback(async (): Promise<RiskProfile> => {
    const defaultProfile: RiskProfile = {
      overallScore: 20,
      kycStatus: 'verified',
      pepStatus: false,
      sanctionsCheck: 'clear',
      adverseMedia: false,
      transactionRiskScore: 15,
      behaviorRiskScore: 10,
      geographicRiskScore: 5,
      lastReviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };

    if (!user?.id) {
      return defaultProfile;
    }

    try {
      // Get user's historical data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Calculate risk based on profile data
        const riskProfile = {
          ...defaultProfile,
          // These would be calculated from actual user data
          transactionRiskScore: Math.random() * 30,
          behaviorRiskScore: Math.random() * 20,
          geographicRiskScore: 5
        };

        riskProfile.overallScore = (
          riskProfile.transactionRiskScore + 
          riskProfile.behaviorRiskScore + 
          riskProfile.geographicRiskScore
        ) / 3;

        setRiskProfile(riskProfile);
        return riskProfile;
      }

      return defaultProfile;
    } catch (error) {
      console.error('Error getting risk profile:', error);
      return defaultProfile;
    }
  }, [user?.id]);

  // Report suspicious activity (SAR)
  const reportSuspiciousActivity = useCallback(async (
    description: string,
    evidence: any
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'SAR_REPORT',
        table_name: 'compliance',
        new_data: {
          description,
          evidence,
          reported_at: new Date().toISOString(),
          status: 'pending_review'
        }
      });

      return true;
    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
      return false;
    }
  }, [user?.id]);

  // Load risk profile on mount
  useEffect(() => {
    if (user?.id) {
      getUserRiskProfile();
    }
  }, [user?.id, getUserRiskProfile]);

  return {
    isAnalyzing,
    fraudIndicators,
    amlAlerts,
    riskProfile,
    overallFraudScore,
    analyzeTransaction,
    checkAMLCompliance,
    getUserRiskProfile,
    reportSuspiciousActivity
  };
}
