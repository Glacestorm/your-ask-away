import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface VoiceSession {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_duration_seconds: number | null;
  commands_count: number | null;
  session_type: string;
  context_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface VoiceCommand {
  understood: boolean;
  intent: 'navigate' | 'query' | 'action' | 'alert' | 'unknown';
  command: {
    type: string;
    target: string;
    params?: Record<string, unknown>;
  };
  response: {
    text: string;
    action: string;
  };
  confidence: number;
  alternatives?: Array<{ intent: string; confidence: number }>;
}

export interface VoiceContext {
  currentRoute?: string;
  currentView?: string;
  availableActions?: string[];
}

export function useVoiceInterface() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<VoiceSession | null>(null);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasSpeechRecognition = !!SpeechRecognitionAPI;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    
    setHasVoiceSupport(hasSpeechRecognition && hasSpeechSynthesis);
    
    if (hasSpeechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('voice-interface', {
        body: { action: 'get_sessions', userId: user.id }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error('[useVoiceInterface] fetchSessions error:', err);
    }
  }, [user?.id]);

  const startSession = useCallback(async (context?: VoiceContext) => {
    if (!user?.id) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('voice-interface', {
        body: { 
          action: 'start_session', 
          userId: user.id,
          context: { ...context, sessionType: 'command' }
        }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setActiveSession(data.data);
        toast.success('Sesión de voz iniciada');
        return data.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error starting session';
      setError(message);
      toast.error(message);
      return null;
    }
  }, [user?.id]);

  const endSession = useCallback(async () => {
    if (!activeSession?.id) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('voice-interface', {
        body: { action: 'end_session', sessionId: activeSession.id }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setActiveSession(null);
        await fetchSessions();
        toast.success('Sesión de voz finalizada');
      }
    } catch (err) {
      console.error('[useVoiceInterface] endSession error:', err);
    }
  }, [activeSession?.id, fetchSessions]);

  const processCommand = useCallback(async (command: string, context?: VoiceContext) => {
    if (!command.trim()) return null;

    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('voice-interface', {
        body: { 
          action: 'process_command', 
          command,
          sessionId: activeSession?.id,
          userId: user?.id,
          context
        }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        const result = data.data as VoiceCommand;
        setLastCommand(result);
        
        // Speak the response
        if (result.response?.text && synthesisRef.current) {
          const utterance = new SpeechSynthesisUtterance(result.response.text);
          utterance.lang = 'es-ES';
          synthesisRef.current.speak(utterance);
        }
        
        return result;
      }
      
      throw new Error(data?.error || 'Command processing failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error processing command';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [activeSession?.id, user?.id]);

  const startListening = useCallback(() => {
    if (!hasVoiceSupport) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;
      
      setTranscript(transcriptText);
      
      if (result.isFinal) {
        processCommand(transcriptText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[useVoiceInterface] Recognition error:', event.error);
      setError(`Error de reconocimiento: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [hasVoiceSupport, processCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    synthesisRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    activeSession,
    sessions,
    isListening,
    isProcessing,
    lastCommand,
    transcript,
    error,
    hasVoiceSupport,
    fetchSessions,
    startSession,
    endSession,
    processCommand,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

export default useVoiceInterface;
