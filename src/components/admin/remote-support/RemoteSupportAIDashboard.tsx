import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot,
  Zap,
  Brain,
  BookOpen,
  Settings,
  Activity,
  TrendingUp,
  Shield,
  Sparkles
} from 'lucide-react';
import { AgentOrchestrationPanel } from './AgentOrchestrationPanel';
import { ActionExecutionDashboard } from './ActionExecutionDashboard';
import { ReinforcementLearningDashboard } from './ReinforcementLearningDashboard';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
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

  const handleSessionCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleActionComplete = (executionId: string, success: boolean) => {
    console.log(`[RemoteSupportAIDashboard] Action ${executionId} completed: ${success}`);
  };

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
                Fase 3
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
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-muted-foreground">Agentes</span>
            </div>
            <p className="text-lg font-bold text-violet-400">5</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Resolución</span>
            </div>
            <p className="text-lg font-bold text-green-400">78%</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Patrones</span>
            </div>
            <p className="text-lg font-bold text-amber-400">24</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Documentos</span>
            </div>
            <p className="text-lg font-bold text-blue-400">156</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="orchestration" className="text-sm">
              <Bot className="h-4 w-4 mr-2" />
              Orquestación
            </TabsTrigger>
            <TabsTrigger value="execution" className="text-sm">
              <Zap className="h-4 w-4 mr-2" />
              Ejecución
            </TabsTrigger>
            <TabsTrigger value="learning" className="text-sm">
              <Brain className="h-4 w-4 mr-2" />
              Aprendizaje
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="text-sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Conocimiento
            </TabsTrigger>
          </TabsList>

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
