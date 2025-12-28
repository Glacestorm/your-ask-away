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
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  });

  const {
    webhooks,
    logs,
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
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const success = await createWebhook({
      name: formData.name,
      url: formData.url,
      events: formData.events
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        name: '',
        url: '',
        events: [],
        secret: ''
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
      events: prev.events.includes(eventType)
        ? prev.events.filter(e => e !== eventType)
        : [...prev.events, eventType]
    }));
  };

  const activeCount = webhooks.filter(w => w.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Webhooks Activos</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <Webhook className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entregas</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Hoy</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => 
                    new Date(l.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <History className="h-8 w-8 text-purple-500" />
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
                    Configure un endpoint para recibir eventos
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        placeholder="Mi webhook"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://api.example.com/webhook"
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
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
                            formData.events.includes(event.value)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleEventType(event.value)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              formData.events.includes(event.value)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {formData.events.includes(event.value) && (
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <span className="text-sm font-medium">{event.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secret">Clave Secreta (opcional)</Label>
                    <Input
                      id="secret"
                      type="password"
                      placeholder="Opcional"
                      value={formData.secret}
                      onChange={e => setFormData({ ...formData, secret: e.target.value })}
                    />
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
                      <TableHead>URL</TableHead>
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
                              <p className="font-medium">{webhook.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                                {webhook.url}
                              </code>
                              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                <a href={webhook.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {webhook.events.slice(0, 2).map(event => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event.split('.')[1]}
                                </Badge>
                              ))}
                              {webhook.events.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{webhook.events.length - 2}
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
                Registro de notificaciones enviadas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Respuesta</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">{log.event_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {webhooks.find(w => w.id === log.webhook_id)?.name || 'Desconocido'}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate block">
                              {log.response_body?.slice(0, 50) || '-'}
                            </code>
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
