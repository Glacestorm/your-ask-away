import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { useRoleCopilot, CopilotSuggestion } from '@/hooks/useRoleCopilot';
import { CopilotSuggestionCard } from './CopilotSuggestionCard';
import { CopilotMetricsBar } from './CopilotMetricsBar';

export function RoleCopilotPanel() {
  const {
    copilotConfig,
    session,
    metrics,
    currentSuggestions,
    isProcessing,
    configLoading,
    generateSuggestions,
    executeAction,
    dismissSuggestion,
    executeQuickAction,
  } = useRoleCopilot();

  const [activeTab, setActiveTab] = useState('suggestions');

  if (configLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!copilotConfig) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <Bot className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            No hi ha configuració de copilot disponible per al teu rol
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSuggestionsByType = (type: string) => 
    currentSuggestions.filter(s => s.type === type);

  const handleExecute = async (suggestion: CopilotSuggestion, actionId: string) => {
    await executeAction.mutateAsync({ suggestion, actionId });
  };

  const handleDismiss = async (suggestion: CopilotSuggestion, reason?: string) => {
    await dismissSuggestion.mutateAsync({ suggestion, reason });
  };

  return (
    <div className="space-y-4">
      {/* Header with Copilot Info */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {copilotConfig.copilot_name}
                  <Badge variant="secondary" className="text-xs">
                    {copilotConfig.role}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {copilotConfig.copilot_description || 'Assistent IA personalitzat per al teu rol'}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => generateSuggestions()} 
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generant...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Suggeriments
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CopilotMetricsBar metrics={metrics} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {copilotConfig.quick_actions && copilotConfig.quick_actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Accions Ràpides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {copilotConfig.quick_actions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => executeQuickAction(action.id)}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions Tabs */}
      <Card className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="suggestions" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Tots ({currentSuggestions.length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Accions ({getSuggestionsByType('action').length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Insights ({getSuggestionsByType('insight').length})
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertes ({getSuggestionsByType('alert').length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <TabsContent value="suggestions" className="mt-0 space-y-3">
                {currentSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      No hi ha suggeriments actius
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Fes clic a "Generar Suggeriments" per obtenir recomanacions IA
                    </p>
                  </div>
                ) : (
                  currentSuggestions.map((suggestion) => (
                    <CopilotSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onExecute={handleExecute}
                      onDismiss={handleDismiss}
                      isExecuting={executeAction.isPending}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="actions" className="mt-0 space-y-3">
                {getSuggestionsByType('action').map((suggestion) => (
                  <CopilotSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onExecute={handleExecute}
                    onDismiss={handleDismiss}
                    isExecuting={executeAction.isPending}
                  />
                ))}
              </TabsContent>

              <TabsContent value="insights" className="mt-0 space-y-3">
                {getSuggestionsByType('insight').map((suggestion) => (
                  <CopilotSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onExecute={handleExecute}
                    onDismiss={handleDismiss}
                    isExecuting={executeAction.isPending}
                  />
                ))}
              </TabsContent>

              <TabsContent value="alerts" className="mt-0 space-y-3">
                {getSuggestionsByType('alert').map((suggestion) => (
                  <CopilotSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onExecute={handleExecute}
                    onDismiss={handleDismiss}
                    isExecuting={executeAction.isPending}
                  />
                ))}
              </TabsContent>
            </ScrollArea>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
