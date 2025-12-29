/**
 * ObelixIA Financial Guardian Hook
 * Fase 15 - Enterprise SaaS 2025-2026
 * 
 * Agente financiero vigilante que monitorea movimientos contables,
 * detecta irregularidades y proporciona asesoramiento proactivo
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface GuardianAlert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'recommendation';
  category: 'anomaly' | 'compliance' | 'optimization' | 'risk' | 'opportunity';
  title: string;
  description: string;
  affectedEntity: {
    type: 'transaction' | 'account' | 'partner' | 'period' | 'report';
    id: string;
    name: string;
  };
  severity: number; // 1-10
  confidence: number; // 0-100
  suggestedAction: string;
  alternativeActions?: string[];
  impact: {
    financial?: number;
    risk?: string;
    compliance?: string;
  };
  autoResolvable: boolean;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface GuardianInsight {
  id: string;
  type: 'pattern' | 'trend' | 'anomaly' | 'prediction' | 'benchmark';
  title: string;
  description: string;
  dataPoints: Array<{
    label: string;
    value: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  validUntil: string;
  createdAt: string;
}

export interface GuardianRecommendation {
  id: string;
  category: 'tax' | 'cash_flow' | 'cost_reduction' | 'revenue' | 'compliance' | 'investment';
  title: string;
  description: string;
  expectedBenefit: {
    type: 'savings' | 'revenue' | 'risk_reduction' | 'efficiency';
    amount?: number;
    percentage?: number;
    description: string;
  };
  implementationSteps: Array<{
    step: number;
    action: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
  risks: string[];
  prerequisites: string[];
  confidence: number;
  urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  status: 'pending' | 'in_progress' | 'implemented' | 'rejected';
  createdAt: string;
}

export interface GuardianWatchItem {
  id: string;
  type: 'account' | 'transaction_type' | 'partner' | 'threshold' | 'pattern';
  name: string;
  description: string;
  rules: Array<{
    condition: string;
    threshold?: number;
    action: 'alert' | 'block' | 'review' | 'notify';
  }>;
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

export interface GuardianStats {
  alertsToday: number;
  alertsThisWeek: number;
  alertsResolved: number;
  pendingRecommendations: number;
  implementedRecommendations: number;
  savingsGenerated: number;
  risksMitigated: number;
  healthScore: number; // 0-100
  lastAnalysis: string;
}

export interface FinancialGuardianContext {
  entityId: string;
  entityType: 'company' | 'period' | 'account';
  dateRange?: { start: string; end: string };
  focusAreas?: string[];
}

// === HOOK ===
export function useObelixiaFinancialGuardian() {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alerts, setAlerts] = useState<GuardianAlert[]>([]);
  const [insights, setInsights] = useState<GuardianInsight[]>([]);
  const [recommendations, setRecommendations] = useState<GuardianRecommendation[]>([]);
  const [watchList, setWatchList] = useState<GuardianWatchItem[]>([]);
  const [stats, setStats] = useState<GuardianStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs para auto-refresh y realtime
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // === ANALIZAR TRANSACCIÓN EN TIEMPO REAL ===
  const analyzeTransaction = useCallback(async (transaction: {
    type: string;
    amount: number;
    accountId: string;
    accountName: string;
    description: string;
    partnerId?: string;
    partnerName?: string;
  }) => {
    setIsAnalyzing(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-guardian',
        {
          body: {
            action: 'analyze_transaction',
            transaction
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        // Si hay alertas, añadirlas
        if (fnData.alerts && fnData.alerts.length > 0) {
          setAlerts(prev => [...fnData.alerts, ...prev]);
          
          // Mostrar toast para alertas críticas
          fnData.alerts.forEach((alert: GuardianAlert) => {
            if (alert.type === 'critical') {
              toast.error(`⚠️ Alerta Crítica: ${alert.title}`, {
                description: alert.description,
                duration: 10000
              });
            } else if (alert.type === 'warning') {
              toast.warning(`⚡ ${alert.title}`, {
                description: alert.suggestedAction
              });
            }
          });
        }

        // Si hay recomendaciones
        if (fnData.recommendation) {
          toast.info(`💡 Sugerencia: ${fnData.recommendation}`, {
            duration: 8000
          });
        }

        return fnData;
      }

      return null;
    } catch (err) {
      console.error('[FinancialGuardian] analyzeTransaction error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // === OBTENER ALERTAS ===
  const fetchAlerts = useCallback(async (context?: FinancialGuardianContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-guardian',
        {
          body: {
            action: 'get_alerts',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.alerts) {
        setAlerts(fnData.alerts);
        return fnData.alerts;
      }

      // Datos de demostración si no hay edge function
      const demoAlerts: GuardianAlert[] = [
        {
          id: 'alert-1',
          type: 'warning',
          category: 'anomaly',
          title: 'Transacción inusual detectada',
          description: 'Pago a proveedor TECH SOLUTIONS por €45,000 excede el promedio histórico en 3x',
          affectedEntity: { type: 'transaction', id: 'txn-001', name: 'Pago #4521' },
          severity: 7,
          confidence: 85,
          suggestedAction: 'Verificar la autorización del pago y confirmar con departamento de compras',
          alternativeActions: ['Bloquear temporalmente', 'Solicitar documentación adicional'],
          impact: { financial: 45000, risk: 'medio' },
          autoResolvable: false,
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'alert-2',
          type: 'recommendation',
          category: 'optimization',
          title: 'Oportunidad de optimización fiscal',
          description: 'Detectada posibilidad de deducción adicional en gastos de I+D',
          affectedEntity: { type: 'account', id: 'acc-rd', name: 'Gastos I+D' },
          severity: 3,
          confidence: 92,
          suggestedAction: 'Revisar gastos de I+D para aplicar deducción del 25% adicional',
          impact: { financial: 12500, compliance: 'bajo riesgo' },
          autoResolvable: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'active'
        },
        {
          id: 'alert-3',
          type: 'critical',
          category: 'compliance',
          title: 'Vencimiento de obligación fiscal',
          description: 'Modelo 303 del Q4 vence en 3 días y no está preparado',
          affectedEntity: { type: 'period', id: 'q4-2024', name: 'Q4 2024' },
          severity: 9,
          confidence: 100,
          suggestedAction: 'Preparar y presentar Modelo 303 antes del vencimiento',
          impact: { compliance: 'alto riesgo', financial: 5000 },
          autoResolvable: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'active'
        },
        {
          id: 'alert-4',
          type: 'info',
          category: 'opportunity',
          title: 'Patrón de cobro identificado',
          description: 'Cliente ACME Corp siempre paga 5 días antes del vencimiento',
          affectedEntity: { type: 'partner', id: 'partner-acme', name: 'ACME Corp' },
          severity: 2,
          confidence: 95,
          suggestedAction: 'Considerar ofrecer descuento por pronto pago del 2%',
          impact: { financial: 1500 },
          autoResolvable: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          status: 'active'
        }
      ];

      setAlerts(demoAlerts);
      return demoAlerts;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[FinancialGuardian] fetchAlerts error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === OBTENER INSIGHTS ===
  const fetchInsights = useCallback(async (context?: FinancialGuardianContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-guardian',
        {
          body: {
            action: 'get_insights',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.insights) {
        setInsights(fnData.insights);
        return fnData.insights;
      }

      // Datos de demostración
      const demoInsights: GuardianInsight[] = [
        {
          id: 'insight-1',
          type: 'trend',
          title: 'Tendencia de gastos operativos',
          description: 'Los gastos operativos han aumentado un 12% respecto al trimestre anterior',
          dataPoints: [
            { label: 'Q1', value: 45000, trend: 'stable' },
            { label: 'Q2', value: 47500, trend: 'up' },
            { label: 'Q3', value: 52000, trend: 'up' },
            { label: 'Q4', value: 58240, trend: 'up' }
          ],
          recommendation: 'Revisar contratos de servicios y renegociar condiciones',
          priority: 'medium',
          validUntil: new Date(Date.now() + 604800000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: 'insight-2',
          type: 'pattern',
          title: 'Ciclo de cobro optimizable',
          description: 'El 35% de los clientes pagan entre 45-60 días, superando términos acordados',
          dataPoints: [
            { label: '0-30 días', value: 45 },
            { label: '30-45 días', value: 20 },
            { label: '45-60 días', value: 35 }
          ],
          recommendation: 'Implementar recordatorios automáticos y revisar política de crédito',
          priority: 'high',
          validUntil: new Date(Date.now() + 1209600000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: 'insight-3',
          type: 'benchmark',
          title: 'Margen bruto vs industria',
          description: 'Tu margen bruto (42%) está 5 puntos por encima del promedio del sector',
          dataPoints: [
            { label: 'Tu empresa', value: 42 },
            { label: 'Promedio sector', value: 37 },
            { label: 'Top 10%', value: 48 }
          ],
          recommendation: 'Mantener estrategia actual, considerar inversión en diferenciación',
          priority: 'low',
          validUntil: new Date(Date.now() + 2592000000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ];

      setInsights(demoInsights);
      return demoInsights;
    } catch (err) {
      console.error('[FinancialGuardian] fetchInsights error:', err);
      return [];
    }
  }, []);

  // === OBTENER RECOMENDACIONES ===
  const fetchRecommendations = useCallback(async (context?: FinancialGuardianContext) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-guardian',
        {
          body: {
            action: 'get_recommendations',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.recommendations) {
        setRecommendations(fnData.recommendations);
        return fnData.recommendations;
      }

      // Datos de demostración
      const demoRecommendations: GuardianRecommendation[] = [
        {
          id: 'rec-1',
          category: 'tax',
          title: 'Optimización de deducciones fiscales',
          description: 'Se han identificado €18,500 en gastos elegibles para deducciones adicionales no aplicadas',
          expectedBenefit: {
            type: 'savings',
            amount: 4625,
            description: 'Ahorro estimado en impuesto de sociedades (25%)'
          },
          implementationSteps: [
            { step: 1, action: 'Revisar facturas de formación del último año', effort: 'low', timeline: '2 días' },
            { step: 2, action: 'Clasificar gastos de I+D elegibles', effort: 'medium', timeline: '1 semana' },
            { step: 3, action: 'Preparar documentación justificativa', effort: 'medium', timeline: '3 días' },
            { step: 4, action: 'Aplicar deducciones en declaración anual', effort: 'low', timeline: '1 día' }
          ],
          risks: ['Posible revisión por Hacienda', 'Requiere documentación detallada'],
          prerequisites: ['Facturas originales disponibles', 'Registro de horas dedicadas a I+D'],
          confidence: 88,
          urgency: 'medium_term',
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'rec-2',
          category: 'cash_flow',
          title: 'Renegociación de términos de pago',
          description: 'Oportunidad de mejorar el ciclo de caja renegociando con 3 proveedores principales',
          expectedBenefit: {
            type: 'efficiency',
            description: 'Reducción de 15 días en ciclo de conversión de efectivo'
          },
          implementationSteps: [
            { step: 1, action: 'Analizar volumen de compras por proveedor', effort: 'low', timeline: '1 día' },
            { step: 2, action: 'Preparar propuesta de términos', effort: 'medium', timeline: '3 días' },
            { step: 3, action: 'Negociar con proveedores', effort: 'high', timeline: '2 semanas' }
          ],
          risks: ['Posible resistencia de proveedores', 'Podría afectar relación comercial'],
          prerequisites: ['Historial de pagos positivo', 'Volumen de compras significativo'],
          confidence: 75,
          urgency: 'short_term',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'rec-3',
          category: 'cost_reduction',
          title: 'Consolidación de servicios bancarios',
          description: 'Detectadas comisiones duplicadas en 4 cuentas bancarias con bajo movimiento',
          expectedBenefit: {
            type: 'savings',
            amount: 2400,
            percentage: 60,
            description: 'Ahorro anual en comisiones bancarias'
          },
          implementationSteps: [
            { step: 1, action: 'Listar todas las cuentas y sus costes', effort: 'low', timeline: '1 día' },
            { step: 2, action: 'Identificar cuentas a cerrar/consolidar', effort: 'low', timeline: '2 días' },
            { step: 3, action: 'Transferir saldos y cerrar cuentas', effort: 'medium', timeline: '1 semana' }
          ],
          risks: ['Verificar que no hay domiciliaciones activas'],
          prerequisites: ['Acceso a banca online de todas las cuentas'],
          confidence: 95,
          urgency: 'immediate',
          status: 'pending',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setRecommendations(demoRecommendations);
      return demoRecommendations;
    } catch (err) {
      console.error('[FinancialGuardian] fetchRecommendations error:', err);
      return [];
    }
  }, []);

  // === OBTENER ESTADÍSTICAS ===
  const fetchStats = useCallback(async () => {
    try {
      const demoStats: GuardianStats = {
        alertsToday: 4,
        alertsThisWeek: 12,
        alertsResolved: 28,
        pendingRecommendations: 3,
        implementedRecommendations: 15,
        savingsGenerated: 34500,
        risksMitigated: 7,
        healthScore: 78,
        lastAnalysis: new Date().toISOString()
      };

      setStats(demoStats);
      return demoStats;
    } catch (err) {
      console.error('[FinancialGuardian] fetchStats error:', err);
      return null;
    }
  }, []);

  // === RESOLVER ALERTA ===
  const resolveAlert = useCallback(async (
    alertId: string,
    resolution: { action: 'resolve' | 'dismiss' | 'acknowledge'; notes?: string }
  ) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: resolution.action === 'resolve' ? 'resolved' : 
                      resolution.action === 'dismiss' ? 'dismissed' : 'acknowledged',
              resolvedAt: new Date().toISOString(),
              resolutionNotes: resolution.notes
            }
          : alert
      ));

      toast.success(
        resolution.action === 'resolve' ? 'Alerta resuelta' :
        resolution.action === 'dismiss' ? 'Alerta descartada' : 'Alerta reconocida'
      );

      return true;
    } catch (err) {
      console.error('[FinancialGuardian] resolveAlert error:', err);
      toast.error('Error al procesar alerta');
      return false;
    }
  }, []);

  // === IMPLEMENTAR RECOMENDACIÓN ===
  const implementRecommendation = useCallback(async (
    recommendationId: string,
    status: 'in_progress' | 'implemented' | 'rejected'
  ) => {
    try {
      setRecommendations(prev => prev.map(rec =>
        rec.id === recommendationId ? { ...rec, status } : rec
      ));

      toast.success(
        status === 'implemented' ? '✅ Recomendación implementada' :
        status === 'in_progress' ? '🔄 Recomendación en progreso' :
        '❌ Recomendación rechazada'
      );

      return true;
    } catch (err) {
      console.error('[FinancialGuardian] implementRecommendation error:', err);
      toast.error('Error al actualizar recomendación');
      return false;
    }
  }, []);

  // === CONSULTAR AL GUARDIAN ===
  const askGuardian = useCallback(async (question: string, context?: FinancialGuardianContext) => {
    setIsAnalyzing(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-financial-guardian',
        {
          body: {
            action: 'ask',
            question,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        return fnData.response;
      }

      // Respuesta de demostración
      return {
        answer: `Basándome en el análisis de tus datos financieros, mi recomendación para "${question}" es revisar los patrones históricos y considerar las alternativas que maximicen el beneficio fiscal mientras mantienen la liquidez operativa.`,
        confidence: 85,
        relatedAlerts: alerts.slice(0, 2),
        suggestedActions: [
          'Revisar el flujo de caja proyectado',
          'Consultar con asesor fiscal',
          'Analizar impacto en ratios financieros'
        ]
      };
    } catch (err) {
      console.error('[FinancialGuardian] askGuardian error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [alerts]);

  // === INICIALIZAR TODO ===
  const initialize = useCallback(async (context?: FinancialGuardianContext) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAlerts(context),
        fetchInsights(context),
        fetchRecommendations(context),
        fetchStats()
      ]);
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [fetchAlerts, fetchInsights, fetchRecommendations, fetchStats]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: FinancialGuardianContext, intervalMs = 60000) => {
    stopAutoRefresh();
    initialize(context);
    autoRefreshInterval.current = setInterval(() => {
      initialize(context);
    }, intervalMs);
  }, [initialize]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    isAnalyzing,
    alerts,
    insights,
    recommendations,
    watchList,
    stats,
    error,
    lastRefresh,
    
    // Acciones principales
    initialize,
    analyzeTransaction,
    fetchAlerts,
    fetchInsights,
    fetchRecommendations,
    fetchStats,
    
    // Gestión de alertas
    resolveAlert,
    
    // Gestión de recomendaciones
    implementRecommendation,
    
    // Consulta al Guardian
    askGuardian,
    
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,

    // Contadores derivados
    activeAlertsCount: alerts.filter(a => a.status === 'active').length,
    criticalAlertsCount: alerts.filter(a => a.status === 'active' && a.type === 'critical').length,
    pendingRecommendationsCount: recommendations.filter(r => r.status === 'pending').length,
  };
}

export default useObelixiaFinancialGuardian;
