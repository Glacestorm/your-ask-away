/**
 * EnterpriseActivityFeed
 * Feed de actividad empresarial en tiempo real
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Activity,
  RefreshCw,
  User,
  Settings,
  Database,
  Shield,
  Zap,
  FileText,
  Bot,
  TrendingUp,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ActivityItem {
  id: string;
  type: 'user' | 'system' | 'ai' | 'compliance' | 'workflow' | 'alert' | 'data';
  action: string;
  description: string;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  target?: string;
  result?: 'success' | 'failure' | 'pending';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface EnterpriseActivityFeedProps {
  activities?: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onRefresh?: () => void;
  className?: string;
}

const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'ai',
    action: 'Predicción de churn ejecutada',
    description: 'Revenue AI Agent identificó 5 clientes en riesgo alto',
    result: 'success',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    type: 'user',
    action: 'Exportación de reporte',
    description: 'Reporte Q4 exportado en formato PDF',
    user: { name: 'Carlos Martín', role: 'Director Comercial' },
    result: 'success',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    type: 'compliance',
    action: 'Escaneo de compliance completado',
    description: '156 reglas verificadas, 3 advertencias detectadas',
    result: 'success',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    type: 'workflow',
    action: 'Workflow de onboarding completado',
    description: '8 nuevos usuarios activados automáticamente',
    result: 'success',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    type: 'system',
    action: 'Backup automático',
    description: 'Backup completo de base de datos (2.3 GB)',
    result: 'success',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    type: 'alert',
    action: 'Alerta resuelta',
    description: 'CPU normalizada tras optimización automática',
    user: { name: 'Sistema AI', role: 'Auto-healing' },
    result: 'success',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString()
  },
  {
    id: '7',
    type: 'data',
    action: 'Sincronización CRM',
    description: '1,247 registros sincronizados con Salesforce',
    result: 'success',
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString()
  },
  {
    id: '8',
    type: 'ai',
    action: 'Insights generados',
    description: 'Business Intelligence generó 12 nuevos insights',
    result: 'success',
    timestamp: new Date(Date.now() - 68 * 60 * 1000).toISOString()
  }
];

const typeConfig = {
  user: {
    icon: User,
    color: 'bg-blue-500',
    label: 'Usuario'
  },
  system: {
    icon: Settings,
    color: 'bg-gray-500',
    label: 'Sistema'
  },
  ai: {
    icon: Bot,
    color: 'bg-purple-500',
    label: 'IA'
  },
  compliance: {
    icon: Shield,
    color: 'bg-green-500',
    label: 'Compliance'
  },
  workflow: {
    icon: Zap,
    color: 'bg-orange-500',
    label: 'Workflow'
  },
  alert: {
    icon: Bell,
    color: 'bg-red-500',
    label: 'Alerta'
  },
  data: {
    icon: Database,
    color: 'bg-cyan-500',
    label: 'Datos'
  }
};

const resultIcons = {
  success: <CheckCircle className="h-3 w-3 text-green-500" />,
  failure: <XCircle className="h-3 w-3 text-destructive" />,
  pending: <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
};

export function EnterpriseActivityFeed({ 
  activities = defaultActivities,
  loading = false,
  maxItems = 20,
  onRefresh,
  className 
}: EnterpriseActivityFeedProps) {
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredActivities = filterType 
    ? activities.filter(a => a.type === filterType)
    : activities;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Actividad Enterprise</CardTitle>
              <p className="text-xs text-muted-foreground">
                Últimas {filteredActivities.length} actividades
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setFilterType(filterType ? null : 'ai')}
              className={cn("h-8 w-8", filterType === 'ai' && "bg-purple-100 dark:bg-purple-900/30")}
              title="Filtrar IA"
            >
              <Bot className="h-4 w-4" />
            </Button>
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {filteredActivities.slice(0, maxItems).map((activity) => {
                const config = typeConfig[activity.type];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={activity.id} 
                    className="p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon/Avatar */}
                      {activity.user ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn(config.color, "text-white text-xs")}>
                            {activity.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          config.color
                        )}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">{activity.action}</span>
                          {activity.result && resultIcons[activity.result]}
                        </div>
                        
                        {/* Description */}
                        <p className="text-xs text-muted-foreground mb-1">
                          {activity.description}
                        </p>
                        
                        {/* Footer */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {config.label}
                          </Badge>
                          {activity.user && (
                            <>
                              <span>•</span>
                              <span>{activity.user.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(activity.timestamp), { 
                              locale: es, 
                              addSuffix: true 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EnterpriseActivityFeed;
