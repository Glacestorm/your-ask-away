import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Bot,
  Zap,
  Brain,
  BookOpen,
  Settings,
  Activity,
  TrendingUp,
  Shield,
  Sparkles,
  LineChart,
  FileText,
  Plug,
  Monitor,
  Network,
  Heart,
  Cpu
} from 'lucide-react';
import { AgentOrchestrationPanel } from './AgentOrchestrationPanel';
import { ActionExecutionDashboard } from './ActionExecutionDashboard';
import { ReinforcementLearningDashboard } from './ReinforcementLearningDashboard';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { PredictiveMonitoringPanel } from './PredictiveMonitoringPanel';
import { AuditSecurityPanel } from './AuditSecurityPanel';
import { ReportsExportPanel } from './ReportsExportPanel';
import { ExternalIntegrationsPanel } from './ExternalIntegrationsPanel';
import { ScreenUnderstandingPanel } from './ScreenUnderstandingPanel';
import { GraphRAGPanel } from './GraphRAGPanel';
import { EmotionalAnalysisPanel } from './EmotionalAnalysisPanel';
import { PredictiveMaintenancePanel } from './PredictiveMaintenancePanel';
import { useSupportPredictiveAnalytics } from '@/hooks/admin/support/useSupportPredictiveAnalytics';
import { useSupportAgentOrchestrator } from '@/hooks/admin/support/useSupportAgentOrchestrator';
import { useKnowledgeBase } from '@/hooks/admin/support/useKnowledgeBase';
import { cn } from '@/lib/utils';

interface RemoteSupportAIDashboardProps {
  ticketId?: string;
  ticketContext?: {
    title: string;
    description: string;
    priority: string;
    category: string;
  };
  className?: string;
}

export function RemoteSupportAIDashboard({ 
  ticketId,
  ticketContext,
  className 
}: RemoteSupportAIDashboardProps) {
  const [activeTab, setActiveTab] = useState('orchestration');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);

  // Hooks for real data
  const { agents, sessions } = useSupportAgentOrchestrator();
  const { healthMetrics, realtimeStatus, refreshAll } = useSupportPredictiveAnalytics();
  const { documents } = useKnowledgeBase();

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleSessionCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleActionComplete = (executionId: string, success: boolean) => {
    console.log(`[RemoteSupportAIDashboard] Action ${executionId} completed: ${success}`);
  };

  // Computed stats from real data
  const activeAgentsCount = agents.filter(a => a.is_active).length;
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const resolutionRate = healthMetrics?.metrics?.successRate || 78;
  const documentsCount = documents.length || 0;

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Soporte AI Autónomo
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Fase 6
              </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sistema multi-agente con aprendizaje por refuerzo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1 text-green-400 animate-pulse" />
                Sesión Activa
              </Badge>
            )}
            {healthMetrics && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  healthMetrics.status === 'healthy' ? 'border-green-500/50 text-green-400' :
                  healthMetrics.status === 'warning' ? 'border-yellow-500/50 text-yellow-400' :
                  'border-red-500/50 text-red-400'
                )}
              >
                {healthMetrics.healthScore}% Salud
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Quick Stats - Real Data */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-muted-foreground">Agentes</span>
            </div>
            <p className="text-lg font-bold text-violet-400">{activeAgentsCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Sesiones</span>
            </div>
            <p className="text-lg font-bold text-cyan-400">{activeSessions}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Resolución</span>
            </div>
            <p className="text-lg font-bold text-green-400">{resolutionRate}%</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Patrones</span>
            </div>
            <p className="text-lg font-bold text-amber-400">{realtimeStatus?.actionsLast30Min || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Documentos</span>
            </div>
            <p className="text-lg font-bold text-blue-400">{documentsCount}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full mb-4">
            <TabsList className="inline-flex w-max gap-1 p-1">
              <TabsTrigger value="orchestration" className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                Agentes
              </TabsTrigger>
              <TabsTrigger value="execution" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Ejecución
              </TabsTrigger>
              <TabsTrigger value="screen" className="text-xs">
                <Monitor className="h-3 w-3 mr-1" />
                Pantalla
              </TabsTrigger>
              <TabsTrigger value="graphrag" className="text-xs">
                <Network className="h-3 w-3 mr-1" />
                GraphRAG
              </TabsTrigger>
              <TabsTrigger value="emotional" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Emocional
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs">
                <Cpu className="h-3 w-3 mr-1" />
                IoT
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="text-xs">
                <LineChart className="h-3 w-3 mr-1" />
                Monitoreo
              </TabsTrigger>
              <TabsTrigger value="learning" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                RL
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                KB
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Auditoría
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Reportes
              </TabsTrigger>
              <TabsTrigger value="integrations" className="text-xs">
                <Plug className="h-3 w-3 mr-1" />
                APIs
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="orchestration" className="mt-0">
            <AgentOrchestrationPanel 
              ticketId={ticketId}
              ticketContext={ticketContext}
              onSessionCreated={handleSessionCreated}
            />
          </TabsContent>

          <TabsContent value="execution" className="mt-0">
            <ActionExecutionDashboard 
              sessionId={activeSessionId || undefined}
              onActionComplete={handleActionComplete}
            />
          </TabsContent>

          <TabsContent value="monitoring" className="mt-0">
            <PredictiveMonitoringPanel />
          </TabsContent>

          <TabsContent value="learning" className="mt-0">
            <ReinforcementLearningDashboard 
              selectedAgentKey={selectedAgentKey || undefined}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-0">
            <KnowledgeBasePanel 
              onDocumentSelect={(doc) => {
                console.log('[RemoteSupportAIDashboard] Document selected:', doc.title);
              }}
            />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <AuditSecurityPanel sessionId={activeSessionId || undefined} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportsExportPanel />
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
            <ExternalIntegrationsPanel sessionId={activeSessionId || undefined} />
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <div className="mt-4 p-3 rounded-lg border bg-muted/30 flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium">Modo Sandbox Activo</p>
            <p className="text-xs text-muted-foreground">
              Todas las acciones se ejecutan en entorno aislado con rollback automático
            </p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Seguro
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default RemoteSupportAIDashboard;
