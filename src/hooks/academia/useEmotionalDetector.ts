/**
 * useEmotionalDetector - Hook para detección emocional básica
 * Analiza patrones de interacción para detectar estado emocional del estudiante
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InteractionPattern {
  type: 'pause' | 'rewind' | 'skip' | 'question' | 'error' | 'success' | 'idle' | 'fast_forward';
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface EmotionalState {
  state: 'neutral' | 'frustrated' | 'confused' | 'disengaged' | 'engaged' | 'confident';
  confidence: number;
  frustrationLevel: number;
  engagementLevel: number;
  recommendations: string[];
  lastAnalyzed: Date | null;
}

export interface EmotionalDetectorOptions {
  courseId: string;
  lessonId?: string;
  analysisInterval?: number; // ms between analyses
  onStateChange?: (state: EmotionalState) => void;
}

export function useEmotionalDetector(options: EmotionalDetectorOptions) {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    state: 'neutral',
    confidence: 0.5,
    frustrationLevel: 0,
    engagementLevel: 0.5,
    recommendations: [],
    lastAnalyzed: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const patternsRef = useRef<InteractionPattern[]>([]);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const lastAnalysisRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleStartRef = useRef<number | null>(null);

  const analysisInterval = options.analysisInterval || 30000; // 30 seconds default

  // Record an interaction pattern
  const recordPattern = useCallback((
    type: InteractionPattern['type'],
    metadata?: Record<string, unknown>
  ) => {
    const pattern: InteractionPattern = {
      type,
      timestamp: Date.now(),
      metadata,
    };

    patternsRef.current.push(pattern);

    // Keep only last 50 patterns
    if (patternsRef.current.length > 50) {
      patternsRef.current = patternsRef.current.slice(-50);
    }

    // Reset idle timer on any activity
    if (type !== 'idle') {
      resetIdleTimer();
    }

    console.log('[EmotionalDetector] Pattern recorded:', type);
  }, []);

  // Start idle detection
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // If we were idle, record the duration
    if (idleStartRef.current) {
      const idleDuration = Date.now() - idleStartRef.current;
      if (idleDuration > 10000) { // Only record if idle for more than 10 seconds
        patternsRef.current.push({
          type: 'idle',
          timestamp: idleStartRef.current,
          duration: idleDuration,
        });
      }
      idleStartRef.current = null;
    }

    // Start new idle timer
    idleTimerRef.current = setTimeout(() => {
      idleStartRef.current = Date.now();
      console.log('[EmotionalDetector] Idle detected');
    }, 30000); // 30 seconds of no activity
  }, []);

  // Analyze patterns and get emotional state
  const analyzePatterns = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    
    // Don't analyze too frequently unless forced
    if (!force && now - lastAnalysisRef.current < analysisInterval) {
      return;
    }

    if (patternsRef.current.length < 3) {
      return; // Need at least 3 patterns
    }

    setIsAnalyzing(true);
    lastAnalysisRef.current = now;

    try {
      const { data, error } = await supabase.functions.invoke('academia-emotional-analytics', {
        body: {
          action: 'analyze',
          courseId: options.courseId,
          lessonId: options.lessonId,
          sessionId: sessionIdRef.current,
          patterns: patternsRef.current,
        },
      });

      if (error) {
        console.error('[EmotionalDetector] Analysis error:', error);
        return;
      }

      if (data?.success && data?.analysis) {
        const newState: EmotionalState = {
          state: data.analysis.state,
          confidence: data.analysis.confidence,
          frustrationLevel: data.analysis.frustrationLevel,
          engagementLevel: data.analysis.engagementLevel,
          recommendations: data.recommendations || [],
          lastAnalyzed: new Date(),
        };

        setEmotionalState(newState);
        options.onStateChange?.(newState);
      }
    } catch (err) {
      console.error('[EmotionalDetector] Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [options, analysisInterval]);

  // Common interaction recording helpers
  const recordVideoAction = useCallback((action: 'pause' | 'play' | 'rewind' | 'skip' | 'fast_forward', videoTime?: number) => {
    if (action === 'play') return; // Don't record play, it's the default
    recordPattern(action as InteractionPattern['type'], { videoTime });
  }, [recordPattern]);

  const recordQuizResult = useCallback((correct: boolean, questionId?: string) => {
    recordPattern(correct ? 'success' : 'error', { questionId });
  }, [recordPattern]);

  const recordQuestion = useCallback((questionText?: string) => {
    recordPattern('question', { questionText });
  }, [recordPattern]);

  // Auto-analyze on interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      analyzePatterns();
    }, analysisInterval);

    resetIdleTimer();

    return () => {
      clearInterval(intervalId);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [analyzePatterns, analysisInterval, resetIdleTimer]);

  // Get current session ID
  const getSessionId = useCallback(() => sessionIdRef.current, []);

  // Get summary of session
  const getSessionSummary = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('academia-emotional-analytics', {
        body: {
          action: 'get_summary',
          courseId: options.courseId,
          lessonId: options.lessonId,
          sessionId: sessionIdRef.current,
        },
      });

      if (error) {
        console.error('[EmotionalDetector] Summary error:', error);
        return null;
      }

      return data?.summary || null;
    } catch (err) {
      console.error('[EmotionalDetector] Summary error:', err);
      return null;
    }
  }, [options]);

  // Reset patterns for new session
  const resetSession = useCallback(() => {
    patternsRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
    lastAnalysisRef.current = 0;
    setEmotionalState({
      state: 'neutral',
      confidence: 0.5,
      frustrationLevel: 0,
      engagementLevel: 0.5,
      recommendations: [],
      lastAnalyzed: null,
    });
  }, []);

  return {
    // State
    emotionalState,
    isAnalyzing,
    
    // Pattern recording
    recordPattern,
    recordVideoAction,
    recordQuizResult,
    recordQuestion,
    
    // Analysis
    analyzePatterns,
    getSessionSummary,
    
    // Session
    getSessionId,
    resetSession,
  };
}

export default useEmotionalDetector;
