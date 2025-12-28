/**
 * ModuleConfigurationPanel - Panel de configuración por módulo
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save,
  RotateCcw,
  AlertTriangle,
  Shield,
  Zap,
  Database,
  Bell,
  Lock,
  Globe,
  Clock,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModuleConfigurationPanelProps {
  moduleKey?: string;
  moduleName?: string;
  className?: string;
}

interface ModuleConfig {
  general: {
    enabled: boolean;
    autoStart: boolean;
    priority: number;
    maxInstances: number;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    maxConcurrentRequests: number;
    requestTimeout: number;
    rateLimit: number;
  };
  security: {
    authRequired: boolean;
    minRole: string;
    ipWhitelist: string;
    auditLogging: boolean;
  };
  alerts: {
    healthThreshold: number;
    responseTimeThreshold: number;
    errorRateThreshold: number;
    notifyOnDegraded: boolean;
    notifyOnError: boolean;
  };
}

const defaultConfig: ModuleConfig = {
  general: {
    enabled: true,
    autoStart: true,
    priority: 5,
    maxInstances: 3,
  },
  performance: {
    cacheEnabled: true,
    cacheTTL: 300,
    maxConcurrentRequests: 100,
    requestTimeout: 30,
    rateLimit: 1000,
  },
  security: {
    authRequired: true,
    minRole: 'user',
    ipWhitelist: '',
    auditLogging: true,
  },
  alerts: {
    healthThreshold: 80,
    responseTimeThreshold: 500,
    errorRateThreshold: 5,
    notifyOnDegraded: true,
    notifyOnError: true,
  }
};

export function ModuleConfigurationPanel({ 
  moduleKey, 
  moduleName = 'Módulo',
  className 
}: ModuleConfigurationPanelProps) {
  const [config, setConfig] = useState<ModuleConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const updateConfig = <K extends keyof ModuleConfig>(
    section: K,
    key: keyof ModuleConfig[K],
    value: ModuleConfig[K][keyof ModuleConfig[K]]
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    toast.success('Configuración guardada correctamente');
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setHasChanges(false);
    setShowResetDialog(false);
    toast.info('Configuración restaurada a valores por defecto');
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Configuración
                {moduleKey && <Badge variant="outline" className="text-xs">{moduleKey}</Badge>}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ajustes de {moduleName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Cambios sin guardar
              </Badge>
            )}
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Restaurar configuración</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de restaurar la configuración por defecto? Esto eliminará todos los cambios personalizados.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleReset}>
                    Restaurar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="general" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[340px]">
            {/* General Tab */}
            <TabsContent value="general" className="mt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Módulo Habilitado</Label>
                  <p className="text-xs text-muted-foreground">Activar o desactivar el módulo</p>
                </div>
                <Switch
                  checked={config.general.enabled}
                  onCheckedChange={(v) => updateConfig('general', 'enabled', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Inicio Automático</Label>
                  <p className="text-xs text-muted-foreground">Iniciar al arrancar el sistema</p>
                </div>
                <Switch
                  checked={config.general.autoStart}
                  onCheckedChange={(v) => updateConfig('general', 'autoStart', v)}
                />
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Prioridad</Label>
                  <span className="text-sm font-mono">{config.general.priority}</span>
                </div>
                <Slider
                  value={[config.general.priority]}
                  onValueChange={([v]) => updateConfig('general', 'priority', v)}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">1 = más alta, 10 = más baja</p>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Máximo de Instancias</Label>
                <Input
                  type="number"
                  value={config.general.maxInstances}
                  onChange={(e) => updateConfig('general', 'maxInstances', parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                />
                <p className="text-xs text-muted-foreground">Número máximo de instancias paralelas</p>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Cache Habilitado</Label>
                  <p className="text-xs text-muted-foreground">Mejorar rendimiento con caché</p>
                </div>
                <Switch
                  checked={config.performance.cacheEnabled}
                  onCheckedChange={(v) => updateConfig('performance', 'cacheEnabled', v)}
                />
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">TTL de Cache (segundos)</Label>
                <Input
                  type="number"
                  value={config.performance.cacheTTL}
                  onChange={(e) => updateConfig('performance', 'cacheTTL', parseInt(e.target.value) || 60)}
                  min={60}
                  max={3600}
                  disabled={!config.performance.cacheEnabled}
                />
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Requests Concurrentes Máx.</Label>
                <Input
                  type="number"
                  value={config.performance.maxConcurrentRequests}
                  onChange={(e) => updateConfig('performance', 'maxConcurrentRequests', parseInt(e.target.value) || 10)}
                  min={10}
                  max={1000}
                />
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Timeout de Request (segundos)</Label>
                <Input
                  type="number"
                  value={config.performance.requestTimeout}
                  onChange={(e) => updateConfig('performance', 'requestTimeout', parseInt(e.target.value) || 10)}
                  min={5}
                  max={120}
                />
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Rate Limit (req/min)</Label>
                <Input
                  type="number"
                  value={config.performance.rateLimit}
                  onChange={(e) => updateConfig('performance', 'rateLimit', parseInt(e.target.value) || 100)}
                  min={100}
                  max={10000}
                />
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Autenticación Requerida</Label>
                  <p className="text-xs text-muted-foreground">Requiere usuario autenticado</p>
                </div>
                <Switch
                  checked={config.security.authRequired}
                  onCheckedChange={(v) => updateConfig('security', 'authRequired', v)}
                />
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Rol Mínimo</Label>
                <Select
                  value={config.security.minRole}
                  onValueChange={(v) => updateConfig('security', 'minRole', v)}
                  disabled={!config.security.authRequired}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">IP Whitelist</Label>
                <Textarea
                  value={config.security.ipWhitelist}
                  onChange={(e) => updateConfig('security', 'ipWhitelist', e.target.value)}
                  placeholder="Ej: 192.168.1.0/24&#10;10.0.0.1"
                  className="h-20 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Una IP/CIDR por línea. Dejar vacío para permitir todas.</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Audit Logging</Label>
                  <p className="text-xs text-muted-foreground">Registrar todas las acciones</p>
                </div>
                <Switch
                  checked={config.security.auditLogging}
                  onCheckedChange={(v) => updateConfig('security', 'auditLogging', v)}
                />
              </div>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="mt-0 space-y-4">
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Umbral de Health (%)</Label>
                  <span className="text-sm font-mono">{config.alerts.healthThreshold}%</span>
                </div>
                <Slider
                  value={[config.alerts.healthThreshold]}
                  onValueChange={([v]) => updateConfig('alerts', 'healthThreshold', v)}
                  min={50}
                  max={99}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">Alertar si health baja de este valor</p>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Umbral de Response Time (ms)</Label>
                <Input
                  type="number"
                  value={config.alerts.responseTimeThreshold}
                  onChange={(e) => updateConfig('alerts', 'responseTimeThreshold', parseInt(e.target.value) || 100)}
                  min={100}
                  max={5000}
                />
                <p className="text-xs text-muted-foreground">Alertar si supera este tiempo</p>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <Label className="font-medium">Umbral de Error Rate (%)</Label>
                <Input
                  type="number"
                  value={config.alerts.errorRateThreshold}
                  onChange={(e) => updateConfig('alerts', 'errorRateThreshold', parseInt(e.target.value) || 1)}
                  min={1}
                  max={50}
                />
                <p className="text-xs text-muted-foreground">Alertar si tasa de errores supera este valor</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Notificar en Degradado</Label>
                  <p className="text-xs text-muted-foreground">Alerta cuando el módulo se degrada</p>
                </div>
                <Switch
                  checked={config.alerts.notifyOnDegraded}
                  onCheckedChange={(v) => updateConfig('alerts', 'notifyOnDegraded', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <Label className="font-medium">Notificar en Error</Label>
                  <p className="text-xs text-muted-foreground">Alerta cuando ocurren errores</p>
                </div>
                <Switch
                  checked={config.alerts.notifyOnError}
                  onCheckedChange={(v) => updateConfig('alerts', 'notifyOnError', v)}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleConfigurationPanel;
