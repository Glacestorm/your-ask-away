/**
 * AccountingVoiceAgent - Agente de Voz para Contabilidad
 * Fase 2 del Plan Estratosférico
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Settings,
  Sparkles,
  Languages,
  Phone,
  PhoneOff,
  Loader2
} from 'lucide-react';
import { useAccountingVoiceAgent, type VoiceTranscript, type VoiceCommandResult } from '@/hooks/erp/useAccountingVoiceAgent';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es, ca, enUS, fr } from 'date-fns/locale';

interface AccountingVoiceAgentProps {
  agentId?: string;
  context?: {
    module: 'accounting' | 'customers' | 'suppliers' | 'inventory' | 'reports';
    currentView?: string;
    selectedEntity?: { type: string; id: string; name: string };
  };
  onCommand?: (result: VoiceCommandResult) => void;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  className?: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español', locale: es, flag: '🇪🇸' },
  { value: 'ca', label: 'Català', locale: ca, flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  { value: 'en', label: 'English', locale: enUS, flag: '🇬🇧' },
  { value: 'fr', label: 'Français', locale: fr, flag: '🇫🇷' },
];

export function AccountingVoiceAgent({
  agentId,
  context,
  onCommand,
  onTranscript,
  className
}: AccountingVoiceAgentProps) {
  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');

  const {
    isConnecting,
    isProcessing,
    isConnected,
    isSpeaking,
    currentSession,
    transcripts,
    preferences,
    lastCommand,
    error,
    startSession,
    endSession,
    speakText,
    sendTextMessage,
    updatePreferences,
    conversation
  } = useAccountingVoiceAgent({
    language: selectedLanguage,
    context,
    onCommand,
    onTranscript
  });

  // Update language from preferences
  useEffect(() => {
    if (preferences?.preferred_language) {
      setSelectedLanguage(preferences.preferred_language);
    }
  }, [preferences]);

  // Handle start/stop session
  const handleToggleSession = useCallback(async () => {
    if (isConnected || currentSession) {
      await endSession();
    } else {
      await startSession('general', agentId);
    }
  }, [isConnected, currentSession, startSession, endSession, agentId]);

  // Handle text message send
  const handleSendText = useCallback(async () => {
    if (!textInput.trim()) return;
    await sendTextMessage(textInput);
    setTextInput('');
  }, [textInput, sendTextMessage]);

  // Handle language change
  const handleLanguageChange = useCallback(async (lang: string) => {
    setSelectedLanguage(lang);
    if (preferences) {
      await updatePreferences({ preferred_language: lang });
    }
  }, [preferences, updatePreferences]);

  const currentLocale = LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage)?.locale || es;

  const getStatusBadge = () => {
    if (isConnecting) return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Conectando...</Badge>;
    if (isConnected) return <Badge variant="default" className="bg-green-500">Conectado</Badge>;
    if (currentSession) return <Badge variant="secondary">Sesión activa</Badge>;
    return <Badge variant="outline">Desconectado</Badge>;
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg transition-all",
              isConnected 
                ? "bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse" 
                : "bg-gradient-to-br from-violet-500 to-purple-600"
            )}>
              {isSpeaking ? (
                <Volume2 className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Asistente de Voz
                {getStatusBadge()}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {currentSession 
                  ? `Sesión iniciada ${formatDistanceToNow(new Date(currentSession.started_at), { locale: currentLocale, addSuffix: true })}`
                  : 'Contabilidad por voz en 4 idiomas'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue>
                  {LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage)?.flag}{' '}
                  {LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <CardContent className="flex-1 flex flex-col pt-4 min-h-[400px]">
        {/* Transcripts Area */}
        <ScrollArea className="flex-1 mb-4 pr-2">
          <div className="space-y-3">
            {transcripts.length === 0 && !isConnected && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">
                  {selectedLanguage === 'es' && 'Pulsa el botón para iniciar una conversación'}
                  {selectedLanguage === 'ca' && 'Prem el botó per iniciar una conversa'}
                  {selectedLanguage === 'en' && 'Press the button to start a conversation'}
                  {selectedLanguage === 'fr' && 'Appuyez sur le bouton pour démarrer une conversation'}
                </p>
                <p className="text-xs mt-2">
                  {selectedLanguage === 'es' && 'Ejemplos: "Crear asiento de venta", "Saldo del cliente Acme"'}
                  {selectedLanguage === 'ca' && 'Exemples: "Crear assentament de venda", "Saldo del client Acme"'}
                  {selectedLanguage === 'en' && 'Examples: "Create sales entry", "Balance of customer Acme"'}
                  {selectedLanguage === 'fr' && 'Exemples: "Créer une écriture de vente", "Solde du client Acme"'}
                </p>
              </div>
            )}

            {transcripts.map((transcript, i) => (
              <div 
                key={transcript.id || i}
                className={cn(
                  "flex",
                  transcript.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  transcript.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                )}>
                  <p className="text-sm">{transcript.content}</p>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span className="text-xs opacity-70">
                      {formatDistanceToNow(new Date(transcript.created_at), { 
                        locale: currentLocale, 
                        addSuffix: true 
                      })}
                    </span>
                    {transcript.intent_detected && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        {transcript.intent_detected}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Procesando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Last Command Result */}
        {lastCommand && lastCommand.intent !== 'unknown' && (
          <div className="mb-4 p-3 rounded-lg border bg-accent/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Último comando detectado</span>
              <Badge variant={lastCommand.confidence > 80 ? 'default' : 'secondary'}>
                {lastCommand.confidence}% confianza
              </Badge>
            </div>
            <p className="text-sm">{lastCommand.spokenResponse}</p>
            {lastCommand.requiresConfirmation && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="default">Confirmar</Button>
                <Button size="sm" variant="outline">Cancelar</Button>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center gap-2">
          <Button
            variant={isConnected || currentSession ? "destructive" : "default"}
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleToggleSession}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isConnected || currentSession ? (
              <PhoneOff className="h-5 w-5" />
            ) : (
              <Phone className="h-5 w-5" />
            )}
          </Button>

          <div className="flex-1 flex gap-2">
            <Input
              placeholder={
                selectedLanguage === 'es' ? 'Escribe tu mensaje...' :
                selectedLanguage === 'ca' ? 'Escriu el teu missatge...' :
                selectedLanguage === 'en' ? 'Type your message...' :
                'Tapez votre message...'
              }
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSendText}
              disabled={!textInput.trim() || isProcessing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {preferences?.enable_voice_feedback && lastCommand?.spokenResponse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => speakText(lastCommand.spokenResponse)}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && preferences && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="text-sm font-medium">Configuración de Voz</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs">Feedback por voz</span>
                <Button 
                  variant={preferences.enable_voice_feedback ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreferences({ enable_voice_feedback: !preferences.enable_voice_feedback })}
                >
                  {preferences.enable_voice_feedback ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Comandos de voz</span>
                <Button 
                  variant={preferences.enable_voice_commands ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreferences({ enable_voice_commands: !preferences.enable_voice_commands })}
                >
                  {preferences.enable_voice_commands ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Detección automática de idioma</span>
                <Button 
                  variant={preferences.auto_detect_language ? "default" : "outline"}
                  size="sm"
                  onClick={() => updatePreferences({ auto_detect_language: !preferences.auto_detect_language })}
                >
                  <Languages className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Velocidad: {preferences.speech_rate}x</span>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updatePreferences({ speech_rate: Math.max(0.7, preferences.speech_rate - 0.1) })}
                  >
                    -
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updatePreferences({ speech_rate: Math.min(1.2, preferences.speech_rate + 0.1) })}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AccountingVoiceAgent;
