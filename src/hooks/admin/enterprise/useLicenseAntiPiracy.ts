/**
 * useLicenseAntiPiracy - Hook para protección anti-pirateo
 * Fase 4 - Enterprise SaaS 2025-2026
 * 
 * Funcionalidades:
 * - Detección de anomalías en tiempo real
 * - Análisis de patrones de uso sospechoso
 * - Bloqueo automático de licencias comprometidas
 * - Sistema de puntuación de riesgo
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDeviceFingerprint } from './useDeviceFingerprint';

// === INTERFACES ===
export interface AnomalyPattern {
  type: 'velocity' | 'geographic' | 'device_cloning' | 'concurrent_abuse' | 'time_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  confidence: number;
  detectedAt: string;
}

export interface RiskAssessment {
  overallScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  autoActionTaken?: string;
}

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface SuspiciousActivity {
  id: string;
  licenseId: string;
  activityType: string;
  details: Record<string, unknown>;
  riskScore: number;
  detectedAt: string;
  resolved: boolean;
  resolution?: string;
}

export interface AntiPiracyConfig {
  enableAutoBlock: boolean;
  blockThreshold: number; // Risk score threshold for auto-block
  enableVelocityChecks: boolean;
  enableGeoChecks: boolean;
  enableDeviceCloneDetection: boolean;
  alertOnSuspiciousActivity: boolean;
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
}

// === DEFAULT CONFIG ===
const DEFAULT_CONFIG: AntiPiracyConfig = {
  enableAutoBlock: true,
  blockThreshold: 85,
  enableVelocityChecks: true,
  enableGeoChecks: true,
  enableDeviceCloneDetection: true,
  alertOnSuspiciousActivity: true,
  maxConcurrentSessions: 3,
  sessionTimeoutMinutes: 30
};

// === HOOK ===
export function useLicenseAntiPiracy(config: Partial<AntiPiracyConfig> = {}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyPattern[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [blockedLicenses, setBlockedLicenses] = useState<string[]>([]);
  
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config };
  const { generateFingerprint } = useDeviceFingerprint();
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);

  // === COMPARE FINGERPRINTS ===
  const compareFingerprints = useCallback(async (fp1: string, fp2: string): Promise<number> => {
    // Simple similarity comparison
    if (fp1 === fp2) return 1.0;
    if (!fp1 || !fp2) return 0;
    
    const set1 = new Set(fp1.split(''));
    const set2 = new Set(fp2.split(''));
    const intersection = [...set1].filter(x => set2.has(x)).length;
    const union = new Set([...set1, ...set2]).size;
    
    return intersection / union;
  }, []);

  // === VELOCITY ANOMALY DETECTION ===
  const detectVelocityAnomaly = useCallback(async (
    licenseId: string,
    recentActivations: Array<{ timestamp: string; location?: string }>
  ): Promise<AnomalyPattern | null> => {
    if (!effectiveConfig.enableVelocityChecks || recentActivations.length < 2) {
      return null;
    }

    // Check for impossible travel (activations too close in time but far in location)
    const sortedActivations = [...recentActivations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    for (let i = 0; i < sortedActivations.length - 1; i++) {
      const current = sortedActivations[i];
      const previous = sortedActivations[i + 1];
      
      const timeDiffMinutes = (
        new Date(current.timestamp).getTime() - 
        new Date(previous.timestamp).getTime()
      ) / (1000 * 60);

      // If multiple activations within 5 minutes
      if (timeDiffMinutes < 5) {
        return {
          type: 'velocity',
          severity: timeDiffMinutes < 1 ? 'critical' : 'high',
          description: 'Múltiples activaciones en un período muy corto',
          indicators: [
            `${recentActivations.length} activaciones detectadas`,
            `Intervalo mínimo: ${timeDiffMinutes.toFixed(1)} minutos`
          ],
          confidence: 0.9,
          detectedAt: new Date().toISOString()
        };
      }
    }

    return null;
  }, [effectiveConfig.enableVelocityChecks]);

  // === DEVICE CLONING DETECTION ===
  const detectDeviceCloning = useCallback(async (
    licenseId: string,
    currentFingerprint: string,
    storedFingerprints: string[]
  ): Promise<AnomalyPattern | null> => {
    if (!effectiveConfig.enableDeviceCloneDetection) {
      return null;
    }

    // Check for fingerprints that are suspiciously similar but not identical
    for (const stored of storedFingerprints) {
      const similarity = await compareFingerprints(currentFingerprint, stored);
      
      // If similarity is between 70-95%, it might be a cloned VM or spoofed device
      if (similarity >= 0.70 && similarity < 0.95) {
        return {
          type: 'device_cloning',
          severity: 'high',
          description: 'Posible clonación de dispositivo detectada',
          indicators: [
            `Similitud de huella: ${(similarity * 100).toFixed(1)}%`,
            'Dispositivo podría ser una VM clonada o spoofed'
          ],
          confidence: similarity,
          detectedAt: new Date().toISOString()
        };
      }
    }

    return null;
  }, [effectiveConfig.enableDeviceCloneDetection, compareFingerprints]);

  // === CONCURRENT ABUSE DETECTION ===
  const detectConcurrentAbuse = useCallback(async (
    licenseId: string
  ): Promise<AnomalyPattern | null> => {
    try {
      // Get active sessions for this license
      const { data: activations, error } = await (supabase as any)
        .from('license_device_activations')
        .select('*')
        .eq('license_id', licenseId)
        .eq('is_active', true);

      if (error) throw error;

      const activeCount = activations?.length || 0;
      
      if (activeCount > effectiveConfig.maxConcurrentSessions) {
        return {
          type: 'concurrent_abuse',
          severity: activeCount > effectiveConfig.maxConcurrentSessions * 2 ? 'critical' : 'high',
          description: 'Exceso de sesiones concurrentes',
          indicators: [
            `Sesiones activas: ${activeCount}`,
            `Límite permitido: ${effectiveConfig.maxConcurrentSessions}`,
            `Exceso: ${activeCount - effectiveConfig.maxConcurrentSessions}`
          ],
          confidence: 0.95,
          detectedAt: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('[AntiPiracy] Error detecting concurrent abuse:', error);
      return null;
    }
  }, [effectiveConfig.maxConcurrentSessions]);

  // === TIME PATTERN ANALYSIS ===
  const analyzeTimePatterns = useCallback(async (
    licenseId: string,
    usageLogs: Array<{ timestamp: string; action: string }>
  ): Promise<AnomalyPattern | null> => {
    if (usageLogs.length < 10) return null;

    // Analyze for bot-like patterns (regular intervals, 24/7 usage)
    const hourCounts = new Array(24).fill(0);
    
    usageLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourCounts[hour]++;
    });

    // Check for unusual 24/7 activity (no gaps in usage)
    const activeHours = hourCounts.filter(count => count > 0).length;
    
    if (activeHours >= 22) {
      return {
        type: 'time_pattern',
        severity: 'medium',
        description: 'Patrón de uso inusual (posible automatización)',
        indicators: [
          `Actividad en ${activeHours}/24 horas`,
          'Posible uso automatizado o compartido'
        ],
        confidence: 0.7,
        detectedAt: new Date().toISOString()
      };
    }

    return null;
  }, []);

  // === COMPREHENSIVE RISK ASSESSMENT ===
  const assessRisk = useCallback(async (
    licenseId: string
  ): Promise<RiskAssessment> => {
    setIsAnalyzing(true);
    const detectedAnomalies: AnomalyPattern[] = [];
    const factors: RiskFactor[] = [];

    try {
      // Get license data
      const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', licenseId)
        .single();

      // Get activations
      const { data: activations } = await (supabase as any)
        .from('license_device_activations')
        .select('*')
        .eq('license_id', licenseId)
        .order('activated_at', { ascending: false })
        .limit(50);

      // Get usage logs
      const { data: usageLogs } = await supabase
        .from('license_usage_logs')
        .select('*')
        .eq('license_id', licenseId)
        .order('logged_at', { ascending: false })
        .limit(100) as { data: any[] | null };

      // Run all anomaly detections
      const velocityAnomaly = await detectVelocityAnomaly(
        licenseId,
        (activations || []).map(a => ({ 
          timestamp: a.activated_at, 
          location: (a as any).location 
        }))
      );
      if (velocityAnomaly) detectedAnomalies.push(velocityAnomaly);

      const concurrentAnomaly = await detectConcurrentAbuse(licenseId);
      if (concurrentAnomaly) detectedAnomalies.push(concurrentAnomaly);

      const timeAnomaly = await analyzeTimePatterns(
        licenseId,
        (usageLogs || []).map((l: any) => ({ timestamp: l.logged_at, action: l.feature_key }))
      );
      if (timeAnomaly) detectedAnomalies.push(timeAnomaly);

      // Calculate risk factors
      factors.push({
        name: 'Anomalías detectadas',
        weight: 0.4,
        score: Math.min(detectedAnomalies.length * 25, 100),
        description: `${detectedAnomalies.length} anomalía(s) encontrada(s)`
      });

      factors.push({
        name: 'Severidad máxima',
        weight: 0.3,
        score: calculateSeverityScore(detectedAnomalies),
        description: getMaxSeverity(detectedAnomalies)
      });

      factors.push({
        name: 'Frecuencia de uso',
        weight: 0.15,
        score: calculateUsageFrequencyScore(usageLogs || []),
        description: 'Basado en patrones de uso'
      });

      factors.push({
        name: 'Dispositivos activos',
        weight: 0.15,
        score: calculateDeviceScore(activations || [], license),
        description: `${(activations || []).filter((a: any) => a.is_active).length} dispositivos activos`
      });

      // Calculate overall score
      const overallScore = factors.reduce(
        (sum, factor) => sum + factor.score * factor.weight, 
        0
      );

      const riskLevel = getRiskLevel(overallScore);
      const recommendations = generateRecommendations(riskLevel, detectedAnomalies);

      const assessment: RiskAssessment = {
        overallScore: Math.round(overallScore),
        riskLevel,
        factors,
        recommendations
      };

      // Auto-block if threshold exceeded
      if (effectiveConfig.enableAutoBlock && overallScore >= effectiveConfig.blockThreshold) {
        await blockLicense(licenseId, 'Auto-bloqueado por riesgo elevado');
        assessment.autoActionTaken = 'Licencia bloqueada automáticamente';
        toast.error(`Licencia ${licenseId.slice(0, 8)}... bloqueada por actividad sospechosa`);
      }

      setAnomalies(detectedAnomalies);
      setRiskAssessment(assessment);

      // Log suspicious activity if needed
      if (effectiveConfig.alertOnSuspiciousActivity && riskLevel !== 'safe' && riskLevel !== 'low') {
        await logSuspiciousActivity(licenseId, assessment, detectedAnomalies);
      }

      return assessment;
    } catch (error) {
      console.error('[AntiPiracy] Risk assessment error:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    detectVelocityAnomaly,
    detectConcurrentAbuse,
    analyzeTimePatterns,
    effectiveConfig
  ]);

  // === BLOCK LICENSE ===
  const blockLicense = useCallback(async (
    licenseId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ 
          status: 'suspended',
          suspension_reason: reason,
          suspended_at: new Date().toISOString()
        } as any)
        .eq('id', licenseId);

      if (error) throw error;

      // Create anomaly alert
      await supabase
        .from('license_anomaly_alerts')
        .insert({
          license_id: licenseId,
          alert_type: 'license_blocked',
          severity: 'critical',
          description: reason,
          metadata: { blocked_by: 'anti_piracy_system' },
          status: 'pending'
        } as any);

      setBlockedLicenses(prev => [...prev, licenseId]);
      toast.warning(`Licencia bloqueada: ${reason}`);
      return true;
    } catch (error) {
      console.error('[AntiPiracy] Block license error:', error);
      return false;
    }
  }, []);

  // === UNBLOCK LICENSE ===
  const unblockLicense = useCallback(async (
    licenseId: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ 
          status: 'active',
          suspension_reason: null,
          suspended_at: null
        } as any)
        .eq('id', licenseId);

      if (error) throw error;

      // Update alert as resolved
      await supabase
        .from('license_anomaly_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || 'Desbloqueado manualmente'
        })
        .eq('license_id', licenseId)
        .eq('alert_type', 'license_blocked');

      setBlockedLicenses(prev => prev.filter(id => id !== licenseId));
      toast.success('Licencia desbloqueada correctamente');
      return true;
    } catch (error) {
      console.error('[AntiPiracy] Unblock license error:', error);
      return false;
    }
  }, []);

  // === LOG SUSPICIOUS ACTIVITY ===
  const logSuspiciousActivity = useCallback(async (
    licenseId: string,
    assessment: RiskAssessment,
    anomalies: AnomalyPattern[]
  ) => {
    try {
      await supabase
        .from('license_anomaly_alerts')
        .insert({
          license_id: licenseId,
          alert_type: 'suspicious_activity',
          severity: assessment.riskLevel === 'critical' ? 'critical' : 
                    assessment.riskLevel === 'high' ? 'high' : 'medium',
          description: `Actividad sospechosa detectada (Score: ${assessment.overallScore})`,
          metadata: {
            risk_score: assessment.overallScore,
            anomalies: anomalies.map(a => a.type),
            factors: assessment.factors
          },
          status: 'pending'
        } as any);
    } catch (error) {
      console.error('[AntiPiracy] Log suspicious activity error:', error);
    }
  }, []);

  // === FETCH SUSPICIOUS ACTIVITIES ===
  const fetchSuspiciousActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('license_anomaly_alerts')
        .select('*')
        .in('alert_type', ['suspicious_activity', 'license_blocked'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSuspiciousActivities((data || []).map((alert: any) => ({
        id: alert.id,
        licenseId: alert.license_id,
        activityType: alert.alert_type,
        details: (alert.details as Record<string, unknown>) || {},
        riskScore: ((alert.details as any)?.risk_score as number) || 0,
        detectedAt: alert.created_at,
        resolved: alert.status === 'resolved',
        resolution: alert.resolution_notes || undefined
      })));
    } catch (error) {
      console.error('[AntiPiracy] Fetch suspicious activities error:', error);
    }
  }, []);

  // === START CONTINUOUS MONITORING ===
  const startMonitoring = useCallback((intervalMs = 300000) => { // Default 5 min
    stopMonitoring();
    fetchSuspiciousActivities();
    
    analysisInterval.current = setInterval(() => {
      fetchSuspiciousActivities();
    }, intervalMs);
  }, [fetchSuspiciousActivities]);

  const stopMonitoring = useCallback(() => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return {
    // State
    isAnalyzing,
    anomalies,
    riskAssessment,
    suspiciousActivities,
    blockedLicenses,
    config: effectiveConfig,
    // Actions
    assessRisk,
    blockLicense,
    unblockLicense,
    detectVelocityAnomaly,
    detectDeviceCloning,
    detectConcurrentAbuse,
    analyzeTimePatterns,
    fetchSuspiciousActivities,
    startMonitoring,
    stopMonitoring
  };
}

// === HELPER FUNCTIONS ===
function calculateSeverityScore(anomalies: AnomalyPattern[]): number {
  if (anomalies.length === 0) return 0;
  
  const severityMap = { low: 25, medium: 50, high: 75, critical: 100 };
  const maxSeverity = anomalies.reduce((max, a) => {
    return Math.max(max, severityMap[a.severity]);
  }, 0);
  
  return maxSeverity;
}

function getMaxSeverity(anomalies: AnomalyPattern[]): string {
  if (anomalies.length === 0) return 'Sin anomalías';
  
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  for (const severity of severityOrder) {
    if (anomalies.some(a => a.severity === severity)) {
      return `Severidad: ${severity}`;
    }
  }
  return 'Desconocido';
}

function calculateUsageFrequencyScore(logs: any[]): number {
  if (logs.length === 0) return 0;
  
  // High frequency might indicate sharing
  const hoursSpan = logs.length > 1 
    ? (new Date(logs[0].used_at).getTime() - new Date(logs[logs.length - 1].used_at).getTime()) / (1000 * 60 * 60)
    : 24;
  
  const avgPerHour = logs.length / Math.max(hoursSpan, 1);
  
  // More than 10 actions per hour is suspicious
  if (avgPerHour > 10) return 80;
  if (avgPerHour > 5) return 50;
  if (avgPerHour > 2) return 25;
  return 0;
}

function calculateDeviceScore(activations: any[], license: any): number {
  const activeDevices = activations.filter(a => a.is_active).length;
  const maxDevices = license?.max_devices || 3;
  
  if (activeDevices > maxDevices * 2) return 100;
  if (activeDevices > maxDevices) return 75;
  if (activeDevices === maxDevices) return 50;
  return 0;
}

function getRiskLevel(score: number): RiskAssessment['riskLevel'] {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'safe';
}

function generateRecommendations(
  riskLevel: RiskAssessment['riskLevel'],
  anomalies: AnomalyPattern[]
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'critical') {
    recommendations.push('Bloquear licencia inmediatamente');
    recommendations.push('Contactar al cliente para verificación');
    recommendations.push('Revisar historial completo de actividad');
  } else if (riskLevel === 'high') {
    recommendations.push('Monitorear de cerca las próximas 24 horas');
    recommendations.push('Considerar reducir límite de dispositivos');
    recommendations.push('Enviar notificación de advertencia');
  } else if (riskLevel === 'medium') {
    recommendations.push('Revisar patrones de uso semanalmente');
    recommendations.push('Verificar dispositivos registrados');
  }

  // Specific recommendations per anomaly type
  anomalies.forEach(anomaly => {
    switch (anomaly.type) {
      case 'velocity':
        recommendations.push('Implementar cooldown entre activaciones');
        break;
      case 'device_cloning':
        recommendations.push('Requerir re-autenticación del dispositivo');
        break;
      case 'concurrent_abuse':
        recommendations.push('Forzar cierre de sesiones antiguas');
        break;
      case 'time_pattern':
        recommendations.push('Verificar si es uso legítimo automatizado');
        break;
    }
  });

  return [...new Set(recommendations)]; // Remove duplicates
}

export default useLicenseAntiPiracy;
