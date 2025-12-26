// Emotional Analysis Module - Multimodal Real-time Analysis
// Detección voz + texto + video, respuesta adaptativa, predicción abandono

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface EmotionalState {
  primary: 'neutral' | 'happy' | 'frustrated' | 'angry' | 'confused' | 'anxious' | 'satisfied';
  secondary?: string;
  intensity: number; // 0-1
  confidence: number;
  timestamp: string;
}

export interface MultimodalSignals {
  text?: TextEmotionSignals;
  voice?: VoiceEmotionSignals;
  video?: VideoEmotionSignals;
  combined: EmotionalState;
}

export interface TextEmotionSignals {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  emotions: { emotion: string; score: number }[];
  urgencyIndicators: string[];
  frustrationKeywords: string[];
  satisfactionKeywords: string[];
}

export interface VoiceEmotionSignals {
  pitch: number;
  pitchVariation: number;
  speakingRate: number;
  volume: number;
  pauseFrequency: number;
  emotionalTone: string;
  stressLevel: number;
  confidence: number;
}

export interface VideoEmotionSignals {
  facialExpression: string;
  eyeContact: boolean;
  headMovement: string;
  microExpressions: string[];
  engagementLevel: number;
  attentionScore: number;
  confidence: number;
}

export interface AbandonmentRisk {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  timeToAbandon?: number; // seconds
  recommendations: string[];
  interventionNeeded: boolean;
}

export interface AdaptiveResponse {
  tone: 'empathetic' | 'professional' | 'friendly' | 'urgent' | 'reassuring';
  pacing: 'slow' | 'normal' | 'fast';
  emphasis: string[];
  avoidTopics: string[];
  suggestedPhrases: string[];
  escalationRecommended: boolean;
  humanHandoffSuggested: boolean;
}

export interface EmotionalTimeline {
  sessionId: string;
  customerId: string;
  states: Array<{
    timestamp: string;
    state: EmotionalState;
    trigger?: string;
    agentAction?: string;
  }>;
  overallTrend: 'improving' | 'stable' | 'declining';
  criticalMoments: string[];
}

export interface AnalysisConfig {
  enableVoice: boolean;
  enableVideo: boolean;
  enableText: boolean;
  analysisInterval: number; // ms
  abandonmentThreshold: number;
  autoAdaptResponse: boolean;
}

