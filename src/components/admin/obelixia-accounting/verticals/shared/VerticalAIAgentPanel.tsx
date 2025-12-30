/**
 * VerticalAIAgentPanel
 * Panel de agentes autónomos especializados por vertical
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Zap, Shield, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Play, Pause, Settings,
  Activity, FileText, Calculator, BarChart3,
  RefreshCw, Eye, Target, Sparkles
} from 'lucide-react';
import { type VerticalType, VERTICAL_CONFIGS } from '@/hooks/admin/obelixia-accounting/useVerticalCopilot';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'paused' | 'learning' | 'error';
  lastRun?: Date;
  nextRun?: Date;
  actionsToday: number;
  successRate: number;
  capabilities: string[];
  autonomyLevel: 'supervised' | 'semi_autonomous' | 'autonomous';
}

interface AgentAction {
  id: string;
  agentId: string;
  action: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  confidence: number;
  createdAt: Date;
  description: string;
}

// Agentes por vertical
const VERTICAL_AGENTS: Record<VerticalType, Omit<AIAgent, 'status' | 'lastRun' | 'nextRun' | 'actionsToday' | 'successRate'>[]> = {
  agriculture: [
    { id: 'pac-agent', name: 'Agente PAC', description: 'Automatiza contabilización de ayudas PAC', icon: <FileText className="h-5 w-5" />, capabilities: ['Contabilización automática PAC', 'Alertas de plazos', 'Validación documentos'], autonomyLevel: 'semi_autonomous' },
    { id: 'campaign-agent', name: 'Agente Campañas', description: 'Gestiona cierres de campaña agrícola', icon: <TrendingUp className="h-5 w-5" />, capabilities: ['Cierre automático', 'Cálculo rendimientos', 'Comparativas'], autonomyLevel: 'supervised' },
    { id: 'cost-agent', name: 'Agente Costes', description: 'Analiza costes por parcela/cultivo', icon: <BarChart3 className="h-5 w-5" />, capabilities: ['Analítica predictiva', 'Alertas desviaciones', 'Benchmarking'], autonomyLevel: 'autonomous' },
  ],
  education: [
    { id: 'enrollment-agent', name: 'Agente Matrículas', description: 'Automatiza proceso de matrículas', icon: <FileText className="h-5 w-5" />, capabilities: ['Facturación automática', 'Descuentos', 'Recordatorios'], autonomyLevel: 'semi_autonomous' },
    { id: 'scholarship-agent', name: 'Agente Becas', description: 'Gestiona becas y ayudas', icon: <Target className="h-5 w-5" />, capabilities: ['Concesión automática', 'Renovaciones', 'Justificaciones'], autonomyLevel: 'supervised' },
    { id: 'analytics-agent', name: 'Agente Analítica', description: 'KPIs educativos y financieros', icon: <BarChart3 className="h-5 w-5" />, capabilities: ['Dashboards tiempo real', 'Predicciones', 'Alertas'], autonomyLevel: 'autonomous' },
  ],
  healthcare: [
    { id: 'billing-agent', name: 'Agente Facturación', description: 'Facturación automática a aseguradoras', icon: <Calculator className="h-5 w-5" />, capabilities: ['Factura electrónica', 'Validación códigos', 'Reclamaciones'], autonomyLevel: 'semi_autonomous' },
    { id: 'compliance-agent', name: 'Agente Compliance', description: 'Cumplimiento normativo sanitario', icon: <Shield className="h-5 w-5" />, capabilities: ['Auditorías automáticas', 'Alertas normativas', 'Documentación'], autonomyLevel: 'supervised' },
    { id: 'cost-agent', name: 'Agente Costes', description: 'Análisis costes por procedimiento', icon: <BarChart3 className="h-5 w-5" />, capabilities: ['Coste por GRD', 'Rentabilidad servicios', 'Optimización'], autonomyLevel: 'autonomous' },
  ],
  hospitality: [
    { id: 'revenue-agent', name: 'Agente Revenue', description: 'Revenue management inteligente', icon: <TrendingUp className="h-5 w-5" />, capabilities: ['Pricing dinámico', 'Forecasting', 'Channel management'], autonomyLevel: 'autonomous' },
    { id: 'fb-agent', name: 'Agente F&B', description: 'Optimización F&B costing', icon: <Calculator className="h-5 w-5" />, capabilities: ['Recetas costeadas', 'Inventario', 'Mermas'], autonomyLevel: 'semi_autonomous' },
    { id: 'ota-agent', name: 'Agente OTAs', description: 'Gestión comisiones canales', icon: <Activity className="h-5 w-5" />, capabilities: ['Conciliación automática', 'Análisis rentabilidad', 'Alertas'], autonomyLevel: 'autonomous' },
  ],
  legal: [
    { id: 'time-agent', name: 'Agente Time Tracking', description: 'Captura automática de horas', icon: <Clock className="h-5 w-5" />, capabilities: ['IA reconocimiento actividad', 'Imputación automática', 'Alertas no facturadas'], autonomyLevel: 'autonomous' },
    { id: 'billing-agent', name: 'Agente Facturación', description: 'Facturación LEDES/UTBMS', icon: <FileText className="h-5 w-5" />, capabilities: ['Generación facturas', 'Validación códigos', 'E-billing'], autonomyLevel: 'semi_autonomous' },
    { id: 'matter-agent', name: 'Agente Asuntos', description: 'Rentabilidad por expediente', icon: <BarChart3 className="h-5 w-5" />, capabilities: ['P&L automático', 'Alertas desviaciones', 'Predicciones'], autonomyLevel: 'supervised' },
  ],
  energy: [
    { id: 'carbon-agent', name: 'Agente Carbono', description: 'Huella de carbono automática', icon: <Activity className="h-5 w-5" />, capabilities: ['Cálculo emisiones', 'Reporting ESG', 'Compensaciones'], autonomyLevel: 'autonomous' },
    { id: 'trading-agent', name: 'Agente Trading', description: 'Operaciones mercado energético', icon: <TrendingUp className="h-5 w-5" />, capabilities: ['Registro operaciones', 'Mark-to-market', 'Hedging'], autonomyLevel: 'supervised' },
    { id: 'renewable-agent', name: 'Agente Renovables', description: 'Gestión certificados RECs', icon: <Zap className="h-5 w-5" />, capabilities: ['Tracking certificados', 'Valoración', 'Reporting'], autonomyLevel: 'semi_autonomous' },
  ],
  construction: [
    { id: 'cert-agent', name: 'Agente Certificaciones', description: 'Certificaciones de obra automáticas', icon: <FileText className="h-5 w-5" />, capabilities: ['Generación certificaciones', 'Validación avance', 'Alertas'], autonomyLevel: 'semi_autonomous' },
    { id: 'retention-agent', name: 'Agente Retenciones', description: 'Control retenciones de garantía', icon: <Shield className="h-5 w-5" />, capabilities: ['Seguimiento plazos', 'Alertas vencimiento', 'Liberaciones'], autonomyLevel: 'autonomous' },
    { id: 'wip-agent', name: 'Agente Obra en Curso', description: 'Valoración WIP automática', icon: <Calculator className="h-5 w-5" />, capabilities: ['Cálculo avance', 'NIIF 15', 'Análisis desviaciones'], autonomyLevel: 'supervised' },
  ],
  manufacturing: [
    { id: 'costing-agent', name: 'Agente ABC Costing', description: 'Costeo por actividades', icon: <Calculator className="h-5 w-5" />, capabilities: ['Imputación automática', 'Cost drivers', 'Análisis'], autonomyLevel: 'autonomous' },
    { id: 'variance-agent', name: 'Agente Varianzas', description: 'Análisis estándar vs real', icon: <BarChart3 className="h-5 w-5" />, capabilities: ['Cálculo varianzas', 'Alertas desviaciones', 'Drill-down'], autonomyLevel: 'autonomous' },
    { id: 'quality-agent', name: 'Agente Calidad', description: 'Costes de calidad (CoQ)', icon: <Shield className="h-5 w-5" />, capabilities: ['Tracking CoQ', 'Análisis tendencias', 'Reporting'], autonomyLevel: 'semi_autonomous' },
  ],
  logistics: [
    { id: 'fleet-agent', name: 'Agente Flota', description: 'TCO y gestión de flota', icon: <Activity className="h-5 w-5" />, capabilities: ['Cálculo TCO', 'Mantenimiento predictivo', 'Amortizaciones'], autonomyLevel: 'autonomous' },
    { id: 'customs-agent', name: 'Agente Aduanas', description: 'Operaciones import/export', icon: <FileText className="h-5 w-5" />, capabilities: ['Documentación automática', 'Aranceles', 'IVA diferido'], autonomyLevel: 'semi_autonomous' },
    { id: 'esg-agent', name: 'Agente ESG Logística', description: 'Huella carbono transporte', icon: <TrendingUp className="h-5 w-5" />, capabilities: ['Cálculo emisiones', 'Optimización rutas', 'Reporting'], autonomyLevel: 'autonomous' },
  ],
  real_estate: [
    { id: 'rental-agent', name: 'Agente Alquileres', description: 'Gestión integral alquileres', icon: <Calculator className="h-5 w-5" />, capabilities: ['Facturación automática', 'Cobros', 'Actualización IPC'], autonomyLevel: 'autonomous' },
    { id: 'community-agent', name: 'Agente Comunidades', description: 'Contabilidad comunidades', icon: <FileText className="h-5 w-5" />, capabilities: ['Cuotas', 'Derramas', 'Actas'], autonomyLevel: 'semi_autonomous' },
    { id: 'tax-agent', name: 'Agente Fiscal', description: 'IRPF rendimientos capital', icon: <Shield className="h-5 w-5" />, capabilities: ['Cálculo retenciones', 'Modelos', 'Optimización'], autonomyLevel: 'supervised' },
  ],
  retail: [
    { id: 'omni-agent', name: 'Agente Omnicanal', description: 'P&L por canal de venta', icon: <BarChart3 className="h-5 w-5" />, capabilities: ['Consolidación canales', 'Márgenes', 'Comisiones'], autonomyLevel: 'autonomous' },
    { id: 'inventory-agent', name: 'Agente Inventario', description: 'Inventario predictivo', icon: <Activity className="h-5 w-5" />, capabilities: ['Predicción demanda', 'Valoración', 'Alertas'], autonomyLevel: 'autonomous' },
    { id: 'loyalty-agent', name: 'Agente Fidelidad', description: 'Contabilidad loyalty', icon: <Target className="h-5 w-5" />, capabilities: ['Pasivo puntos', 'Provisiones', 'Análisis ROI'], autonomyLevel: 'semi_autonomous' },
  ],
  ngo: [
    { id: 'fund-agent', name: 'Agente Fund Accounting', description: 'Contabilidad por fondos', icon: <Calculator className="h-5 w-5" />, capabilities: ['Segregación fondos', 'Restricciones', 'Reporting'], autonomyLevel: 'autonomous' },
    { id: 'grant-agent', name: 'Agente Grants', description: 'Gestión subvenciones', icon: <FileText className="h-5 w-5" />, capabilities: ['Seguimiento grants', 'Justificaciones', 'Alertas plazos'], autonomyLevel: 'semi_autonomous' },
    { id: 'impact-agent', name: 'Agente Impacto', description: 'SROI y métricas impacto', icon: <Target className="h-5 w-5" />, capabilities: ['Cálculo SROI', 'Indicadores', 'Reporting'], autonomyLevel: 'supervised' },
  ],
  crypto: [
    { id: 'portfolio-agent', name: 'Agente Portfolio', description: 'Valoración cartera crypto', icon: <Activity className="h-5 w-5" />, capabilities: ['Mark-to-market', 'Cost basis', 'Gains/losses'], autonomyLevel: 'autonomous' },
    { id: 'defi-agent', name: 'Agente DeFi', description: 'Contabilidad protocolos DeFi', icon: <Zap className="h-5 w-5" />, capabilities: ['Staking', 'Lending', 'Farming'], autonomyLevel: 'supervised' },
    { id: 'tax-agent', name: 'Agente Fiscal Crypto', description: 'Fiscalidad criptomonedas', icon: <Shield className="h-5 w-5" />, capabilities: ['Modelo 721', 'Ganancias', 'Optimización'], autonomyLevel: 'semi_autonomous' },
  ],
  ai_marketplace: [
    { id: 'cost-agent', name: 'Agente Costes IA', description: 'TCO de agentes de IA', icon: <Calculator className="h-5 w-5" />, capabilities: ['Compute costs', 'Inference costs', 'Training costs'], autonomyLevel: 'autonomous' },
    { id: 'usage-agent', name: 'Agente Usage Billing', description: 'Facturación por uso', icon: <Activity className="h-5 w-5" />, capabilities: ['Metering', 'Billing', 'Reporting'], autonomyLevel: 'autonomous' },
    { id: 'roi-agent', name: 'Agente ROI', description: 'ROI de automatización', icon: <TrendingUp className="h-5 w-5" />, capabilities: ['Cálculo savings', 'Productivity gains', 'Business value'], autonomyLevel: 'semi_autonomous' },
  ],
  predictive_cashflow: [
    { id: 'forecast-agent', name: 'Agente Forecast', description: 'Predicción tesorería ML', icon: <TrendingUp className="h-5 w-5" />, capabilities: ['Forecast 90 días', 'Confidence intervals', 'Accuracy tracking'], autonomyLevel: 'autonomous' },
    { id: 'scenario-agent', name: 'Agente Escenarios', description: 'Simulación what-if', icon: <Activity className="h-5 w-5" />, capabilities: ['Monte Carlo', 'Stress testing', 'Sensitivity'], autonomyLevel: 'supervised' },
    { id: 'optimize-agent', name: 'Agente WC', description: 'Optimización working capital', icon: <Zap className="h-5 w-5" />, capabilities: ['Cash conversion', 'Payment terms', 'Collection'], autonomyLevel: 'semi_autonomous' },
  ],
};

interface VerticalAIAgentPanelProps {
  verticalType: VerticalType;
  className?: string;
}

export function VerticalAIAgentPanel({ verticalType, className }: VerticalAIAgentPanelProps) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const config = VERTICAL_CONFIGS[verticalType];

  // Inicializar agentes
  useEffect(() => {
    const baseAgents = VERTICAL_AGENTS[verticalType] || [];
    const initializedAgents: AIAgent[] = baseAgents.map(agent => ({
      ...agent,
      status: 'active',
      lastRun: new Date(Date.now() - Math.random() * 3600000),
      nextRun: new Date(Date.now() + Math.random() * 3600000),
      actionsToday: Math.floor(Math.random() * 20),
      successRate: 85 + Math.random() * 15
    }));
    setAgents(initializedAgents);

    // Simular acciones pendientes
    const actions: AgentAction[] = initializedAgents.slice(0, 2).map((agent, i) => ({
      id: `action-${i}`,
      agentId: agent.id,
      action: agent.capabilities[0],
      status: 'pending',
      confidence: 75 + Math.random() * 20,
      createdAt: new Date(Date.now() - Math.random() * 3600000),
      description: `Acción propuesta por ${agent.name}`
    }));
    setPendingActions(actions);
  }, [verticalType]);

  const toggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ));
  };

  const approveAction = (actionId: string) => {
    setPendingActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'approved' } : a
    ));
  };

  const rejectAction = (actionId: string) => {
    setPendingActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'rejected' } : a
    ));
  };

  const getStatusBadge = (status: AIAgent['status']) => {
    const styles = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      paused: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      learning: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      error: 'bg-red-500/10 text-red-600 border-red-500/20'
    };
    const labels = {
      active: 'Activo',
      paused: 'Pausado',
      learning: 'Aprendiendo',
      error: 'Error'
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getAutonomyBadge = (level: AIAgent['autonomyLevel']) => {
    const styles = {
      supervised: 'bg-slate-500/10 text-slate-600',
      semi_autonomous: 'bg-amber-500/10 text-amber-600',
      autonomous: 'bg-emerald-500/10 text-emerald-600'
    };
    const labels = {
      supervised: 'Supervisado',
      semi_autonomous: 'Semi-autónomo',
      autonomous: 'Autónomo'
    };
    return <Badge className={styles[level]}>{labels[level]}</Badge>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Agentes IA - {config.name}</h2>
            <p className="text-sm text-muted-foreground">
              {agents.filter(a => a.status === 'active').length} agentes activos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
            <Zap className="h-3 w-3 mr-1" />
            {agents.reduce((sum, a) => sum + a.actionsToday, 0)} acciones hoy
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
            {pendingActions.filter(a => a.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingActions.filter(a => a.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Agents */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {agent.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        <CardDescription className="text-xs">{agent.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={agent.status === 'active'}
                      onCheckedChange={() => toggleAgentStatus(agent.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    {getStatusBadge(agent.status)}
                    {getAutonomyBadge(agent.autonomyLevel)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tasa de éxito</span>
                      <span className="font-medium">{agent.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.successRate} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Acciones hoy</p>
                      <p className="font-medium">{agent.actionsToday}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Próx. ejecución</p>
                      <p className="font-medium">
                        {agent.nextRun ? formatDistanceToNow(agent.nextRun, { locale: es, addSuffix: true }) : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 2).map((cap, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{cap}</Badge>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <Badge variant="outline" className="text-[10px]">+{agent.capabilities.length - 2}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver logs
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Pending */}
        <TabsContent value="pending" className="space-y-4">
          {pendingActions.filter(a => a.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                <p className="font-medium">No hay acciones pendientes</p>
                <p className="text-sm text-muted-foreground">Los agentes están operando de forma autónoma</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingActions.filter(a => a.status === 'pending').map((action) => {
                const agent = agents.find(a => a.id === action.agentId);
                return (
                  <Card key={action.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/10">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">{action.action}</p>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{agent?.name}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Confianza: {action.confidence.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600"
                            onClick={() => rejectAction(action.id)}
                          >
                            Rechazar
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => approveAction(action.id)}
                          >
                            Aprobar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: History */}
        <TabsContent value="history">
          <Card>
            <CardContent className="py-8 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Historial de acciones próximamente</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
