// License Reporting & Analytics Hook - Phase 6
// Enterprise License System 2025

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface LicenseMetrics {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  suspendedLicenses: number;
  revokedLicenses: number;
  totalRevenue: number;
  averageLicenseValue: number;
  renewalRate: number;
  churnRate: number;
  activationRate: number;
}

export interface LicenseUsageTrend {
  date: string;
  activations: number;
  deactivations: number;
  validations: number;
  anomalies: number;
  revenue: number;
}

export interface LicenseTierDistribution {
  tier: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface ExpirationForecast {
  period: string;
  count: number;
  potentialRevenue: number;
  licenses: Array<{
    id: string;
    companyName: string;
    expiresAt: string;
    tier: string;
    value: number;
  }>;
}

export interface LicenseReport {
  id: string;
  reportType: 'usage' | 'revenue' | 'compliance' | 'anomaly' | 'custom';
  title: string;
  description: string;
  generatedAt: string;
  generatedBy: string;
  parameters: Record<string, unknown>;
  data: Record<string, unknown>;
  format: 'json' | 'csv' | 'pdf' | 'excel';
  fileUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface AutomationRule {
  id: string;
  ruleName: string;
  ruleType: 'renewal_reminder' | 'expiration_warning' | 'usage_alert' | 'anomaly_response' | 'auto_suspend';
  isActive: boolean;
  conditions: {
    daysBeforeExpiry?: number;
    usageThreshold?: number;
    anomalyType?: string;
    triggerCount?: number;
  };
  actions: {
    sendEmail?: boolean;
    sendNotification?: boolean;
    suspendLicense?: boolean;
    createTask?: boolean;
    webhookUrl?: string;
  };
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

export interface ScheduledNotification {
  id: string;
  licenseId: string;
  notificationType: 'renewal' | 'expiration' | 'usage' | 'anomaly';
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  recipient: string;
  subject: string;
  content: string;
  sentAt?: string;
}

// === HOOK ===
export function useLicenseReporting() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<LicenseMetrics | null>(null);
  const [usageTrends, setUsageTrends] = useState<LicenseUsageTrend[]>([]);
  const [tierDistribution, setTierDistribution] = useState<LicenseTierDistribution[]>([]);
  const [expirationForecast, setExpirationForecast] = useState<ExpirationForecast[]>([]);
  const [reports, setReports] = useState<LicenseReport[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH METRICS ===
  const fetchMetrics = useCallback(async (dateRange?: { start: string; end: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch licenses data
      const { data: licenses, error: licensesError } = await (supabase as any)
        .from('enterprise_licenses')
        .select('*');

      if (licensesError) throw licensesError;

      const now = new Date();
      const licensesData = licenses || [];

      // Calculate metrics
      const totalLicenses = licensesData.length;
      const activeLicenses = licensesData.filter((l: any) => l.status === 'active').length;
      const expiredLicenses = licensesData.filter((l: any) => l.status === 'expired').length;
      const suspendedLicenses = licensesData.filter((l: any) => l.status === 'suspended').length;
      const revokedLicenses = licensesData.filter((l: any) => l.status === 'revoked').length;

      // Revenue calculations (mock - would come from billing system)
      const tierPrices: Record<string, number> = {
        'starter': 99,
        'professional': 299,
        'enterprise': 999,
        'unlimited': 2499
      };

      const totalRevenue = licensesData.reduce((sum: number, l: any) => {
        return sum + (tierPrices[l.license_tier] || 0);
      }, 0);

      const averageLicenseValue = totalLicenses > 0 ? totalRevenue / totalLicenses : 0;

      // Renewal rate (mock calculation)
      const renewalRate = totalLicenses > 0 ? (activeLicenses / totalLicenses) * 100 : 0;
      const churnRate = 100 - renewalRate;

      // Activation rate
      const activatedLicenses = licensesData.filter((l: any) => l.activated_at).length;
      const activationRate = totalLicenses > 0 ? (activatedLicenses / totalLicenses) * 100 : 0;

      const calculatedMetrics: LicenseMetrics = {
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        suspendedLicenses,
        revokedLicenses,
        totalRevenue,
        averageLicenseValue,
        renewalRate,
        churnRate,
        activationRate
      };

      setMetrics(calculatedMetrics);
      setLastRefresh(new Date());

      return calculatedMetrics;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching metrics';
      setError(message);
      console.error('[useLicenseReporting] fetchMetrics error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH USAGE TRENDS ===
  const fetchUsageTrends = useCallback(async (days: number = 30) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch device activations for trends
      const { data: activations, error: activationsError } = await (supabase as any)
        .from('license_device_activations')
        .select('*')
        .gte('activated_at', startDate.toISOString())
        .lte('activated_at', endDate.toISOString());

      if (activationsError) throw activationsError;

      // Fetch validation logs
      const { data: validations, error: validationsError } = await (supabase as any)
        .from('license_validation_logs')
        .select('*')
        .gte('validated_at', startDate.toISOString())
        .lte('validated_at', endDate.toISOString());

      if (validationsError) throw validationsError;

      // Fetch anomalies
      const { data: anomalies, error: anomaliesError } = await (supabase as any)
        .from('license_anomaly_alerts')
        .select('*')
        .gte('detected_at', startDate.toISOString())
        .lte('detected_at', endDate.toISOString());

      if (anomaliesError) throw anomaliesError;

      // Group by date
      const trendMap = new Map<string, LicenseUsageTrend>();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        trendMap.set(dateStr, {
          date: dateStr,
          activations: 0,
          deactivations: 0,
          validations: 0,
          anomalies: 0,
          revenue: 0
        });
      }

      // Count activations
      (activations || []).forEach((a: any) => {
        const dateStr = new Date(a.activated_at).toISOString().split('T')[0];
        const trend = trendMap.get(dateStr);
        if (trend) {
          if (a.is_active) {
            trend.activations++;
          } else {
            trend.deactivations++;
          }
        }
      });

      // Count validations
      (validations || []).forEach((v: any) => {
        const dateStr = new Date(v.validated_at).toISOString().split('T')[0];
        const trend = trendMap.get(dateStr);
        if (trend) {
          trend.validations++;
        }
      });

      // Count anomalies
      (anomalies || []).forEach((a: any) => {
        const dateStr = new Date(a.detected_at).toISOString().split('T')[0];
        const trend = trendMap.get(dateStr);
        if (trend) {
          trend.anomalies++;
        }
      });

      const trends = Array.from(trendMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setUsageTrends(trends);
      return trends;
    } catch (err) {
      console.error('[useLicenseReporting] fetchUsageTrends error:', err);
      return [];
    }
  }, []);

  // === FETCH TIER DISTRIBUTION ===
  const fetchTierDistribution = useCallback(async () => {
    try {
      const { data: licenses, error } = await (supabase as any)
        .from('enterprise_licenses')
        .select('license_tier, status');

      if (error) throw error;

      const tierPrices: Record<string, number> = {
        'starter': 99,
        'professional': 299,
        'enterprise': 999,
        'unlimited': 2499
      };

      const tierCounts = new Map<string, { count: number; revenue: number }>();

      (licenses || []).forEach((l: any) => {
        const tier = l.license_tier || 'unknown';
        const current = tierCounts.get(tier) || { count: 0, revenue: 0 };
        current.count++;
        current.revenue += tierPrices[tier] || 0;
        tierCounts.set(tier, current);
      });

      const total = licenses?.length || 1;
      const distribution: LicenseTierDistribution[] = Array.from(tierCounts.entries()).map(
        ([tier, data]) => ({
          tier,
          count: data.count,
          percentage: (data.count / total) * 100,
          revenue: data.revenue
        })
      );

      setTierDistribution(distribution);
      return distribution;
    } catch (err) {
      console.error('[useLicenseReporting] fetchTierDistribution error:', err);
      return [];
    }
  }, []);

  // === FETCH EXPIRATION FORECAST ===
  const fetchExpirationForecast = useCallback(async () => {
    try {
      const { data: licenses, error } = await (supabase as any)
        .from('enterprise_licenses')
        .select('*, companies(name)')
        .eq('status', 'active')
        .order('expires_at', { ascending: true });

      if (error) throw error;

      const tierPrices: Record<string, number> = {
        'starter': 99,
        'professional': 299,
        'enterprise': 999,
        'unlimited': 2499
      };

      const now = new Date();
      const periods = [
        { label: '7 días', days: 7 },
        { label: '30 días', days: 30 },
        { label: '60 días', days: 60 },
        { label: '90 días', days: 90 }
      ];

      const forecast: ExpirationForecast[] = periods.map(period => {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + period.days);

        const expiringLicenses = (licenses || []).filter((l: any) => {
          const expiresAt = new Date(l.expires_at);
          return expiresAt >= now && expiresAt <= endDate;
        });

        return {
          period: period.label,
          count: expiringLicenses.length,
          potentialRevenue: expiringLicenses.reduce((sum: number, l: any) => 
            sum + (tierPrices[l.license_tier] || 0), 0
          ),
          licenses: expiringLicenses.map((l: any) => ({
            id: l.id,
            companyName: l.companies?.name || 'Unknown',
            expiresAt: l.expires_at,
            tier: l.license_tier,
            value: tierPrices[l.license_tier] || 0
          }))
        };
      });

      setExpirationForecast(forecast);
      return forecast;
    } catch (err) {
      console.error('[useLicenseReporting] fetchExpirationForecast error:', err);
      return [];
    }
  }, []);

  // === GENERATE REPORT ===
  const generateReport = useCallback(async (
    reportType: LicenseReport['reportType'],
    parameters: Record<string, unknown>,
    format: LicenseReport['format'] = 'json'
  ): Promise<LicenseReport | null> => {
    try {
      const reportId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create initial report record
      const report: LicenseReport = {
        id: reportId,
        reportType,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        description: `Generated ${reportType} report`,
        generatedAt: now,
        generatedBy: 'system',
        parameters,
        data: {},
        format,
        status: 'generating'
      };

      setReports(prev => [report, ...prev]);

      // Generate report data based on type
      let reportData: Record<string, unknown> = {};

      switch (reportType) {
        case 'usage':
          const trends = await fetchUsageTrends(30);
          reportData = {
            trends,
            summary: {
              totalActivations: trends.reduce((sum, t) => sum + t.activations, 0),
              totalValidations: trends.reduce((sum, t) => sum + t.validations, 0),
              totalAnomalies: trends.reduce((sum, t) => sum + t.anomalies, 0)
            }
          };
          break;

        case 'revenue':
          const metricsData = await fetchMetrics();
          const distribution = await fetchTierDistribution();
          reportData = {
            metrics: metricsData,
            tierDistribution: distribution
          };
          break;

        case 'compliance':
          const { data: validationLogs } = await (supabase as any)
            .from('license_validation_logs')
            .select('*')
            .order('validated_at', { ascending: false })
            .limit(1000);

          reportData = {
            validationLogs: validationLogs || [],
            complianceScore: 95, // Mock score
            findings: []
          };
          break;

        case 'anomaly':
          const { data: anomalyAlerts } = await (supabase as any)
            .from('license_anomaly_alerts')
            .select('*')
            .order('detected_at', { ascending: false });

          reportData = {
            anomalies: anomalyAlerts || [],
            riskAssessment: 'medium'
          };
          break;
      }

      // Update report with data
      const completedReport: LicenseReport = {
        ...report,
        data: reportData,
        status: 'completed'
      };

      setReports(prev => prev.map(r => r.id === reportId ? completedReport : r));
      toast.success('Reporte generado exitosamente');

      return completedReport;
    } catch (err) {
      console.error('[useLicenseReporting] generateReport error:', err);
      toast.error('Error al generar reporte');
      return null;
    }
  }, [fetchUsageTrends, fetchMetrics, fetchTierDistribution]);

  // === EXPORT REPORT ===
  const exportReport = useCallback(async (
    report: LicenseReport,
    format: 'csv' | 'json' | 'excel'
  ): Promise<string | null> => {
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'csv':
          // Convert data to CSV
          const flatData = Object.entries(report.data).map(([key, value]) => ({
            key,
            value: JSON.stringify(value)
          }));
          content = 'Key,Value\n' + flatData.map(d => `"${d.key}","${d.value}"`).join('\n');
          mimeType = 'text/csv';
          extension = 'csv';
          break;

        case 'json':
          content = JSON.stringify(report, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;

        case 'excel':
          // For Excel, we'd use a library like xlsx
          // For now, export as CSV
          const excelData = Object.entries(report.data).map(([key, value]) => ({
            key,
            value: JSON.stringify(value)
          }));
          content = 'Key,Value\n' + excelData.map(d => `"${d.key}","${d.value}"`).join('\n');
          mimeType = 'text/csv';
          extension = 'csv';
          break;

        default:
          throw new Error('Unsupported format');
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.reportType}-report-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Reporte exportado');
      return url;
    } catch (err) {
      console.error('[useLicenseReporting] exportReport error:', err);
      toast.error('Error al exportar reporte');
      return null;
    }
  }, []);

  // === AUTOMATION RULES ===
  const createAutomationRule = useCallback(async (
    rule: Omit<AutomationRule, 'id' | 'lastTriggered' | 'triggerCount' | 'createdAt'>
  ): Promise<AutomationRule | null> => {
    try {
      const newRule: AutomationRule = {
        ...rule,
        id: crypto.randomUUID(),
        triggerCount: 0,
        createdAt: new Date().toISOString()
      };

      // Store in local state (would be persisted to DB in production)
      setAutomationRules(prev => [...prev, newRule]);
      toast.success('Regla de automatización creada');

      return newRule;
    } catch (err) {
      console.error('[useLicenseReporting] createAutomationRule error:', err);
      toast.error('Error al crear regla');
      return null;
    }
  }, []);

  const updateAutomationRule = useCallback(async (
    ruleId: string,
    updates: Partial<AutomationRule>
  ): Promise<boolean> => {
    try {
      setAutomationRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, ...updates } : r
      ));
      toast.success('Regla actualizada');
      return true;
    } catch (err) {
      console.error('[useLicenseReporting] updateAutomationRule error:', err);
      toast.error('Error al actualizar regla');
      return false;
    }
  }, []);

