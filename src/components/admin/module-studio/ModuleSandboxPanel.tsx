/**
 * ModuleSandboxPanel - Panel para gestionar sandboxes de módulos
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TestTube2, 
  Play, 
  CheckCircle2, 
  XCircle,
  Trash2,
  RefreshCw,
  Clock,
  GitCompare,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleSandbox, ModuleSandbox, SandboxTestResult } from '@/hooks/admin/useModuleSandbox';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ModuleSandboxPanelProps {
  moduleKey: string;
  moduleData: Record<string, unknown>;
  className?: string;
}

interface TestItem {
  name: string;
  passed: boolean;
  message?: string;
  duration_ms?: number;
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
    deploySandbox,
    discardSandbox
  } = useModuleSandbox(moduleKey);

  const [testResults, setTestResults] = useState<TestItem[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
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
      if (result && result.tests) {
        setTestResults(result.tests);
        const passed = result.summary?.passed || 0;
        const total = result.summary?.total || 0;
        toast.success(`${passed}/${total} tests pasaron`);
      }
    } finally {
      setIsRunningTests(false);
    }
  }, [activeSandbox, runTests]);

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
    setTestResults([]);
  }, [activeSandbox, discardSandbox]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500',
      testing: 'bg-blue-500',
      deployed: 'bg-violet-500',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5" />
              Sandbox de Pruebas
            </CardTitle>
            <CardDescription>Prueba cambios antes de aplicarlos</CardDescription>
          </div>
          {!activeSandbox && (
            <Button onClick={handleCreateSandbox} disabled={isLoading}>
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
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{activeSandbox.id.slice(0, 8)}</span>
                  {getStatusBadge(activeSandbox.status)}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(activeSandbox.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={handleRunTests} disabled={isRunningTests}>
                  {isRunningTests ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Tests
                </Button>
                <Button size="sm" onClick={handleDeploy} disabled={isDeploying}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Desplegar
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDiscard}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Descartar
                </Button>
              </div>
            </div>

            <Tabs defaultValue="tests">
              <TabsList>
                <TabsTrigger value="tests">Tests ({testResults.length})</TabsTrigger>
                <TabsTrigger value="diff"><GitCompare className="h-4 w-4 mr-2" />Cambios</TabsTrigger>
              </TabsList>
              <TabsContent value="tests">
                {testResults.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {testResults.map((result, i) => (
                        <div key={i} className={cn("p-3 border rounded-lg flex items-start gap-3", result.passed ? "bg-green-500/5" : "bg-destructive/5")}>
                          {result.passed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                          <div>
                            <p className="font-medium text-sm">{result.name}</p>
                            {result.message && <p className="text-xs text-muted-foreground">{result.message}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Ejecuta tests para ver resultados</div>
                )}
              </TabsContent>
              <TabsContent value="diff">
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify({ original: activeSandbox.original_state, modified: activeSandbox.modified_state }, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <TestTube2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Crea un sandbox para probar cambios</p>
            <Button onClick={handleCreateSandbox}><TestTube2 className="h-4 w-4 mr-2" />Crear Sandbox</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ModuleSandboxPanel;
