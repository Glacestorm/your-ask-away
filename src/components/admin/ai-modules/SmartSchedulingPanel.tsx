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
  XCircle
} from 'lucide-react';
import { useSmartScheduling } from '@/hooks/admin/useSmartScheduling';
import { cn } from '@/lib/utils';

interface SmartSchedulingPanelProps {
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

export function SmartSchedulingPanel({ context, className }: SmartSchedulingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');

  const {
    isLoading,
    suggestions,
    timeSlots,
    fetchSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    optimizeSchedule,
    getPriorityColor
  } = useSmartScheduling();

  useEffect(() => {
    if (context?.entityId) {
      fetchSuggestions({ participants: [context.entityId] });
    }
  }, [context?.entityId, fetchSuggestions]);

  const handleRefresh = useCallback(async () => {
    if (context?.entityId) {
      await fetchSuggestions({ participants: [context.entityId] });
    }
  }, [context, fetchSuggestions]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un contexto para Smart Scheduling</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Smart Scheduling IA</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="suggestions" className="text-xs">Sugerencias</TabsTrigger>
            <TabsTrigger value="optimize" className="text-xs">Optimizar</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">{suggestion.title}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(suggestion.priority))}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{suggestion.suggested_date} {suggestion.suggested_time}</span>
                        <Users className="h-3 w-3 ml-2" />
                        <span>{suggestion.participants?.length || 0}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => acceptSuggestion(suggestion)}>
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dismissSuggestion(suggestion.id)}>
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
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

          <TabsContent value="optimize" className="flex-1 mt-0">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h4 className="font-medium mb-2">Optimización de Agenda</h4>
              <p className="text-sm text-muted-foreground mb-4">
                La IA optimizará automáticamente tu agenda
              </p>
              <Button onClick={() => optimizeSchedule(suggestions)} disabled={isLoading || suggestions.length === 0}>
                <Calendar className="h-4 w-4 mr-2" />Optimizar Agenda
              </Button>
              {timeSlots.length > 0 && (
                <div className="mt-4 space-y-2 text-left">
                  {timeSlots.slice(0, 3).map((slot, idx) => (
                    <div key={idx} className="p-2 rounded border bg-muted/30 flex items-center justify-between">
                      <span className="text-xs">{slot.start} - {slot.end}</span>
                      <Badge variant={slot.available ? 'default' : 'secondary'} className="text-xs">
                        {slot.available ? 'Disponible' : 'Ocupado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SmartSchedulingPanel;
