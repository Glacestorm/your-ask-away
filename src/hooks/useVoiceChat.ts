import { useState, useRef, useCallback, useEffect } from 'react';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, collectTelemetry } from '@/hooks/core/useKBBase';

interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void;
  onSpeakEnd?: () => void;
  language?: string;
}

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const { onTranscript, onSpeakEnd, language = 'es-ES' } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isRetrying = status === 'retrying';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => setError(null), []);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
    setTranscript('');
  }, []);
  
  // Use any to avoid TypeScript conflicts with browser-specific SpeechRecognition implementations
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
      setStatus('loading');
    };

    recognition.onaudiostart = () => {
      console.log('Audio capture started');
    };

    recognition.onspeechstart = () => {
      console.log('Speech detected');
    };

    recognition.onspeechend = () => {
      console.log('Speech ended');
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcriptText;
          console.log('Final transcript:', transcriptText);
        } else {
          interimTranscript += transcriptText;
          console.log('Interim transcript:', transcriptText);
        }
      }
      
      // Update transcript with either final or interim result
      const currentTranscript = finalTranscript || interimTranscript;
      if (currentTranscript) {
        setTranscript(currentTranscript);
        setStatus('success');
        setLastSuccess(new Date());
      }
      
      // Only call onTranscript callback with final results
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event.message);
      const kbError = createKBError(event.error, event.message || 'Error de reconocimiento de voz');
      setError(kbError);
      setStatus('error');
      setIsListening(false);
      
      collectTelemetry({
        hookName: 'useVoiceChat',
        operationName: 'speechRecognition',
        startTime: new Date(),
        status: 'error',
        error: kbError,
        retryCount
      });
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      setLastRefresh(new Date());
    };
    
    return recognition;
  }, [language, onTranscript, retryCount]);

  useEffect(() => {
    // Check browser support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasSpeechRecognition = !!SpeechRecognitionAPI;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    
    console.log('Speech Recognition supported:', hasSpeechRecognition);
    console.log('Speech Synthesis supported:', hasSpeechSynthesis);
    
    setIsSupported(hasSpeechRecognition && hasSpeechSynthesis);
    
    if (hasSpeechRecognition && !isInitializedRef.current) {
      recognitionRef.current = initRecognition();
      isInitializedRef.current = true;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log('Error aborting recognition:', e);
        }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [initRecognition]);

  // Reinitialize recognition when language changes
  useEffect(() => {
    if (isInitializedRef.current && recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startListening = useCallback(async () => {
    const startTime = new Date();
    setError(null);
    setStatus('loading');
    
    // Check if already listening
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    // Request microphone permission explicitly
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (permError) {
      console.error('Microphone permission error:', permError);
      const kbError = createKBError('microphone-permission', 'Permiso de micrófono denegado');
      setError(kbError);
      setStatus('error');
      
      collectTelemetry({
        hookName: 'useVoiceChat',
        operationName: 'startListening',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
      return;
    }
    
    // Reinitialize recognition if needed
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    
    if (!recognitionRef.current) {
      console.error('Speech recognition not available');
      const kbError = createKBError('not-supported', 'Reconocimiento de voz no disponible');
      setError(kbError);
      setStatus('error');
      return;
    }
    
    setTranscript('');
    
    try {
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
    } catch (startError) {
      console.error('Error starting speech recognition:', startError);
      // If already running, stop and restart
      if (startError instanceof Error && startError.message.includes('already started')) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (e) {
          console.error('Error restarting recognition:', e);
          const kbError = createKBError('start-failed', 'Error al iniciar reconocimiento');
          setError(kbError);
          setStatus('error');
        }
      } else {
        const kbError = createKBError('start-failed', 'Error al iniciar reconocimiento');
        setError(kbError);
        setStatus('error');
      }
    }
  }, [isListening, initRecognition, retryCount]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      console.log('Stopping speech recognition...');
      recognitionRef.current.stop();
    } catch (stopError) {
      console.error('Error stopping speech recognition:', stopError);
    }
    
    setIsListening(false);
    setLastRefresh(new Date());
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !text) {
      console.log('Speech synthesis not available or no text');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a good voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langCode = language.split('-')[0];
    const langVoice = voices.find(v => v.lang.startsWith(langCode));
    if (langVoice) {
      utterance.voice = langVoice;
      console.log('Using voice:', langVoice.name);
    }
    
    utterance.onstart = () => {
      console.log('Speech synthesis started');
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('Speech synthesis ended');
      setIsSpeaking(false);
      onSpeakEnd?.();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language, onSpeakEnd]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    isRetrying,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
