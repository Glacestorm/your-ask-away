import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceRecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceRecordButton({ 
  onRecordingComplete, 
  disabled = false,
  className 
}: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    
    try {
      setError(null);
      audioChunksRef.current = [];
      
      console.log('[VoiceRecord] Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      console.log('[VoiceRecord] Microphone access granted');
      streamRef.current = stream;

      // Determine MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      console.log('[VoiceRecord] Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[VoiceRecord] Recording stopped, chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('[VoiceRecord] Audio blob size:', audioBlob.size);
          
          if (audioBlob.size > 1000) { // Only process if we have substantial audio
            onRecordingComplete(audioBlob);
          } else {
            toast.info('Grabación muy corta, intenta hablar más tiempo');
          }
        }
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        isRecordingRef.current = false;
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error('[VoiceRecord] MediaRecorder error:', event);
        setError('Error durante la grabación');
        toast.error('Error durante la grabación');
      };

      // Start recording
      mediaRecorder.start(100);
      isRecordingRef.current = true;
      setIsRecording(true);
      setDuration(0);
      
      // Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      console.log('[VoiceRecord] Recording started');
      
    } catch (err) {
      console.error('[VoiceRecord] Error:', err);
      
      let errorMsg = 'Error al acceder al micrófono';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMsg = 'Permiso de micrófono denegado';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No se encontró micrófono';
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    console.log('[VoiceRecord] Stop requested');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    setIsPressing(true);
    startRecording();
  }, [disabled, startRecording]);

  const handleMouseUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isPressing) return;
    
    setIsPressing(false);
    if (isRecordingRef.current) {
      stopRecording();
    }
  }, [isPressing, stopRecording]);

  const handleMouseLeave = useCallback(() => {
    if (isPressing && isRecordingRef.current) {
      setIsPressing(false);
      stopRecording();
    }
  }, [isPressing, stopRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={disabled}
        title="Mantén presionado para grabar"
        className={cn(
          "touch-none select-none transition-all",
          isRecording && "animate-pulse ring-2 ring-destructive ring-offset-2",
          className
        )}
      >
        {isRecording ? (
          <Square className="h-4 w-4 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isRecording && (
        <span className="text-xs font-mono text-destructive animate-pulse">
          🔴 {formatDuration(duration)}
        </span>
      )}
      
      {error && !isRecording && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
