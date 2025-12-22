import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Brain,
  Target,
  TrendingUp,
  Clock,
  Star,
  Settings,
  RefreshCw,
  BarChart3,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  activeLeads: number;
  maxCapacity: number;
  specializations: string[];
  performanceScore: number;
  avgResponseTime: number;
  conversionRate: number;
  isAvailable: boolean;
  currentWorkload: number;
}

export interface DistributionRule {
  id: string;
  name: string;
  type: 'round_robin' | 'workload' | 'performance' | 'specialization' | 'hybrid';
  weight: number;
  isActive: boolean;
}

export interface DistributionStats {
  totalDistributed: number;
  avgAssignmentTime: number;
  balanceScore: number;
  performanceImpact: number;
}

interface IntelligentLeadDistributionProps {
  agents: Agent[];
  rules: DistributionRule[];
  stats: DistributionStats;
  onUpdateRule?: (ruleId: string, updates: Partial<DistributionRule>) => void;
  onDistributeNow?: () => void;
  onUpdateAgentCapacity?: (agentId: string, capacity: number) => void;
}

export const IntelligentLeadDistribution: React.FC<IntelligentLeadDistributionProps> = ({
  agents,
  rules,
  stats,
  onUpdateRule,
  onDistributeNow,
  onUpdateAgentCapacity
}) => {
  const [distributionMode, setDistributionMode] = useState<'auto' | 'manual'>('auto');
  const [selectedTab, setSelectedTab] = useState('overview');

  const getWorkloadColor = (workload: number) => {
    if (workload < 50) return 'text-green-500';
    if (workload < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getWorkloadBg = (workload: number) => {
    if (workload < 50) return 'bg-green-500';
    if (workload < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const totalCapacity = agents.reduce((acc, a) => acc + a.maxCapacity, 0);
  const totalActive = agents.reduce((acc, a) => acc + a.activeLeads, 0);
  const avgWorkload = totalCapacity > 0 ? (totalActive / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Distribución Inteligente</h2>
          <p className="text-muted-foreground">
            Asignación automática de leads basada en IA
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Modo:</Label>
            <Select value={distributionMode} onValueChange={(v: 'auto' | 'manual') => setDistributionMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onDistributeNow} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Redistribuir Ahora
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Distribuidos</p>
                <p className="text-2xl font-bold">{stats.totalDistributed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">{stats.avgAssignmentTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Score</p>
                <p className="text-2xl font-bold">{stats.balanceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impacto Rendimiento</p>
                <p className="text-2xl font-bold">+{stats.performanceImpact}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Carga de Trabajo del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Carga promedio</span>
                  <span className={`font-bold ${getWorkloadColor(avgWorkload)}`}>
                    {avgWorkload.toFixed(0)}%
                  </span>
                </div>
                <Progress value={avgWorkload} className="h-3" />
                
                <div className="space-y-3 mt-6">
                  {agents.slice(0, 5).map(agent => (
                    <div key={agent.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {agent.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{agent.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {agent.activeLeads}/{agent.maxCapacity}
                          </span>
                        </div>
                        <Progress 
                          value={agent.currentWorkload} 
                          className="h-1.5"
                        />
                      </div>
                      {agent.isAvailable ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribution Algorithm */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Algoritmo de Distribución
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={rule.isActive}
                        onCheckedChange={(checked) => onUpdateRule?.(rule.id, { isActive: checked })}
                      />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Peso: {rule.weight}%
                        </p>
                      </div>
                    </div>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.type === 'round_robin' && 'Round Robin'}
                      {rule.type === 'workload' && 'Por Carga'}
                      {rule.type === 'performance' && 'Por Rendimiento'}
                      {rule.type === 'specialization' && 'Por Especialización'}
                      {rule.type === 'hybrid' && 'Híbrido IA'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents.map(agent => (
                  <div key={agent.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{agent.name}</h4>
                            <Badge variant={agent.isAvailable ? 'default' : 'secondary'}>
                              {agent.isAvailable ? 'Disponible' : 'Ocupado'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agent.specializations.map((spec, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{agent.performanceScore}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                          <span className="font-bold">{agent.avgResponseTime}m</span>
                          <p className="text-xs text-muted-foreground">Resp. Avg</p>
                        </div>
                        <div className="text-center">
                          <span className="font-bold">{agent.conversionRate}%</span>
                          <p className="text-xs text-muted-foreground">Conversión</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Capacidad Máxima: {agent.maxCapacity} leads</Label>
                        <span className="text-sm text-muted-foreground">
                          Actual: {agent.activeLeads}
                        </span>
                      </div>
                      <Slider
                        value={[agent.maxCapacity]}
                        onValueChange={(v) => onUpdateAgentCapacity?.(agent.id, v[0])}
                        max={50}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Reglas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {rules.map(rule => (
                  <div key={rule.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={rule.isActive}
                          onCheckedChange={(checked) => onUpdateRule?.(rule.id, { isActive: checked })}
                        />
                        <div>
                          <h4 className="font-semibold">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rule.type === 'round_robin' && 'Distribuye leads de forma equitativa entre agentes'}
                            {rule.type === 'workload' && 'Prioriza agentes con menor carga de trabajo'}
                            {rule.type === 'performance' && 'Prioriza agentes con mejor rendimiento'}
                            {rule.type === 'specialization' && 'Asigna según especialización del agente'}
                            {rule.type === 'hybrid' && 'Combina todos los factores usando IA'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Peso: {rule.weight}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>Peso en la decisión</Label>
                      <Slider
                        value={[rule.weight]}
                        onValueChange={(v) => onUpdateRule?.(rule.id, { weight: v[0] })}
                        max={100}
                        min={0}
                        step={5}
                        disabled={!rule.isActive}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
