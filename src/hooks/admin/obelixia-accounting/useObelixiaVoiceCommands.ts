import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface VoiceCommand {
  id: string;
  transcript: string;
  intent: VoiceIntent;
  response?: string;
  executed: boolean;
  timestamp: Date;
}

export interface VoiceIntent {
  action: 'query_treasury' | 'create_invoice' | 'read_alerts' | 'query_balance' | 
          'list_pending' | 'explain_entry' | 'general_question' | 'unknown';
  entities: Record<string, string | number>;
  confidence: number;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  autoSpeak: boolean;
  wakeWord?: string;
}

// === HOOK ===
export function useObelixiaVoiceCommands(config?: Partial<VoiceConfig>) {
  const defaultConfig: VoiceConfig = {
    language: 'es-ES',
    continuous: false,
    autoSpeak: true,
    wakeWord: 'obelix',
    ...config
  };

  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    error: null
  });

  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // === CHECK SUPPORT ===
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // === START LISTENING ===
  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    const recognition = recognitionRef.current;
    recognition.continuous = defaultConfig.continuous;
    recognition.interimResults = true;
    recognition.lang = defaultConfig.language;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setState(prev => ({ 
        ...prev, 
        transcript: finalTranscript || interimTranscript 
      }));

      if (finalTranscript) {
        processCommand(finalTranscript);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setState(prev => ({ ...prev, error: event.error, isListening: false }));
      if (event.error !== 'no-speech') {
        toast.error(`Error de reconocimiento: ${event.error}`);
      }
    };

    recognition.start();
  }, [isSupported, defaultConfig]);

  // === STOP LISTENING ===
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // === PROCESS COMMAND ===
  const processCommand = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-accounting-copilot', {
        body: {
          action: 'process_voice_command',
          transcript,
          context: {
            source: 'voice',
            language: defaultConfig.language
          }
        }
      });

      if (error) throw error;

      const command: VoiceCommand = {
        id: crypto.randomUUID(),
        transcript,
        intent: data?.intent || { action: 'unknown', entities: {}, confidence: 0 },
        response: data?.response,
        executed: data?.success || false,
        timestamp: new Date()
      };

      setCommands(prev => [command, ...prev].slice(0, 50));

      if (data?.response && defaultConfig.autoSpeak) {
        await speak(data.response);
      }

      if (data?.success) {
        toast.success('Comando ejecutado');
      }

      return command;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar comando';
      toast.error(message);
      return null;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [defaultConfig]);

  // === TEXT TO SPEECH ===
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!synthRef.current) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    return new Promise((resolve) => {
      setState(prev => ({ ...prev, isSpeaking: true }));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = defaultConfig.language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to find a Spanish voice
      const voices = synthRef.current?.getVoices() || [];
      const spanishVoice = voices.find(v => v.lang.startsWith('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        resolve();
      };

      utterance.onerror = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        resolve();
      };

      synthRef.current?.speak(utterance);
    });
  }, [defaultConfig.language]);

  // === STOP SPEAKING ===
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  // === CLEAR HISTORY ===
  const clearHistory = useCallback(() => {
    setCommands([]);
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return {
    ...state,
    commands,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    processCommand,
    clearHistory
  };
}

export default useObelixiaVoiceCommands;
