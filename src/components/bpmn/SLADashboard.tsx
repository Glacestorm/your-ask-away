import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Bell,
  ArrowUpRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SLAViolation, ProcessDefinition } from '@/types/bpmn';

interface ComplianceStats {
  total: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  complianceRate: number;
  atRiskRate: number;
  breachRate: number;
}

interface SLADashboardProps {
  violations: SLAViolation[];
  complianceStats: ComplianceStats | undefined;
  definitions: ProcessDefinition[];
}

export function SLADashboard({ violations, complianceStats, definitions }: SLADashboardProps) {
  const activeViolations = violations.filter(v => !v.resolved_at);
  const resolvedViolations = violations.filter(v => v.resolved_at);

  const complianceRate = complianceStats?.complianceRate ?? 100;

  return (
    <div className="space-y-6">
      {/* SLA Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {violations.length}
                </div>
                <p className="text-sm text-muted-foreground">Total violaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {activeViolations.length}
                </div>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {resolvedViolations.length}
                </div>
                <p className="text-sm text-muted-foreground">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cumplimiento SLA</span>
                <span className="font-bold">{complianceRate.toFixed(1)}%</span>
              </div>
              <Progress value={complianceRate} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Violations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Violaciones Activas
          </CardTitle>
          <Badge variant="destructive">{activeViolations.length}</Badge>
        </CardHeader>
        <CardContent>
          {activeViolations.length > 0 ? (
            <div className="space-y-3">
              {activeViolations.map(violation => {
                const definition = definitions.find(d => d.id === violation.process_definition_id);
                return (
                  <div 
                    key={violation.id}
                    className="p-4 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {violation.violation_type}
                          <Badge variant="destructive">Nivel {violation.escalation_level}</Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {definition?.name || 'Proceso'} • Nodo: {violation.node_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Excedido: {violation.exceeded_by || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(violation.created_at), { 
                            addSuffix: true,
                            locale: es 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline">
                        Escalación nivel {violation.escalation_level}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Ver detalles
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">
                No hay violaciones SLA activas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SLA Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración SLA por Proceso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {definitions.filter(d => d.sla_config && Object.keys(d.sla_config).length > 0).map(def => (
              <div 
                key={def.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <span className="font-medium">{def.name}</span>
                  <p className="text-xs text-muted-foreground">{def.entity_type}</p>
                </div>
                <Badge variant="secondary">
                  {Object.keys(def.sla_config).length} nodos configurados
                </Badge>
              </div>
            ))}
            {definitions.filter(d => d.sla_config && Object.keys(d.sla_config).length > 0).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No hay configuraciones SLA definidas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
