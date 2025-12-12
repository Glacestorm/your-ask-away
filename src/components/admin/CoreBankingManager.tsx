import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Database, Settings, ArrowLeftRight, Plus, RefreshCw, CheckCircle, 
  XCircle, Clock, AlertTriangle, Zap, Building2, CreditCard, Send
} from 'lucide-react';
import { format } from 'date-fns';

interface CoreBankingConfig {
  id: string;
  entity_name: string;
  core_type: string;
  api_endpoint: string;
  api_version: string;
  auth_type: string;
  auth_config: any;
  is_active: boolean;
  timeout_ms: number;
  retry_config: any;
  created_at: string;
}

interface IntegrationMapping {
  id: string;
  config_id: string;
  entity_type: string;
  obelixia_field: string;
  core_field: string;
  transformation_rule: any;
  direction: string;
  is_required: boolean;
  default_value: string | null;
}

interface IntegrationQueueItem {
  id: string;
  config_id: string;
  operation_type: string;
  payload: any;
  status: string;
  priority: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export function CoreBankingManager() {
  const [configs, setConfigs] = useState<CoreBankingConfig[]>([]);
  const [mappings, setMappings] = useState<IntegrationMapping[]>([]);
  const [queueItems, setQueueItems] = useState<IntegrationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  // Form states  
  const [configForm, setConfigForm] = useState({
    entity_name: '',
    core_type: 'temenos',
    api_endpoint: '',
    api_version: 'v1',
    auth_type: 'api_key',
    timeout_ms: 30000,
    is_active: true
  });

  const [mappingForm, setMappingForm] = useState({
    entity_type: 'company',
    obelixia_field: '',
    core_field: '',
    direction: 'bidirectional',
    is_required: false,
    default_value: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configsRes, mappingsRes, queueRes] = await Promise.all([
        supabase.from('core_banking_configs').select('*').order('created_at', { ascending: false }),
        supabase.from('integration_mappings').select('*').order('entity_type'),
        supabase.from('integration_queue').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (configsRes.data) setConfigs(configsRes.data);
      if (mappingsRes.data) setMappings(mappingsRes.data);
      if (queueRes.data) setQueueItems(queueRes.data);
    } catch (error) {
      console.error('Error fetching core banking data:', error);
      toast.error('Error al cargar datos de Core Banking');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      const { error } = await supabase.from('core_banking_configs').insert({
        ...configForm,
        auth_config: {},
        retry_config: { maxRetries: 3, backoffMs: 1000 }
      });

      if (error) throw error;
      toast.success('Configuración creada correctamente');
      setShowConfigDialog(false);
      setConfigForm({
        entity_name: '',
        core_type: 'temenos',
        api_endpoint: '',
        api_version: 'v1',
        auth_type: 'api_key',
        timeout_ms: 30000,
        is_active: true
      });
      fetchData();
    } catch (error) {
      console.error('Error creating config:', error);
      toast.error('Error al crear configuración');
    }
  };

  const handleCreateMapping = async () => {
    if (!selectedConfig) {
      toast.error('Selecciona una configuración primero');
      return;
    }

    try {
      const { error } = await supabase.from('integration_mappings').insert({
        config_id: selectedConfig,
        ...mappingForm,
        transformation_rule: null
      });

      if (error) throw error;
      toast.success('Mapeo creado correctamente');
      setShowMappingDialog(false);
      setMappingForm({
        entity_type: 'company',
        obelixia_field: '',
        core_field: '',
        direction: 'bidirectional',
        is_required: false,
        default_value: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast.error('Error al crear mapeo');
    }
  };

  const handleToggleConfig = async (configId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('core_banking_configs')
        .update({ is_active: !isActive })
        .eq('id', configId);

      if (error) throw error;
      toast.success(isActive ? 'Configuración desactivada' : 'Configuración activada');
      fetchData();
    } catch (error) {
      console.error('Error toggling config:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleRetryQueueItem = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('integration_queue')
        .update({ status: 'pending', error_message: null, started_at: null })
        .eq('id', queueId);

      if (error) throw error;
      toast.success('Operación reencolada');
      fetchData();
    } catch (error) {
      console.error('Error retrying queue item:', error);
      toast.error('Error al reencolar');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Procesando</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const getCoreTypeIcon = (coreType: string) => {
    switch (coreType) {
      case 'temenos':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'finastra':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'mambu':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'thought_machine':
        return <Database className="w-4 h-4 text-green-500" />;
      default:
        return <Settings className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Core Banking Integration</h2>
          <p className="text-muted-foreground">Gestión de adaptadores e integraciones con sistemas bancarios</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{configs.length}</p>
                <p className="text-xs text-muted-foreground">Configuraciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{configs.filter(c => c.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <ArrowLeftRight className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mappings.length}</p>
                <p className="text-xs text-muted-foreground">Mapeos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{queueItems.filter(q => q.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">En Cola</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Configuraciones</TabsTrigger>
          <TabsTrigger value="mappings">Mapeos de Campos</TabsTrigger>
          <TabsTrigger value="queue">Cola de Operaciones</TabsTrigger>
          <TabsTrigger value="sepa">SEPA Instant</TabsTrigger>
          <TabsTrigger value="vrp">VRP</TabsTrigger>
        </TabsList>

        {/* Configurations Tab */}
        <TabsContent value="configs" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Configuración
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva Configuración Core Banking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input 
                      value={configForm.entity_name}
                      onChange={(e) => setConfigForm({...configForm, entity_name: e.target.value})}
                      placeholder="Producción Temenos"
                    />
                  </div>
                  <div>
                    <Label>Tipo de Core</Label>
                    <Select value={configForm.core_type} onValueChange={(v) => setConfigForm({...configForm, core_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temenos">Temenos T24/Transact</SelectItem>
                        <SelectItem value="finastra">Finastra Fusion</SelectItem>
                        <SelectItem value="mambu">Mambu</SelectItem>
                        <SelectItem value="thought_machine">Thought Machine Vault</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>API Endpoint</Label>
                    <Input 
                      value={configForm.api_endpoint}
                      onChange={(e) => setConfigForm({...configForm, api_endpoint: e.target.value})}
                      placeholder="https://core.bank.com/api"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Versión API</Label>
                      <Input 
                        value={configForm.api_version}
                        onChange={(e) => setConfigForm({...configForm, api_version: e.target.value})}
                        placeholder="v1"
                      />
                    </div>
                    <div>
                      <Label>Timeout (ms)</Label>
                      <Input 
                        type="number"
                        value={configForm.timeout_ms}
                        onChange={(e) => setConfigForm({...configForm, timeout_ms: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tipo de Autenticación</Label>
                    <Select value={configForm.auth_type} onValueChange={(v) => setConfigForm({...configForm, auth_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                        <SelectItem value="jwt">JWT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={configForm.is_active}
                      onCheckedChange={(c) => setConfigForm({...configForm, is_active: c})}
                    />
                    <Label>Activo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreateConfig}>Crear</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id} className={!config.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getCoreTypeIcon(config.core_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{config.entity_name}</h3>
                          <Badge variant="outline">{config.core_type}</Badge>
                          {config.is_active ? (
                            <Badge className="bg-green-500/20 text-green-600">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{config.api_endpoint}</p>
                        <p className="text-xs text-muted-foreground">
                          Auth: {config.auth_type} | Timeout: {config.timeout_ms}ms | v{config.api_version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedConfig(config.id)}
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-1" />
                        Mapeos
                      </Button>
                      <Switch 
                        checked={config.is_active}
                        onCheckedChange={() => handleToggleConfig(config.id, config.is_active)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {configs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay configuraciones de Core Banking</p>
                  <p className="text-sm">Crea una configuración para conectar con tu sistema bancario</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {selectedConfig && (
                <Badge variant="outline">
                  Configuración: {configs.find(c => c.id === selectedConfig)?.entity_name}
                </Badge>
              )}
            </div>
            <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
              <DialogTrigger asChild>
                <Button disabled={!selectedConfig}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Mapeo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Mapeo de Campos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Entidad</Label>
                    <Select value={mappingForm.entity_type} onValueChange={(v) => setMappingForm({...mappingForm, entity_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Empresa</SelectItem>
                        <SelectItem value="contact">Contacto</SelectItem>
                        <SelectItem value="account">Cuenta</SelectItem>
                        <SelectItem value="transaction">Transacción</SelectItem>
                        <SelectItem value="product">Producto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Campo ObelixIA</Label>
                      <Input 
                        value={mappingForm.obelixia_field}
                        onChange={(e) => setMappingForm({...mappingForm, obelixia_field: e.target.value})}
                        placeholder="tax_id"
                      />
                    </div>
                    <div>
                      <Label>Campo Core Banking</Label>
                      <Input 
                        value={mappingForm.core_field}
                        onChange={(e) => setMappingForm({...mappingForm, core_field: e.target.value})}
                        placeholder="CUSTOMER.TAX.ID"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <Select value={mappingForm.direction} onValueChange={(v) => setMappingForm({...mappingForm, direction: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Entrada (Core → ObelixIA)</SelectItem>
                        <SelectItem value="outbound">Salida (ObelixIA → Core)</SelectItem>
                        <SelectItem value="bidirectional">Bidireccional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={mappingForm.is_required}
                      onCheckedChange={(c) => setMappingForm({...mappingForm, is_required: c})}
                    />
                    <Label>Campo requerido</Label>
                  </div>
                  <div>
                    <Label>Valor por defecto</Label>
                    <Input 
                      value={mappingForm.default_value}
                      onChange={(e) => setMappingForm({...mappingForm, default_value: e.target.value})}
                      placeholder="(opcional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMappingDialog(false)}>Cancelar</Button>
                  <Button onClick={handleCreateMapping}>Crear</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Campo ObelixIA</TableHead>
                  <TableHead>Campo Core</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Requerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.filter(m => !selectedConfig || m.config_id === selectedConfig).map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <Badge variant="outline">{mapping.entity_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{mapping.obelixia_field}</TableCell>
                    <TableCell className="font-mono text-sm">{mapping.core_field}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {mapping.direction === 'inbound' ? '← Entrada' : 
                         mapping.direction === 'outbound' ? '→ Salida' : '↔ Bidireccional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mapping.is_required ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {mappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay mapeos configurados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Completado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{item.operation_type}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Badge variant={item.priority >= 8 ? 'destructive' : item.priority >= 5 ? 'default' : 'secondary'}>
                        P{item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'dd/MM HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.completed_at ? format(new Date(item.completed_at), 'dd/MM HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      {item.status === 'failed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetryQueueItem(item.id)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {queueItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay operaciones en cola
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* SEPA Instant Tab */}
        <TabsContent value="sepa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                SEPA Instant Payments (SCT Inst)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-green-600">≤10s</p>
                      <p className="text-sm text-muted-foreground">Tiempo máximo</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-blue-600">100.000€</p>
                      <p className="text-sm text-muted-foreground">Límite por transacción</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-purple-600">24/7/365</p>
                      <p className="text-sm text-muted-foreground">Disponibilidad</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Endpoint API</h4>
                  <code className="text-sm bg-background p-2 rounded block">
                    POST /functions/v1/open-banking-api/sepa-instant
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Requiere suscripción Premium con feature 'sepa_instant' habilitado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VRP Tab */}
        <TabsContent value="vrp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                Variable Recurring Payments (VRP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Mandatos VRP</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pagos recurrentes variables con límites configurables por frecuencia
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Frecuencias soportadas:</span>
                        <span className="font-mono">diaria, semanal, mensual, trimestral, anual</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Límite máximo por transacción:</span>
                        <span>Configurable</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Límite por período:</span>
                        <span>Configurable</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Endpoints VRP</h4>
                    <div className="space-y-2 text-sm font-mono">
                      <div className="p-2 bg-muted rounded">POST /vrp/mandates</div>
                      <div className="p-2 bg-muted rounded">GET /vrp/mandates/:id</div>
                      <div className="p-2 bg-muted rounded">POST /vrp/mandates/:id/authorise</div>
                      <div className="p-2 bg-muted rounded">POST /vrp/mandates/:id/payments</div>
                      <div className="p-2 bg-muted rounded">DELETE /vrp/mandates/:id</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-amber-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-600">Requisitos</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Suscripción Premium con feature 'vrp' habilitado</li>
                    <li>• Consentimiento PSD2 válido para 'payments'</li>
                    <li>• Autenticación TPP registrada</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
