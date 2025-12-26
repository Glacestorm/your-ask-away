// Screen Understanding Module - AI Vision for Support
// Análisis de screenshots, detección de errores visuales, anotaciones en tiempo real

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ScreenAnalysis {
  id: string;
  sessionId: string;
  imageUrl: string;
  timestamp: string;
  analysis: {
    errorDetected: boolean;
    errorType?: string;
    errorLocation?: { x: number; y: number; width: number; height: number };
    uiElements: UIElement[];
    textContent: string[];
    suggestions: string[];
    confidence: number;
  };
  annotations: ScreenAnnotation[];
  aiInsights: string[];
}

export interface UIElement {
  id: string;
  type: 'button' | 'input' | 'text' | 'image' | 'error' | 'warning' | 'dialog' | 'menu';
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  state?: 'normal' | 'disabled' | 'error' | 'loading' | 'selected';
  confidence: number;
}

export interface ScreenAnnotation {
  id: string;
  type: 'highlight' | 'arrow' | 'text' | 'circle' | 'rectangle';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color: string;
  label?: string;
  createdBy: 'ai' | 'agent' | 'user';
  timestamp: string;
}

export interface VisualErrorPattern {
  id: string;
  patternType: string;
  description: string;
  visualSignature: string;
  frequency: number;
  resolutionSteps: string[];
  lastSeen: string;
}

export interface ScreenContext {
  sessionId: string;
  customerId?: string;
  applicationName?: string;
  screenType?: string;
  previousScreens?: string[];
}

// === HOOK ===
export function useScreenUnderstanding() {
  const [analyses, setAnalyses] = useState<ScreenAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ScreenAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorPatterns, setErrorPatterns] = useState<VisualErrorPattern[]>([]);
  const [liveAnnotations, setLiveAnnotations] = useState<ScreenAnnotation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analysisQueue = useRef<string[]>([]);

  // === ANALYZE SCREENSHOT ===
  const analyzeScreenshot = useCallback(async (
    imageData: string, // base64 or URL
    context: ScreenContext
  ): Promise<ScreenAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('screen-understanding', {
        body: {
          action: 'analyze_screenshot',
          imageData,
          context
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.analysis) {
        const analysis: ScreenAnalysis = {
          id: crypto.randomUUID(),
          sessionId: context.sessionId,
          imageUrl: imageData.startsWith('data:') ? imageData : imageData,
          timestamp: new Date().toISOString(),
          analysis: data.analysis,
          annotations: data.annotations || [],
          aiInsights: data.insights || []
        };

        setCurrentAnalysis(analysis);
        setAnalyses(prev => [analysis, ...prev].slice(0, 50));
        
        if (analysis.analysis.errorDetected) {
          toast.warning('Error visual detectado', {
            description: analysis.analysis.errorType || 'Se encontró un problema en la pantalla'
          });
        }

        return analysis;
      }

      throw new Error(data?.error || 'Error analyzing screenshot');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useScreenUnderstanding] analyzeScreenshot error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // === DETECT VISUAL ERRORS ===
  const detectVisualErrors = useCallback(async (
    imageData: string,
    expectedState?: Record<string, unknown>
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('screen-understanding', {
        body: {
          action: 'detect_errors',
          imageData,
          expectedState
        }
      });

      if (fnError) throw fnError;

      return data?.errors || [];
    } catch (err) {
      console.error('[useScreenUnderstanding] detectVisualErrors error:', err);
      return [];
    }
  }, []);

  // === ADD ANNOTATION ===
  const addAnnotation = useCallback((annotation: Omit<ScreenAnnotation, 'id' | 'timestamp'>) => {
    const newAnnotation: ScreenAnnotation = {
      ...annotation,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    setLiveAnnotations(prev => [...prev, newAnnotation]);

    // Update current analysis if exists
    if (currentAnalysis) {
      setCurrentAnalysis(prev => prev ? {
        ...prev,
        annotations: [...prev.annotations, newAnnotation]
      } : null);
    }

    return newAnnotation;
  }, [currentAnalysis]);

  // === REMOVE ANNOTATION ===
  const removeAnnotation = useCallback((annotationId: string) => {
    setLiveAnnotations(prev => prev.filter(a => a.id !== annotationId));
    
    if (currentAnalysis) {
      setCurrentAnalysis(prev => prev ? {
        ...prev,
        annotations: prev.annotations.filter(a => a.id !== annotationId)
      } : null);
    }
  }, [currentAnalysis]);

  // === COMPARE SCREENS ===
  const compareScreens = useCallback(async (
    beforeImage: string,
    afterImage: string,
    context?: ScreenContext
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('screen-understanding', {
        body: {
          action: 'compare_screens',
          beforeImage,
          afterImage,
          context
        }
      });

      if (fnError) throw fnError;

      return data?.comparison || null;
    } catch (err) {
      console.error('[useScreenUnderstanding] compareScreens error:', err);
      return null;
    }
  }, []);

  // === EXTRACT TEXT FROM SCREEN ===
  const extractScreenText = useCallback(async (imageData: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('screen-understanding', {
        body: {
          action: 'extract_text',
          imageData
        }
      });

      if (fnError) throw fnError;

      return data?.text || [];
    } catch (err) {
      console.error('[useScreenUnderstanding] extractScreenText error:', err);
      return [];
    }
  }, []);

  // === GET ERROR PATTERNS ===
  const fetchErrorPatterns = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('screen-understanding', {
        body: { action: 'get_error_patterns' }
      });

      if (fnError) throw fnError;

      setErrorPatterns(data?.patterns || []);
      return data?.patterns || [];
    } catch (err) {
      console.error('[useScreenUnderstanding] fetchErrorPatterns error:', err);
      return [];
    }
  }, []);

  // === GENERATE STEP-BY-STEP GUIDE ===
  const generateVisualGuide = useCallback(async (
    problemDescription: string,
    targetScreens: string[]
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('screen-understanding', {
        body: {
          action: 'generate_guide',
          problemDescription,
          targetScreens
        }
      });

      if (fnError) throw fnError;

      return data?.guide || null;
    } catch (err) {
      console.error('[useScreenUnderstanding] generateVisualGuide error:', err);
      return null;
    }
  }, []);

  // === CLEAR STATE ===
  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setLiveAnnotations([]);
    setError(null);
  }, []);

  return {
    // State
    analyses,
    currentAnalysis,
    isAnalyzing,
    errorPatterns,
    liveAnnotations,
    error,
    // Actions
    analyzeScreenshot,
    detectVisualErrors,
    addAnnotation,
    removeAnnotation,
    compareScreens,
    extractScreenText,
    fetchErrorPatterns,
    generateVisualGuide,
    clearAnalysis,
  };
}

export default useScreenUnderstanding;
