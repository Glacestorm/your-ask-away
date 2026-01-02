import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  FileText,
  Calendar,
  Scale
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ComplianceResult {
  compliance_score: number;
  status: string;
  country: string;
  sections: {
    vat?: {
      issues: any[];
      recommendations: string[];
      current_quarter: string;
      vat_entries_count: number;
    };
    journal_entries?: {
      checked: number;
      with_issues: number;
    };
  };
  applicable_regulations?: Array<{
    type: string;
    name: string;
    code: string;
  }>;
}

interface ProcessComplianceStatusProps {
  companyId: string;
}

export function ProcessComplianceStatus({ companyId }: ProcessComplianceStatusProps) {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-advisor-compliance', {
        body: {
          action: 'full_audit',
          company_id: companyId
        }
      });

      if (error) throw error;
      setResult(data);
    } catch (err) {
      console.error('[ProcessComplianceStatus] Error:', err);
      toast.error('Error al ejecutar auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, [companyId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500">Cumple</Badge>;
      case 'needs_attention':
        return <Badge className="bg-yellow-500">Atención</Badge>;
      default:
        return <Badge variant="destructive">No cumple</Badge>;
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Estado de Cumplimiento
          </h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runAudit}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
            Auditar
          </Button>
        </div>

        {loading && !result && (
          <div className="text-center py-8 text-muted-foreground">
            Ejecutando auditoría de cumplimiento...
          </div>
        )}

        {result && (
          <>
            {/* Score Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "text-3xl font-bold",
                    getScoreColor(result.compliance_score)
                  )}>
                    {result.compliance_score}%
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <Badge variant="outline">{result.country}</Badge>
              </div>
              <Progress 
                value={result.compliance_score} 
                className={cn(
                  "h-2",
                  result.compliance_score >= 80 && "[&>div]:bg-green-500",
                  result.compliance_score >= 60 && result.compliance_score < 80 && "[&>div]:bg-yellow-500",
                  result.compliance_score < 60 && "[&>div]:bg-destructive"
                )}
              />
            </Card>

            {/* VAT Status */}
            {result.sections.vat && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <h5 className="font-medium text-sm">IVA - {result.sections.vat.current_quarter}</h5>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Registros IVA</p>
                    <p className="font-medium">{result.sections.vat.vat_entries_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Incidencias</p>
                    <p className="font-medium">{result.sections.vat.issues.length}</p>
                  </div>
                </div>
                {result.sections.vat.issues.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {result.sections.vat.issues.map((issue, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "p-2 rounded text-xs",
                          issue.severity === 'error' && "bg-destructive/10",
                          issue.severity === 'warning' && "bg-yellow-500/10"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={cn(
                            "h-3 w-3 shrink-0 mt-0.5",
                            issue.severity === 'error' ? "text-destructive" : "text-yellow-500"
                          )} />
                          <span>{issue.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Journal Entries */}
            {result.sections.journal_entries && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h5 className="font-medium text-sm">Asientos Contables</h5>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Revisados</p>
                    <p className="font-medium">{result.sections.journal_entries.checked}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Con problemas</p>
                    <p className={cn(
                      "font-medium",
                      result.sections.journal_entries.with_issues > 0 && "text-destructive"
                    )}>
                      {result.sections.journal_entries.with_issues}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Applicable Regulations */}
            {result.applicable_regulations && result.applicable_regulations.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-4 w-4 text-primary" />
                  <h5 className="font-medium text-sm">Normativa Aplicable</h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.applicable_regulations.map((reg, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {reg.code || reg.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

export default ProcessComplianceStatus;
