/**
 * useAccountingSupervisorAgent - Agente AI Supervisor de Partidas Contables
 * Supervisa, valida y alerta sobre incidencias en tiempo real (escrito + oral)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountingValidation {
  isValid: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  code: string;
  message: string;
  recommendation?: string;
  affectedEntries?: number[];
}

export interface SupervisorAlert {
  id: string;
  type: 'validation' | 'recommendation' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation?: string;
  timestamp: Date;
  isRead: boolean;
  isSpoken: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccountingEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface SupervisorContext {
  operationType: 'discount' | 'factoring' | 'confirming';
  entries: AccountingEntry[];
  operationData?: {
    amount?: number;
    interestAmount?: number;
    commissionAmount?: number;
    expenses?: number;
    netAmount?: number;
    currency?: string;
  };
}

export function useAccountingSupervisorAgent() {
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [alerts, setAlerts] = useState<SupervisorAlert[]>([]);
  const [validations, setValidations] = useState<AccountingValidation[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Generar ID único para alertas
  const generateAlertId = () => `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Reproducir alerta por voz usando ElevenLabs TTS
  const speakAlert = useCallback(async (text: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    if (!audioEnabled) return;

    try {
      setIsSpeaking(true);
      
      // Determinar voz según severidad
      const voiceId = severity === 'critical' ? 'onwK4e9ZLuTAKqWW03F9' : 'EXAVITQu4vr4xnSDxMaL'; // Daniel para crítico, Sarah para otros
      
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
    }
  }, [audioEnabled]);

  // Añadir nueva alerta
  const addAlert = useCallback((
    type: SupervisorAlert['type'],
    title: string,
    message: string,
    severity: SupervisorAlert['severity'],
    recommendation?: string,
    speakImmediately = true
  ) => {
    const newAlert: SupervisorAlert = {
      id: generateAlertId(),
      type,
      title,
      message,
      recommendation,
      timestamp: new Date(),
      isRead: false,
      isSpoken: false,
      severity
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Mostrar toast según severidad
    const toastOptions: any = { duration: severity === 'critical' ? 10000 : 5000 };
    
    switch (severity) {
      case 'critical':
        toast.error(title, { description: message, ...toastOptions });
        break;
      case 'high':
        toast.warning(title, { description: message, ...toastOptions });
        break;
      case 'medium':
        toast.info(title, { description: message, ...toastOptions });
        break;
      default:
        toast(title, { description: message, ...toastOptions });
    }

    // Hablar alerta si está habilitado
    if (speakImmediately && audioEnabled && (severity === 'critical' || severity === 'high')) {
      const speechText = `${title}. ${message}${recommendation ? `. Recomendación: ${recommendation}` : ''}`;
      speakAlert(speechText, severity);
      newAlert.isSpoken = true;
    }

    return newAlert;
  }, [audioEnabled, speakAlert]);

  // Validaciones locales de partidas
  const validateEntriesLocally = useCallback((entries: AccountingEntry[]): AccountingValidation[] => {
    const results: AccountingValidation[] = [];

    // Validar que hay partidas
    if (entries.length === 0) {
      results.push({
        isValid: false,
        severity: 'warning',
        code: 'NO_ENTRIES',
        message: 'No hay partidas contables registradas',
        recommendation: 'Genere las partidas automáticamente o añádalas manualmente'
      });
      return results;
    }

    // Calcular totales
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    // Validar cuadre
    if (difference > 0.01) {
      results.push({
        isValid: false,
        severity: 'error',
        code: 'UNBALANCED',
        message: `Los asientos no cuadran. Diferencia: ${difference.toFixed(2)}€`,
        recommendation: 'Revise los importes de debe y haber para que sumen igual'
      });
    }

    // Validar cuentas vacías
    const emptyAccounts = entries.filter((e, i) => !e.account_code);
    if (emptyAccounts.length > 0) {
      results.push({
        isValid: false,
        severity: 'error',
        code: 'EMPTY_ACCOUNTS',
        message: `Hay ${emptyAccounts.length} partida(s) sin cuenta contable asignada`,
        recommendation: 'Asigne una cuenta del plan contable a cada partida',
        affectedEntries: entries.map((e, i) => !e.account_code ? i : -1).filter(i => i >= 0)
      });
    }

    // Validar importes cero
    const zeroEntries = entries.filter((e, i) => e.debit === 0 && e.credit === 0);
    if (zeroEntries.length > 0) {
      results.push({
        isValid: false,
        severity: 'warning',
        code: 'ZERO_AMOUNTS',
        message: `Hay ${zeroEntries.length} partida(s) con importe cero`,
        recommendation: 'Elimine las partidas sin importe o asigne un valor'
      });
    }

    // Validar partidas duplicadas
    const accountCodes = entries.map(e => e.account_code);
    const duplicates = accountCodes.filter((code, index) => 
      accountCodes.indexOf(code) !== index && code
    );
    if (duplicates.length > 0) {
      results.push({
        isValid: true, // No es error, solo advertencia
        severity: 'info',
        code: 'DUPLICATE_ACCOUNTS',
        message: `Cuentas repetidas: ${[...new Set(duplicates)].join(', ')}`,
        recommendation: 'Considere consolidar las partidas de la misma cuenta'
      });
    }

    // Validar estructura de cuentas (PGC español)
    entries.forEach((entry, index) => {
      if (entry.account_code) {
        // Grupo 1-5 son cuentas de balance, 6-7 son de resultado
        const group = parseInt(entry.account_code.charAt(0));
        
        // Validar que gastos (6) van al debe y ingresos (7) al haber
        if (group === 6 && entry.credit > 0 && entry.debit === 0) {
          results.push({
            isValid: true,
            severity: 'warning',
            code: 'EXPENSE_IN_CREDIT',
            message: `La cuenta ${entry.account_code} (gasto) tiene saldo acreedor`,
            recommendation: 'Verifique que no sea un abono de gasto incorrecto',
            affectedEntries: [index]
          });
        }

        if (group === 7 && entry.debit > 0 && entry.credit === 0) {
          results.push({
            isValid: true,
            severity: 'warning',
            code: 'INCOME_IN_DEBIT',
            message: `La cuenta ${entry.account_code} (ingreso) tiene saldo deudor`,
            recommendation: 'Verifique que no sea un cargo a ingreso incorrecto',
            affectedEntries: [index]
          });
        }
      }
    });

    // Si todo OK
    if (results.length === 0) {
      results.push({
        isValid: true,
        severity: 'info',
        code: 'ALL_OK',
        message: 'Todas las partidas están correctamente configuradas',
        recommendation: 'El asiento está listo para contabilizar'
      });
    }

    return results;
  }, []);

  // Análisis AI profundo de las partidas
  const analyzeWithAI = useCallback(async (context: SupervisorContext) => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('erp-accounting-supervisor', {
        body: {
          action: 'analyze',
          context: {
            operationType: context.operationType,
            entries: context.entries,
            operationData: context.operationData,
            countryCode: 'ES',
            accountingFramework: 'PGC'
          }
        }
      });

      if (error) throw error;

      if (data?.success && data?.analysis) {
        const analysis = data.analysis;

        // Procesar alertas del análisis AI
        if (analysis.alerts && Array.isArray(analysis.alerts)) {
          analysis.alerts.forEach((alert: any) => {
            addAlert(
              alert.type || 'recommendation',
              alert.title,
              alert.message,
              alert.severity || 'medium',
              alert.recommendation,
              alert.severity === 'critical' || alert.severity === 'high'
            );
          });
        }

        // Procesar validaciones
        if (analysis.validations && Array.isArray(analysis.validations)) {
          setValidations(prev => [...prev, ...analysis.validations]);
        }

        // Procesar recomendaciones generales
        if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
          analysis.recommendations.forEach((rec: any) => {
            addAlert(
              'recommendation',
              'Recomendación del Supervisor',
              rec.message || rec,
              'low',
              rec.action,
              false
            );
          });
        }

        setLastAnalysis(new Date());
        return analysis;
      }

      return null;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      addAlert(
        'warning',
        'Error de Análisis',
        'No se pudo completar el análisis AI. Continuando con validación local.',
        'medium'
      );
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [addAlert]);

  // Supervisar partidas (combina validación local + AI)
  const supervise = useCallback(async (context: SupervisorContext) => {
    if (!isActive) return;

    // Primero validación local
    const localValidations = validateEntriesLocally(context.entries);
    setValidations(localValidations);

    // Generar alertas por validaciones críticas
    const criticalValidations = localValidations.filter(v => !v.isValid && (v.severity === 'error' || v.severity === 'critical'));
    
    criticalValidations.forEach(validation => {
      addAlert(
        'validation',
        'Incidencia Detectada',
        validation.message,
        validation.severity === 'critical' ? 'critical' : 'high',
        validation.recommendation,
        true
      );
    });

    // Análisis AI si hay datos suficientes
    if (context.entries.length > 0 && context.operationData?.amount) {
      // Debounce para evitar llamadas excesivas
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      analysisTimeoutRef.current = setTimeout(async () => {
        await analyzeWithAI(context);
      }, 2000);
    }
  }, [isActive, validateEntriesLocally, addAlert, analyzeWithAI]);

  // Activar/desactivar supervisor
  const toggleActive = useCallback(() => {
    setIsActive(prev => {
      const newState = !prev;
      if (newState) {
        addAlert(
          'recommendation',
          'Supervisor Activado',
          'El agente supervisor de contabilidad está vigilando las partidas',
          'low',
          undefined,
          true
        );
      }
      return newState;
    });
  }, [addAlert]);

  // Marcar alerta como leída
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  // Limpiar alertas
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Detener audio
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Repetir última alerta crítica
  const repeatLastCriticalAlert = useCallback(() => {
    const criticalAlert = alerts.find(a => a.severity === 'critical' || a.severity === 'high');
    if (criticalAlert) {
      const text = `${criticalAlert.title}. ${criticalAlert.message}${criticalAlert.recommendation ? `. Recomendación: ${criticalAlert.recommendation}` : ''}`;
      speakAlert(text, criticalAlert.severity);
    }
  }, [alerts, speakAlert]);

  return {
    // Estado
    isActive,
    isAnalyzing,
    isSpeaking,
    alerts,
    validations,
    lastAnalysis,
    audioEnabled,
    
    // Acciones
    toggleActive,
    setAudioEnabled,
    supervise,
    addAlert,
    markAlertAsRead,
    clearAlerts,
    stopSpeaking,
    repeatLastCriticalAlert,
    speakAlert,
    
    // Estadísticas
    unreadCount: alerts.filter(a => !a.isRead).length,
    criticalCount: alerts.filter(a => a.severity === 'critical' && !a.isRead).length,
    hasErrors: validations.some(v => !v.isValid && v.severity === 'error')
  };
}

export default useAccountingSupervisorAgent;
