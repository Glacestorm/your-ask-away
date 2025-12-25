import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, MessageSquare, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { useAutoResponse } from '@/hooks/admin/useAutoResponse';
import { cn } from '@/lib/utils';

interface AutoResponsePanelProps {
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

export function AutoResponsePanel({ context, className }: AutoResponsePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, suggestions, templates, config, generateSuggestion, fetchTemplates, updateConfig } = useAutoResponse();

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un mensaje para generar respuesta</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Auto-Response IA</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border bg-card">
                <p className="text-sm">{s.content}</p>
                <Badge variant="outline" className="text-xs mt-2">{Math.round(s.confidence * 100)}%</Badge>
              </div>
            ))}
            {suggestions.length === 0 && (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <Button onClick={() => generateSuggestion(context.entityId, 'general')} disabled={isLoading}>
                  <Zap className="h-4 w-4 mr-2" />Generar Borrador
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border mt-4">
              <span className="text-sm">Auto-envío</span>
              <Switch checked={config.enabled} onCheckedChange={(enabled) => updateConfig({ enabled })} />
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AutoResponsePanel;
