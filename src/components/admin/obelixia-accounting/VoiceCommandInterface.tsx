/**
 * Voice Command Interface
 * Fase 2: Multimodal AI - Voice
 * Botón mic con waveform y comandos de voz
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  Sparkles,
  History,
  X
} from 'lucide-react';
import { useObelixiaVoiceCommands, VoiceCommand } from '@/hooks/admin/obelixia-accounting/useObelixiaVoiceCommands';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface VoiceCommandInterfaceProps {
  onCommandExecuted?: (command: VoiceCommand) => void;
  compact?: boolean;
  className?: string;
}

export function VoiceCommandInterface({ 
  onCommandExecuted,
  compact = false,
  className 
}: VoiceCommandInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  const {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    error,
    commands,
    isSupported,
    startListening,
    stopListening,
    stopSpeaking,
    clearHistory
  } = useObelixiaVoiceCommands();

  // Handle mic button click
  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      if (!compact) setIsExpanded(true);
    }
  }, [isListening, startListening, stopListening, compact]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setSpeakerEnabled(prev => !prev);
  }, [isSpeaking, stopSpeaking]);

  // Notify when command executed
  useEffect(() => {
    if (commands.length > 0 && commands[0].executed) {
      onCommandExecuted?.(commands[0]);
    }
  }, [commands, onCommandExecuted]);

  // Auto-collapse when idle
  useEffect(() => {
    if (!isListening && !isProcessing && !isSpeaking) {
      const timer = setTimeout(() => {
        if (!showHistory) setIsExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isListening, isProcessing, isSpeaking, showHistory]);

  // Get status color
  const getStatusColor = () => {
    if (isListening) return 'from-red-500 to-pink-600';
    if (isProcessing) return 'from-blue-500 to-cyan-600';
    if (isSpeaking) return 'from-green-500 to-emerald-600';
    return 'from-violet-500 to-purple-600';
  };

  // Waveform animation
  const WaveformBars = () => (
    <div className="flex items-center gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-current rounded-full"
          animate={{
            height: isListening 
              ? [4, 16, 8, 12, 4]
              : [4, 4, 4, 4, 4]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );

  // Compact mode - just the button
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleMicClick}
              disabled={!isSupported}
              size="icon"
              className={cn(
                "relative h-10 w-10 rounded-full transition-all",
                `bg-gradient-to-br ${getStatusColor()}`,
                isListening && "animate-pulse",
                className
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : isListening ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Comandos de Voz</p>
            <p className="text-xs opacity-80">
              {isListening ? 'Escuchando...' : 'Click para hablar'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main Button */}
      <motion.div
        initial={false}
        animate={{ scale: isListening ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Button
          onClick={handleMicClick}
          disabled={!isSupported}
          size="lg"
          className={cn(
            "relative h-14 w-14 rounded-full shadow-lg transition-all",
            `bg-gradient-to-br ${getStatusColor()}`,
            "border-2 border-white/20"
          )}
        >
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-white"
              >
                <WaveformBars />
              </motion.div>
            ) : isSpeaking ? (
              <motion.div
                key="speaking"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Volume2 className="h-6 w-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Mic className="h-6 w-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse animation when listening */}
          {isListening && (
            <motion.span
              className="absolute inset-0 rounded-full bg-red-400/50"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />
          )}
        </Button>
      </motion.div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-72"
          >
            <Card className="shadow-lg border-violet-500/20">
              <CardContent className="p-4 space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium">ObelixIA Voice</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={toggleSpeaker}
                    >
                      {speakerEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Current transcript */}
                {transcript && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Escuchado: </span>
                      {transcript}
                    </p>
                  </div>
                )}

                {/* Current response */}
                {commands.length > 0 && commands[0].response && (
                  <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <p className="text-sm">{commands[0].response}</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Quick commands */}
                {!showHistory && !isListening && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Prueba decir:</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                        "¿Cuál es mi tesorería?"
                      </Badge>
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                        "Registra una factura"
                      </Badge>
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                        "Lee mis alertas"
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Command History */}
                {showHistory && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Historial</p>
                      {commands.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={clearHistory}
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[120px]">
                      {commands.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Sin comandos recientes
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {commands.slice(0, 5).map((cmd) => (
                            <div
                              key={cmd.id}
                              className="p-2 rounded-lg bg-muted/30 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{cmd.transcript}</span>
                                <Badge 
                                  variant={cmd.executed ? 'default' : 'destructive'}
                                  className="text-[10px]"
                                >
                                  {cmd.executed ? 'OK' : 'Error'}
                                </Badge>
                              </div>
                              {cmd.response && (
                                <p className="text-muted-foreground truncate">
                                  {cmd.response}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(cmd.timestamp, { locale: es, addSuffix: true })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VoiceCommandInterface;
