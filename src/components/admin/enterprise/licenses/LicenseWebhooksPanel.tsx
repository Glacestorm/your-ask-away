/**
 * License Webhooks Panel
 * Gestión de webhooks e integraciones externas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Webhook,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  Play,
  History,
  Zap
} from 'lucide-react';
import { useLicenseWebhooks, WEBHOOK_EVENTS } from '@/hooks/admin/enterprise/useLicenseWebhooks';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function LicenseWebhooksPanel() {
  const [activeTab, setActiveTab] = useState('webhooks');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    webhook_name: '',
    endpoint_url: '',
    event_types: [] as string[],
    secret_key: '',
    retry_count: 3,
    timeout_seconds: 30
  });

  const {
    webhooks,
    logs: webhookLogs,
    loading,
    fetchWebhooks,
    fetchLogs,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook
  } = useLicenseWebhooks();

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
  }, []);

  const handleCreateWebhook = async () => {
    if (!formData.webhook_name || !formData.endpoint_url || formData.event_types.length === 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const success = await createWebhook({
      webhook_name: formData.webhook_name,
      endpoint_url: formData.endpoint_url,
      event_types: formData.event_types,
      secret_key: formData.secret_key || undefined,
      retry_count: formData.retry_count,
      timeout_seconds: formData.timeout_seconds
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        webhook_name: '',
        endpoint_url: '',
        event_types: [],
        secret_key: '',
        retry_count: 3,
        timeout_seconds: 30
      });
    }
  };

  const handleTestWebhook = async (webhook: typeof webhooks[0]) => {
    await testWebhook(webhook);
  };

  const handleToggleWebhook = async (webhook: typeof webhooks[0]) => {
    await updateWebhook(webhook.id, { is_active: !webhook.is_active });
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (confirm('¿Está seguro de eliminar este webhook?')) {
      await deleteWebhook(webhookId);
    }
  };

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Éxito</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Webhooks Activos</p>
                <p className="text-2xl font-bold">{webhooks.filter(w => w.is_active).length}</p>
              </div>
              <Webhook className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregas Exitosas</p>
                <p className="text-2xl font-bold">{webhookLogs.filter(l => l.status === 'success').length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregas Fallidas</p>
                <p className="text-2xl font-bold">{webhookLogs.filter(l => l.status === 'failed').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Hoy</p>
                <p className="text-2xl font-bold">
                  {webhookLogs.filter(l => 
                    new Date(l.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchWebhooks(); fetchLogs(); }}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Webhook</DialogTitle>
                  <DialogDescription>
                    Configure un endpoint para recibir notificaciones de eventos de licencias
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Webhook *</Label>
                      <Input
                        id="name"
                        placeholder="Mi integración"
                        value={formData.webhook_name}
                        onChange={e => setFormData({ ...formData, webhook_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL del Endpoint *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://api.example.com/webhook"
                        value={formData.endpoint_url}
                        onChange={e => setFormData({ ...formData, endpoint_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Eventos a Escuchar *</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                      {WEBHOOK_EVENTS.map(event => (
                        <div
                          key={event.value}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                            formData.event_types.includes(event.value)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleEventType(event.value)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              formData.event_types.includes(event.value)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {formData.event_types.includes(event.value) && (
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <span className="text-sm font-medium">{event.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="secret">Clave Secreta</Label>
                      <Input
                        id="secret"
                        type="password"
                        placeholder="Opcional"
                        value={formData.secret_key}
                        onChange={e => setFormData({ ...formData, secret_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retries">Reintentos</Label>
                      <Select
                        value={String(formData.retry_count)}
                        onValueChange={v => setFormData({ ...formData, retry_count: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sin reintentos</SelectItem>
                          <SelectItem value="1">1 reintento</SelectItem>
                          <SelectItem value="3">3 reintentos</SelectItem>
                          <SelectItem value="5">5 reintentos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seg)</Label>
                      <Select
                        value={String(formData.timeout_seconds)}
                        onValueChange={v => setFormData({ ...formData, timeout_seconds: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 segundos</SelectItem>
                          <SelectItem value="30">30 segundos</SelectItem>
                          <SelectItem value="60">60 segundos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateWebhook}>
                    Crear Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Eventos</TableHead>
                      <TableHead>Última Entrega</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay webhooks configurados
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhooks.map(webhook => (
                        <TableRow key={webhook.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Webhook className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{webhook.webhook_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {webhook.retry_count} reintentos, {webhook.timeout_seconds}s timeout
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                {webhook.endpoint_url}
                              </code>
                              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                <a href={webhook.endpoint_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {webhook.event_types.slice(0, 2).map(event => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event.split('.')[1]}
                                </Badge>
                              ))}
                              {webhook.event_types.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{webhook.event_types.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {webhook.last_triggered_at ? (
                              <span className="text-sm">
                                {formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true, locale: es })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nunca</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={webhook.is_active}
                              onCheckedChange={() => handleToggleWebhook(webhook)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleTestWebhook(webhook)}
                                title="Probar webhook"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteWebhook(webhook.id)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Entregas
              </CardTitle>
              <CardDescription>
                Registro de todas las notificaciones enviadas a webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Código HTTP</TableHead>
                      <TableHead>Tiempo</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay registros de entregas
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhookLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">{log.event_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {webhooks.find(w => w.id === log.webhook_id)?.webhook_name || 'Desconocido'}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.response_code ? (
                              <Badge variant={log.response_code < 400 ? 'default' : 'destructive'}>
                                {log.response_code}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.response_time_ms ? `${log.response_time_ms}ms` : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LicenseWebhooksPanel;