// === HOOK ===
export function useEmotionalAnalysis() {
  const [currentState, setCurrentState] = useState<MultimodalSignals | null>(null);
  const [timeline, setTimeline] = useState<EmotionalTimeline | null>(null);
  const [abandonmentRisk, setAbandonmentRisk] = useState<AbandonmentRisk | null>(null);
  const [adaptiveResponse, setAdaptiveResponse] = useState<AdaptiveResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [config, setConfig] = useState<AnalysisConfig>({
    enableVoice: true,
    enableVideo: false,
    enableText: true,
    analysisInterval: 5000,
    abandonmentThreshold: 70,
    autoAdaptResponse: true
  });
  const [error, setError] = useState<string | null>(null);

  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // === ANALYZE TEXT EMOTION ===
  const analyzeText = useCallback(async (text: string): Promise<TextEmotionSignals | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'analyze_text',
          text
        }
      });

      if (fnError) throw fnError;

      return data?.signals || null;
    } catch (err) {
      console.error('[useEmotionalAnalysis] analyzeText error:', err);
      return null;
    }
  }, []);

  // === ANALYZE VOICE EMOTION ===
  const analyzeVoice = useCallback(async (audioData: string): Promise<VoiceEmotionSignals | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'analyze_voice',
          audioData
        }
      });

      if (fnError) throw fnError;

      return data?.signals || null;
    } catch (err) {
      console.error('[useEmotionalAnalysis] analyzeVoice error:', err);
      return null;
    }
  }, []);

  // === ANALYZE VIDEO EMOTION ===
  const analyzeVideo = useCallback(async (frameData: string): Promise<VideoEmotionSignals | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'analyze_video',
          frameData
        }
      });

      if (fnError) throw fnError;

      return data?.signals || null;
    } catch (err) {
      console.error('[useEmotionalAnalysis] analyzeVideo error:', err);
      return null;
    }
  }, []);

  // === COMBINED MULTIMODAL ANALYSIS ===
  const analyzeMultimodal = useCallback(async (
    input: {
      text?: string;
      audioData?: string;
      videoFrame?: string;
    },
    sessionId: string
  ): Promise<MultimodalSignals | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'analyze_multimodal',
          input,
          sessionId,
          config
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.signals) {
        const signals = data.signals as MultimodalSignals;
        setCurrentState(signals);

        // Update timeline
        if (data.timeline) {
          setTimeline(data.timeline as EmotionalTimeline);
        }

        // Check abandonment risk
        if (data.abandonmentRisk) {
          const risk = data.abandonmentRisk as AbandonmentRisk;
          setAbandonmentRisk(risk);

          if (risk.interventionNeeded) {
            toast.warning('⚠️ Riesgo de abandono alto', {
              description: 'Se recomienda intervención inmediata'
            });
          }
        }

        // Get adaptive response
        if (config.autoAdaptResponse && data.adaptiveResponse) {
          setAdaptiveResponse(data.adaptiveResponse as AdaptiveResponse);
        }

        return signals;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useEmotionalAnalysis] analyzeMultimodal error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [config]);

  // === PREDICT ABANDONMENT ===
  const predictAbandonment = useCallback(async (
    sessionId: string,
    currentEmotionalState: EmotionalState,
    sessionDuration: number,
    interactionCount: number
  ): Promise<AbandonmentRisk | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'predict_abandonment',
          sessionId,
          currentEmotionalState,
          sessionDuration,
          interactionCount
        }
      });

      if (fnError) throw fnError;

      if (data?.risk) {
        const risk = data.risk as AbandonmentRisk;
        setAbandonmentRisk(risk);
        return risk;
      }

      return null;
    } catch (err) {
      console.error('[useEmotionalAnalysis] predictAbandonment error:', err);
      return null;
    }
  }, []);

  // === GET ADAPTIVE RESPONSE SUGGESTIONS ===
  const getAdaptiveResponse = useCallback(async (
    emotionalState: EmotionalState,
    conversationContext: string
  ): Promise<AdaptiveResponse | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'get_adaptive_response',
          emotionalState,
          conversationContext
        }
      });

      if (fnError) throw fnError;

      if (data?.response) {
        const response = data.response as AdaptiveResponse;
        setAdaptiveResponse(response);
        return response;
      }

      return null;
    } catch (err) {
      console.error('[useEmotionalAnalysis] getAdaptiveResponse error:', err);
      return null;
    }
  }, []);

  // === START REAL-TIME ANALYSIS ===
  const startRealtimeAnalysis = useCallback(async (
    sessionId: string,
    onStateChange?: (state: MultimodalSignals) => void
  ) => {
    stopRealtimeAnalysis();

    try {
      // Request microphone access if voice enabled
      if (config.enableVoice) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: config.enableVideo 
        });
        audioContextRef.current = new AudioContext();
      }

      toast.success('Análisis emocional iniciado');

      // Start periodic analysis
      analysisIntervalRef.current = setInterval(async () => {
        // In a real implementation, this would capture and analyze media streams
        // For now, we simulate with text-only analysis
        const result = await analyzeMultimodal({ text: '' }, sessionId);
        if (result && onStateChange) {
          onStateChange(result);
        }
      }, config.analysisInterval);

    } catch (err) {
      console.error('[useEmotionalAnalysis] startRealtimeAnalysis error:', err);
      toast.error('Error iniciando análisis', {
        description: err instanceof Error ? err.message : 'No se pudo acceder al micrófono'
      });
    }
  }, [config, analyzeMultimodal]);

  // === STOP REAL-TIME ANALYSIS ===
  const stopRealtimeAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback((newConfig: Partial<AnalysisConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // === GET EMOTIONAL TRENDS ===
  const getEmotionalTrends = useCallback(async (
    customerId: string,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('emotional-analysis-multimodal', {
        body: {
          action: 'get_trends',
          customerId,
          timeRange
        }
      });

      if (fnError) throw fnError;

      return data?.trends || null;
    } catch (err) {
      console.error('[useEmotionalAnalysis] getEmotionalTrends error:', err);
      return null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      stopRealtimeAnalysis();
    };
  }, [stopRealtimeAnalysis]);

  return {
    // State
    currentState,
    timeline,
    abandonmentRisk,
    adaptiveResponse,
    isAnalyzing,
    config,
    error,
    // Actions
    analyzeText,
    analyzeVoice,
    analyzeVideo,
    analyzeMultimodal,
    predictAbandonment,
    getAdaptiveResponse,
    startRealtimeAnalysis,
    stopRealtimeAnalysis,
    updateConfig,
    getEmotionalTrends,
  };
}

export default useEmotionalAnalysis;
