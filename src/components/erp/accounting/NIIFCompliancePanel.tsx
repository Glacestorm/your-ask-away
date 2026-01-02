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
  Info,
  Trash2
} from 'lucide-react';
import { useNIIFCompliance, type AccountingFramework, type ComplianceValidation } from '@/hooks/erp/useNIIFCompliance';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/erp/maestros/shared/ConfirmationDialog';

interface NIIFCompliancePanelProps {
  context?: {
    entries?: unknown[];
    accounts?: Array<{ code: string; name: string; balance?: number }>;
    period?: { start: string; end: string };
  };
  onValidationComplete?: (result: ComplianceValidation) => void;
  className?: string;
}

// Datos de demo para cuando no hay contexto externo
const DEMO_ENTRIES = [
  { id: '1', date: '2024-01-15', account: '4300', description: 'Venta servicios', debit: 0, credit: 15000, type: 'revenue' },
  { id: '2', date: '2024-01-15', account: '5720', description: 'Cobro cliente', debit: 15000, credit: 0, type: 'asset' },
  { id: '3', date: '2024-01-20', account: '6400', description: 'Sueldos personal', debit: 8500, credit: 0, type: 'expense' },
  { id: '4', date: '2024-01-20', account: '5720', description: 'Pago nóminas', debit: 0, credit: 8500, type: 'liability' },
  { id: '5', date: '2024-01-25', account: '2130', description: 'Amortización maquinaria', debit: 1200, credit: 0, type: 'depreciation' },
];

const DEMO_ACCOUNTS = [
  { code: '4300', name: 'Ventas de servicios', balance: 150000 },
  { code: '5720', name: 'Bancos c/c', balance: 45000 },
  { code: '6400', name: 'Sueldos y salarios', balance: 85000 },
  { code: '2130', name: 'Maquinaria', balance: 120000 },
  { code: '2813', name: 'Amortización acumulada maquinaria', balance: -24000 },
  { code: '4000', name: 'Proveedores', balance: -35000 },
  { code: '4750', name: 'HP acreedora por IVA', balance: -12000 },
];

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
  const [useDemo, setUseDemo] = useState(!context?.entries?.length);
  const [showClearDemoDialog, setShowClearDemoDialog] = useState(false);

  // Función para limpiar datos demo
  const handleClearDemoData = useCallback(() => {
    setComplianceResult(null);
    setMappingResult(null);
    setStandardsInfo(null);
    setShowClearDemoDialog(false);
  }, []);

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

  // Datos efectivos (demo o contexto real)
  const effectiveEntries = context?.entries?.length ? context.entries : DEMO_ENTRIES;
  const effectiveAccounts = context?.accounts?.length ? context.accounts : DEMO_ACCOUNTS;

  // Load frameworks on mount
  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  // Handle validation - ahora siempre funciona con demo o datos reales
  const handleValidate = useCallback(async () => {
    const result = await analyzeCompliance(
      { entries: effectiveEntries },
      { 
        framework: selectedSourceFramework as any,
        targetFramework: selectedTargetFramework,
        periodStart: context?.period?.start || '2024-01-01',
        periodEnd: context?.period?.end || '2024-12-31'
      }
    );

    if (result) {
      setComplianceResult(result);
      onValidationComplete?.(result as any);
    }
  }, [effectiveEntries, selectedSourceFramework, selectedTargetFramework, analyzeCompliance, context?.period, onValidationComplete]);

  // Handle account mapping - ahora siempre funciona
  const handleMapAccounts = useCallback(async () => {
    const result = await mapAccounts(
      effectiveAccounts,
      selectedSourceFramework,
      selectedTargetFramework
    );

    if (result) {
      setMappingResult(result);
    }
  }, [effectiveAccounts, selectedSourceFramework, selectedTargetFramework, mapAccounts]);

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
              {/* Indicador de modo demo */}
              {!context?.entries?.length && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Modo demostración: usando {DEMO_ENTRIES.length} asientos de ejemplo
                    </span>
                  </div>
                  {(complianceResult || mappingResult || standardsInfo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowClearDemoDialog(true)}
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Limpiar datos
                    </Button>
                  )}
                </div>
              )}

              <Button 
                onClick={handleValidate} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Analizar Cumplimiento NIIF
              </Button>

              {complianceResult && (
                <div className="space-y-4">
                  {/* Score Overview */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Puntuación de Cumplimiento</span>
                      <span className={cn("text-2xl font-bold", getComplianceColor(complianceResult.overallCompliance || 0))}>
                        {complianceResult.overallCompliance || 0}%
                      </span>
                    </div>
                    <Progress value={complianceResult.overallCompliance || 0} className="h-2" />
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={
                        complianceResult.riskLevel === 'low' ? 'default' :
                        complianceResult.riskLevel === 'medium' ? 'secondary' :
                        'destructive'
                      }>
                        Riesgo: {complianceResult.riskLevel || 'N/A'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {complianceResult.entriesAnalyzed || effectiveEntries.length} asientos analizados
                      </span>
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

                  {/* Recommendations */}
                  {complianceResult.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recomendaciones</h4>
                      <div className="space-y-2">
                        {complianceResult.recommendations.slice(0, 4).map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg border bg-blue-500/5">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
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
                              P{action.priority || i + 1}
                            </Badge>
                            <span className="text-sm flex-1">{action.action || action}</span>
                            {action.deadline && (
                              <span className="text-xs text-muted-foreground">{action.deadline}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!complianceResult && !isLoading && (
                <div className="text-center py-6 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Listo para analizar</p>
                  <p className="text-xs mt-1">
                    Pulsa el botón para analizar {effectiveEntries.length} asientos contables
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mapping Tab */}
          <TabsContent value="mapping" className="mt-0">
            <div className="space-y-4">
              {/* Indicador de modo demo */}
              {!context?.accounts?.length && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Info className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Modo demostración: usando {DEMO_ACCOUNTS.length} cuentas de ejemplo
                  </span>
                </div>
              )}

              <Button 
                onClick={handleMapAccounts} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
                <div className="text-center py-6 text-muted-foreground">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Listo para mapear</p>
                  <p className="text-xs mt-1">
                    Pulsa para convertir {effectiveAccounts.length} cuentas de {selectedSourceFramework} a {selectedTargetFramework}
                  </p>
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

      {/* Diálogo de confirmación para limpiar datos demo */}
      <ConfirmationDialog
        open={showClearDemoDialog}
        onOpenChange={setShowClearDemoDialog}
        onConfirm={handleClearDemoData}
        title="Limpiar datos de demostración"
        description="¿Estás seguro de que deseas eliminar todos los resultados generados? Los datos de ejemplo permanecerán disponibles para futuras pruebas."
        variant="warning"
        confirmLabel="Limpiar"
        cancelLabel="Cancelar"
      />
    </Card>
  );
}

export default NIIFCompliancePanel;
