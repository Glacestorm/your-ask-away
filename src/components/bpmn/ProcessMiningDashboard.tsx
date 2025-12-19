import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3, 
  GitBranch,
  RefreshCw,
  Download
} from 'lucide-react';
import { useProcessEvents } from '@/hooks/useProcessEvents';
import { useProcessDefinitions } from '@/hooks/useProcessDefinitions';
import { useSLATracking } from '@/hooks/useSLATracking';
import { ProcessFlowVisualization } from './ProcessFlowVisualization';
import { BottleneckAnalysis } from './BottleneckAnalysis';
import { SLADashboard } from './SLADashboard';
import { ProcessVariantsChart } from './ProcessVariantsChart';
import type { ProcessEventEntityType, BPMNEntityType } from '@/types/bpmn';

interface ProcessMiningDashboardProps {
  entityType?: ProcessEventEntityType;
}

export function ProcessMiningDashboard({ entityType }: ProcessMiningDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
  
  const dateFrom = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }, [selectedPeriod]);

  // Convert ProcessEventEntityType to BPMNEntityType for definitions hook
  const bpmnEntityType = useMemo((): BPMNEntityType | undefined => {
    if (!entityType) return undefined;
    // Map compatible types
    const compatibleTypes: ProcessEventEntityType[] = ['opportunity', 'company', 'visit', 'task', 'quote', 'invoice', 'workflow'];
    if (compatibleTypes.includes(entityType)) {
      return entityType as BPMNEntityType;
    }
    return 'custom';
  }, [entityType]);

  const { 
    events, 
    isLoading: eventsLoading, 
    miningStats, 
    fetchMiningStats,
    bottlenecks,
    fetchBottlenecks,
    refetch: refetchEvents
  } = useProcessEvents({ 
    entityType, 
    dateFrom,
    limit: 1000 
  });

  const { definitions } = useProcessDefinitions({ entityType: bpmnEntityType, activeOnly: true });
  
  const { 
    violations, 
    complianceStats, 
    fetchComplianceStats,
    refetch: refetchSLA 
  } = useSLATracking({ 
    processDefinitionId: selectedDefinition || undefined 
  });

  useEffect(() => {
    fetchMiningStats();
    fetchBottlenecks();
    fetchComplianceStats();
  }, [selectedPeriod, entityType, fetchMiningStats, fetchBottlenecks, fetchComplianceStats]);

  const handleRefresh = () => {
    refetchEvents();
    fetchMiningStats();
    fetchBottlenecks();
    fetchComplianceStats();
    refetchSLA();
  };

  // Calculate summary metrics
  const totalEvents = events.length;
  const uniqueEntities = new Set(events.map(e => e.entity_id)).size;
  const avgEventsPerEntity = uniqueEntities > 0 ? (totalEvents / uniqueEntities).toFixed(1) : '0';
  
  const actionCounts = events.reduce((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Process Mining</h2>
          <p className="text-muted-foreground">
            Análisis de procesos y detección de cuellos de botella
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedDefinition || 'all'} 
            onValueChange={(v) => setSelectedDefinition(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los procesos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los procesos</SelectItem>
              {definitions.map(def => (
                <SelectItem key={def.id} value={def.id}>
                  {def.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Eventos
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {avgEventsPerEntity} promedio por entidad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entidades Únicas
            </CardTitle>
            <GitBranch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEntities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              casos procesados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Violaciones SLA
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {complianceStats?.breached || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceStats?.atRisk || 0} en riesgo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {miningStats && typeof miningStats === 'object' && 'avg_duration_hours' in miningStats
                ? `${Math.round(Number(miningStats.avg_duration_hours))}h`
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              duración de proceso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Acciones más Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topActions.map(([action, count]) => {
              const percentage = (count / totalEvents) * 100;
              return (
                <div key={action} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{action}</span>
                    <span className="text-muted-foreground">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {topActions.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No hay eventos en el período seleccionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="flow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Flujo de Proceso
          </TabsTrigger>
          <TabsTrigger value="bottlenecks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cuellos de Botella
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            SLA Tracking
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Variantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow">
          <ProcessFlowVisualization 
            events={events}
            selectedDefinition={selectedDefinition}
          />
        </TabsContent>

        <TabsContent value="bottlenecks">
          <BottleneckAnalysis 
            bottlenecks={bottlenecks}
            events={events}
          />
        </TabsContent>

        <TabsContent value="sla">
          <SLADashboard 
            violations={violations}
            complianceStats={complianceStats}
            definitions={definitions}
          />
        </TabsContent>

        <TabsContent value="variants">
          <ProcessVariantsChart events={events} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
