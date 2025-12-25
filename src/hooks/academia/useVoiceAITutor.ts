/**
 * useVoiceAITutor - Hook para el tutor de voz con ElevenLabs
 * Gestiona la conversación de voz bidireccional
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoiceTutorOptions {
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onEmotionalChange?: (state: string) => void;
}

export interface VoiceSessionData {
  sessionId: string;
  startedAt: Date;
  messagesCount: number;
  totalDuration: number;
}

export function useVoiceAITutor(options: VoiceTutorOptions) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionData, setSessionData] = useState<VoiceSessionData | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: Date }>>([]);
  const [error, setError] = useState<string | null>(null);
  
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const startTimeRef = useRef<Date | null>(null);
  const messageCountRef = useRef(0);

  // Initialize ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceAITutor] Connected to ElevenLabs');
      startTimeRef.current = new Date();
      
      // Create session in database
      createVoiceSession();
    },
    onDisconnect: () => {
      console.log('[VoiceAITutor] Disconnected');
      
      // Update session as ended
      if (sessionData) {
        endVoiceSession();
      }
    },
    onMessage: (message) => {
      console.log('[VoiceAITutor] Message:', message);
      
      // Handle different message types - cast to any for flexibility
      const msg = message as unknown as Record<string, unknown>;
      const messageType = msg?.type as string;
      if (messageType === 'user_transcript') {
        const event = msg?.user_transcription_event as Record<string, unknown>;
        const text = (event?.user_transcript as string) || '';
        if (text) {
          addTranscript('user', text);
          options.onTranscript?.(text, 'user');
        }
      } else if (messageType === 'agent_response') {
        const event = msg?.agent_response_event as Record<string, unknown>;
        const text = (event?.agent_response as string) || '';
        if (text) {
          addTranscript('assistant', text);
          options.onTranscript?.(text, 'assistant');
          messageCountRef.current++;
        }
      }
    },
    onError: (errorMessage) => {
      console.error('[VoiceAITutor] Error:', errorMessage);
      const errMsg = typeof errorMessage === 'string' ? errorMessage : 'Error de conexión';
      setError(errMsg);
      toast.error('Error en la conexión de voz');
    },
  });

  // Add transcript to history
  const addTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscripts(prev => [...prev, {
      role,
      text,
      timestamp: new Date(),
    }]);
  }, []);

  // Create voice session in database
  const createVoiceSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: insertError } = await supabase
        .from('academia_voice_sessions')
        .insert({
          id: sessionIdRef.current,
          user_id: user.id,
          course_id: options.courseId,
          lesson_id: options.lessonId || null,
          session_type: 'voice_tutor',
          status: 'active',
          started_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[VoiceAITutor] Session create error:', insertError);
      } else {
        setSessionData({
          sessionId: sessionIdRef.current,
          startedAt: new Date(),
          messagesCount: 0,
          totalDuration: 0,
        });
      }
    } catch (err) {
      console.error('[VoiceAITutor] Session create error:', err);
    }
  }, [options.courseId, options.lessonId]);

  // End voice session
  const endVoiceSession = useCallback(async () => {
    try {
      const duration = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        : 0;

      await supabase
        .from('academia_voice_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          total_duration_seconds: duration,
          messages_count: messageCountRef.current,
        })
        .eq('id', sessionIdRef.current);

      setSessionData(null);
    } catch (err) {
      console.error('[VoiceAITutor] Session end error:', err);
    }
  }, []);

  // Start voice conversation
  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error: fnError } = await supabase.functions.invoke('academia-voice-token', {
        body: {
          courseId: options.courseId,
          lessonId: options.lessonId,
          courseTitle: options.courseTitle,
          lessonTitle: options.lessonTitle,
        },
      });

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Error al obtener token de voz');
      }

      if (!data.signed_url) {
        throw new Error('No se recibió URL de conexión');
      }

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      toast.success('Tutor de voz conectado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        toast.error('Permiso de micrófono denegado. Por favor, habilita el acceso.');
      } else {
        toast.error('Error al conectar el tutor de voz');
      }
      console.error('[VoiceAITutor] Start error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, options]);

  // Stop voice conversation
  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('[VoiceAITutor] Stop error:', err);
    }
  }, [conversation]);

  // Send text message (for accessibility)
  const sendTextMessage = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
      addTranscript('user', text);
    }
  }, [conversation, addTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [conversation]);

  return {
    // State
    isConnecting,
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    error,
    transcripts,
    sessionData,
    
    // Actions
    startConversation,
    stopConversation,
    sendTextMessage,
    
    // From conversation hook
    status: conversation.status,
  };
}

export default useVoiceAITutor;
