import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, Clock, AlertTriangle, CheckCircle, TrendingUp,
  MessageSquare, Phone, BarChart3, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SLAConfig {
  id: string;
  name: string;
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'web' | 'all';
  firstResponseMinutes: number;
  resolutionMinutes: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface AgentMetrics {
  id: string;
  name: string;
  avatar?: string;
  activeConversations: number;
  resolvedToday: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
  csat: number;
  channels: string[];
}

interface ChannelMetrics {
  channel: string;
  totalConversations: number;
  openConversations: number;
  avgWaitTime: number;
  avgResponseTime: number;
  slaCompliance: number;
  csat: number;
}

interface MultichannelSLADashboardProps {
  slaConfigs: SLAConfig[];
  agentMetrics: AgentMetrics[];
  channelMetrics: ChannelMetrics[];
  globalMetrics: {
    totalOpen: number;
    totalResolved: number;
    avgWaitTime: number;
    avgResponseTime: number;
    slaCompliance: number;
    csat: number;
  };
  onUpdateSLA?: (config: SLAConfig) => void;
}

export function MultichannelSLADashboard({
  slaConfigs,
  agentMetrics,
  channelMetrics,
  globalMetrics,
  onUpdateSLA
}: MultichannelSLADashboardProps) {
  const [periodFilter, setPeriodFilter] = useState('today');

  const getSlaColor = (compliance: number) => {
    if (compliance >= 90) return 'text-green-500';
    if (compliance >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">SLAs y Métricas Multicanal</h2>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Abiertas</p>
            <p className="text-2xl font-bold">{globalMetrics.totalOpen}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Resueltas</p>
            <p className="text-2xl font-bold text-green-600">{globalMetrics.totalResolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Tiempo Espera</p>
            <p className="text-2xl font-bold">{formatTime(globalMetrics.avgWaitTime)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Tiempo Respuesta</p>
            <p className="text-2xl font-bold">{formatTime(globalMetrics.avgResponseTime)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">SLA Cumplido</p>
            <p className={cn("text-2xl font-bold", getSlaColor(globalMetrics.slaCompliance))}>
              {globalMetrics.slaCompliance}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">CSAT</p>
            <p className="text-2xl font-bold">{globalMetrics.csat.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {channelMetrics.map((channel) => (
              <Card key={channel.channel} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5" />
                    <h4 className="font-medium capitalize">{channel.channel}</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Abiertas</span>
                      <span className="font-medium">{channel.openConversations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiempo Resp.</span>
                      <span className="font-medium">{formatTime(channel.avgResponseTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SLA</span>
                      <span className={cn("font-medium", getSlaColor(channel.slaCompliance))}>
                        {channel.slaCompliance}%
                      </span>
                    </div>
                    <Progress value={channel.slaCompliance} className="h-1.5 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rendimiento de Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Agente</th>
                  <th className="text-center py-2">Activas</th>
                  <th className="text-center py-2">Resueltas</th>
                  <th className="text-center py-2">T. Respuesta</th>
                  <th className="text-center py-2">SLA</th>
                  <th className="text-center py-2">CSAT</th>
                </tr>
              </thead>
              <tbody>
                {agentMetrics.map((agent) => (
                  <tr key={agent.id} className="border-b hover:bg-muted/30">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="text-center">{agent.activeConversations}</td>
                    <td className="text-center text-green-600">{agent.resolvedToday}</td>
                    <td className="text-center">{formatTime(agent.avgResponseTime)}</td>
                    <td className="text-center">
                      <span className={cn("font-medium", getSlaColor(agent.slaCompliance))}>
                        {agent.slaCompliance}%
                      </span>
                    </td>
                    <td className="text-center">{agent.csat.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
