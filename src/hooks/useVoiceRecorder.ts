import { useState, useRef, useCallback } from 'react';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

interface UseVoiceRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { onRecordingComplete, onError } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
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
    setAudioUrl(null);
    setDuration(0);
  }, []);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    const startTime = new Date();
    setStatus('loading');
    setError(null);
    
    try {
      audioChunksRef.current = [];
      
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      console.log('Microphone access granted');
      streamRef.current = stream;

      // Check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/ogg';
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, total chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          onRecordingComplete?.(audioBlob, url);
        }
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const kbError = createKBError('RECORDING_ERROR', 'Error durante la grabación');
        setError(kbError);
        setStatus('error');
        onError?.('Error durante la grabación');
        
        collectTelemetry({
          hookName: 'useVoiceRecorder',
          operationName: 'startRecording',
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'error',
          error: kbError,
          retryCount
        });
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      console.log('Recording started');
      
      collectTelemetry({
        hookName: 'useVoiceRecorder',
        operationName: 'startRecording',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount
      });
    } catch (err) {
      console.error('Error starting recording:', err);
      let errorMsg = 'Error al acceder al micrófono';
      let errorCode = 'MICROPHONE_ERROR';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMsg = 'Permiso de micrófono denegado. Por favor, permite el acceso.';
          errorCode = 'PERMISSION_DENIED';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No se encontró ningún micrófono.';
          errorCode = 'NOT_FOUND';
        } else if (err.name === 'NotReadableError') {
          errorMsg = 'El micrófono está siendo usado por otra aplicación.';
          errorCode = 'IN_USE';
        }
      }
      
      const kbError = createKBError(errorCode, errorMsg, { retryable: false, originalError: err });
      setError(kbError);
      setStatus('error');
      onError?.(errorMsg);
      
      collectTelemetry({
        hookName: 'useVoiceRecorder',
        operationName: 'startRecording',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
    }
  }, [onRecordingComplete, onError, retryCount]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    console.log('Cancelling recording...');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    audioChunksRef.current = [];
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setAudioUrl(null);
  }, []);

  return {
    isRecording,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
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
