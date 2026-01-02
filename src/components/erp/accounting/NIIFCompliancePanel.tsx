/**
 * NIIFCompliancePanel - Panel de Cumplimiento NIIF/NIC
 * Fase 1 del Plan Estratosférico
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRightLeft,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';
import { useNIIFCompliance, type AccountingFramework, type ComplianceValidation } from '@/hooks/erp/useNIIFCompliance';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NIIFCompliancePanelProps {
  context?: {
    entries?: unknown[];
    accounts?: Array<{ code: string; name: string; balance?: number }>;
    period?: { start: string; end: string };
  };
  onValidationComplete?: (result: ComplianceValidation) => void;
  className?: string;
}

export function NIIFCompliancePanel({ 
  context,
  onValidationComplete,
  className 
}: NIIFCompliancePanelProps) {
  const [activeTab, setActiveTab] = useState('compliance');
  const [selectedSourceFramework, setSelectedSourceFramework] = useState('PGC_2007');
  const [selectedTargetFramework, setSelectedTargetFramework] = useState('NIIF_FULL');
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [mappingResult, setMappingResult] = useState<any>(null);
  const [standardsInfo, setStandardsInfo] = useState<any>(null);

  const {
    isLoading,
    frameworks,
    currentValidation,
    error,
    lastRefresh,
    fetchFrameworks,
    validateEntry,
    mapAccounts,
    analyzeCompliance,
    getStandardsInfo
  } = useNIIFCompliance();

  // Load frameworks on mount
  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  // Handle validation
  const handleValidate = useCallback(async () => {
    if (!context?.entries?.length) return;

    const result = await analyzeCompliance(
      { entries: context.entries },
      { 
        framework: selectedSourceFramework as any,
        targetFramework: selectedTargetFramework,
        periodStart: context.period?.start,
        periodEnd: context.period?.end
      }
    );

    if (result) {
      setComplianceResult(result);
      onValidationComplete?.(result as any);
    }
  }, [context, selectedSourceFramework, selectedTargetFramework, analyzeCompliance, onValidationComplete]);

  // Handle account mapping
  const handleMapAccounts = useCallback(async () => {
    if (!context?.accounts?.length) return;

    const result = await mapAccounts(
      context.accounts,
      selectedSourceFramework,
      selectedTargetFramework
    );

    if (result) {
      setMappingResult(result);
    }
  }, [context?.accounts, selectedSourceFramework, selectedTargetFramework, mapAccounts]);

  // Handle standards lookup
  const handleGetStandards = useCallback(async (topic: string) => {
    const result = await getStandardsInfo(topic, true);
    if (result) {
      setStandardsInfo(result);
    }
  }, [getStandardsInfo]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-destructive';
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Cumplimiento NIIF/NIC</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Motor de compliance normativo'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedSourceFramework} onValueChange={setSelectedSourceFramework}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Marco origen" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map(f => (
                  <SelectItem key={f.id} value={f.framework_code}>
                    {f.framework_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedTargetFramework} onValueChange={setSelectedTargetFramework}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Marco destino" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map(f => (
                  <SelectItem key={f.id} value={f.framework_code}>
                    {f.framework_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="compliance" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="mapping" className="text-xs">
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Mapeo
            </TabsTrigger>
            <TabsTrigger value="standards" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Normativa
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Informes
            </TabsTrigger>
          </TabsList>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="mt-0">
            <div className="space-y-4">
              <Button 
                onClick={handleValidate} 
                disabled={isLoading || !context?.entries?.length}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Analizar Cumplimiento
              </Button>

              {complianceResult && (
                <div className="space-y-4">
                  {/* Score Overview */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Puntuación de Cumplimiento</span>
                      <span className={cn("text-2xl font-bold", getComplianceColor(complianceResult.overallCompliance))}>
                        {complianceResult.overallCompliance}%
                      </span>
                    </div>
                    <Progress value={complianceResult.overallCompliance} className="h-2" />
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={
                        complianceResult.riskLevel === 'low' ? 'default' :
                        complianceResult.riskLevel === 'medium' ? 'secondary' :
                        'destructive'
                      }>
                        Riesgo: {complianceResult.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Issues List */}
                  {complianceResult.criticalFindings?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Hallazgos Críticos</h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {complianceResult.criticalFindings.map((finding: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border bg-destructive/5">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">{finding.issue || finding}</p>
                                  {finding.remediation && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {finding.remediation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Action Plan */}
                  {complianceResult.actionPlan?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Plan de Acción</h4>
                      <div className="space-y-2">
                        {complianceResult.actionPlan.slice(0, 3).map((action: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                            <Badge variant="outline" className="shrink-0">
                              P{action.priority}
                            </Badge>
                            <span className="text-sm flex-1">{action.action}</span>
                            <span className="text-xs text-muted-foreground">{action.deadline}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!complianceResult && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Selecciona datos contables para analizar</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mapping Tab */}
          <TabsContent value="mapping" className="mt-0">
            <div className="space-y-4">
              <Button 
                onClick={handleMapAccounts} 
                disabled={isLoading || !context?.accounts?.length}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                )}
                Mapear Cuentas {selectedSourceFramework} → {selectedTargetFramework}
              </Button>

              {mappingResult?.mappings && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {mappingResult.mappings.map((mapping: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{mapping.sourceCode}</p>
                            <p className="text-xs text-muted-foreground">{mapping.sourceName}</p>
                          </div>
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-2" />
                          <div className="text-right">
                            <p className="text-sm font-medium">{mapping.targetCode}</p>
                            <p className="text-xs text-muted-foreground">{mapping.targetName}</p>
                          </div>
                        </div>
                        {mapping.conversionNotes && (
                          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            {mapping.conversionNotes}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {mapping.standardReference || mapping.mappingType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {!mappingResult && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Proporciona cuentas para mapear entre marcos</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Standards Tab */}
          <TabsContent value="standards" className="mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGetStandards('activos')}
                  disabled={isLoading}
                >
                  NIC 16 - Activos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGetStandards('ingresos')}
                  disabled={isLoading}
                >
                  NIIF 15 - Ingresos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGetStandards('arrendamientos')}
                  disabled={isLoading}
                >
                  NIIF 16 - Leasing
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGetStandards('instrumentos financieros')}
                  disabled={isLoading}
                >
                  NIIF 9 - Financieros
                </Button>
              </div>

              {standardsInfo?.standards && (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {standardsInfo.standards.map((std: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{std.code} - {std.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{std.scope}</p>
                            {std.keyRequirements?.length > 0 && (
                              <ul className="text-xs mt-2 space-y-1">
                                {std.keyRequirements.slice(0, 3).map((req: string, j: number) => (
                                  <li key={j} className="flex items-start gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {std.pgcEquivalent && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                PGC: {std.pgcEquivalent}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {!standardsInfo && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Consulta normativa NIIF/NIC</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Generador de informes NIIF</p>
              <p className="text-xs mt-1">Próximamente: Balance, PyG, Notas según NIIF</p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NIIFCompliancePanel;
