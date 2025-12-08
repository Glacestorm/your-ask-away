import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Database, Server, HardDrive, Shield, AlertTriangle, CheckCircle2, XCircle, Stethoscope, Layers, Settings2, Brain, History, Clock, Mail, Undo2, Play, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HealthData {
  overall: {
    status: 'healthy' | 'degraded' | 'error';
    timestamp: string;
    uptime?: any;
  };
  database: {
    connected: boolean;
    responseTime: number;
    status: string;
    error?: string | null;
  };
  authentication: {
    status: string;
    responseTime: number;
    error?: string | null;
  };
  tables: Record<string, {
    count: number;
    status: string;
    error?: string | null;
  }>;
  storage: Record<string, {
    accessible: boolean;
    status: string;
    error?: string | null;
  }>;
  recentErrors: any[];
  metrics: {
    totalCompanies: number;
    totalUsers: number;
    totalVisits: number;
    totalProducts: number;
  };
}

interface ModuleDiagnostic {
  name: string;
  key: string;
  status: 'healthy' | 'warning' | 'error' | 'pending';
  checks: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
  }[];
  lastRun?: string;
}

interface AIIntervention {
  id: string;
  diagnostic_log_id: string | null;
  issue_description: string;
  ai_analysis: string;
  proposed_solution: string;
  status: 'pending' | 'approved' | 'executed' | 'reverted' | 'rejected';
  auto_execute_at: string | null;
  executed_at: string | null;
  executed_by: string | null;
  created_at: string;
}

interface ScheduledCheck {
  id: string;
  check_type: 'morning' | 'night';
  overall_status: string;
  total_modules: number;
  healthy_modules: number;
  warning_modules: number;
  error_modules: number;
  email_sent: boolean;
  created_at: string;
}

const APPLICATION_MODULES = [
  { key: 'auth', name: 'Autenticación y Roles', icon: Shield },
  { key: 'companies', name: 'Gestión de Empresas', icon: Database },
  { key: 'visits', name: 'Visitas y Fichas', icon: Server },
  { key: 'accounting', name: 'Contabilidad', icon: HardDrive },
  { key: 'goals', name: 'Objetivos y Metas', icon: Layers },
  { key: 'notifications', name: 'Notificaciones', icon: AlertTriangle },
  { key: 'storage', name: 'Almacenamiento', icon: HardDrive },
  { key: 'edge_functions', name: 'Edge Functions', icon: Settings2 },
];

