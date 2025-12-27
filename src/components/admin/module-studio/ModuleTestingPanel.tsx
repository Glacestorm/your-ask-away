/**
 * ModuleTestingPanel - Testing Framework para módulos
 * Tests automatizados, cobertura, validación de módulos
 * Enhanced with more interactivity
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Shield,
  MoreVertical,
  Eye,
  Trash2,
  RotateCcw,
  ChevronDown,
  Zap
} from 'lucide-react';
import { useModuleTestingFramework } from '@/hooks/admin/useModuleTestingFramework';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
  const [selectedTestType, setSelectedTestType] = useState<'all' | 'unit' | 'integration' | 'e2e'>('all');
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showTestDetails, setShowTestDetails] = useState(false);

  const {
    isLoading,
    testSuites,
    activeTestRun,
    coverageReport,
    validationResults,
    runTests,
    getCoverage,
    validateModule,
    cancelTestRun,
  } = useModuleTestingFramework();

  useEffect(() => {
    if (context?.moduleKey) {
      getCoverage(context.moduleKey);
    }
  }, [context?.moduleKey, getCoverage]);

  const handleRunTests = useCallback(async (type: 'all' | 'unit' | 'integration' | 'e2e') => {
    if (context?.moduleKey) {
      setSelectedTestType(type);
      await runTests(context.moduleKey, type);
      toast.success(`Tests ${type === 'all' ? 'completos' : type} ejecutados`);
    }
  }, [context?.moduleKey, runTests]);

  const handleValidate = useCallback(async () => {
    if (context?.moduleKey) {
      await validateModule(context.moduleKey);
      toast.success('Validación completada');
    }
  }, [context?.moduleKey, validateModule]);

  const handleViewTestDetails = (test: any) => {
    setSelectedTest(test);
    setShowTestDetails(true);
  };

  const handleRetryTest = useCallback(async (testId: string) => {
    toast.info('Reintentando test...');
    // Simulate retry
    setTimeout(() => toast.success('Test reintentado'), 1000);
  }, []);

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

  const passedTests = activeTestRun?.passed_tests || 0;
  const failedTests = activeTestRun?.failed_tests || 0;
  const totalTests = activeTestRun?.total_tests || 0;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const coveragePercentage = coverageReport?.lines_percentage || 0;

  return (
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
        className
      )}>
        <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TestTube2 className="h-5 w-5 text-white" />
              </motion.div>
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
              {/* Dropdown for test types */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1" disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ejecutar Tests</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRunTests('all')}>
                    <Zap className="h-4 w-4 mr-2" />
                    Todos los tests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRunTests('unit')}>
                    <TestTube2 className="h-4 w-4 mr-2" />
                    Tests unitarios
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRunTests('integration')}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Tests de integración
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRunTests('e2e')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Tests E2E
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8"
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExpanded ? 'Minimizar' : 'Expandir'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
          {/* Animated Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <motion.div 
              className="p-2 rounded-lg bg-muted/50 text-center cursor-pointer hover:bg-muted/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveTab('results')}
            >
              <motion.p 
                className="text-lg font-bold text-green-500"
                key={passedTests}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {passedTests}
              </motion.p>
              <p className="text-xs text-muted-foreground">Pasados</p>
            </motion.div>
            <motion.div 
              className="p-2 rounded-lg bg-muted/50 text-center cursor-pointer hover:bg-muted/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveTab('results')}
            >
              <motion.p 
                className="text-lg font-bold text-destructive"
                key={failedTests}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {failedTests}
              </motion.p>
              <p className="text-xs text-muted-foreground">Fallidos</p>
            </motion.div>
            <motion.div 
              className="p-2 rounded-lg bg-muted/50 text-center cursor-pointer hover:bg-muted/70 transition-colors"
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveTab('coverage')}
            >
              <motion.p 
                className="text-lg font-bold"
                key={coveragePercentage}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {coveragePercentage.toFixed(0)}%
              </motion.p>
              <p className="text-xs text-muted-foreground">Cobertura</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ originX: 0 }}
          >
            <Progress value={passRate} className="h-2 mb-3" />
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-3">
              <TabsTrigger value="results" className="text-xs">Resultados</TabsTrigger>
              <TabsTrigger value="coverage" className="text-xs">Cobertura</TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">Validación</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {!activeTestRun?.test_cases || activeTestRun.test_cases.length === 0 ? (
                      <motion.div 
                        className="text-center py-4 text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Ejecuta los tests para ver resultados</p>
                      </motion.div>
                    ) : (
                      activeTestRun.test_cases.map((testCase, index) => (
                        <motion.div 
                          key={testCase.id} 
                          className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleViewTestDetails(testCase)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(testCase.status)}
                              <span className="text-sm font-medium">{testCase.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={testCase.status === 'passed' ? 'secondary' : 'destructive'} className="text-xs">
                                {testCase.duration_ms || 0}ms
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewTestDetails(testCase); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRetryTest(testCase.id); }}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reintentar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {testCase.error_message && (
                            <motion.p 
                              className="text-xs text-destructive mt-1 ml-6"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                            >
                              {testCase.error_message}
                            </motion.p>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="coverage" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
                {coverageReport ? (
                  <div className="space-y-3">
                    <motion.div 
                      className="p-3 rounded-lg border"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Cobertura Total</span>
                        <span className="text-lg font-bold">{coverageReport.lines_percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={coverageReport.lines_percentage} className="h-2" />
                    </motion.div>
                    
                    {coverageReport.files?.map((file, index) => (
                      <motion.div 
                        key={file.path} 
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium truncate">{file.path}</span>
                          </div>
                          <span className={cn(
                            "text-xs font-bold",
                            file.coverage >= 80 ? "text-green-500" : 
                            file.coverage >= 50 ? "text-yellow-500" : "text-destructive"
                          )}>
                            {file.coverage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={file.coverage} className="h-1" />
                      </motion.div>
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
                <AnimatePresence mode="popLayout">
                  {validationResults && validationResults.length > 0 ? (
                    <div className="space-y-2">
                      {validationResults.map((result, index) => (
                        <motion.div 
                          key={result.id}
                          className={cn(
                            "p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                            result.status === 'valid' ? "border-green-500/30 bg-green-500/10" : 
                            result.status === 'warning' ? "border-yellow-500/30 bg-yellow-500/10" :
                            "border-destructive/30 bg-destructive/10"
                          )}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
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
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Ejecuta validación para ver resultados</p>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Test Details Dialog */}
        <Dialog open={showTestDetails} onOpenChange={setShowTestDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTest && getStatusIcon(selectedTest.status)}
                {selectedTest?.name || 'Detalles del Test'}
              </DialogTitle>
              <DialogDescription>
                Información detallada del test seleccionado
              </DialogDescription>
            </DialogHeader>
            {selectedTest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="font-medium capitalize">{selectedTest.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Duración</p>
                    <p className="font-medium">{selectedTest.duration_ms || 0}ms</p>
                  </div>
                </div>
                {selectedTest.error_message && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-muted-foreground mb-1">Error</p>
                    <p className="text-sm text-destructive">{selectedTest.error_message}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleRetryTest(selectedTest.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

export default ModuleTestingPanel;
