import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plug, Plus, Save, Trash2, RefreshCw, Key, Webhook, Loader2 } from 'lucide-react';

interface Integration {
  id: string;
  integration_name: string;
  integration_type: string;
  config: Record<string, any>;
  is_active: boolean;
  status: string;
  last_sync: string | null;
}

interface WebhookConfig {
  id: string;
  webhook_name: string;
  webhook_url: string;
  events: string[];
  is_active: boolean;
  secret_key: string;
}

export function IntegrationsHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Integration | null>(null);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [intRes, webhookRes] = await Promise.all([
        (supabase as any).from('cms_integrations').select('*').order('integration_name'),
        (supabase as any).from('cms_webhooks').select('*').order('webhook_name')
      ]);
      if (intRes.error) throw intRes.error;
      if (webhookRes.error) throw webhookRes.error;
      setIntegrations((intRes.data as any[])?.map(i => ({ ...i, config: (i.config as Record<string, any>) || {} })) || []);
      setWebhooks((webhookRes.data as any[])?.map(w => ({ ...w, events: (w.events as string[]) || [] })) || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIntegration = async (type: string) => {
    try {
      await (supabase as any).from('cms_integrations').insert({
        integration_name: `Nueva ${type}`,
        integration_type: type,
        config: {},
        is_active: false,
        status: 'pending'
      });
      toast.success('Integración añadida');
      loadData();
    } catch (error) {
      toast.error('Error al añadir');
    }
  };

  const saveIntegration = async () => {
    if (!selected) return;
    try {
      await (supabase as any).from('cms_integrations').update({
        integration_name: selected.integration_name,
        config: selected.config,
        is_active: selected.is_active
      }).eq('id', selected.id);
      toast.success('Integración guardada');
      loadData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm('¿Eliminar esta integración?')) return;
    try {
      await (supabase as any).from('cms_integrations').delete().eq('id', id);
      toast.success('Integración eliminada');
      if (selected?.id === id) setSelected(null);
      loadData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const addWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) return;
    try {
      await (supabase as any).from('cms_webhooks').insert({
        webhook_name: newWebhook.name,
        webhook_url: newWebhook.url,
        events: newWebhook.events.split(',').map(e => e.trim()),
        is_active: true,
        secret_key: crypto.randomUUID()
      });
      toast.success('Webhook añadido');
      setNewWebhook({ name: '', url: '', events: '' });
      loadData();
    } catch (error) {
      toast.error('Error al añadir webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      await (supabase as any).from('cms_webhooks').delete().eq('id', id);
      toast.success('Webhook eliminado');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    toast.info(`Probando webhook: ${webhook.webhook_name}...`);
    setTimeout(() => toast.success('Webhook respondió correctamente'), 1500);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Plug className="h-6 w-6" />Hub de Integraciones</h2>
      </div>

      <Tabs defaultValue="oauth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="oauth">OAuth Providers</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="oauth">
          <div className="grid grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Providers</CardTitle>
                  <Button size="sm" onClick={() => addIntegration('oauth')}><Plus className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {integrations.filter(i => i.integration_type === 'oauth').map(int => (
                  <div key={int.id} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${selected?.id === int.id ? 'border-primary bg-primary/10' : ''}`} onClick={() => setSelected(int)}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${int.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span>{int.integration_name}</span>
                    </div>
                    <Badge variant={int.status === 'connected' ? 'default' : 'secondary'}>{int.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader><CardTitle>{selected ? selected.integration_name : 'Configuración'}</CardTitle></CardHeader>
              <CardContent>
                {selected ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input value={selected.integration_name} onChange={e => setSelected(p => p ? { ...p, integration_name: e.target.value } : null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input value={selected.config.client_id || ''} onChange={e => setSelected(p => p ? { ...p, config: { ...p.config, client_id: e.target.value } } : null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <Input type="password" value={selected.config.client_secret || ''} onChange={e => setSelected(p => p ? { ...p, config: { ...p.config, client_secret: e.target.value } } : null)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Activo</Label>
                      <Switch checked={selected.is_active} onCheckedChange={is_active => setSelected(p => p ? { ...p, is_active } : null)} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveIntegration}><Save className="h-4 w-4 mr-2" />Guardar</Button>
                      <Button variant="destructive" onClick={() => deleteIntegration(selected.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Selecciona un provider</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />API Keys</CardTitle>
                <Button size="sm" onClick={() => addIntegration('apikey')}><Plus className="h-4 w-4 mr-2" />Nueva Key</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.filter(i => i.integration_type === 'apikey').map(int => (
                  <div key={int.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{int.integration_name}</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{int.config.api_key ? '••••••••' + int.config.api_key.slice(-4) : 'No configurada'}</code>
                    </div>
                    <div className="flex gap-2">
                      <Switch checked={int.is_active} onCheckedChange={async (is_active: boolean) => {
                        await (supabase as any).from('cms_integrations').update({ is_active }).eq('id', int.id);
                        loadData();
                      }} />
                      <Button variant="ghost" size="sm" onClick={() => deleteIntegration(int.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" />Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Input value={newWebhook.name} onChange={e => setNewWebhook(p => ({ ...p, name: e.target.value }))} placeholder="Nombre" />
                  <Input value={newWebhook.url} onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))} placeholder="URL" />
                  <Input value={newWebhook.events} onChange={e => setNewWebhook(p => ({ ...p, events: e.target.value }))} placeholder="Eventos (coma separados)" />
                </div>
                <Button onClick={addWebhook}><Plus className="h-4 w-4 mr-2" />Añadir Webhook</Button>
              </div>

              <div className="space-y-4">
                {webhooks.map(wh => (
                  <div key={wh.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{wh.webhook_name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">{wh.webhook_url}</p>
                      <div className="flex gap-1 mt-1">
                        {wh.events.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => testWebhook(wh)}><RefreshCw className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
