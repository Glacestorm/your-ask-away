import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  MicOff, 
  Volume2,
  Radio,
  MessageCircle,
  Clock,
  CheckCircle,
  History,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useVoiceInterface } from '@/hooks/admin/useVoiceInterface';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function VoiceInterfacePanel() {
  const [showHistory, setShowHistory] = useState(false);
  const {
    isListening,
    isProcessing,
    transcript,
    sessions,
    activeSession,
    hasVoiceSupport,
    startListening,
    stopListening,
    processCommand,
    fetchSessions,
    startSession,
    speak
  } = useVoiceInterface();

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleToggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      if (!activeSession) {
        await startSession({ currentRoute: window.location.pathname });
      }
      startListening();
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl shadow-lg transition-all duration-300",
              isListening 
                ? "bg-gradient-to-br from-red-500 to-rose-600 animate-pulse" 
                : "bg-gradient-to-br from-cyan-500 to-blue-600"
            )}>
              {isListening ? (
                <Radio className="h-5 w-5 text-white animate-pulse" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Voice Interface</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!hasVoiceSupport 
                  ? 'No soportado' 
                  : isListening 
                    ? 'Escuchando...' 
                    : 'Listo para comandos de voz'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className={cn("h-4 w-4", showHistory && "text-primary")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchSessions}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Main Voice Control */}
        <div className="flex flex-col items-center py-6">
          <button
            onClick={handleToggleListening}
            disabled={isProcessing || !hasVoiceSupport}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
              isListening 
                ? "bg-gradient-to-br from-red-500 to-rose-600 scale-110 shadow-red-500/30" 
                : "bg-gradient-to-br from-primary to-primary/80 hover:scale-105 shadow-primary/30",
              (isProcessing || !hasVoiceSupport) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isListening ? (
              <MicOff className="h-10 w-10 text-white" />
            ) : (
              <Mic className="h-10 w-10 text-white" />
            )}
          </button>

          <p className="text-sm text-muted-foreground mt-4">
            {!hasVoiceSupport 
              ? 'Tu navegador no soporta voz' 
              : isProcessing 
                ? 'Procesando...' 
                : isListening 
                  ? 'Toca para detener' 
                  : 'Toca para hablar'}
          </p>

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-4 w-full p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">{transcript}</p>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span className="text-sm">Procesando con IA...</span>
            </div>
          )}
        </div>

        {/* Session/History */}
        {showHistory && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Historial de Sesiones
            </p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => (
                  <div 
                    key={session.id}
                    className="p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : session.status === 'active' ? (
                          <Radio className="h-4 w-4 text-primary animate-pulse" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {session.session_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(session.started_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px]",
                            session.status === 'active' && "bg-primary/10 text-primary border-primary/30"
                          )}
                        >
                          {session.status}
                        </Badge>
                        {session.commands_count !== undefined && session.commands_count !== null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.commands_count} comandos
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin sesiones previas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Quick Commands */}
        {!showHistory && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Comandos rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Ver dashboard',
                'Mostrar métricas',
                'Buscar cliente',
                'Crear tarea'
              ].map((cmd) => (
                <Button
                  key={cmd}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => processCommand(cmd)}
                  disabled={isProcessing || !hasVoiceSupport}
                >
                  {cmd}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VoiceInterfacePanel;
