/**
 * VoiceAITutor - Tutor de voz con ElevenLabs Conversational AI
 * Permite conversaciones de voz bidireccionales con el tutor IA
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, PhoneOff,
  Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceAITutor } from '@/hooks/academia/useVoiceAITutor';

interface VoiceAITutorProps {
  courseId: string;
  lessonId?: string;
  courseTitle: string;
  lessonTitle?: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  className?: string;
}

export const VoiceAITutor: React.FC<VoiceAITutorProps> = ({
  courseId,
  lessonId,
  courseTitle,
  lessonTitle,
  onTranscript,
  className,
}) => {
  const {
    status,
    isSpeaking,
    isConnecting,
    error,
    startConversation,
    stopConversation,
  } = useVoiceAITutor({
    courseId,
    lessonId,
    courseTitle,
    lessonTitle,
  });

  const isConnected = status === 'connected';

  const handleToggleConnection = useCallback(async () => {
    if (isConnected) {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [isConnected, startConversation, stopConversation]);

  // Audio visualizer animation
  const visualizerBars = Array.from({ length: 5 });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Voice Orb */}
      <div className="relative">
        <motion.div
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-accent/20",
            "border-2",
            isConnected ? "border-primary" : "border-slate-600"
          )}
          animate={isSpeaking ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 0 0 rgba(var(--primary), 0)",
              "0 0 20px 10px rgba(var(--primary), 0.3)",
              "0 0 0 0 rgba(var(--primary), 0)"
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0 }}
        >
          {isConnecting ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : isConnected ? (
            <div className="flex items-end gap-1 h-10">
              {visualizerBars.map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary rounded-full"
                  animate={isSpeaking ? {
                    height: [8, 24 + Math.random() * 16, 8],
                  } : { height: 8 }}
                  transition={{
                    duration: 0.5,
                    repeat: isSpeaking ? Infinity : 0,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          ) : (
            <Sparkles className="w-10 h-10 text-slate-400" />
          )}
        </motion.div>

        {/* Status indicator */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900",
          isConnected ? "bg-green-500" : "bg-slate-500"
        )} />
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-sm font-medium text-white">
          {isConnecting ? "Conectando..." : 
           isConnected ? (isSpeaking ? "Hablando..." : "Escuchando...") : 
           "Tutor de Voz IA"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {isConnected 
            ? "Habla para hacer preguntas" 
            : "Activa para conversar con tu tutor"}
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isConnected ? "destructive" : "default"}
          size="lg"
          onClick={handleToggleConnection}
          disabled={isConnecting}
          className="gap-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Conectando...
            </>
          ) : isConnected ? (
            <>
              <PhoneOff className="w-4 h-4" />
              Terminar
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Iniciar Voz
            </>
          )}
        </Button>

      </div>

      {/* Hint */}
      {!isConnected && (
        <p className="text-[10px] text-slate-500 text-center max-w-[200px]">
          Requiere acceso al micrófono para funcionar
        </p>
      )}
    </div>
  );
};

export default VoiceAITutor;
