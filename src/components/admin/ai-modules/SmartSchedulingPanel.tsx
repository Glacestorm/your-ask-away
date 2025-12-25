import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Calendar,
  Clock,
  Users,
  Maximize2,
  Minimize2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useSmartScheduling } from '@/hooks/admin/useSmartScheduling';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SmartSchedulingPanelProps {
  context?: {
    entityId: string;
    entityName?: string;
  } | null;
  className?: string;
}

export function SmartSchedulingPanel({ 
  context, 
  className 
}: SmartSchedulingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');

  const {
    isLoading,
    suggestions,
    conflicts,
    lastRefresh,
    getSuggestions,
    detectConflicts,
    autoSchedule
  } = useSmartScheduling();

  useEffect(() => {
    if (context?.entityId) {
      getSuggestions({ participants: [context.entityId] });
    }
  }, [context?.entityId, getSuggestions]);

  const handleRefresh = useCallback(async () => {
    if (context?.entityId) {
      await getSuggestions({ participants: [context.entityId] });
      await detectConflicts(context.entityId);
    }
  }, [context, getSuggestions, detectConflicts]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un contexto para activar Smart Scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Smart Scheduling IA</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="suggestions" className="text-xs">Sugerencias</TabsTrigger>
            <TabsTrigger value="conflicts" className="text-xs">Conflictos</TabsTrigger>
            <TabsTrigger value="auto" className="text-xs">Auto-Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">{suggestion.suggestedTime}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}% confianza
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {suggestion.participants?.length || 0} participantes
                      </span>
                    </div>
                  </div>
                ))}
                {suggestions.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay sugerencias disponibles</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conflicts" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-sm">{conflict.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{conflict.description}</p>
                    <p className="text-xs text-primary">{conflict.resolution}</p>
                  </div>
                ))}
                {conflicts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                    <p className="text-sm">Sin conflictos detectados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="auto" className="flex-1 mt-0">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h4 className="font-medium mb-2">Auto-Agendamiento IA</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Deja que la IA organice automáticamente tu agenda optimizando tiempos y recursos
              </p>
              <Button 
                onClick={() => autoSchedule([])}
                disabled={isLoading}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Optimizar Agenda
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SmartSchedulingPanel;
