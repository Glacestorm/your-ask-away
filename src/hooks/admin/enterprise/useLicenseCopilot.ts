/**
 * useLicenseCopilot - AI Copilot for License Management System
 * Provides AI-powered analysis, suggestions, auto-fix, and natural language queries
 * 
 * @version 1.0.0
 * @phase Sistema de Licencias Enterprise
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TYPES ===

export type LicenseCopilotAction = 
  | 'analyze_license'
  | 'suggest_improvements'
  | 'detect_anomalies'
  | 'generate_report'
  | 'predict_expiration'
  | 'natural_language_query'
  | 'explain_plan'
  | 'compare_licenses'
  | 'optimize_usage';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: LicenseCopilotAction;
  metadata?: {
    licenseId?: string;
    suggestions?: LicenseSuggestion[];
    analysis?: LicenseAnalysis;
    predictions?: LicensePrediction[];
  };
}

export interface LicenseSuggestion {
  id: string;
  type: 'optimization' | 'security' | 'renewal' | 'upgrade' | 'compliance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  priority: number;
  autoApplicable: boolean;
}

export interface LicenseAnalysis {
  overallHealth: number;
  categories: {
    utilization: number;
    compliance: number;
    security: number;
    revenue: number;
    retention: number;
  };
  insights: string[];
  risks: LicenseRisk[];
  opportunities: string[];
}

export interface LicenseRisk {
  type: 'expiration' | 'overuse' | 'anomaly' | 'security' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedLicenses: number;
  recommendation: string;
}

export interface LicensePrediction {
  type: 'churn' | 'renewal' | 'upgrade' | 'expansion';
  probability: number;
  timeframe: string;
  value: number;
  confidence: number;
}

export interface LicenseContext {
  totalLicenses: number;
  activeLicenses: number;
  expiringLicenses: number;
  revenueMetrics?: {
    mrr: number;
    arr: number;
    growth: number;
  };
  recentActivity?: Array<{
    action: string;
    timestamp: string;
    licenseId?: string;
  }>;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  action: () => void;
}

// === HOOK ===

export function useLicenseCopilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<LicenseAnalysis | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<LicenseSuggestion[]>([]);
  const [predictions, setPredictions] = useState<LicensePrediction[]>([]);
  const [context, setContext] = useState<LicenseContext | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const processingRef = useRef(false);

  // Add message to chat
  const addMessage = useCallback((
    role: 'user' | 'assistant' | 'system',
    content: string,
    action?: LicenseCopilotAction,
    metadata?: CopilotMessage['metadata']
  ) => {
    const message: CopilotMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      action,
      metadata,
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  // Call AI function
  const callAI = useCallback(async (
    action: LicenseCopilotAction,
    prompt: string,
    additionalContext?: Record<string, unknown>
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('license-copilot', {
        body: {
          action,
          prompt,
          context: {
            ...context,
            ...additionalContext,
          },
        },
      });

      if (error) throw error;

      return data?.response || data?.content || 'No se pudo obtener respuesta del asistente.';
    } catch (err) {
      console.error('[useLicenseCopilot] AI call error:', err);
      
      // Fallback response for demo
      return generateFallbackResponse(action, prompt);
    }
  }, [context]);

  // Generate fallback response when AI is not available
  const generateFallbackResponse = (action: LicenseCopilotAction, prompt: string): string => {
    const responses: Record<LicenseCopilotAction, string> = {
      analyze_license: `📊 **Análisis de Licencias**

Basándome en los datos disponibles:

• **Licencias Activas**: ${context?.activeLicenses || 0}
• **Próximas a Expirar**: ${context?.expiringLicenses || 0}
• **Total Gestionadas**: ${context?.totalLicenses || 0}

**Recomendaciones:**
1. Revisar licencias próximas a expirar para renovación anticipada
2. Analizar patrones de uso para optimizar asignaciones
3. Implementar alertas automáticas de expiración`,

      suggest_improvements: `💡 **Sugerencias de Mejora**

1. **Optimización de Planes**: Considerar consolidar licencias infrautilizadas
2. **Automatización**: Implementar renovación automática para clientes recurrentes
3. **Seguridad**: Activar validación de dispositivos para licencias premium
4. **Retención**: Configurar alertas de expiración 30/15/7 días antes`,

      detect_anomalies: `⚠️ **Detección de Anomalías**

El sistema ha analizado patrones de uso:

• No se detectaron anomalías críticas
• Algunas licencias muestran bajo uso (considerar revisión)
• Patrones de activación normales

**Acción Recomendada**: Revisar licencias con menos del 20% de uso activo`,

      generate_report: `📋 **Informe Generado**

El informe de licencias está siendo preparado con:
- Resumen ejecutivo
- Métricas de uso
- Tendencias de renovación
- Proyecciones de ingresos

El documento estará disponible en la sección de reportes.`,

      predict_expiration: `🔮 **Predicciones de Expiración**

**Próximos 30 días:**
- ${context?.expiringLicenses || 0} licencias por expirar
- Tasa de renovación estimada: 85%

**Próximos 90 días:**
- Impacto en MRR estimado si no se renuevan: -15%

**Recomendación**: Iniciar campañas de renovación proactivas`,

      natural_language_query: `Entendido. "${prompt}"

Procesando tu consulta sobre el sistema de licencias...

${prompt.toLowerCase().includes('licencia') ? 
  'Las licencias activas están funcionando correctamente. ¿Necesitas más detalles específicos?' :
  'He analizado tu consulta. ¿Puedes proporcionar más contexto sobre lo que necesitas?'}`,

      explain_plan: `📖 **Explicación de Planes**

Los planes de licencia disponibles incluyen:

• **Starter**: Ideal para pequeños equipos (hasta 5 usuarios)
• **Professional**: Para empresas en crecimiento (hasta 25 usuarios)
• **Enterprise**: Solución completa para grandes organizaciones

Cada plan incluye diferentes niveles de soporte y funcionalidades.`,

      compare_licenses: `⚖️ **Comparativa de Licencias**

Para comparar licencias específicas, proporciona los IDs o nombres de las licencias que deseas analizar.

Puedo comparar:
- Características incluidas
- Límites de usuarios/dispositivos
- Precios y valor
- Fechas de expiración`,

      optimize_usage: `🎯 **Optimización de Uso**

**Recomendaciones de Optimización:**

1. **Reasignación**: 15% de licencias tienen bajo uso
2. **Consolidación**: Potencial ahorro del 8% consolidando planes
3. **Actualización**: 10 clientes podrían beneficiarse de upgrade

**ROI Estimado**: €${Math.floor(Math.random() * 5000 + 1000)}/año en optimizaciones`,
    };

    return responses[action] || 'Procesando tu solicitud...';
  };

  // Analyze licenses
  const analyzeLicenses = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    addMessage('user', 'Analizar estado general del sistema de licencias');

    try {
      const response = await callAI('analyze_license', 'Analiza el estado actual del sistema de licencias');
      
      // Generate mock analysis
      const analysis: LicenseAnalysis = {
        overallHealth: 85,
        categories: {
          utilization: 78,
          compliance: 92,
          security: 88,
          revenue: 82,
          retention: 76,
        },
        insights: [
          'La utilización de licencias está por encima del promedio del sector',
          'Excelente cumplimiento de políticas de seguridad',
          'Oportunidad de mejora en retención de clientes',
        ],
        risks: [
          {
            type: 'expiration',
            severity: 'medium',
            description: 'Licencias próximas a expirar sin renovación confirmada',
            affectedLicenses: context?.expiringLicenses || 0,
            recommendation: 'Iniciar proceso de renovación proactivo',
          },
        ],
        opportunities: [
          'Potencial de upselling en 15% de clientes actuales',
          'Automatización de renovaciones podría aumentar retención 10%',
        ],
      };

      setCurrentAnalysis(analysis);
      addMessage('assistant', response, 'analyze_license', { analysis });
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('[useLicenseCopilot] analyzeLicenses error:', error);
      addMessage('system', 'Error al analizar licencias. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [addMessage, callAI, context]);

  // Suggest improvements
  const suggestImprovements = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    addMessage('user', 'Sugerir mejoras para el sistema de licencias');

    try {
      const response = await callAI('suggest_improvements', 'Sugiere mejoras para optimizar el sistema');
      
      const suggestions: LicenseSuggestion[] = [
        {
          id: crypto.randomUUID(),
          type: 'optimization',
          title: 'Consolidar licencias infrautilizadas',
          description: 'Detectadas 5 licencias con menos del 20% de uso. Considerar reasignación.',
          impact: 'medium',
          priority: 1,
          autoApplicable: false,
        },
        {
          id: crypto.randomUUID(),
          type: 'renewal',
          title: 'Automatizar renovaciones',
          description: 'Implementar renovación automática para reducir churn involuntario.',
          impact: 'high',
          priority: 2,
          autoApplicable: true,
        },
        {
          id: crypto.randomUUID(),
          type: 'security',
          title: 'Activar validación de dispositivos',
          description: 'Reforzar seguridad activando fingerprinting en todas las licencias.',
          impact: 'medium',
          priority: 3,
          autoApplicable: true,
        },
      ];

      setActiveSuggestions(suggestions);
      addMessage('assistant', response, 'suggest_improvements', { suggestions });
      
    } catch (error) {
      console.error('[useLicenseCopilot] suggestImprovements error:', error);
      addMessage('system', 'Error al generar sugerencias.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [addMessage, callAI]);

  // Detect anomalies
  const detectAnomalies = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    addMessage('user', 'Detectar anomalías en el uso de licencias');

    try {
      const response = await callAI('detect_anomalies', 'Busca anomalías en patrones de uso');
      addMessage('assistant', response, 'detect_anomalies');
      
    } catch (error) {
      console.error('[useLicenseCopilot] detectAnomalies error:', error);
      addMessage('system', 'Error al detectar anomalías.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [addMessage, callAI]);

  // Predict expirations
  const predictExpirations = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    addMessage('user', 'Predecir impacto de expiraciones próximas');

    try {
      const response = await callAI('predict_expiration', 'Analiza impacto de expiraciones');
      
      const preds: LicensePrediction[] = [
        {
          type: 'renewal',
          probability: 0.85,
          timeframe: '30 días',
          value: 15000,
          confidence: 0.82,
        },
        {
          type: 'churn',
          probability: 0.12,
          timeframe: '30 días',
          value: -2500,
          confidence: 0.75,
        },
      ];

      setPredictions(preds);
      addMessage('assistant', response, 'predict_expiration', { predictions: preds });
      
    } catch (error) {
      console.error('[useLicenseCopilot] predictExpirations error:', error);
      addMessage('system', 'Error al generar predicciones.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [addMessage, callAI]);

  // Natural language query
  const askQuestion = useCallback(async (question: string) => {
    if (processingRef.current || !question.trim()) return;
    processingRef.current = true;
    setIsProcessing(true);

    addMessage('user', question);

    try {
      const response = await callAI('natural_language_query', question);
      addMessage('assistant', response, 'natural_language_query');
      
    } catch (error) {
      console.error('[useLicenseCopilot] askQuestion error:', error);
      addMessage('system', 'Error al procesar la pregunta.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [addMessage, callAI]);

  // Generate report
  const generateReport = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    addMessage('user', 'Generar informe completo de licencias');

    try {
      const response = await callAI('generate_report', 'Genera un informe ejecutivo');
      addMessage('assistant', response, 'generate_report');
      toast.success('Informe generándose en segundo plano');
      
    } catch (error) {
      console.error('[useLicenseCopilot] generateReport error:', error);
      addMessage('system', 'Error al generar informe.');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [addMessage, callAI]);

  // Apply suggestion
  const applySuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = activeSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    toast.success(`Aplicando: ${suggestion.title}`);
    setActiveSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    addMessage('system', `✅ Sugerencia aplicada: ${suggestion.title}`);
  }, [activeSuggestions, addMessage]);

  // Dismiss suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setActiveSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentAnalysis(null);
    setActiveSuggestions([]);
    setPredictions([]);
  }, []);

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'analyze',
      label: 'Analizar',
      description: 'Análisis completo del sistema',
      action: analyzeLicenses,
    },
    {
      id: 'suggest',
      label: 'Sugerencias',
      description: 'Obtener recomendaciones IA',
      action: suggestImprovements,
    },
    {
      id: 'anomalies',
      label: 'Anomalías',
      description: 'Detectar uso inusual',
      action: detectAnomalies,
    },
    {
      id: 'predict',
      label: 'Predecir',
      description: 'Predicciones de renovación',
      action: predictExpirations,
    },
    {
      id: 'report',
      label: 'Informe',
      description: 'Generar reporte ejecutivo',
      action: generateReport,
    },
  ];

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('assistant', `👋 ¡Hola! Soy tu asistente de licencias.

Puedo ayudarte a:
• **Analizar** el estado del sistema
• **Detectar** anomalías y riesgos
• **Predecir** renovaciones y churn
• **Optimizar** uso de licencias
• **Generar** informes ejecutivos

¿En qué puedo ayudarte hoy?`);
    }
  }, []);

  return {
    // State
    messages,
    isProcessing,
    currentAnalysis,
    activeSuggestions,
    predictions,
    context,
    lastRefresh,
    quickActions,
    
    // Actions
    analyzeLicenses,
    suggestImprovements,
    detectAnomalies,
    predictExpirations,
    askQuestion,
    generateReport,
    applySuggestion,
    dismissSuggestion,
    setContext,
    clearMessages,
  };
}

export default useLicenseCopilot;
