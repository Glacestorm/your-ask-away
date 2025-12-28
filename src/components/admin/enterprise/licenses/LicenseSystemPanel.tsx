// License System Control Panel - Phase 7
// Enterprise License System 2025 - Unified Dashboard

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Settings,
  Shield,
  Activity,
  Database,
  Bell,
  Key,
  Code,
  FileText,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Server,
  Cpu,
  HardDrive
} from 'lucide-react';
import { useLicenseSystem, LicenseSystemConfig, APIKey } from '@/hooks/admin/enterprise/useLicenseSystem';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function LicenseSystemPanel() {
  const [activeTab, setActiveTab] = useState('health');
  const [isCreateKeyDialogOpen, setIsCreateKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['validate', 'activate']);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Partial<LicenseSystemConfig>>({});

  const {
    isLoading,
    config,
    health,
    auditLogs,
    apiKeys,
    fetchConfig,
    updateConfig,
    checkHealth,
    startHealthMonitoring,
    stopHealthMonitoring,
    createAPIKey,
    revokeAPIKey,
    getAPIEndpoints,
    exportSystemData
  } = useLicenseSystem();

  // === INIT ===
  useEffect(() => {
    startHealthMonitoring(60000);
    return () => stopHealthMonitoring();
  }, [startHealthMonitoring, stopHealthMonitoring]);

  // === HANDLERS ===
  const handleConfigChange = useCallback((key: keyof LicenseSystemConfig, value: unknown) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveConfig = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    
    await updateConfig(pendingChanges);
    setPendingChanges({});
  }, [pendingChanges, updateConfig]);

  const handleCreateAPIKey = useCallback(async () => {
    if (!newKeyName) return;
    
    const result = await createAPIKey(newKeyName, newKeyPermissions, 90);
    if (result) {
      setShowNewKey(result.key);
      setNewKeyName('');
      setNewKeyPermissions(['validate', 'activate']);
    }
  }, [newKeyName, newKeyPermissions, createAPIKey]);

  const handleCopyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key copiada al portapapeles');
  }, []);

  const getConfigValue = useCallback(<K extends keyof LicenseSystemConfig>(
    key: K
  ): LicenseSystemConfig[K] | undefined => {
    return (pendingChanges[key] ?? config?.[key]) as LicenseSystemConfig[K] | undefined;
  }, [config, pendingChanges]);

  const endpoints = getAPIEndpoints();

  // === STATUS BADGE ===
  const getStatusBadge = (status: 'operational' | 'degraded' | 'down' | 'healthy' | 'critical') => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operacional</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degradado</Badge>;
      case 'down':
      case 'critical':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Crítico</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Sistema de Licencias
          </h2>
          <p className="text-muted-foreground">
            Panel de control y configuración centralizada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => exportSystemData(true, true, false)}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline"
            size="icon"
            onClick={checkHealth}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado del Sistema</p>
                <div className="mt-1">
                  {health && getStatusBadge(health.status)}
                </div>
              </div>
              <Server className={cn(
                "h-8 w-8",
                health?.status === 'healthy' ? "text-green-500" :
                health?.status === 'degraded' ? "text-yellow-500" : "text-red-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validaciones (24h)</p>
                <p className="text-2xl font-bold">
                  {health?.metrics.validationsLast24h.toLocaleString() || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activaciones (24h)</p>
                <p className="text-2xl font-bold">
                  {health?.metrics.activationsLast24h.toLocaleString() || 0}
                </p>
              </div>
              <Zap className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalías (24h)</p>
                <p className="text-2xl font-bold">
                  {health?.metrics.anomaliesLast24h || 0}
                </p>
              </div>
              <AlertTriangle className={cn(
                "h-8 w-8",
                (health?.metrics.anomaliesLast24h || 0) > 10 ? "text-red-500" : "text-muted-foreground"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Salud
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Components Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Componentes</CardTitle>
                <CardDescription>
                  Monitoreo en tiempo real del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {health && Object.entries(health.components).map(([name, component]) => (
                  <div 
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        component.status === 'operational' ? "bg-green-500/10" :
                        component.status === 'degraded' ? "bg-yellow-500/10" : "bg-red-500/10"
                      )}>
                        {component.status === 'operational' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : component.status === 'degraded' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{name}</p>
                        {component.latency && (
                          <p className="text-xs text-muted-foreground">
                            Latencia: {component.latency}ms
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(component.status)}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas del Sistema</CardTitle>
                <CardDescription>
                  Rendimiento y estadísticas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-5 w-5 text-muted-foreground" />
                    <span>Tiempo de Respuesta</span>
                  </div>
                  <span className="font-medium">{health?.metrics.avgResponseTime || 0}ms</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span>Uptime</span>
                  </div>
                  <span className="font-medium">{health?.uptime || 0}%</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Última Verificación</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {health?.lastChecked && formatDistanceToNow(new Date(health.lastChecked), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuración del Sistema</CardTitle>
                  <CardDescription>
                    Ajusta los parámetros del sistema de licencias
                  </CardDescription>
                </div>
                {Object.keys(pendingChanges).length > 0 && (
                  <Button onClick={handleSaveConfig}>
                    Guardar Cambios
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validation Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Validación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Cache TTL (minutos)</Label>
                    <Slider
                      value={[getConfigValue('validationCacheTTL') || 60]}
                      onValueChange={([v]) => handleConfigChange('validationCacheTTL', v)}
                      min={5}
                      max={1440}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {getConfigValue('validationCacheTTL') || 60} minutos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Periodo de Gracia Offline (horas)</Label>
                    <Slider
                      value={[getConfigValue('offlineGracePeriod') || 72]}
                      onValueChange={([v]) => handleConfigChange('offlineGracePeriod', v)}
                      min={1}
                      max={168}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      {getConfigValue('offlineGracePeriod') || 72} horas
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Requerir Validación Online</Label>
                    <Switch
                      checked={getConfigValue('requireOnlineValidation') || false}
                      onCheckedChange={(v) => handleConfigChange('requireOnlineValidation', v)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Seguridad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Máximo Dispositivos por Licencia</Label>
                    <Slider
                      value={[getConfigValue('maxDevicesPerLicense') || 5]}
                      onValueChange={([v]) => handleConfigChange('maxDevicesPerLicense', v)}
                      min={1}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      {getConfigValue('maxDevicesPerLicense') || 5} dispositivos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Fuerza del Fingerprint</Label>
                    <Select 
                      value={getConfigValue('deviceFingerprintStrength') || 'high'}
                      onValueChange={(v) => handleConfigChange('deviceFingerprintStrength', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Detección de Anomalías</Label>
                    <Switch
                      checked={getConfigValue('anomalyDetectionEnabled') ?? true}
                      onCheckedChange={(v) => handleConfigChange('anomalyDetectionEnabled', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-Suspender en Anomalía</Label>
                    <Switch
                      checked={getConfigValue('autoSuspendOnAnomaly') || false}
                      onCheckedChange={(v) => handleConfigChange('autoSuspendOnAnomaly', v)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div className="flex items-center justify-between">
                    <Label>Notificaciones por Email</Label>
                    <Switch
                      checked={getConfigValue('sendEmailNotifications') ?? true}
                      onCheckedChange={(v) => handleConfigChange('sendEmailNotifications', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Notificaciones In-App</Label>
                    <Switch
                      checked={getConfigValue('sendInAppNotifications') ?? true}
                      onCheckedChange={(v) => handleConfigChange('sendInAppNotifications', v)}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={getConfigValue('webhookUrl') || ''}
                      onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentación de API</CardTitle>
              <CardDescription>
                Endpoints disponibles para integración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={
                          endpoint.method === 'GET' ? 'default' :
                          endpoint.method === 'POST' ? 'secondary' :
                          endpoint.method === 'PUT' ? 'outline' : 'destructive'
                        }>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                        <Badge variant="outline" className="ml-auto">
                          {endpoint.authentication}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {endpoint.description}
                      </p>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium mb-2">Respuesta de ejemplo:</p>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(endpoint.example.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Gestiona las claves de acceso a la API
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateKeyDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Key className="h-16 w-16 mb-4 opacity-50" />
                  <p>No hay API Keys creadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div 
                      key={key.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        !key.isActive && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          key.isActive ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          <Key className={cn(
                            "h-4 w-4",
                            key.isActive ? "text-green-500" : "text-red-500"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <code className="text-xs text-muted-foreground">
                            {key.keyPrefix}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {key.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                        {key.isActive && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive"
                            onClick={() => revokeAPIKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Auditoría</CardTitle>
              <CardDescription>
                Historial de acciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4 opacity-50" />
                  <p>Sin registros de auditoría</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            log.severity === 'info' ? 'secondary' :
                            log.severity === 'warning' ? 'outline' :
                            log.severity === 'error' ? 'destructive' : 'destructive'
                          }>
                            {log.severity}
                          </Badge>
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.entityType} {log.entityId && `• ${log.entityId.substring(0, 8)}...`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'dd/MM HH:mm', { locale: es })}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateKeyDialogOpen} onOpenChange={setIsCreateKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear API Key</DialogTitle>
            <DialogDescription>
              Crea una nueva clave de acceso a la API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ej: Production API"
              />
            </div>
            <div className="space-y-2">
              <Label>Permisos</Label>
              <div className="flex flex-wrap gap-2">
                {['validate', 'activate', 'deactivate', 'status', 'admin'].map((perm) => (
                  <Badge
                    key={perm}
                    variant={newKeyPermissions.includes(perm) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewKeyPermissions(prev => 
                        prev.includes(perm) 
                          ? prev.filter(p => p !== perm)
                          : [...prev, perm]
                      );
                    }}
                  >
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateKeyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAPIKey} disabled={!newKeyName}>
              Crear Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog open={!!showNewKey} onOpenChange={() => setShowNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Creada</DialogTitle>
            <DialogDescription>
              Guarda esta clave de forma segura. No podrás verla de nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted font-mono text-sm break-all flex items-center gap-2">
              <span className="flex-1">{showNewKey}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => showNewKey && handleCopyKey(showNewKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewKey(null)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LicenseSystemPanel;