  const deleteAutomationRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      setAutomationRules(prev => prev.filter(r => r.id !== ruleId));
      toast.success('Regla eliminada');
      return true;
    } catch (err) {
      console.error('[useLicenseReporting] deleteAutomationRule error:', err);
      toast.error('Error al eliminar regla');
      return false;
    }
  }, []);

  // === EXECUTE AUTOMATION RULES ===
  const executeAutomationRules = useCallback(async (): Promise<number> => {
    try {
      let triggeredCount = 0;

      for (const rule of automationRules) {
        if (!rule.isActive) continue;

        let shouldTrigger = false;

        switch (rule.ruleType) {
          case 'renewal_reminder':
          case 'expiration_warning':
            if (rule.conditions.daysBeforeExpiry) {
              const { data: expiringLicenses } = await (supabase as any)
                .from('enterprise_licenses')
                .select('*')
                .eq('status', 'active')
                .lte('expires_at', new Date(Date.now() + rule.conditions.daysBeforeExpiry * 24 * 60 * 60 * 1000).toISOString());

              shouldTrigger = (expiringLicenses?.length || 0) > 0;
            }
            break;

          case 'usage_alert':
            // Check usage thresholds
            if (rule.conditions.usageThreshold) {
              const { data: licenses } = await (supabase as any)
                .from('enterprise_licenses')
                .select('*, license_device_activations(count)');

              // Check if any license exceeds threshold
              shouldTrigger = (licenses || []).some((l: any) => {
                const usage = l.license_device_activations?.[0]?.count || 0;
                return usage >= (rule.conditions.usageThreshold || 0);
              });
            }
            break;

          case 'anomaly_response':
            const { data: unresolvedAnomalies } = await (supabase as any)
              .from('license_anomaly_alerts')
              .select('*')
              .eq('status', 'pending');

            shouldTrigger = (unresolvedAnomalies?.length || 0) >= (rule.conditions.triggerCount || 1);
            break;
        }

        if (shouldTrigger) {
          triggeredCount++;

          // Execute actions
          if (rule.actions.sendNotification) {
            toast.info(`Regla activada: ${rule.ruleName}`);
          }

          // Update rule
          setAutomationRules(prev => prev.map(r => 
            r.id === rule.id 
              ? { ...r, lastTriggered: new Date().toISOString(), triggerCount: r.triggerCount + 1 }
              : r
          ));
        }
      }

      return triggeredCount;
    } catch (err) {
      console.error('[useLicenseReporting] executeAutomationRules error:', err);
      return 0;
    }
  }, [automationRules]);

  // === SCHEDULE NOTIFICATIONS ===
  const scheduleNotification = useCallback(async (
    notification: Omit<ScheduledNotification, 'id' | 'status' | 'sentAt'>
  ): Promise<ScheduledNotification | null> => {
    try {
      const newNotification: ScheduledNotification = {
        ...notification,
        id: crypto.randomUUID(),
        status: 'pending'
      };

      setScheduledNotifications(prev => [...prev, newNotification]);
      toast.success('Notificación programada');

      return newNotification;
    } catch (err) {
      console.error('[useLicenseReporting] scheduleNotification error:', err);
      toast.error('Error al programar notificación');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    stopAutoRefresh();
    fetchMetrics();
    fetchUsageTrends();
    fetchTierDistribution();
    fetchExpirationForecast();
    
    autoRefreshInterval.current = setInterval(() => {
      fetchMetrics();
      executeAutomationRules();
    }, intervalMs);
  }, [fetchMetrics, fetchUsageTrends, fetchTierDistribution, fetchExpirationForecast, executeAutomationRules]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    metrics,
    usageTrends,
    tierDistribution,
    expirationForecast,
    reports,
    automationRules,
    scheduledNotifications,
    error,
    lastRefresh,
    // Métricas
    fetchMetrics,
    fetchUsageTrends,
    fetchTierDistribution,
    fetchExpirationForecast,
    // Reportes
    generateReport,
    exportReport,
    // Automatización
    createAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    executeAutomationRules,
    // Notificaciones
    scheduleNotification,
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useLicenseReporting;
