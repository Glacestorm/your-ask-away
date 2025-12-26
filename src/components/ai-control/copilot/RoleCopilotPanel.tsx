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
  MessageSquare,
  Calendar,
  Flame,
  FileText,
  Users,
  GraduationCap,
  Shield,
  ShieldAlert,
  FileSearch,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { useRoleCopilot, CopilotSuggestion } from '@/hooks/useRoleCopilot';
import { CopilotSuggestionCard } from './CopilotSuggestionCard';
import { CopilotMetricsBar } from './CopilotMetricsBar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapa de iconos para quick actions
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Flame,
  FileText,
  Users,
  AlertTriangle,
  GraduationCap,
  Shield,
  ShieldAlert,
  FileSearch,
  BarChart3,
  TrendingUp,
  CheckCircle: CheckCircle2,
  Zap,
  Bot,
  Sparkles,
  Clock,
  MessageSquare,
};

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
    error,
    isError,
    clearError,
    lastRefresh,
    refetchSession,
  } = useRoleCopilot();

  const [activeTab, setActiveTab] = useState('suggestions');

  // Renderizar icono de quick action
  const renderQuickActionIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    // Fallback: mostrar el emoji/string directamente
    return <span className="text-sm">{iconName}</span>;
  };

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

  // Componente para renderizar estado vacío en tabs
  const EmptyTabState = ({ type, icon: Icon }: { type: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">
        No hi ha {type} actius
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Genera suggeriments per veure recomanacions
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Error State */}
      {isError && error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error.message}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Refresh Indicator */}
      {lastRefresh && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Actualitzat {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetchSession()} className="h-6 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}

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
          <CopilotMetricsBar metrics={metrics} isLoading={isProcessing && !metrics} />
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
                  {action.icon && renderQuickActionIcon(action.icon)}
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
                {getSuggestionsByType('action').length === 0 ? (
                  <EmptyTabState type="accions" icon={Zap} />
                ) : (
                  getSuggestionsByType('action').map((suggestion) => (
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

              <TabsContent value="insights" className="mt-0 space-y-3">
                {getSuggestionsByType('insight').length === 0 ? (
                  <EmptyTabState type="insights" icon={TrendingUp} />
                ) : (
                  getSuggestionsByType('insight').map((suggestion) => (
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

              <TabsContent value="alerts" className="mt-0 space-y-3">
                {getSuggestionsByType('alert').length === 0 ? (
                  <EmptyTabState type="alertes" icon={AlertTriangle} />
                ) : (
                  getSuggestionsByType('alert').map((suggestion) => (
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
            </ScrollArea>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
