import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, RefreshCw, Database, Shield, FileCheck, Activity, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

interface EvidenceCollectorProps {
  sectorKey: string;
}

interface EvidenceType {
  id: string;
  name: string;
  icon: React.ReactNode;
  table: string;
  description: string;
}

const EVIDENCE_TYPES: EvidenceType[] = [
  { id: 'audit_logs', name: 'Logs de Auditoría', icon: <Database className="h-4 w-4" />, table: 'audit_logs', description: 'Registro de todas las acciones en el sistema' },
  { id: 'security_incidents', name: 'Incidentes de Seguridad', icon: <AlertTriangle className="h-4 w-4" />, table: 'security_incidents', description: 'Incidentes detectados y gestionados' },
  { id: 'backup_verifications', name: 'Verificaciones Backup', icon: <FileCheck className="h-4 w-4" />, table: 'backup_verifications', description: 'Pruebas de restauración de backups' },
  { id: 'risk_assessments', name: 'Evaluaciones de Riesgo', icon: <Shield className="h-4 w-4" />, table: 'risk_assessments', description: 'Análisis de riesgos realizados' },
  { id: 'resilience_tests', name: 'Tests de Resiliencia', icon: <Activity className="h-4 w-4" />, table: 'resilience_tests', description: 'Pruebas de continuidad y resiliencia' },
  { id: 'stress_tests', name: 'Stress Tests', icon: <Activity className="h-4 w-4" />, table: 'stress_test_executions', description: 'Ejecuciones de pruebas de estrés' },
];

export function EvidenceCollector({ sectorKey }: EvidenceCollectorProps) {
  const [periodStart, setPeriodStart] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [collecting, setCollecting] = useState<string | null>(null);

  const { data: collectedEvidence, isLoading, refetch } = useQuery({
    queryKey: ['audit-evidence', periodStart, periodEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_evidence')
        .select('*')
        .gte('evidence_period_start', periodStart)
        .lte('evidence_period_end', periodEnd)
        .order('collected_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: evidenceCounts } = useQuery({
    queryKey: ['evidence-counts', periodStart, periodEnd],
    queryFn: async () => {
      const counts: Record<string, number> = {};

      for (const type of EVIDENCE_TYPES) {
        try {
          let query = supabase.from(type.table as any).select('*', { count: 'exact', head: true });
          
          // Different date columns for different tables
          if (type.table === 'audit_logs') {
            query = query.gte('created_at', periodStart).lte('created_at', periodEnd);
          } else if (type.table === 'backup_verifications') {
            query = query.gte('verification_date', periodStart).lte('verification_date', periodEnd);
          } else if (type.table === 'risk_assessments') {
            query = query.gte('assessment_date', periodStart).lte('assessment_date', periodEnd);
          } else if (type.table === 'resilience_tests') {
            query = query.gte('test_date', periodStart).lte('test_date', periodEnd);
          } else if (type.table === 'stress_test_executions') {
            query = query.gte('execution_start', periodStart).lte('execution_start', periodEnd);
          } else {
            query = query.gte('created_at', periodStart).lte('created_at', periodEnd);
          }

          const { count } = await query;
          counts[type.id] = count || 0;
        } catch (e) {
          counts[type.id] = 0;
        }
      }

      return counts;
    },
  });

  const collectEvidence = async (evidenceType: EvidenceType) => {
    setCollecting(evidenceType.id);
    try {
      let data: any[] = [];
      let query = supabase.from(evidenceType.table as any).select('*');

      // Different date columns for different tables
      if (evidenceType.table === 'audit_logs') {
        query = query.gte('created_at', periodStart).lte('created_at', periodEnd).limit(1000);
      } else if (evidenceType.table === 'backup_verifications') {
        query = query.gte('verification_date', periodStart).lte('verification_date', periodEnd);
      } else if (evidenceType.table === 'risk_assessments') {
        query = query.gte('assessment_date', periodStart).lte('assessment_date', periodEnd);
      } else if (evidenceType.table === 'resilience_tests') {
        query = query.gte('test_date', periodStart).lte('test_date', periodEnd);
      } else if (evidenceType.table === 'stress_test_executions') {
        query = query.gte('execution_start', periodStart).lte('execution_start', periodEnd);
      } else {
        query = query.gte('created_at', periodStart).lte('created_at', periodEnd);
      }

      const { data: result, error } = await query;
      if (error) throw error;
      data = result || [];

      // Save as collected evidence
      const { error: insertError } = await supabase
        .from('audit_evidence')
        .insert({
          evidence_type: evidenceType.id,
          evidence_period_start: periodStart,
          evidence_period_end: periodEnd,
          data: { records: data, count: data.length },
          source_table: evidenceType.table,
          is_validated: true,
        });

      if (insertError) throw insertError;

      toast.success(`Evidencia recopilada: ${evidenceType.name}`, {
        description: `${data.length} registros del período`,
      });
      refetch();
    } catch (error: any) {
      console.error('Error collecting evidence:', error);
      toast.error('Error al recopilar evidencia', { description: error.message });
    } finally {
      setCollecting(null);
    }
  };

  const exportEvidence = (evidence: any) => {
    const dataStr = JSON.stringify(evidence.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence_${evidence.evidence_type}_${evidence.evidence_period_start}_${evidence.evidence_period_end}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllAsCSV = () => {
    if (!collectedEvidence?.length) return;

    const rows = collectedEvidence.map(e => ({
      tipo: e.evidence_type,
      periodo_inicio: e.evidence_period_start,
      periodo_fin: e.evidence_period_end,
      registros: (e.data as any)?.count || 0,
      validado: e.is_validated ? 'Sí' : 'No',
      recopilado: e.collected_at,
    }));

    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidencias_auditoria_${periodStart}_${periodEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Exportación completada');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recopilador de Evidencias</CardTitle>
          <CardDescription>
            Recopila automáticamente evidencias del sistema para informes de auditoría
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Selection */}
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="secondary" onClick={exportAllAsCSV} disabled={!collectedEvidence?.length}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Evidence Types Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {EVIDENCE_TYPES.map((type) => {
              const count = evidenceCounts?.[type.id] || 0;
              const collected = collectedEvidence?.find(e => e.evidence_type === type.id);
              const isCollecting = collecting === type.id;

              return (
                <Card key={type.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {type.icon}
                        </div>
                        <CardTitle className="text-base">{type.name}</CardTitle>
                      </div>
                      {collected && (
                        <Badge variant="outline" className="text-green-600">
                          Recopilado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">registros</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={collected ? 'secondary' : 'default'}
                        onClick={() => collectEvidence(type)}
                        disabled={isCollecting || count === 0}
                        className="flex-1"
                      >
                        {isCollecting ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-1" />
                        )}
                        {collected ? 'Actualizar' : 'Recopilar'}
                      </Button>
                      {collected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportEvidence(collected)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Collected Evidence History */}
      {collectedEvidence && collectedEvidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidencias Recopiladas</CardTitle>
            <CardDescription>
              Historial de evidencias recopiladas para el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collectedEvidence.map((evidence) => (
                <div
                  key={evidence.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {EVIDENCE_TYPES.find(t => t.id === evidence.evidence_type)?.icon || <Database className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {EVIDENCE_TYPES.find(t => t.id === evidence.evidence_type)?.name || evidence.evidence_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(evidence.data as any)?.count || 0} registros · 
                        Recopilado: {format(new Date(evidence.collected_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {evidence.is_validated && (
                      <Badge variant="outline" className="text-green-600">Validado</Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => exportEvidence(evidence)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
