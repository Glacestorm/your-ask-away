import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Phone,
  PhoneOff,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Settings,
  Sparkles
} from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceAgentPanelProps {
  sessionId?: string;
  clientName?: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  className?: string;
}

export function VoiceAgentPanel({
  sessionId,
  clientName,
  onTranscript,
  className
}: VoiceAgentPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [agentId, setAgentId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceAgent] Connected to agent');
      toast.success('Agente de voz conectado');
    },
    onDisconnect: () => {
      console.log('[VoiceAgent] Disconnected from agent');
      toast.info('Agente de voz desconectado');
    },
    onMessage: (message) => {
      console.log('[VoiceAgent] Message received:', message);
      
      // Handle different message types
      const msg = message as unknown as Record<string, unknown>;
      const messageType = msg.type as string | undefined;
      
      if (messageType === 'user_transcript') {
        const userEvent = msg.user_transcription_event as { user_transcript?: string } | undefined;
        const userText = userEvent?.user_transcript;
        if (userText) {
          addMessage('user', userText);
          onTranscript?.(userText, 'user');
        }
      } else if (messageType === 'agent_response') {
        const agentEvent = msg.agent_response_event as { agent_response?: string } | undefined;
        const agentText = agentEvent?.agent_response;
        if (agentText) {
          addMessage('assistant', agentText);
          onTranscript?.(agentText, 'assistant');
        }
      }
    },
    onError: (error) => {
      console.error('[VoiceAgent] Error:', error);
      toast.error('Error en el agente de voz');
    },
  });

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = useCallback(async () => {
    if (!agentId.trim()) {
      toast.error('Por favor ingresa el ID del agente de ElevenLabs');
      setShowSettings(true);
      return;
    }

    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke(
        'elevenlabs-conversation-token',
        { body: { agentId: agentId.trim() } }
      );

      if (error || !data?.signed_url) {
        throw new Error(error?.message || 'No se pudo obtener el token');
      }

      // Start the conversation
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      addMessage('assistant', '¡Hola! Soy tu asistente de soporte. ¿En qué puedo ayudarte hoy?');
      
    } catch (error) {
      console.error('[VoiceAgent] Failed to start:', error);
      toast.error(error instanceof Error ? error.message : 'Error al conectar');
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, conversation, addMessage]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    // Note: ElevenLabs SDK doesn't have a direct mute function,
    // this would need to be handled at the audio level
  }, []);

  const handleVolumeChange = useCallback(async (newVolume: number) => {
    setVolume(newVolume);
    try {
      await conversation.setVolume({ volume: newVolume });
    } catch (e) {
      console.error('Error setting volume:', e);
    }
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isConnected 
                ? "bg-emerald-500 animate-pulse" 
                : "bg-muted"
            )}>
              <Bot className={cn(
                "h-5 w-5",
                isConnected ? "text-white" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Agente de Voz
                {isConnected && <Sparkles className="h-4 w-4 text-emerald-500" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isConnected 
                  ? isSpeaking ? 'Hablando...' : 'Escuchando...'
                  : 'Desconectado'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-3">
        {/* Settings Panel */}
        {showSettings && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">ID del Agente ElevenLabs</label>
              <Input
                placeholder="Ej: abc123xyz..."
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="h-8 text-sm"
                disabled={isConnected}
              />
              <p className="text-xs text-muted-foreground">
                Configura tu agente en elevenlabs.io/convai
              </p>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-sm">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          {isConnected && (
            <Badge variant={isSpeaking ? 'default' : 'secondary'} className="text-xs">
              {isSpeaking ? 'Agente habla' : 'Tu turno'}
            </Badge>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="h-[200px] pr-2" ref={scrollRef}>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inicia una conversación</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 p-2 rounded-lg",
                    msg.role === 'user' 
                      ? "bg-primary/10 ml-4" 
                      : "bg-muted/50 mr-4"
                  )}
                >
                  <div className={cn(
                    "p-1 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0",
                    msg.role === 'user' ? "bg-primary/20" : "bg-emerald-500/20"
                  )}>
                    {msg.role === 'user' 
                      ? <User className="h-3 w-3" />
                      : <Bot className="h-3 w-3 text-emerald-600" />
                    }
                  </div>
                  <p className="text-sm flex-1">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Volume Control */}
        {isConnected && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Progress 
              value={isMuted ? 0 : volume * 100} 
              className="flex-1 h-2 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const newVolume = (e.clientX - rect.left) / rect.width;
                handleVolumeChange(Math.max(0, Math.min(1, newVolume)));
              }}
            />
            <span className="text-xs text-muted-foreground w-8">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={startConversation} 
              disabled={isConnecting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Iniciar Conversación
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2 text-red-500" />
                    Silenciado
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Micrófono
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={stopConversation}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </>
          )}
        </div>

        {/* Warning if no agent ID */}
        {!agentId && !showSettings && (
          <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 text-yellow-600 text-xs">
            <AlertCircle className="h-4 w-4" />
            Configura el ID del agente en ajustes
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VoiceAgentPanel;
