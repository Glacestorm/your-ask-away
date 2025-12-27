/**
 * ModuleTestingPanel - Testing Framework para módulos
 * Tests automatizados, cobertura, validación de módulos
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube2, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  FileCode,
  Shield
} from 'lucide-react';
import { useModuleTestingFramework } from '@/hooks/admin/useModuleTestingFramework';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleTestContext {
  moduleKey: string;
  moduleName?: string;
}

interface ModuleTestingPanelProps {
  context: ModuleTestContext | null;
  className?: string;
}

export function ModuleTestingPanel({ context, className }: ModuleTestingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('results');

  const {
    isLoading,
    testSuites,
    activeTestRun,
    coverageReport,
    validationResults,
    runTests,
    getCoverage,
    validateModule,
  } = useModuleTestingFramework();

  useEffect(() => {
    if (context?.moduleKey) {
      getCoverage(context.moduleKey);
    }
  }, [context?.moduleKey, getCoverage]);

  const handleRunAllTests = useCallback(async () => {
    if (context?.moduleKey) {
      await runTests(context.moduleKey, 'all');
    }
  }, [context?.moduleKey, runTests]);

  const handleValidate = useCallback(async () => {
    if (context?.moduleKey) {
      await validateModule(context.moduleKey);
    }
  }, [context?.moduleKey, validateModule]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <TestTube2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <TestTube2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para ejecutar tests</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate test stats from activeTestRun
  const passedTests = activeTestRun?.passed_tests || 0;
  const failedTests = activeTestRun?.failed_tests || 0;
  const totalTests = activeTestRun?.total_tests || 0;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const coveragePercentage = coverageReport?.lines_percentage || 0;

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <TestTube2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Testing Framework</CardTitle>
              <p className="text-xs text-muted-foreground">
                {activeTestRun?.last_run_at 
                  ? `Última ejecución ${formatDistanceToNow(new Date(activeTestRun.last_run_at), { locale: es, addSuffix: true })}`
                  : 'Sin ejecutar aún'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRunAllTests}
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold text-green-500">{passedTests}</p>
            <p className="text-xs text-muted-foreground">Pasados</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold text-destructive">{failedTests}</p>
            <p className="text-xs text-muted-foreground">Fallidos</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{coveragePercentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Cobertura</p>
          </div>
        </div>

        <Progress value={passRate} className="h-2 mb-3" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="results" className="text-xs">Resultados</TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs">Cobertura</TabsTrigger>
            <TabsTrigger value="validation" className="text-xs">Validación</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              <div className="space-y-2">
                {!activeTestRun?.test_cases || activeTestRun.test_cases.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ejecuta los tests para ver resultados</p>
                  </div>
                ) : (
                  activeTestRun.test_cases.map((testCase) => (
                    <div 
                      key={testCase.id} 
                      className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(testCase.status)}
                          <span className="text-sm font-medium">{testCase.name}</span>
                        </div>
                        <Badge variant={testCase.status === 'passed' ? 'secondary' : 'destructive'} className="text-xs">
                          {testCase.duration_ms || 0}ms
                        </Badge>
                      </div>
                      {testCase.error_message && (
                        <p className="text-xs text-destructive mt-1 ml-6">{testCase.error_message}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="coverage" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              {coverageReport ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Cobertura Total</span>
                      <span className="text-lg font-bold">{coverageReport.lines_percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={coverageReport.lines_percentage} className="h-2" />
                  </div>
                  
                  {coverageReport.files?.map((file) => (
                    <div key={file.path} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium truncate">{file.path}</span>
                        </div>
                        <span className="text-xs font-bold">{file.coverage.toFixed(0)}%</span>
                      </div>
                      <Progress value={file.coverage} className="h-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ejecuta tests para ver cobertura</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="validation" className="flex-1 mt-0">
            <div className="mb-3">
              <Button 
                size="sm" 
                className="w-full" 
                onClick={handleValidate}
                disabled={isLoading}
              >
                <Shield className="h-4 w-4 mr-2" />
                Validar Módulo
              </Button>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-400px)]" : "h-[160px]"}>
              {validationResults && validationResults.length > 0 ? (
                <div className="space-y-2">
                  {validationResults.map((result) => (
                    <div 
                      key={result.id}
                      className={cn(
                        "p-2 rounded-lg border",
                        result.status === 'valid' ? "border-green-500/30 bg-green-500/10" : 
                        result.status === 'warning' ? "border-yellow-500/30 bg-yellow-500/10" :
                        "border-destructive/30 bg-destructive/10"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {result.status === 'valid' 
                          ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          : result.status === 'warning'
                          ? <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          : <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                        }
                        <div>
                          <span className="text-sm font-medium">{result.validation_type}</span>
                          <p className="text-xs text-muted-foreground">{result.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ejecuta validación para ver resultados</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleTestingPanel;
