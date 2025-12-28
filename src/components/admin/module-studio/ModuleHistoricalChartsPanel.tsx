/**
 * ModuleHistoricalChartsPanel - Gráficos históricos de health y performance
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  RefreshCw, 
  Activity, 
  Clock, 
  Cpu,
  HardDrive,
  Zap,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

interface ModuleHistoricalChartsPanelProps {
  moduleKey?: string;
  className?: string;
}

// Generate mock historical data
function generateHistoricalData(hours: number, moduleKey?: string) {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseHealth = 95 + Math.random() * 5;
    const baseResponseTime = 100 + Math.random() * 80;
    const baseCpu = 20 + Math.random() * 40;
    const baseMemory = 30 + Math.random() * 35;
    
    data.push({
      time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      fullTime: time.toISOString(),
      health: Math.round(baseHealth * 10) / 10,
      responseTime: Math.round(baseResponseTime),
      cpu: Math.round(baseCpu),
      memory: Math.round(baseMemory),
      requests: Math.round(50 + Math.random() * 200),
      errors: Math.floor(Math.random() * 5),
      uptime: 99 + Math.random() * 1,
    });
  }
  
  return data;
}

export function ModuleHistoricalChartsPanel({ 
  moduleKey, 
  className 
}: ModuleHistoricalChartsPanelProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('health');

  const hours = useMemo(() => {
    switch (timeRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '24h': return 24;
      case '7d': return 168;
      default: return 24;
    }
  }, [timeRange]);

  const historicalData = useMemo(() => {
    return generateHistoricalData(hours, moduleKey);
  }, [hours, moduleKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Calculate averages
  const averages = useMemo(() => {
    if (historicalData.length === 0) return null;
    const sum = historicalData.reduce((acc, d) => ({
      health: acc.health + d.health,
      responseTime: acc.responseTime + d.responseTime,
      cpu: acc.cpu + d.cpu,
      memory: acc.memory + d.memory,
      requests: acc.requests + d.requests,
      errors: acc.errors + d.errors,
    }), { health: 0, responseTime: 0, cpu: 0, memory: 0, requests: 0, errors: 0 });
    
    const count = historicalData.length;
    return {
      health: Math.round(sum.health / count * 10) / 10,
      responseTime: Math.round(sum.responseTime / count),
      cpu: Math.round(sum.cpu / count),
      memory: Math.round(sum.memory / count),
      requests: Math.round(sum.requests),
      errors: Math.round(sum.errors / count * 10) / 10,
    };
  }, [historicalData]);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Métricas Históricas</CardTitle>
              <p className="text-xs text-muted-foreground">
                Tendencias de rendimiento y salud
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="6h">6 horas</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 días</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Summary Stats */}
        {averages && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <Activity className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{averages.health}%</p>
              <p className="text-[10px] text-muted-foreground">Health Avg</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-bold">{averages.responseTime}ms</p>
              <p className="text-[10px] text-muted-foreground">Response Avg</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <Cpu className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{averages.cpu}%</p>
              <p className="text-[10px] text-muted-foreground">CPU Avg</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <HardDrive className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold">{averages.memory}%</p>
              <p className="text-[10px] text-muted-foreground">Memory Avg</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{averages.requests}</p>
              <p className="text-[10px] text-muted-foreground">Requests/h</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 border text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold">{averages.errors}</p>
              <p className="text-[10px] text-muted-foreground">Errors Avg</p>
            </div>
          </div>
        )}

        <Tabs value={activeMetric} onValueChange={setActiveMetric}>
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="health" className="text-xs">Health</TabsTrigger>
            <TabsTrigger value="response" className="text-xs">Response</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">Recursos</TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs">Tráfico</TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[80, 100]} 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="health" 
                    stroke="hsl(var(--chart-1))" 
                    fill="url(#healthGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="response" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={false}
                    name="Response Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="hsl(var(--chart-3))" 
                    fill="url(#cpuGradient)"
                    strokeWidth={2}
                    name="CPU %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="hsl(var(--chart-4))" 
                    fill="url(#memoryGradient)"
                    strokeWidth={2}
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="mt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="requests" fill="hsl(var(--chart-1))" name="Requests" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="errors" fill="hsl(var(--destructive))" name="Errors" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleHistoricalChartsPanel;
