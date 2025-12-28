/**
 * ModuleResourceMetricsPanel - CPU, Memoria, Disco detallado por módulo
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network, 
  RefreshCw,
  Activity,
  Thermometer,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleResourceMetricsPanelProps {
  className?: string;
}

interface ModuleResources {
  moduleKey: string;
  moduleName: string;
  cpu: {
    usage: number;
    cores: number;
    trend: 'up' | 'down' | 'stable';
    peak: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  disk: {
    read: number;
    write: number;
    iops: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
  };
  status: 'optimal' | 'warning' | 'critical';
}

// Generate mock resource data
function generateMockResources(): ModuleResources[] {
  return [
    {
      moduleKey: 'crm',
      moduleName: 'CRM Core',
      cpu: { usage: 32, cores: 4, trend: 'stable', peak: 45 },
      memory: { used: 512, total: 2048, percentage: 25, trend: 'stable' },
      disk: { read: 45, write: 12, iops: 120 },
      network: { inbound: 25, outbound: 18, connections: 145 },
      status: 'optimal'
    },
    {
      moduleKey: 'analytics',
      moduleName: 'Analytics Suite',
      cpu: { usage: 58, cores: 8, trend: 'up', peak: 72 },
      memory: { used: 1536, total: 4096, percentage: 37.5, trend: 'up' },
      disk: { read: 120, write: 45, iops: 350 },
      network: { inbound: 85, outbound: 120, connections: 89 },
      status: 'optimal'
    },
    {
      moduleKey: 'ai-copilot',
      moduleName: 'AI Copilot',
      cpu: { usage: 78, cores: 16, trend: 'up', peak: 95 },
      memory: { used: 6144, total: 8192, percentage: 75, trend: 'up' },
      disk: { read: 250, write: 180, iops: 800 },
      network: { inbound: 200, outbound: 350, connections: 234 },
      status: 'warning'
    },
    {
      moduleKey: 'marketplace',
      moduleName: 'Marketplace',
      cpu: { usage: 22, cores: 2, trend: 'down', peak: 35 },
      memory: { used: 256, total: 1024, percentage: 25, trend: 'stable' },
      disk: { read: 15, write: 8, iops: 50 },
      network: { inbound: 12, outbound: 8, connections: 45 },
      status: 'optimal'
    }
  ];
}

export function ModuleResourceMetricsPanel({ className }: ModuleResourceMetricsPanelProps) {
  const [resources, setResources] = useState<ModuleResources[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setResources(generateMockResources());
    setLastRefresh(new Date());
    
    const interval = setInterval(() => {
      setResources(generateMockResources());
      setLastRefresh(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setResources(generateMockResources());
      setLastRefresh(new Date());
      setIsLoading(false);
    }, 500);
  };

  const getStatusColor = (status: ModuleResources['status']) => {
    switch (status) {
      case 'optimal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-destructive';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-destructive';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-yellow-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      case 'stable': return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const formatBytes = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  // Calculate totals
  const totals = resources.reduce((acc, r) => ({
    cpu: acc.cpu + r.cpu.usage,
    memory: acc.memory + r.memory.used,
    memoryTotal: acc.memoryTotal + r.memory.total,
    connections: acc.connections + r.network.connections,
    iops: acc.iops + r.disk.iops,
  }), { cpu: 0, memory: 0, memoryTotal: 0, connections: 0, iops: 0 });

  const avgCpu = resources.length > 0 ? Math.round(totals.cpu / resources.length) : 0;
  const memoryPercentage = totals.memoryTotal > 0 ? Math.round((totals.memory / totals.memoryTotal) * 100) : 0;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Recursos del Sistema</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Cargando...'
                }
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-3 rounded-lg bg-muted/50 border text-center">
            <Cpu className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className={cn("text-xl font-bold", getUsageColor(avgCpu))}>{avgCpu}%</p>
            <p className="text-[10px] text-muted-foreground">CPU Promedio</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border text-center">
            <MemoryStick className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className={cn("text-xl font-bold", getUsageColor(memoryPercentage))}>{memoryPercentage}%</p>
            <p className="text-[10px] text-muted-foreground">Memoria</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border text-center">
            <Network className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{totals.connections}</p>
            <p className="text-[10px] text-muted-foreground">Conexiones</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border text-center">
            <HardDrive className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold">{totals.iops}</p>
            <p className="text-[10px] text-muted-foreground">IOPS Total</p>
          </div>
        </div>

        {/* Module Resource Details */}
        <ScrollArea className="h-[320px]">
          <div className="space-y-3">
            {resources.map((module) => (
              <div 
                key={module.moduleKey}
                className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", getStatusColor(module.status))} />
                    <span className="font-medium">{module.moduleName}</span>
                  </div>
                  <Badge 
                    variant={module.status === 'optimal' ? 'default' : module.status === 'warning' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {module.status === 'optimal' ? 'Óptimo' : module.status === 'warning' ? 'Advertencia' : 'Crítico'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* CPU */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Cpu className="h-3 w-3" /> CPU
                      </span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(module.cpu.trend)}
                        <span className={getUsageColor(module.cpu.usage)}>{module.cpu.usage}%</span>
                      </div>
                    </div>
                    <Progress value={module.cpu.usage} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      {module.cpu.cores} cores | Peak: {module.cpu.peak}%
                    </p>
                  </div>

                  {/* Memory */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MemoryStick className="h-3 w-3" /> RAM
                      </span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(module.memory.trend)}
                        <span className={getUsageColor(module.memory.percentage)}>{module.memory.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={module.memory.percentage} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(module.memory.used)} / {formatBytes(module.memory.total)}
                    </p>
                  </div>

                  {/* Disk */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <HardDrive className="h-3 w-3" /> Disco
                      </span>
                      <span>{module.disk.iops} IOPS</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>↓ Read</span>
                        <span>{module.disk.read} MB/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>↑ Write</span>
                        <span>{module.disk.write} MB/s</span>
                      </div>
                    </div>
                  </div>

                  {/* Network */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Network className="h-3 w-3" /> Red
                      </span>
                      <span>{module.network.connections} conn</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>↓ In</span>
                        <span>{module.network.inbound} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>↑ Out</span>
                        <span>{module.network.outbound} Mbps</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ModuleResourceMetricsPanel;
