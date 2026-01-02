/**
 * Hook: useAccountingVoiceAgent
 * Voice Intelligence Hub para ERP Contable
 * Fase 2 del Plan Estratosférico
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// === INTERFACES ===
export interface VoiceSession {
  id: string;
  user_id: string;
  session_type: 'general' | 'journal_entry' | 'query' | 'report' | 'audit';
  language: string;
  voice_id?: string;
  status: 'active' | 'completed' | 'cancelled' | 'error';
  context_data: Record<string, unknown>;
  started_at: string;
  ended_at?: string;
  total_duration_seconds?: number;
  messages_count: number;
  actions_taken: unknown[];
}

export interface VoiceTranscript {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  confidence_score?: number;
  audio_duration_ms?: number;
  intent_detected?: string;
  entities_extracted?: Record<string, unknown>;
  action_triggered?: string;
  action_result?: unknown;
  created_at: string;
}

export interface VoicePreferences {
  id: string;
  user_id: string;
  preferred_language: string;
  voice_id_es: string;
  voice_id_ca: string;
  voice_id_en: string;
  voice_id_fr: string;
  speech_rate: number;
  auto_detect_language: boolean;
  enable_voice_feedback: boolean;
  enable_voice_commands: boolean;
  wake_word_enabled: boolean;
  transcription_display: 'realtime' | 'final' | 'none';
}

export interface VoiceCommandResult {
  success: boolean;
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  spokenResponse: string;
  action?: {
    type: string;
    target: string;
    params: Record<string, unknown>;
  };
  followUpQuestion?: string;
}

export interface AccountingVoiceContext {
  module: 'accounting' | 'customers' | 'suppliers' | 'inventory' | 'reports';
  currentView?: string;
  selectedEntity?: { type: string; id: string; name: string };
  recentActions?: Array<{ action: string; timestamp: string }>;
}

// === VOICE AGENT HOOK ===
export function useAccountingVoiceAgent(options?: {
  language?: string;
  voiceId?: string;
  enableSTT?: boolean;
  enableTTS?: boolean;
  context?: AccountingVoiceContext;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onCommand?: (result: VoiceCommandResult) => void;
  onError?: (error: Error) => void;
}) {
  const { user } = useAuth();
  
  // State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null);
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([]);
  const [preferences, setPreferences] = useState<VoicePreferences | null>(null);
  const [lastCommand, setLastCommand] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const sessionStartTime = useRef<Date | null>(null);
  const messageCount = useRef(0);
  
  // Default options
  const language = options?.language || preferences?.preferred_language || 'es';
  const enableSTT = options?.enableSTT ?? true;
  const enableTTS = options?.enableTTS ?? true;

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('[AccountingVoiceAgent] Connected to voice agent');
      setError(null);
    },
    onDisconnect: () => {
      console.log('[AccountingVoiceAgent] Disconnected from voice agent');
      endSession();
    },
    onMessage: (message: unknown) => {
      console.log('[AccountingVoiceAgent] Message received:', message);
      
      const msg = message as Record<string, unknown>;
      if (msg.type === 'user_transcript') {
        const text = (msg as any).user_transcription_event?.user_transcript;
        if (text) {
          handleUserTranscript(text);
        }
      } else if (msg.type === 'agent_response') {
        const text = (msg as any).agent_response_event?.agent_response;
        if (text) {
          handleAgentResponse(text);
        }
      }
    },
    onError: (err: unknown) => {
      console.error('[AccountingVoiceAgent] Error:', err);
      setError('Error en la conexión de voz');
      options?.onError?.(new Error('Voice connection error'));
    },
  });

  // === FETCH PREFERENCES ===
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('user_voice_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (data) {
        setPreferences(data as VoicePreferences);
        return data;
      }

      // Create default preferences if none exist
      const defaultPrefs = {
        user_id: user.id,
        preferred_language: 'es',
        voice_id_es: 'JBFqnCBsd6RMkjVDRZzb',
        voice_id_ca: 'JBFqnCBsd6RMkjVDRZzb',
        voice_id_en: 'onwK4e9ZLuTAKqWW03F9',
        voice_id_fr: 'TX3LPaxmHKxFdv7VOQHJ',
        speech_rate: 1.0,
        auto_detect_language: true,
        enable_voice_feedback: true,
        enable_voice_commands: true,
        wake_word_enabled: false,
        transcription_display: 'realtime'
      };

      const { data: newPrefs, error: insertError } = await supabase
        .from('user_voice_preferences')
        .insert([defaultPrefs as any])
        .select()
        .single();

      if (insertError) throw insertError;
      setPreferences(newPrefs as VoicePreferences);
      return newPrefs;
    } catch (err) {
      console.error('[AccountingVoiceAgent] fetchPreferences error:', err);
      return null;
    }
  }, [user?.id]);

  // === START SESSION ===
  const startSession = useCallback(async (
    sessionType: VoiceSession['session_type'] = 'general',
    agentId?: string
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para usar el asistente de voz');
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create session in database
      const { data: session, error: sessionError } = await supabase
        .from('erp_voice_sessions')
        .insert([{
          user_id: user.id,
          session_type: sessionType,
          language,
          status: 'active',
          context_data: options?.context || {},
          messages_count: 0,
          actions_taken: []
        } as any])
        .select()
        .single();

      if (sessionError) throw sessionError;

      setCurrentSession(session as VoiceSession);
      sessionStartTime.current = new Date();
      messageCount.current = 0;

      // Get token from edge function if agentId provided
      if (agentId) {
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
          'erp-voice-agent-token',
          {
            body: { agentId, sessionType, language }
          }
        );

        if (tokenError) throw tokenError;

        if (tokenData?.signed_url) {
          await conversation.startSession({
            signedUrl: tokenData.signed_url,
          });
        }
      }

      toast.success('Asistente de voz conectado');
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error iniciando sesión de voz';
      setError(message);
      toast.error(message);
      console.error('[AccountingVoiceAgent] startSession error:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, language, options?.context, conversation]);

  // === END SESSION ===
  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      const endTime = new Date();
      const duration = sessionStartTime.current 
        ? Math.round((endTime.getTime() - sessionStartTime.current.getTime()) / 1000)
        : 0;

      await supabase
        .from('erp_voice_sessions')
        .update({
          status: 'completed',
          ended_at: endTime.toISOString(),
          total_duration_seconds: duration,
          messages_count: messageCount.current
        })
        .eq('id', currentSession.id);

      await conversation.endSession();
      
      setCurrentSession(null);
      setTranscripts([]);
      sessionStartTime.current = null;
      messageCount.current = 0;
      
      toast.info('Sesión de voz finalizada');
    } catch (err) {
      console.error('[AccountingVoiceAgent] endSession error:', err);
    }
  }, [currentSession, conversation]);

  // === HANDLE USER TRANSCRIPT ===
  const handleUserTranscript = useCallback(async (text: string) => {
    if (!currentSession || !user?.id) return;

    messageCount.current++;
    options?.onTranscript?.(text, 'user');

    // Save transcript
    const transcript: Partial<VoiceTranscript> = {
      session_id: currentSession.id,
      user_id: user.id,
      role: 'user',
      content: text,
      language
    };

    try {
      const { data } = await supabase
        .from('erp_voice_transcripts')
        .insert([transcript as any])
        .select()
        .single();

      if (data) {
        setTranscripts(prev => [...prev, data as VoiceTranscript]);
      }

      // Process command via orchestrator
      await processVoiceCommand(text);
    } catch (err) {
      console.error('[AccountingVoiceAgent] handleUserTranscript error:', err);
    }
  }, [currentSession, user?.id, language, options]);

  // === HANDLE AGENT RESPONSE ===
  const handleAgentResponse = useCallback(async (text: string) => {
    if (!currentSession || !user?.id) return;

    messageCount.current++;
    options?.onTranscript?.(text, 'assistant');

    // Save transcript
    const transcript: Partial<VoiceTranscript> = {
      session_id: currentSession.id,
      user_id: user.id,
      role: 'assistant',
      content: text,
      language
    };

    try {
      const { data } = await supabase
        .from('erp_voice_transcripts')
        .insert([transcript as any])
        .select()
        .single();

      if (data) {
        setTranscripts(prev => [...prev, data as VoiceTranscript]);
      }
    } catch (err) {
      console.error('[AccountingVoiceAgent] handleAgentResponse error:', err);
    }
  }, [currentSession, user?.id, language, options]);

  // === PROCESS VOICE COMMAND ===
  const processVoiceCommand = useCallback(async (transcript: string) => {
    setIsProcessing(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'erp-voice-orchestrator',
        {
          body: {
            transcript,
            language,
            context: {
              ...options?.context,
              sessionId: currentSession?.id,
              sessionType: currentSession?.session_type
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        const result = data as VoiceCommandResult;
        setLastCommand(result);
        options?.onCommand?.(result);

        // Update transcript with detected intent
        if (currentSession && result.intent !== 'unknown') {
          await supabase
            .from('erp_voice_transcripts')
            .update({
              intent_detected: result.intent,
              entities_extracted: result.entities as any
            })
            .eq('session_id', currentSession.id)
            .eq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(1);
        }

        // Speak response if TTS enabled
        if (enableTTS && result.spokenResponse) {
          await speakText(result.spokenResponse);
        }

        return result;
      }

      return null;
    } catch (err) {
      console.error('[AccountingVoiceAgent] processVoiceCommand error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [language, options, currentSession, enableTTS]);

  // === SPEAK TEXT (TTS) ===
  const speakText = useCallback(async (text: string) => {
    if (!enableTTS) return;

    try {
      const voiceId = language === 'es' ? preferences?.voice_id_es :
                      language === 'ca' ? preferences?.voice_id_ca :
                      language === 'en' ? preferences?.voice_id_en :
                      language === 'fr' ? preferences?.voice_id_fr :
                      preferences?.voice_id_es;

      const { data, error: ttsError } = await supabase.functions.invoke(
        'erp-voice-tts',
        {
          body: {
            text,
            language,
            voiceId,
            speechRate: preferences?.speech_rate || 1.0
          }
        }
      );

      if (ttsError) throw ttsError;

      if (data?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch (err) {
      console.error('[AccountingVoiceAgent] speakText error:', err);
    }
  }, [enableTTS, language, preferences]);

  // === UPDATE PREFERENCES ===
  const updatePreferences = useCallback(async (updates: Partial<VoicePreferences>) => {
    if (!user?.id || !preferences?.id) return null;

    try {
      const { data, error: updateError } = await supabase
        .from('user_voice_preferences')
        .update(updates)
        .eq('id', preferences.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPreferences(data as VoicePreferences);
      toast.success('Preferencias de voz actualizadas');
      return data;
    } catch (err) {
      console.error('[AccountingVoiceAgent] updatePreferences error:', err);
      toast.error('Error actualizando preferencias');
      return null;
    }
  }, [user?.id, preferences?.id]);

  // === SEND TEXT MESSAGE ===
  const sendTextMessage = useCallback(async (text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
    } else {
      // Process directly via orchestrator if not connected to ElevenLabs
      await processVoiceCommand(text);
    }
  }, [conversation, processVoiceCommand]);

  // === INITIAL FETCH ===
  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id, fetchPreferences]);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [conversation]);

  // === RETURN ===
  return {
    // State
    isConnecting,
    isProcessing,
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    currentSession,
    transcripts,
    preferences,
    lastCommand,
    error,
    
    // Session management
    startSession,
    endSession,
    
    // Voice actions
    speakText,
    sendTextMessage,
    processVoiceCommand,
    
    // Preferences
    fetchPreferences,
    updatePreferences,
    
    // ElevenLabs conversation
    conversation,
  };
}

export default useAccountingVoiceAgent;
