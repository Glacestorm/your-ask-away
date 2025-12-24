/**
 * Voice Action Input Component
 * Allows voice input for logging actions with intelligent parsing
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, Wand2 } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ActionType, RiskLevel } from '@/hooks/admin/useSessionActionLogger';

interface ParsedVoiceAction {
  actionType: ActionType;
  description: string;
  componentAffected?: string;
  riskLevel?: RiskLevel;
  command?: 'pause' | 'resume' | 'end' | null;
}

interface VoiceActionInputProps {
  onActionParsed: (action: ParsedVoiceAction) => void;
  onSessionCommand?: (command: 'pause' | 'resume' | 'end') => void;
  disabled?: boolean;
}

// Keywords for action type detection
const ACTION_KEYWORDS: Record<ActionType, string[]> = {
  config_change: ['configuración', 'config', 'cambio de configuración', 'modificar configuración', 'ajuste'],
  module_update: ['módulo', 'actualizar módulo', 'update'],
  data_access: ['acceso', 'datos', 'consulta', 'ver datos', 'revisar datos', 'base de datos'],
  data_modification: ['modificar datos', 'editar datos', 'actualizar datos', 'cambiar datos'],
  system_repair: ['reparar', 'reparación', 'arreglar', 'corregir', 'fix'],
  diagnostic_run: ['diagnóstico', 'diagnosticar', 'análisis', 'analizar', 'verificar'],
  file_transfer: ['archivo', 'fichero', 'documento', 'transferir', 'subir', 'descargar'],
  permission_change: ['permiso', 'permisos', 'acceso', 'rol', 'privilegios'],
  session_start: ['iniciar sesión', 'comenzar'],
  session_end: ['finalizar sesión', 'terminar'],
  screenshot_capture: ['captura', 'screenshot', 'pantalla', 'foto'],
  command_execution: ['comando', 'ejecutar', 'terminal', 'script', 'consola'],
  error_occurred: ['error', 'fallo', 'problema'],
  warning_raised: ['advertencia', 'warning', 'aviso'],
  user_interaction: ['usuario', 'interacción', 'comunicación', 'hablar', 'nota', 'anotación'],
  system_check: ['verificación', 'check', 'comprobar'],
};

// Keywords for risk level detection
const RISK_KEYWORDS: Record<RiskLevel, string[]> = {
  low: ['bajo', 'simple', 'menor', 'rutina'],
  medium: ['medio', 'moderado', 'normal'],
  high: ['alto', 'importante', 'crítico', 'peligroso'],
  critical: ['crítico', 'urgente', 'emergencia', 'grave'],
};

// Session command keywords
const SESSION_COMMANDS = {
  pause: ['pausar sesión', 'pausar', 'pausa', 'detener temporalmente'],
  resume: ['reanudar sesión', 'reanudar', 'continuar', 'seguir'],
  end: ['finalizar sesión', 'terminar sesión', 'cerrar sesión', 'acabar'],
};

export function VoiceActionInput({ onActionParsed, onSessionCommand, disabled }: VoiceActionInputProps) {
  const { toast } = useToast();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedVoiceAction | null>(null);

  const parseTranscript = useCallback((text: string): ParsedVoiceAction => {
    const lowerText = text.toLowerCase();

    // Check for session commands first
    for (const [command, keywords] of Object.entries(SESSION_COMMANDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return {
            actionType: 'user_interaction',
            description: text,
            command: command as 'pause' | 'resume' | 'end',
          };
        }
      }
    }

    // Detect action type
    let detectedType: ActionType = 'user_interaction';
    let maxMatches = 0;

    for (const [type, keywords] of Object.entries(ACTION_KEYWORDS)) {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedType = type as ActionType;
      }
    }

    // Detect risk level
    let detectedRisk: RiskLevel = 'low';
    for (const [risk, keywords] of Object.entries(RISK_KEYWORDS)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        detectedRisk = risk as RiskLevel;
        break;
      }
    }

    // Auto-elevate risk for certain action types
    if (['system_repair', 'command_execution', 'data_modification', 'rollback'].includes(detectedType)) {
      if (detectedRisk === 'low') detectedRisk = 'medium';
    }

    // Try to extract component affected
    const componentPatterns = [
      /en (?:el |la )?(.+?)(?:\.|,|$)/i,
      /componente (.+?)(?:\.|,|$)/i,
      /módulo (.+?)(?:\.|,|$)/i,
      /sistema (.+?)(?:\.|,|$)/i,
    ];

    let componentAffected: string | undefined;
    for (const pattern of componentPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length < 50) {
        componentAffected = match[1].trim();
        break;
      }
    }

    return {
      actionType: detectedType,
      description: text,
      componentAffected,
      riskLevel: detectedRisk,
      command: null,
    };
  }, []);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setParsedPreview(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);

      const audioBase64 = await base64Promise;

      // Send to edge function for transcription
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 },
      });

      if (error) throw error;

      const transcript = data?.text?.trim();
      
      if (!transcript) {
        toast({
          title: 'No se detectó audio',
          description: 'Intenta hablar más cerca del micrófono',
          variant: 'destructive',
        });
        return;
      }

      setLastTranscript(transcript);

      // Parse the transcript
      const parsed = parseTranscript(transcript);
      setParsedPreview(parsed);

      // Handle session commands
      if (parsed.command && onSessionCommand) {
        onSessionCommand(parsed.command);
        toast({
          title: 'Comando de voz ejecutado',
          description: `${parsed.command === 'pause' ? 'Sesión pausada' : parsed.command === 'resume' ? 'Sesión reanudada' : 'Sesión finalizada'}`,
        });
      } else {
        // Normal action
        onActionParsed(parsed);
        toast({
          title: 'Acción detectada por voz',
          description: `Tipo: ${parsed.actionType} | Riesgo: ${parsed.riskLevel}`,
        });
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: 'Error de transcripción',
        description: error instanceof Error ? error.message : 'No se pudo procesar el audio',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [parseTranscript, onActionParsed, onSessionCommand, toast]);

  const { isRecording, duration, startRecording, stopRecording, error } = useVoiceRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: (err) => {
      toast({
        title: 'Error de grabación',
        description: err,
        variant: 'destructive',
      });
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getActionTypeLabel = (type: ActionType): string => {
    const labels: Record<ActionType, string> = {
      config_change: 'Cambio Config',
      module_update: 'Actualización Módulo',
      data_access: 'Acceso Datos',
      data_modification: 'Modificación Datos',
      system_repair: 'Reparación',
      diagnostic_run: 'Diagnóstico',
      file_transfer: 'Transferencia Archivo',
      permission_change: 'Cambio Permisos',
      session_start: 'Inicio Sesión',
      session_end: 'Fin Sesión',
      screenshot_capture: 'Captura',
      command_execution: 'Comando',
      error_occurred: 'Error',
      warning_raised: 'Advertencia',
      user_interaction: 'Interacción',
      system_check: 'Verificación',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          size="sm"
          onClick={handleToggleRecording}
          disabled={disabled || isTranscribing}
          className="gap-2"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribiendo...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="h-4 w-4" />
              Detener ({formatDuration(duration)})
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Dictar Acción
            </>
          )}
        </Button>

        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Grabando...</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}

      {lastTranscript && !isRecording && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <Wand2 className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">&quot;{lastTranscript}&quot;</p>
              {parsedPreview && !parsedPreview.command && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {getActionTypeLabel(parsedPreview.actionType)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      parsedPreview.riskLevel === 'critical' ? 'border-red-500 text-red-500' :
                      parsedPreview.riskLevel === 'high' ? 'border-orange-500 text-orange-500' :
                      parsedPreview.riskLevel === 'medium' ? 'border-yellow-500 text-yellow-500' :
                      'border-green-500 text-green-500'
                    }`}
                  >
                    Riesgo: {parsedPreview.riskLevel}
                  </Badge>
                  {parsedPreview.componentAffected && (
                    <Badge variant="secondary" className="text-xs">
                      {parsedPreview.componentAffected}
                    </Badge>
                  )}
                </div>
              )}
              {parsedPreview?.command && (
                <Badge className="mt-2 bg-primary">
                  Comando: {parsedPreview.command}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Di comandos como &quot;Pausar sesión&quot;, &quot;Cambio de configuración en el módulo de facturación&quot;, o &quot;Diagnóstico del sistema de usuarios&quot;
      </p>
    </div>
  );
}
