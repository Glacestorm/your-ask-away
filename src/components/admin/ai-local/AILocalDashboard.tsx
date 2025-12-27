/**
 * Dashboard de IA Local
 * 
 * Panel completo para gestionar la IA local del CRM:
 * - Configuración de conexión
 * - Chat con asistente
 * - Documentación de instalación
 * - Monitoreo de estado
 * - Analytics IA (Fase 2)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Settings,
  MessageSquare,
  BookOpen,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Cloud,
  Zap,
  TrendingUp,
  Clock,
  BarChart3,
  Brain,
  Search,
  Eye,
  Network,
  Gauge,
  Library,
  MessageCircle,
  Target,
  Users,
  LineChart,
  AlertTriangle,
  DollarSign,
  Package,
} from 'lucide-react';
import { AIConfigurationPanel } from './AIConfigurationPanel';
import { AIAssistantLocal } from './AIAssistantLocal';
import { AIInstallationGuide } from './AIInstallationGuide';
import { EmotionalAnalysisPanel } from '../ai-modules/EmotionalAnalysisPanel';
import { NaturalLanguageQueryPanel } from '../ai-modules/NaturalLanguageQueryPanel';
import { ScreenUnderstandingPanel } from '../ai-modules/ScreenUnderstandingPanel';
import { GraphRAGPanel } from '../ai-modules/GraphRAGPanel';
import { PredictiveMaintenancePanel } from '../ai-modules/PredictiveMaintenancePanel';
import { KnowledgeBaseRAGPanel } from '../ai-modules/KnowledgeBaseRAGPanel';
import { MultiChannelIntegrationPanel } from '../ai-modules/MultiChannelIntegrationPanel';
import { PerformanceCoachPanel } from '../ai-modules/PerformanceCoachPanel';
import { Customer360IAPanel } from '../ai-modules/Customer360IAPanel';
import { useLocalAI } from '@/hooks/admin/useLocalAI';
import { cn } from '@/lib/utils';

interface AILocalDashboardProps {
  className?: string;
}

export function AILocalDashboard({ className }: AILocalDashboardProps) {
  const [activeTab, setActiveTab] = useState('assistant');
  const { connectionStatus, messages } = useLocalAI();

  const getConnectionColor = () => {
    if (connectionStatus.connected) return 'text-green-500';
    if (connectionStatus.source === 'fallback') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConnectionIcon = () => {
    if (connectionStatus.connected) return <Wifi className="h-4 w-4 text-green-500" />;
    if (connectionStatus.source === 'fallback') return <Cloud className="h-4 w-4 text-yellow-500" />;
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  // Mock stats for dashboard
  const stats = {
    totalMessages: messages.length,
    localResponses: messages.filter(m => m.source === 'local').length,
    cloudResponses: messages.filter(m => m.source === 'fallback').length,
    avgResponseTime: '1.2s',
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className={cn("text-2xl font-bold", getConnectionColor())}>
                  {connectionStatus.connected ? 'Conectado' : 
                   connectionStatus.source === 'fallback' ? 'Fallback' : 'Offline'}
                </p>
              </div>
              {getConnectionIcon()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mensajes Hoy</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modelos Disponibles</p>
                <p className="text-2xl font-bold">{connectionStatus.models.length}</p>
              </div>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Respuesta</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="assistant" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Asistente</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Avanzado</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Knowledge</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="install" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Instalación</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Monitor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIAssistantLocal 
                onOpenSettings={() => setActiveTab('config')}
              />
            </div>
            <div className="space-y-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Estadísticas de Sesión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mensajes</span>
                    <span className="font-medium">{stats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Respuestas Locales</span>
                    <Badge variant="outline">{stats.localResponses}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Respuestas Cloud</span>
                    <Badge variant="secondary">{stats.cloudResponses}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Tips */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Consejos de Uso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>• Usa acciones rápidas para consultas frecuentes</p>
                  <p>• El contexto de la página actual se incluye automáticamente</p>
                  <p>• Puedes copiar las respuestas con un click</p>
                  <p>• El asistente recuerda el historial de la conversación</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analytics IA - Fase 2</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis emocional y consultas en lenguaje natural potenciados por IA
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmotionalAnalysisPanel 
                context={{ 
                  entityId: 'ai-local-dashboard', 
                  entityType: 'feedback' 
                }} 
                className="h-fit"
              />
              <NaturalLanguageQueryPanel className="h-fit" />
            </div>

            <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Capacidades de Analytics IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Análisis Emocional
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Detección de sentimientos en tiempo real</li>
                      <li>• Análisis de tono en comunicaciones</li>
                      <li>• Predicción de satisfacción del cliente</li>
                      <li>• Alertas de frustración temprana</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Search className="h-4 w-4 text-accent" />
                      Consultas en Lenguaje Natural
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Búsqueda semántica en el CRM</li>
                      <li>• Generación de reportes con texto</li>
                      <li>• Análisis de datos conversacional</li>
                      <li>• Traducción de consultas a SQL</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-primary">
                <Network className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Capacidades IA Avanzadas - Fase 3</h3>
                <p className="text-sm text-muted-foreground">
                  Screen Understanding, GraphRAG y Mantenimiento Predictivo IoT
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ScreenUnderstandingPanel 
                context={{ 
                  entityId: 'ai-local-dashboard',
                  sessionId: 'session-001',
                  currentScreen: 'admin-dashboard'
                }} 
                className="h-fit"
              />
              <GraphRAGPanel 
                context={{ 
                  entityId: 'ai-local-dashboard',
                  entityType: 'crm'
                }} 
                className="h-fit"
              />
              <PredictiveMaintenancePanel 
                context={{ 
                  entityId: 'ai-local-dashboard',
                  systemType: 'enterprise'
                }} 
                className="h-fit"
              />
            </div>

            <Card className="bg-gradient-to-r from-accent/5 via-primary/5 to-secondary/5 border-accent/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Capacidades IA Avanzadas - Fase 3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Screen Understanding
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Análisis visual de capturas</li>
                      <li>• Detección de errores UI</li>
                      <li>• Anotaciones en tiempo real</li>
                      <li>• Comparación de pantallas</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Network className="h-4 w-4 text-accent" />
                      GraphRAG
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Knowledge Graph dinámico</li>
                      <li>• Contexto de cliente 360°</li>
                      <li>• Patrones de aprendizaje</li>
                      <li>• Consultas semánticas</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-secondary" />
                      Mantenimiento Predictivo
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Monitoreo IoT en tiempo real</li>
                      <li>• Predicción de fallos</li>
                      <li>• Detección de anomalías</li>
                      <li>• Sesiones proactivas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary to-accent">
                <Library className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Knowledge & Comms - Fase 4</h3>
                <p className="text-sm text-muted-foreground">
                  Base de conocimiento RAG, integración multicanal, coaching y Customer 360°
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KnowledgeBaseRAGPanel className="h-fit" />
              <MultiChannelIntegrationPanel 
                context={{ 
                  entityId: 'ai-local-dashboard'
                }} 
                className="h-fit"
              />
              <PerformanceCoachPanel 
                context={{ 
                  entityId: 'ai-local-dashboard'
                }} 
                className="h-fit"
              />
              <Customer360IAPanel 
                context={{ 
                  entityId: 'ai-local-dashboard'
                }} 
                className="h-fit"
              />
            </div>

            <Card className="bg-gradient-to-r from-secondary/5 via-accent/5 to-primary/5 border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  Capacidades Knowledge & Comms - Fase 4
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Library className="h-4 w-4 text-primary" />
                      Knowledge Base RAG
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Búsqueda semántica</li>
                      <li>• Documentos vectorizados</li>
                      <li>• Contexto aumentado</li>
                      <li>• Respuestas precisas</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-accent" />
                      Multi-Canal
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Email, chat, WhatsApp</li>
                      <li>• Respuestas unificadas</li>
                      <li>• Historial consolidado</li>
                      <li>• Routing inteligente</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-secondary" />
                      Performance Coach
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Análisis de desempeño</li>
                      <li>• Recomendaciones IA</li>
                      <li>• Objetivos adaptativos</li>
                      <li>• Feedback continuo</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Customer 360°
                    </h4>
                    <ul className="text-muted-foreground space-y-1 ml-6">
                      <li>• Vista unificada cliente</li>
                      <li>• Predicción de comportamiento</li>
                      <li>• Segmentación IA</li>
                      <li>• Next Best Action</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIConfigurationPanel />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del Sistema</CardTitle>
                <CardDescription>Estado actual de la configuración de IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fuente Activa</span>
                    <Badge>
                      {connectionStatus.connected ? 'Ollama Local' : 
                       connectionStatus.source === 'fallback' ? 'Lovable AI' : 'Sin conexión'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modelos Locales</span>
                    <span>{connectionStatus.models.filter(m => m.source !== 'lovable').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Última Verificación</span>
                    <span>
                      {connectionStatus.lastChecked 
                        ? connectionStatus.lastChecked.toLocaleTimeString() 
                        : 'Nunca'}
                    </span>
                  </div>
                </div>

                {connectionStatus.error && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs text-destructive">{connectionStatus.error}</p>
                  </div>
                )}

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Uso de Recursos</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>CPU</span>
                        <span>--%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Memoria</span>
                        <span>--%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Métricas disponibles cuando Ollama está conectado
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="install" className="mt-4">
          <AIInstallationGuide />
        </TabsContent>

        <TabsContent value="monitor" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Uso por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Gráfico de uso disponible próximamente</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Métricas de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tiempo promedio de respuesta</span>
                    <Badge variant="outline">{stats.avgResponseTime}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tasa de éxito</span>
                    <Badge variant="outline">100%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uso de fallback</span>
                    <Badge variant="secondary">
                      {stats.totalMessages > 0 
                        ? Math.round((stats.cloudResponses / stats.totalMessages) * 100) 
                        : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Historial de Conexiones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm flex-1">Conexión establecida con Ollama local</span>
                    <span className="text-xs text-muted-foreground">Ahora</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm flex-1">Fallback a Lovable AI activado</span>
                    <span className="text-xs text-muted-foreground">Hace 5 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AILocalDashboard;
