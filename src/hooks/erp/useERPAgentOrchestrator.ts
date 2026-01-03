/**
 * useERPAgentOrchestrator - Orquestador de Agentes AI Especializados ERP
 * Coordina agentes especializados por módulo con un supervisor general
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === TIPOS DE AGENTES ESPECIALIZADOS ===
export type ERPAgentType = 
  | 'trade_finance'      // Comercio exterior, descuento, factoring
  | 'accounting'         // Contabilidad, asientos, balances
  | 'treasury'           // Tesorería, cobros, pagos
  | 'inventory'          // Inventario, stock, almacenes
  | 'purchases'          // Compras, proveedores
  | 'sales'              // Ventas, clientes
  | 'hr'                 // Recursos humanos, nóminas
  | 'analytics'          // Analytics, KPIs, predicciones
  | 'compliance'         // Cumplimiento normativo, NIIF, ESG
  | 'supervisor';        // Supervisor general

export interface ERPAgent {
  id: string;
  type: ERPAgentType;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  status: 'idle' | 'analyzing' | 'alerting' | 'error';
  lastActivity: Date | null;
  alertCount: number;
  capabilities: string[];
}

export interface AgentAlert {
  id: string;
  agentType: ERPAgentType;
  agentName: string;
  type: 'info' | 'warning' | 'error' | 'critical' | 'recommendation';
  title: string;
  message: string;
  recommendation?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  isSpoken: boolean;
  context?: Record<string, unknown>;
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface AgentAnalysisRequest {
  agentType: ERPAgentType;
  module: string;
  action: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface AgentAnalysisResult {
  agentType: ERPAgentType;
  success: boolean;
  analysis?: {
    score: number;
    isValid: boolean;
    summary: string;
    alerts: Omit<AgentAlert, 'id' | 'timestamp' | 'isRead' | 'isSpoken'>[];
    recommendations: string[];
    metrics?: Record<string, number>;
  };
  error?: string;
}

// === DEFINICIÓN DE AGENTES ===
const AGENT_DEFINITIONS: Record<ERPAgentType, Omit<ERPAgent, 'id' | 'isActive' | 'status' | 'lastActivity' | 'alertCount'>> = {
  trade_finance: {
    type: 'trade_finance',
    name: 'Agente Trade Finance',
    description: 'Especialista en operaciones de comercio exterior, descuento, factoring y confirming',
    icon: '🌐',
    capabilities: [
      'Validación de operaciones de descuento',
      'Análisis de riesgo en factoring',
      'Verificación de documentos de comercio exterior',
      'Control de exposición cambiaria',
      'Supervisión de garantías bancarias'
    ]
  },
  accounting: {
    type: 'accounting',
    name: 'Agente Contabilidad',
    description: 'Especialista en contabilidad, asientos y normativa PGC/NIIF',
    icon: '📊',
    capabilities: [
      'Validación de asientos contables',
      'Verificación de cuadre de balances',
      'Control de cuentas por naturaleza',
      'Cumplimiento normativo PGC/NIIF',
      'Análisis de ratios financieros'
    ]
  },
  treasury: {
    type: 'treasury',
    name: 'Agente Tesorería',
    description: 'Especialista en gestión de tesorería, cobros y pagos',
    icon: '💰',
    capabilities: [
      'Previsión de flujo de caja',
      'Gestión de vencimientos',
      'Control de posición bancaria',
      'Análisis de morosidad',
      'Optimización de remesas SEPA'
    ]
  },
  inventory: {
    type: 'inventory',
    name: 'Agente Inventario',
    description: 'Especialista en gestión de stock y almacenes',
    icon: '📦',
    capabilities: [
      'Control de niveles de stock',
      'Alertas de rotura de stock',
      'Optimización de inventario',
      'Análisis de rotación',
      'Gestión de ubicaciones'
    ]
  },
  purchases: {
    type: 'purchases',
    name: 'Agente Compras',
    description: 'Especialista en gestión de compras y proveedores',
    icon: '🛒',
    capabilities: [
      'Evaluación de proveedores',
      'Control de pedidos',
      'Análisis de precios',
      'Gestión de recepciones',
      'Optimización de aprovisionamiento'
    ]
  },
  sales: {
    type: 'sales',
    name: 'Agente Ventas',
    description: 'Especialista en gestión comercial y clientes',
    icon: '📈',
    capabilities: [
      'Análisis de cartera de clientes',
      'Control de pedidos y entregas',
      'Gestión de riesgo comercial',
      'Optimización de precios',
      'Predicción de ventas'
    ]
  },
  hr: {
    type: 'hr',
    name: 'Agente RRHH',
    description: 'Especialista en recursos humanos y nóminas',
    icon: '👥',
    capabilities: [
      'Control de nóminas',
      'Gestión de contratos',
      'Análisis de costes laborales',
      'Cumplimiento normativo laboral',
      'Gestión de vacaciones y permisos'
    ]
  },
  analytics: {
    type: 'analytics',
    name: 'Agente Analytics',
    description: 'Especialista en análisis de datos y predicciones',
    icon: '📉',
    capabilities: [
      'Análisis de tendencias',
      'Predicción de KPIs',
      'Detección de anomalías',
      'Benchmarking sectorial',
      'Informes ejecutivos'
    ]
  },
  compliance: {
    type: 'compliance',
    name: 'Agente Compliance',
    description: 'Especialista en cumplimiento normativo y ESG',
    icon: '⚖️',
    capabilities: [
      'Auditoría de cumplimiento NIIF',
      'Control ESG y huella de carbono',
      'Verificación fiscal',
      'Gestión de riesgos regulatorios',
      'Reporting normativo'
    ]
  },
  supervisor: {
    type: 'supervisor',
    name: 'Supervisor General',
    description: 'Coordina todos los agentes y supervisa el sistema completo',
    icon: '🎯',
    capabilities: [
      'Coordinación de agentes especializados',
      'Priorización de alertas',
      'Escalado de incidencias críticas',
      'Visión global del sistema',
      'Orquestación de respuestas'
    ]
  }
};

export function useERPAgentOrchestrator() {
  // Estado de agentes
  const [agents, setAgents] = useState<ERPAgent[]>(() => 
    Object.entries(AGENT_DEFINITIONS).map(([type, def]) => ({
      ...def,
      id: `agent_${type}`,
      isActive: type === 'supervisor' || type === 'accounting',
      status: 'idle' as const,
      lastActivity: null,
      alertCount: 0
    }))
  );

  // Alertas globales
  const [alerts, setAlerts] = useState<AgentAlert[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastGlobalAnalysis, setLastGlobalAnalysis] = useState<Date | null>(null);

  // Referencias
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analysisQueueRef = useRef<AgentAnalysisRequest[]>([]);
  const processingRef = useRef(false);

  // Generar ID único
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Actualizar estado de un agente
  const updateAgentStatus = useCallback((
    agentType: ERPAgentType,
    updates: Partial<Pick<ERPAgent, 'status' | 'lastActivity' | 'alertCount' | 'isActive'>>
  ) => {
    setAgents(prev => prev.map(agent =>
      agent.type === agentType ? { ...agent, ...updates } : agent
    ));
  }, []);

  // Activar/desactivar agente
  const toggleAgent = useCallback((agentType: ERPAgentType) => {
    setAgents(prev => prev.map(agent =>
      agent.type === agentType ? { ...agent, isActive: !agent.isActive } : agent
    ));
  }, []);

  // Hablar alerta por TTS
  const speakAlert = useCallback(async (
    text: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    if (!audioEnabled) return;

    try {
      setIsSpeaking(true);

      const voiceId = severity === 'critical' 
        ? 'onwK4e9ZLuTAKqWW03F9' // Daniel - más grave
        : 'EXAVITQu4vr4xnSDxMaL'; // Sarah - normal

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/erp-voice-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            voiceId,
            stability: severity === 'critical' ? 0.8 : 0.5,
            speed: severity === 'critical' ? 1.1 : 1.0
          }),
        }
      );

      if (!response.ok) {
        console.error('TTS error:', response.status);
        // Fallback a Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'es-ES';
          utterance.rate = severity === 'critical' ? 1.1 : 1.0;
          utterance.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();
    } catch (error) {
      console.error('Error speaking alert:', error);
      setIsSpeaking(false);
      
      // Fallback a Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [audioEnabled]);

  // Añadir alerta
  const addAlert = useCallback((
    alert: Omit<AgentAlert, 'id' | 'timestamp' | 'isRead' | 'isSpoken'>,
    speak = true
  ): AgentAlert => {
    const newAlert: AgentAlert = {
      ...alert,
      id: generateId(),
      timestamp: new Date(),
      isRead: false,
      isSpoken: false
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Mantener últimas 100

    // Actualizar contador del agente
    updateAgentStatus(alert.agentType, {
      alertCount: agents.find(a => a.type === alert.agentType)?.alertCount ?? 0 + 1,
      lastActivity: new Date()
    });

    // Mostrar toast
    const toastOptions = { duration: alert.severity === 'critical' ? 10000 : 5000 };
    const toastMessage = `[${alert.agentName}] ${alert.message}`;

    switch (alert.severity) {
      case 'critical':
        toast.error(alert.title, { description: toastMessage, ...toastOptions });
        break;
      case 'high':
        toast.warning(alert.title, { description: toastMessage, ...toastOptions });
        break;
      case 'medium':
        toast.info(alert.title, { description: toastMessage, ...toastOptions });
        break;
      default:
        toast(alert.title, { description: toastMessage, ...toastOptions });
    }

    // Hablar si es crítico o alto
    if (speak && audioEnabled && (alert.severity === 'critical' || alert.severity === 'high')) {
      const speechText = `Alerta del ${alert.agentName}. ${alert.title}. ${alert.message}`;
      speakAlert(speechText, alert.severity);
      newAlert.isSpoken = true;
    }

    return newAlert;
  }, [agents, audioEnabled, speakAlert, updateAgentStatus]);

  // Solicitar análisis a un agente específico
  const requestAnalysis = useCallback(async (
    request: AgentAnalysisRequest
  ): Promise<AgentAnalysisResult> => {
    const agent = agents.find(a => a.type === request.agentType);
    
    if (!agent?.isActive) {
      return {
        agentType: request.agentType,
        success: false,
        error: 'Agente no activo'
      };
    }

    updateAgentStatus(request.agentType, { status: 'analyzing' });

    try {
      const { data, error } = await supabase.functions.invoke('erp-agent-orchestrator', {
        body: {
          action: 'analyze',
          agentType: request.agentType,
          module: request.module,
          analysisAction: request.action,
          data: request.data,
          priority: request.priority || 'normal'
        }
      });

      if (error) throw error;

      if (data?.success && data?.analysis) {
        // Procesar alertas del análisis
        if (data.analysis.alerts && Array.isArray(data.analysis.alerts)) {
          data.analysis.alerts.forEach((alertData: any) => {
            addAlert({
              agentType: request.agentType,
              agentName: agent.name,
              type: alertData.type || 'warning',
              title: alertData.title,
              message: alertData.message,
              recommendation: alertData.recommendation,
              severity: alertData.severity || 'medium',
              context: request.data
            }, alertData.severity === 'critical' || alertData.severity === 'high');
          });
        }

        updateAgentStatus(request.agentType, {
          status: 'idle',
          lastActivity: new Date()
        });

        return {
          agentType: request.agentType,
          success: true,
          analysis: data.analysis
        };
      }

      throw new Error('Invalid response');
    } catch (error) {
      console.error(`[${request.agentType}] Analysis error:`, error);
      
      updateAgentStatus(request.agentType, { status: 'error' });

      addAlert({
        agentType: request.agentType,
        agentName: agent.name,
        type: 'error',
        title: 'Error de Análisis',
        message: `El agente ${agent.name} encontró un error durante el análisis`,
        severity: 'medium'
      }, false);

      return {
        agentType: request.agentType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [agents, addAlert, updateAgentStatus]);

  // Análisis coordinado por el supervisor
  const supervisorAnalysis = useCallback(async (
    requests: AgentAnalysisRequest[]
  ): Promise<AgentAnalysisResult[]> => {
    setIsOrchestrating(true);
    updateAgentStatus('supervisor', { status: 'analyzing' });

    // Notificar inicio
    addAlert({
      agentType: 'supervisor',
      agentName: 'Supervisor General',
      type: 'info',
      title: 'Análisis Iniciado',
      message: `Coordinando análisis con ${requests.length} agente(s) especializado(s)`,
      severity: 'low'
    }, false);

    try {
      // Ejecutar análisis en paralelo
      const results = await Promise.all(
        requests.map(req => requestAnalysis(req))
      );

      // Análisis del supervisor sobre los resultados
      const criticalAlerts = results.filter(r => 
        r.analysis?.alerts?.some(a => a.severity === 'critical')
      );

      if (criticalAlerts.length > 0) {
        addAlert({
          agentType: 'supervisor',
          agentName: 'Supervisor General',
          type: 'critical',
          title: 'Incidencias Críticas Detectadas',
          message: `Se han detectado ${criticalAlerts.length} situación(es) crítica(s) que requieren atención inmediata`,
          severity: 'critical',
          recommendation: 'Revise las alertas de los agentes especializados y tome acción inmediata'
        }, true);
      } else {
        addAlert({
          agentType: 'supervisor',
          agentName: 'Supervisor General',
          type: 'info',
          title: 'Análisis Completado',
          message: `Todos los agentes han completado su análisis sin incidencias críticas`,
          severity: 'low'
        }, false);
      }

      setLastGlobalAnalysis(new Date());
      updateAgentStatus('supervisor', { status: 'idle', lastActivity: new Date() });
      
      return results;
    } catch (error) {
      console.error('[supervisor] Orchestration error:', error);
      updateAgentStatus('supervisor', { status: 'error' });
      
      return [{
        agentType: 'supervisor',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    } finally {
      setIsOrchestrating(false);
    }
  }, [requestAnalysis, addAlert, updateAgentStatus]);

  // Marcar alerta como leída
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  // Marcar todas las alertas de un agente como leídas
  const markAgentAlertsAsRead = useCallback((agentType: ERPAgentType) => {
    setAlerts(prev => prev.map(alert =>
      alert.agentType === agentType ? { ...alert, isRead: true } : alert
    ));
    updateAgentStatus(agentType, { alertCount: 0 });
  }, [updateAgentStatus]);

  // Limpiar alertas
  const clearAlerts = useCallback((agentType?: ERPAgentType) => {
    if (agentType) {
      setAlerts(prev => prev.filter(a => a.agentType !== agentType));
      updateAgentStatus(agentType, { alertCount: 0 });
    } else {
      setAlerts([]);
      agents.forEach(agent => {
        updateAgentStatus(agent.type, { alertCount: 0 });
      });
    }
  }, [agents, updateAgentStatus]);

  // Detener audio
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Repetir última alerta crítica
  const repeatLastCriticalAlert = useCallback(() => {
    const criticalAlert = alerts.find(a => 
      (a.severity === 'critical' || a.severity === 'high') && !a.isRead
    );
    if (criticalAlert) {
      const text = `Alerta del ${criticalAlert.agentName}. ${criticalAlert.title}. ${criticalAlert.message}`;
      speakAlert(text, criticalAlert.severity);
    }
  }, [alerts, speakAlert]);

  // Obtener agentes activos
  const activeAgents = agents.filter(a => a.isActive);
  
  // Estadísticas
  const stats = {
    totalAgents: agents.length,
    activeAgents: activeAgents.length,
    totalAlerts: alerts.length,
    unreadAlerts: alerts.filter(a => !a.isRead).length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical' && !a.isRead).length,
    agentsByStatus: {
      idle: agents.filter(a => a.status === 'idle').length,
      analyzing: agents.filter(a => a.status === 'analyzing').length,
      alerting: agents.filter(a => a.status === 'alerting').length,
      error: agents.filter(a => a.status === 'error').length
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    // Estado
    agents,
    activeAgents,
    alerts,
    isOrchestrating,
    isSpeaking,
    audioEnabled,
    lastGlobalAnalysis,
    stats,

    // Acciones de agentes
    toggleAgent,
    updateAgentStatus,
    requestAnalysis,
    supervisorAnalysis,

    // Acciones de alertas
    addAlert,
    markAlertAsRead,
    markAgentAlertsAsRead,
    clearAlerts,

    // Acciones de audio
    setAudioEnabled,
    speakAlert,
    stopSpeaking,
    repeatLastCriticalAlert,

    // Utilidades
    getAgentByType: (type: ERPAgentType) => agents.find(a => a.type === type),
    getAlertsByAgent: (type: ERPAgentType) => alerts.filter(a => a.agentType === type)
  };
}

export default useERPAgentOrchestrator;
