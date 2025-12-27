/**
 * ModuleSandboxPanel - Fase 4: Sandbox de Pruebas con IA
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube2, 
  Play, 
  CheckCircle2, 
  XCircle,
  Trash2,
  RefreshCw,
  Clock,
  GitCompare,
  Rocket,
  AlertTriangle,
  Shield,
  Zap,
  Copy,
  RotateCcw,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleSandbox, SandboxTestResult, ValidationError, SandboxComparison } from '@/hooks/admin/useModuleSandbox';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ModuleSandboxPanelProps {
  moduleKey: string;
  moduleData: Record<string, unknown>;
  className?: string;
}

export function ModuleSandboxPanel({ 
  moduleKey, 
  moduleData,
  className 
}: ModuleSandboxPanelProps) {
  const { 
    sandboxes, 
    activeSandbox, 
    isLoading,
    createSandbox,
    runTests,
    validateSandbox,
    compareSandbox,
    deploySandbox,
    discardSandbox,
    cloneSandbox
  } = useModuleSandbox(moduleKey);

  const [testResults, setTestResults] = useState<SandboxTestResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [comparison, setComparison] = useState<SandboxComparison[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleCreateSandbox = useCallback(async () => {
    createSandbox.mutate({
      module_key: moduleKey,
      sandbox_name: `sandbox_${Date.now()}`,
      original_state: moduleData,
    });
  }, [moduleKey, moduleData, createSandbox]);

  const handleRunTests = useCallback(async () => {
    if (!activeSandbox) return;
    setIsRunningTests(true);
    try {
      const result = await runTests(activeSandbox.id);
      if (result) {
        setTestResults(result);
        const passed = result.summary?.passed || 0;
        const total = result.summary?.total || 0;
        toast.success(`${passed}/${total} tests pasaron`);
      }
    } finally {
      setIsRunningTests(false);
    }
  }, [activeSandbox, runTests]);

  const handleValidate = useCallback(async () => {
    if (!activeSandbox) return;
    setIsValidating(true);
    try {
      const errors = await validateSandbox(activeSandbox.id);
      setValidationErrors(errors);
      if (errors.length === 0) {
        toast.success('Validación completada sin errores');
      } else {
        toast.warning(`${errors.length} problemas encontrados`);
      }
    } finally {
      setIsValidating(false);
    }
  }, [activeSandbox, validateSandbox]);

  const handleCompare = useCallback(async () => {
    if (!activeSandbox) return;
    const diff = await compareSandbox(activeSandbox.id);
    setComparison(diff);
  }, [activeSandbox, compareSandbox]);

  const handleDeploy = useCallback(async () => {
    if (!activeSandbox) return;
    if (!window.confirm('¿Desplegar a producción?')) return;
    setIsDeploying(true);
    try {
      deploySandbox.mutate(activeSandbox.id);
    } finally {
      setIsDeploying(false);
    }
  }, [activeSandbox, deploySandbox]);

  const handleDiscard = useCallback(async () => {
    if (!activeSandbox) return;
    if (!window.confirm('¿Descartar sandbox?')) return;
    discardSandbox.mutate(activeSandbox.id);
    setTestResults(null);
    setValidationErrors([]);
    setComparison([]);
  }, [activeSandbox, discardSandbox]);

  const handleClone = useCallback(async () => {
    if (!activeSandbox) return;
    await cloneSandbox(activeSandbox.id, `${activeSandbox.sandbox_name}_clone`);
  }, [activeSandbox, cloneSandbox]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: 'bg-green-500/20 text-green-600', icon: <Zap className="h-3 w-3" /> },
      testing: { color: 'bg-blue-500/20 text-blue-600', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
      validated: { color: 'bg-violet-500/20 text-violet-600', icon: <CheckCircle2 className="h-3 w-3" /> },
      failed: { color: 'bg-red-500/20 text-red-600', icon: <XCircle className="h-3 w-3" /> },
      deployed: { color: 'bg-emerald-500/20 text-emerald-600', icon: <Rocket className="h-3 w-3" /> },
      discarded: { color: 'bg-gray-500/20 text-gray-600', icon: <Trash2 className="h-3 w-3" /> },
    };
    const cfg = config[status] || config.active;
    return (
      <Badge className={cn("gap-1", cfg.color)}>
        {cfg.icon}
        {status}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4 text-orange-500" />;
      case 'performance': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'validation': return <FileCheck className="h-4 w-4 text-violet-500" />;
      case 'integration': return <GitCompare className="h-4 w-4 text-green-500" />;
      default: return <TestTube2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <TestTube2 className="h-4 w-4 text-white" />
              </div>
              Sandbox de Pruebas
            </CardTitle>
            <CardDescription>Prueba y valida cambios antes de aplicarlos</CardDescription>
          </div>
          {!activeSandbox && (
            <Button onClick={handleCreateSandbox} disabled={isLoading} size="sm">
              <TestTube2 className="h-4 w-4 mr-2" />
              Crear Sandbox
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeSandbox ? (
          <div className="space-y-4">
            {/* Sandbox Info */}
            <div className="p-4 border rounded-lg bg-gradient-to-r from-muted/30 to-muted/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                    {activeSandbox.id.slice(0, 8)}
                  </span>
                  {getStatusBadge(activeSandbox.status)}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(activeSandbox.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleRunTests} disabled={isRunningTests}>
                  {isRunningTests ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Tests IA
                </Button>
                <Button size="sm" variant="outline" onClick={handleValidate} disabled={isValidating}>
                  {isValidating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck className="h-4 w-4 mr-2" />}
                  Validar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCompare}>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Comparar
                </Button>
                <Button size="sm" variant="outline" onClick={handleClone}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clonar
                </Button>
                <div className="flex-1" />
                <Button size="sm" onClick={handleDeploy} disabled={isDeploying} className="bg-gradient-to-r from-emerald-500 to-green-600">
                  <Rocket className="h-4 w-4 mr-2" />
                  Desplegar
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDiscard}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Coverage */}
            {testResults?.coverage && (
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(testResults.coverage).map(([key, value]) => (
                  <div key={key} className="p-2 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="text-lg font-bold">{value}%</p>
                    <Progress value={value} className="h-1 mt-1" />
                  </div>
                ))}
              </div>
            )}

            <Tabs defaultValue="tests" className="mt-4">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="tests" className="text-xs">
                  Tests ({testResults?.tests?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="validation" className="text-xs">
                  Validación ({validationErrors.length})
                </TabsTrigger>
                <TabsTrigger value="diff" className="text-xs">
                  Cambios ({comparison.filter(c => c.change_type !== 'unchanged').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tests" className="mt-3">
                {testResults?.tests && testResults.tests.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {testResults.tests.map((result, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "p-3 border rounded-lg flex items-start gap-3 transition-all",
                            result.passed 
                              ? "bg-green-500/5 border-green-500/20" 
                              : "bg-destructive/5 border-destructive/20"
                          )}
                        >
                          {result.passed 
                            ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> 
                            : <XCircle className="h-5 w-5 text-destructive shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(result.category)}
                              <p className="font-medium text-sm truncate">{result.name}</p>
                            </div>
                            {result.message && (
                              <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {result.duration_ms}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Ejecuta tests IA para ver resultados</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="validation" className="mt-3">
                {validationErrors.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {validationErrors.map((error, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "p-3 border rounded-lg",
                            error.severity === 'error' && "bg-destructive/5 border-destructive/20",
                            error.severity === 'warning' && "bg-amber-500/5 border-amber-500/20",
                            error.severity === 'info' && "bg-blue-500/5 border-blue-500/20"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={cn(
                              "h-4 w-4",
                              error.severity === 'error' && "text-destructive",
                              error.severity === 'warning' && "text-amber-500",
                              error.severity === 'info' && "text-blue-500"
                            )} />
                            <span className="font-medium text-sm">{error.field}</span>
                            <Badge variant="outline" className="text-xs">{error.code}</Badge>
                          </div>
                          <p className="text-sm mt-1">{error.message}</p>
                          {error.suggestion && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              💡 {error.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Ejecuta validación para ver resultados</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="diff" className="mt-3">
                {comparison.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {comparison.filter(c => c.change_type !== 'unchanged').map((item, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "p-3 border rounded-lg",
                            item.change_type === 'added' && "bg-green-500/5 border-green-500/20",
                            item.change_type === 'removed' && "bg-red-500/5 border-red-500/20",
                            item.change_type === 'modified' && "bg-amber-500/5 border-amber-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{item.field}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.change_type}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  item.impact_level === 'high' && "border-orange-500 text-orange-500",
                                  item.impact_level === 'critical' && "border-red-500 text-red-500"
                                )}
                              >
                                {item.impact_level}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-muted/50 rounded overflow-hidden">
                              <span className="text-muted-foreground">Original:</span>
                              <pre className="mt-1 truncate">{JSON.stringify(item.original)}</pre>
                            </div>
                            <div className="p-2 bg-muted/50 rounded overflow-hidden">
                              <span className="text-muted-foreground">Modificado:</span>
                              <pre className="mt-1 truncate">{JSON.stringify(item.modified)}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitCompare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Compara para ver diferencias</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <TestTube2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Crea un sandbox para probar cambios de forma segura
            </p>
            <Button onClick={handleCreateSandbox}>
              <TestTube2 className="h-4 w-4 mr-2" />
              Crear Sandbox
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ModuleSandboxPanel;