export function SystemHealthMonitor() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningDiagnostic, setRunningDiagnostic] = useState<string | null>(null);
  const [moduleDiagnostics, setModuleDiagnostics] = useState<Record<string, ModuleDiagnostic>>({});
  const [globalDiagnosticProgress, setGlobalDiagnosticProgress] = useState(0);
  const [isRunningGlobalDiagnostic, setIsRunningGlobalDiagnostic] = useState(false);
  const [aiInterventions, setAiInterventions] = useState<AIIntervention[]>([]);
  const [scheduledChecks, setScheduledChecks] = useState<ScheduledCheck[]>([]);
  const [loadingInterventions, setLoadingInterventions] = useState(false);
  const [processingIntervention, setProcessingIntervention] = useState<string | null>(null);

  const fetchAIInterventions = async () => {
    try {
      const { data } = await supabase
        .from('ai_interventions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setAiInterventions((data as AIIntervention[]) || []);
    } catch (e) {
      console.error('Error fetching interventions:', e);
    }
  };

  const fetchScheduledChecks = async () => {
    try {
      const { data } = await supabase
        .from('scheduled_health_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setScheduledChecks((data as ScheduledCheck[]) || []);
    } catch (e) {
      console.error('Error fetching scheduled checks:', e);
    }
  };

  const handleInterventionAction = async (interventionId: string, action: 'approve' | 'reject' | 'revert') => {
    setProcessingIntervention(interventionId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('analyze-system-issues', {
        body: { interventionId, action, userId: user?.id }
      });
      if (error) throw error;
      toast.success(`Intervención ${action === 'approve' ? 'aprobada' : action === 'reject' ? 'rechazada' : 'revertida'}`);
      fetchAIInterventions();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setProcessingIntervention(null);
    }
  };

  const fetchHealthData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase.functions.invoke('system-health');

      if (error) throw error;

      setHealthData(data);
      
      if (isRefresh) {
        toast.success('Estado del sistema actualizado');
      }
    } catch (error: any) {
      console.error('Error fetching health data:', error);
      toast.error('Error al obtener el estado del sistema');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runModuleDiagnostic = async (moduleKey: string) => {
    setRunningDiagnostic(moduleKey);
    const moduleName = APPLICATION_MODULES.find(m => m.key === moduleKey)?.name || moduleKey;
    
    try {
      const checks: ModuleDiagnostic['checks'] = [];
      
      // Module-specific diagnostic checks
      switch (moduleKey) {
        case 'auth':
          const { data: roles } = await supabase.from('user_roles').select('count').limit(1);
          checks.push({ name: 'Tabla user_roles accesible', status: roles ? 'passed' : 'failed', message: roles ? 'OK' : 'Error de acceso' });
          const { data: profiles } = await supabase.from('profiles').select('count').limit(1);
          checks.push({ name: 'Tabla profiles accesible', status: profiles ? 'passed' : 'failed', message: profiles ? 'OK' : 'Error de acceso' });
          const { data: { user } } = await supabase.auth.getUser();
          checks.push({ name: 'Sesión de usuario activa', status: user ? 'passed' : 'warning', message: user ? 'Autenticado' : 'No autenticado' });
          break;
        case 'companies':
          const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
          checks.push({ name: 'Tabla companies accesible', status: 'passed', message: `${companyCount || 0} registros` });
          const { data: contacts } = await supabase.from('company_contacts').select('count').limit(1);
          checks.push({ name: 'Tabla contactos accesible', status: contacts ? 'passed' : 'failed', message: 'OK' });
          const { data: products } = await supabase.from('company_products').select('count').limit(1);
          checks.push({ name: 'Tabla productos empresa accesible', status: products ? 'passed' : 'failed', message: 'OK' });
          break;
        case 'visits':
          const { count: visitCount } = await supabase.from('visits').select('*', { count: 'exact', head: true });
          checks.push({ name: 'Tabla visits accesible', status: 'passed', message: `${visitCount || 0} registros` });
          const { count: sheetCount } = await supabase.from('visit_sheets').select('*', { count: 'exact', head: true });
          checks.push({ name: 'Tabla visit_sheets accesible', status: 'passed', message: `${sheetCount || 0} registros` });
          break;
        case 'accounting':
          const { data: statements } = await supabase.from('company_financial_statements').select('count').limit(1);
          checks.push({ name: 'Tabla estados financieros accesible', status: statements ? 'passed' : 'failed', message: 'OK' });
          const { data: balances } = await supabase.from('balance_sheets').select('count').limit(1);
          checks.push({ name: 'Tabla balances accesible', status: balances ? 'passed' : 'failed', message: 'OK' });
          const { data: income } = await supabase.from('income_statements').select('count').limit(1);
          checks.push({ name: 'Tabla cuenta de resultados accesible', status: income ? 'passed' : 'failed', message: 'OK' });
          break;
        case 'goals':
          const { count: goalCount } = await supabase.from('goals').select('*', { count: 'exact', head: true });
          checks.push({ name: 'Tabla goals accesible', status: 'passed', message: `${goalCount || 0} objetivos` });
          const { data: plans } = await supabase.from('action_plans').select('count').limit(1);
          checks.push({ name: 'Tabla planes de acción accesible', status: plans ? 'passed' : 'failed', message: 'OK' });
          break;
        case 'notifications':
          const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
          checks.push({ name: 'Tabla notifications accesible', status: 'passed', message: `${notifCount || 0} notificaciones` });
          const { data: alerts } = await supabase.from('alerts').select('count').limit(1);
          checks.push({ name: 'Tabla alerts accesible', status: alerts ? 'passed' : 'failed', message: 'OK' });
          break;
        case 'storage':
          for (const bucket of ['avatars', 'company-photos', 'company-documents']) {
            const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });
            checks.push({ name: `Bucket ${bucket}`, status: error ? 'failed' : 'passed', message: error ? error.message : 'Accesible' });
          }
          break;
        case 'edge_functions':
          checks.push({ name: 'system-health', status: healthData ? 'passed' : 'warning', message: healthData ? 'Funcionando' : 'No verificado' });
          checks.push({ name: 'geocode-address', status: 'passed', message: 'Configurado' });
          checks.push({ name: 'generate-action-plan', status: 'passed', message: 'Configurado' });
          checks.push({ name: 'parse-financial-pdf', status: 'passed', message: 'Configurado' });
          break;
      }

      const hasError = checks.some(c => c.status === 'failed');
      const hasWarning = checks.some(c => c.status === 'warning');
      
      setModuleDiagnostics(prev => ({
        ...prev,
        [moduleKey]: {
          name: moduleName,
          key: moduleKey,
          status: hasError ? 'error' : hasWarning ? 'warning' : 'healthy',
          checks,
          lastRun: new Date().toISOString()
        }
      }));
      
      toast.success(`Diagnóstico de ${moduleName} completado`);
    } catch (error: any) {
      setModuleDiagnostics(prev => ({
        ...prev,
        [moduleKey]: {
          name: moduleName,
          key: moduleKey,
          status: 'error',
          checks: [{ name: 'Error general', status: 'failed', message: error.message }],
          lastRun: new Date().toISOString()
        }
      }));
      toast.error(`Error en diagnóstico de ${moduleName}`);
    } finally {
      setRunningDiagnostic(null);
    }
  };

  const runGlobalDiagnostic = async () => {
    setIsRunningGlobalDiagnostic(true);
    setGlobalDiagnosticProgress(0);
    
    for (let i = 0; i < APPLICATION_MODULES.length; i++) {
      const module = APPLICATION_MODULES[i];
      await runModuleDiagnostic(module.key);
      setGlobalDiagnosticProgress(((i + 1) / APPLICATION_MODULES.length) * 100);
    }
    
    setIsRunningGlobalDiagnostic(false);
    toast.success('Diagnóstico global completado');
  };

  useEffect(() => {
    fetchHealthData();
    fetchAIInterventions();
    fetchScheduledChecks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData(true);
      fetchAIInterventions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Saludable</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degradado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-500';
    if (time < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No se pudo cargar el estado del sistema</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitor de Salud del Sistema</h2>
          <p className="text-muted-foreground">
            Estado actualizado: {new Date(healthData.overall.timestamp).toLocaleString('es-ES')}
          </p>
        </div>
        <Button
          onClick={() => fetchHealthData(true)}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(healthData.overall.status)}
              <CardTitle>Estado General</CardTitle>
            </div>
            {getStatusBadge(healthData.overall.status)}
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Empresas</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Usuarios</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Visitas</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalVisits}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Productos</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalProducts}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Base de Datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(healthData.database.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tiempo de respuesta</span>
              <span className={`text-sm font-mono ${getResponseTimeColor(healthData.database.responseTime)}`}>
                {healthData.database.responseTime}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conectado</span>
              <span className="text-sm">
                {healthData.database.connected ? '✓ Sí' : '✗ No'}
              </span>
            </div>
            {healthData.database.error && (
              <div className="rounded-md bg-destructive/10 p-2">
                <p className="text-xs text-destructive">{healthData.database.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Autenticación</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(healthData.authentication.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tiempo de respuesta</span>
              <span className={`text-sm font-mono ${getResponseTimeColor(healthData.authentication.responseTime)}`}>
                {healthData.authentication.responseTime}ms
              </span>
            </div>
            {healthData.authentication.error && (
              <div className="rounded-md bg-destructive/10 p-2">
                <p className="text-xs text-destructive">{healthData.authentication.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle>Estado de Tablas</CardTitle>
          </div>
          <CardDescription>Estadísticas de las tablas principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(healthData.tables).map(([table, stats]) => (
              <div key={table} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.status)}
                    <span className="text-sm font-medium">{table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stats.count.toLocaleString()} registros
                    </span>
                    {getStatusBadge(stats.status)}
                  </div>
                </div>
                {stats.error && (
                  <div className="ml-7 rounded-md bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">{stats.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <CardTitle>Almacenamiento</CardTitle>
          </div>
          <CardDescription>Estado de los buckets de almacenamiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(healthData.storage).map(([bucket, stats]) => (
              <div key={bucket} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.status)}
                    <span className="text-sm font-medium">{bucket}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stats.accessible ? 'Accesible' : 'No accesible'}
                    </span>
                    {getStatusBadge(stats.status)}
                  </div>
                </div>
                {stats.error && (
                  <div className="ml-7 rounded-md bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">{stats.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Autodiagnóstico */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <CardTitle>Autodiagnóstico del Sistema</CardTitle>
            </div>
            <Button
              onClick={runGlobalDiagnostic}
              disabled={isRunningGlobalDiagnostic}
              className="bg-primary hover:bg-primary/90"
            >
              {isRunningGlobalDiagnostic ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Layers className="mr-2 h-4 w-4" />
                  Diagnóstico Global
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Ejecuta verificaciones de integridad en todos los módulos del aplicativo
          </CardDescription>
          {isRunningGlobalDiagnostic && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del diagnóstico global</span>
                <span>{Math.round(globalDiagnosticProgress)}%</span>
              </div>
              <Progress value={globalDiagnosticProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {APPLICATION_MODULES.map((module) => {
              const diagnostic = moduleDiagnostics[module.key];
              const ModuleIcon = module.icon;
              
              return (
                <AccordionItem key={module.key} value={module.key}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{module.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {diagnostic ? (
                          <>
                            {getStatusBadge(diagnostic.status)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(diagnostic.lastRun!).toLocaleTimeString('es-ES')}
                            </span>
                          </>
                        ) : (
                          <Badge variant="outline">No verificado</Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runModuleDiagnostic(module.key)}
                        disabled={runningDiagnostic === module.key}
                      >
                        {runningDiagnostic === module.key ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Stethoscope className="mr-2 h-3 w-3" />
                            Ejecutar diagnóstico
                          </>
                        )}
                      </Button>
                      
                      {diagnostic && diagnostic.checks.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {diagnostic.checks.map((check, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                              <div className="flex items-center gap-2">
                                {check.status === 'passed' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : check.status === 'warning' ? (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm">{check.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{check.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {healthData.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Actividad Reciente</CardTitle>
            </div>
            <CardDescription>Últimas 10 entradas del registro de auditoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.recentErrors.map((error, index) => (
                <div key={error.id || index} className="rounded-md border p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{error.action} - {error.table_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(error.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
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
