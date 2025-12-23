/**
 * Session Summary Card Component
 * Displays a compact summary of a session's key metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface SessionSummaryCardProps {
  totalActions: number;
  totalDuration: string;
  highRiskActions: number;
  pendingApprovals: number;
  completedActions: number;
  actionsByType: Record<string, number>;
}

export function SessionSummaryCard({
  totalActions,
  totalDuration,
  highRiskActions,
  pendingApprovals,
  completedActions,
  actionsByType,
}: SessionSummaryCardProps) {
  const completionRate = totalActions > 0 
    ? Math.round((completedActions / totalActions) * 100) 
    : 0;

  const riskRate = totalActions > 0 
    ? Math.round((highRiskActions / totalActions) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Resumen de Sesión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-3 w-3" />
              Acciones
            </div>
            <div className="text-2xl font-bold">{totalActions}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Duración
            </div>
            <div className="text-2xl font-bold">{totalDuration}</div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Completadas
            </span>
            <span className="text-muted-foreground">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Risk Distribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              Alto Riesgo
            </span>
            <span className="text-muted-foreground">{riskRate}%</span>
          </div>
          <Progress 
            value={riskRate} 
            className="h-2 [&>div]:bg-orange-500" 
          />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {highRiskActions > 0 && (
            <Badge variant="destructive" className="bg-orange-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {highRiskActions} alto riesgo
            </Badge>
          )}
          {pendingApprovals > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <Shield className="h-3 w-3 mr-1" />
              {pendingApprovals} pendientes
            </Badge>
          )}
          {pendingApprovals === 0 && totalActions > 0 && (
            <Badge variant="secondary">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Todo aprobado
            </Badge>
          )}
        </div>

        {/* Action Types */}
        {Object.keys(actionsByType).length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Tipos de acción</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(actionsByType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type.replace('_', ' ')}: {count}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
