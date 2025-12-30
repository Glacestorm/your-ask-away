// Vertical Accounting - AI Agent Marketplace
// Fase 12 - Módulo Disruptivo: Marketplace de Agentes IA Contables

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Bot,
  Sparkles,
  Star,
  Download,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Shield,
  Zap,
  Search,
  Filter,
  Grid3X3,
  List,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Brain,
  Workflow,
  Package,
  CreditCard,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Award
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  vendor: string;
  rating: number;
  reviews: number;
  installs: number;
  price: 'free' | 'freemium' | 'paid';
  priceAmount?: number;
  tags: string[];
  capabilities: string[];
  status: 'available' | 'installed' | 'running' | 'paused';
  accuracy?: number;
  tasksCompleted?: number;
  timeSaved?: number;
}

interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  task: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  startedAt: string;
  completedAt?: string;
  result?: string;
  tokensUsed?: number;
}

interface AgentMetric {
  agentId: string;
  agentName: string;
  executionsToday: number;
  executionsMonth: number;
  successRate: number;
  avgExecutionTime: number;
  costSavings: number;
}

export function VerticalAccountingAIMarketplace() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - Available Agents
  const availableAgents: AIAgent[] = [
    {
      id: '1',
      name: 'AutoReconciler Pro',
      description: 'Agente IA que reconcilia automáticamente extractos bancarios con asientos contables usando machine learning.',
      category: 'Reconciliación',
      vendor: 'ObelixIA Labs',
      rating: 4.9,
      reviews: 1247,
      installs: 15420,
      price: 'freemium',
      tags: ['reconciliación', 'bancos', 'automatización'],
      capabilities: ['Matching inteligente', 'Detección de duplicados', 'Sugerencias de asientos'],
      status: 'installed',
      accuracy: 98.5,
      tasksCompleted: 2340,
      timeSaved: 156
    },
    {
      id: '2',
      name: 'TaxOptimizer AI',
      description: 'Optimiza la carga fiscal analizando transacciones y sugiriendo estrategias de planificación tributaria.',
      category: 'Fiscal',
      vendor: 'FiscalTech',
      rating: 4.7,
      reviews: 892,
      installs: 8930,
      price: 'paid',
      priceAmount: 49,
      tags: ['impuestos', 'optimización', 'compliance'],
      capabilities: ['Análisis fiscal', 'Deducciones automáticas', 'Alertas regulatorias'],
      status: 'running'
    },
    {
      id: '3',
      name: 'InvoiceReader OCR+',
      description: 'Extrae datos de facturas en cualquier formato usando OCR avanzado y procesamiento de lenguaje natural.',
      category: 'Documentos',
      vendor: 'DocuAI',
      rating: 4.8,
      reviews: 2103,
      installs: 25600,
      price: 'free',
      tags: ['OCR', 'facturas', 'extracción'],
      capabilities: ['OCR multiidioma', 'Validación de datos', 'Integración ERP'],
      status: 'installed',
      accuracy: 99.2,
      tasksCompleted: 8920,
      timeSaved: 445
    },
    {
      id: '4',
      name: 'CashFlow Prophet',
      description: 'Predice flujos de caja futuros usando modelos de series temporales y datos históricos.',
      category: 'Predicción',
      vendor: 'PredictiveFinance',
      rating: 4.6,
      reviews: 567,
      installs: 4320,
      price: 'paid',
      priceAmount: 79,
      tags: ['predicción', 'cashflow', 'ML'],
      capabilities: ['Forecasting 90 días', 'Escenarios what-if', 'Alertas de liquidez'],
      status: 'available'
    },
    {
      id: '5',
      name: 'AuditBot Compliance',
      description: 'Audita automáticamente transacciones buscando anomalías, fraude y cumplimiento normativo.',
      category: 'Auditoría',
      vendor: 'ComplianceAI',
      rating: 4.8,
      reviews: 734,
      installs: 6780,
      price: 'paid',
      priceAmount: 99,
      tags: ['auditoría', 'fraude', 'compliance'],
      capabilities: ['Detección de anomalías', 'Scoring de riesgo', 'Reportes automáticos'],
      status: 'available'
    },
    {
      id: '6',
      name: 'ExpenseClassifier',
      description: 'Clasifica gastos automáticamente en categorías contables usando IA entrenada en millones de transacciones.',
      category: 'Clasificación',
      vendor: 'ObelixIA Labs',
      rating: 4.5,
      reviews: 1890,
      installs: 19200,
      price: 'free',
      tags: ['gastos', 'clasificación', 'categorías'],
      capabilities: ['Auto-categorización', 'Aprendizaje continuo', 'Multi-empresa'],
      status: 'paused'
    }
  ];

  // Mock data - Running Executions
  const executions: AgentExecution[] = [
    {
      id: '1',
      agentId: '2',
      agentName: 'TaxOptimizer AI',
      task: 'Análisis fiscal Q4 2024',
      status: 'running',
      progress: 67,
      startedAt: '2024-01-15T10:00:00Z',
      tokensUsed: 12500
    },
    {
      id: '2',
      agentId: '1',
      agentName: 'AutoReconciler Pro',
      task: 'Reconciliación bancaria Enero',
      status: 'completed',
      progress: 100,
      startedAt: '2024-01-15T09:30:00Z',
      completedAt: '2024-01-15T09:45:00Z',
      result: '234 transacciones reconciliadas, 12 pendientes de revisión',
      tokensUsed: 8900
    },
    {
      id: '3',
      agentId: '3',
      agentName: 'InvoiceReader OCR+',
      task: 'Procesamiento lote facturas proveedores',
      status: 'queued',
      progress: 0,
      startedAt: '2024-01-15T10:30:00Z'
    }
  ];

  // Mock data - Metrics
  const metrics: AgentMetric[] = [
    {
      agentId: '1',
      agentName: 'AutoReconciler Pro',
      executionsToday: 12,
      executionsMonth: 342,
      successRate: 98.5,
      avgExecutionTime: 8.2,
      costSavings: 4500
    },
    {
      agentId: '3',
      agentName: 'InvoiceReader OCR+',
      executionsToday: 45,
      executionsMonth: 1230,
      successRate: 99.2,
      avgExecutionTime: 2.1,
      costSavings: 8900
    }
  ];

  const installedAgents = availableAgents.filter(a => ['installed', 'running', 'paused'].includes(a.status));
  const totalTimeSaved = installedAgents.reduce((sum, a) => sum + (a.timeSaved || 0), 0);
  const totalTasksCompleted = installedAgents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0);

  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'installed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriceDisplay = (agent: AIAgent) => {
    if (agent.price === 'free') return <Badge variant="secondary">Gratis</Badge>;
    if (agent.price === 'freemium') return <Badge variant="outline">Freemium</Badge>;
    return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">${agent.priceAmount}/mes</Badge>;
  };

  return (
    <div className="space-y-6 p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Agent Marketplace</h1>
            <p className="text-muted-foreground">
              Descubre, instala y orquesta agentes IA especializados en contabilidad
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Mis Agentes
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-violet-500 to-purple-600">
            <Sparkles className="h-4 w-4 mr-2" />
            Publicar Agente
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agentes Instalados</p>
                <p className="text-2xl font-bold">{installedAgents.length}</p>
                <p className="text-xs text-green-600">+2 este mes</p>
              </div>
              <Bot className="h-8 w-8 text-violet-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tareas Completadas</p>
                <p className="text-2xl font-bold">{totalTasksCompleted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Ahorradas</p>
                <p className="text-2xl font-bold">{totalTimeSaved}h</p>
                <p className="text-xs text-muted-foreground">~${(totalTimeSaved * 50).toLocaleString()} valor</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precisión Media</p>
                <p className="text-2xl font-bold">98.7%</p>
                <p className="text-xs text-green-600">+0.5% vs anterior</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="marketplace" className="flex items-center gap-1">
            <Grid3X3 className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Instalados
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-1">
            <Workflow className="h-4 w-4" />
            Ejecuciones
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            Orquestación
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Agent Cards */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {availableAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                        <Bot className="h-6 w-6 text-violet-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground">{agent.vendor}</p>
                      </div>
                    </div>
                    {getPriceDisplay(agent)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{agent.rating}</span>
                      <span className="text-muted-foreground">({agent.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="h-4 w-4" />
                      <span>{agent.installs.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {agent.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    {agent.status === 'available' ? (
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Instalar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        <span className="text-sm capitalize">{agent.status}</span>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Installed Tab */}
        <TabsContent value="installed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {installedAgents.map((agent) => (
              <Card key={agent.id} className="border-l-4 border-l-violet-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-sm capitalize">{agent.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{agent.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">Precisión</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{agent.tasksCompleted?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Tareas</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{agent.timeSaved}h</p>
                      <p className="text-xs text-muted-foreground">Ahorradas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {agent.status === 'running' ? (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Ejecutar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Ejecuciones en Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {executions.map((exec) => (
                    <div key={exec.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-violet-500/10">
                            <Bot className="h-5 w-5 text-violet-500" />
                          </div>
                          <div>
                            <p className="font-medium">{exec.agentName}</p>
                            <p className="text-sm text-muted-foreground">{exec.task}</p>
                          </div>
                        </div>
                        <Badge variant={
                          exec.status === 'running' ? 'default' :
                          exec.status === 'completed' ? 'secondary' :
                          exec.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {exec.status}
                        </Badge>
                      </div>

                      {exec.status === 'running' && (
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span>{exec.progress}%</span>
                          </div>
                          <Progress value={exec.progress} className="h-2" />
                        </div>
                      )}

                      {exec.result && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm mb-3">
                          {exec.result}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Iniciado: {new Date(exec.startedAt).toLocaleString()}</span>
                        {exec.tokensUsed && (
                          <span>{exec.tokensUsed.toLocaleString()} tokens</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.agentId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bot className="h-5 w-5 text-violet-500" />
                    {metric.agentName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{metric.executionsToday}</p>
                      <p className="text-xs text-muted-foreground">Ejecuciones hoy</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{metric.executionsMonth}</p>
                      <p className="text-xs text-muted-foreground">Este mes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <p className="text-2xl font-bold text-green-600">{metric.successRate}%</p>
                      <p className="text-xs text-muted-foreground">Tasa de éxito</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <p className="text-2xl font-bold text-blue-600">{metric.avgExecutionTime}min</p>
                      <p className="text-xs text-muted-foreground">Tiempo promedio</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                    <p className="text-sm text-muted-foreground">Ahorro estimado</p>
                    <p className="text-xl font-bold">${metric.costSavings.toLocaleString()}/mes</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Orchestration Tab */}
        <TabsContent value="orchestration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Orquestación Multi-Agente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-violet-500/10 w-fit mx-auto mb-4">
                  <Workflow className="h-12 w-12 text-violet-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Crea Flujos de Trabajo Inteligentes</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Combina múltiples agentes IA para automatizar procesos contables complejos de principio a fin.
                </p>
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
                  <Zap className="h-4 w-4 mr-2" />
                  Crear Nuevo Flujo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Help Button & AI Agent Panel */}
      <VerticalHelpButton verticalType="ai_marketplace" />
      <VerticalAIAgentPanel verticalType="ai_marketplace" />
    </div>
  );
}

export default VerticalAccountingAIMarketplace;
