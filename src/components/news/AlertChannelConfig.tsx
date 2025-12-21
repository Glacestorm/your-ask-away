import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, Bell, Mail, Smartphone, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AlertChannel {
  id: string;
  channel_type: 'whatsapp' | 'telegram' | 'email' | 'push';
  channel_config: {
    phone_number?: string;
    chat_id?: string;
    email?: string;
  };
  is_active: boolean;
  alert_levels: string[];
  cnae_filter: string[];
}

const ALERT_LEVELS = [
  { id: 'critical', label: 'Crítico', color: 'bg-destructive' },
  { id: 'high', label: 'Alto', color: 'bg-orange-500' },
  { id: 'medium', label: 'Medio', color: 'bg-yellow-500' },
  { id: 'low', label: 'Bajo', color: 'bg-blue-500' },
];

const CHANNEL_ICONS = {
  whatsapp: <MessageSquare className="h-5 w-5 text-green-500" />,
  telegram: <Send className="h-5 w-5 text-blue-500" />,
  email: <Mail className="h-5 w-5 text-purple-500" />,
  push: <Bell className="h-5 w-5 text-orange-500" />,
};

export const AlertChannelConfig: React.FC = () => {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_alert_channels')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const typedChannels = (data || []).map(channel => ({
        ...channel,
        channel_type: channel.channel_type as 'whatsapp' | 'telegram' | 'email' | 'push',
        channel_config: (channel.channel_config || {}) as AlertChannel['channel_config'],
        alert_levels: channel.alert_levels || [],
        cnae_filter: channel.cnae_filter || []
      }));
      
      setChannels(typedChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Error al cargar canales de alerta');
    } finally {
      setLoading(false);
    }
  };

  const addChannel = async (type: 'whatsapp' | 'telegram' | 'email' | 'push') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      const newChannel = {
        user_id: user.id,
        channel_type: type,
        channel_config: {},
        is_active: false,
        alert_levels: ['critical', 'high'],
        cnae_filter: [],
      };

      const { data, error } = await supabase
        .from('user_alert_channels')
        .insert(newChannel)
        .select()
        .single();

      if (error) throw error;

      const typedChannel: AlertChannel = {
        ...data,
        channel_type: data.channel_type as 'whatsapp' | 'telegram' | 'email' | 'push',
        channel_config: (data.channel_config || {}) as AlertChannel['channel_config'],
        alert_levels: data.alert_levels || [],
        cnae_filter: data.cnae_filter || []
      };

      setChannels([...channels, typedChannel]);
      toast.success('Canal añadido');
    } catch (error) {
      console.error('Error adding channel:', error);
      toast.error('Error al añadir canal');
    }
  };

  const updateChannel = async (id: string, updates: Partial<AlertChannel>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_alert_channels')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setChannels(channels.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Canal actualizado');
    } catch (error) {
      console.error('Error updating channel:', error);
      toast.error('Error al actualizar canal');
    } finally {
      setSaving(false);
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_alert_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setChannels(channels.filter(c => c.id !== id));
      toast.success('Canal eliminado');
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast.error('Error al eliminar canal');
    }
  };

  const toggleAlertLevel = (channelId: string, level: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    const newLevels = channel.alert_levels.includes(level)
      ? channel.alert_levels.filter(l => l !== level)
      : [...channel.alert_levels, level];

    updateChannel(channelId, { alert_levels: newLevels });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canales de Alerta
          </CardTitle>
          <CardDescription>
            Configura cómo recibir alertas de noticias críticas del sector
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={() => addChannel('whatsapp')}>
              <Plus className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => addChannel('telegram')}>
              <Plus className="h-4 w-4 mr-1" />
              Telegram
            </Button>
            <Button variant="outline" size="sm" onClick={() => addChannel('email')}>
              <Plus className="h-4 w-4 mr-1" />
              Email
            </Button>
          </div>

          {channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tienes canales de alerta configurados</p>
              <p className="text-sm">Añade un canal para recibir notificaciones instantáneas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => (
                <Card key={channel.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {CHANNEL_ICONS[channel.channel_type]}
                        <div>
                          <h4 className="font-medium capitalize">{channel.channel_type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {channel.is_active ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={channel.is_active}
                          onCheckedChange={(checked) => updateChannel(channel.id, { is_active: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChannel(channel.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Channel-specific config */}
                    <div className="space-y-4">
                      {channel.channel_type === 'whatsapp' && (
                        <div>
                          <Label>Número WhatsApp (con código país)</Label>
                          <Input
                            placeholder="+34612345678"
                            value={channel.channel_config?.phone_number || ''}
                            onChange={(e) => updateChannel(channel.id, {
                              channel_config: { ...channel.channel_config, phone_number: e.target.value }
                            })}
                          />
                        </div>
                      )}

                      {channel.channel_type === 'telegram' && (
                        <div>
                          <Label>Chat ID de Telegram</Label>
                          <Input
                            placeholder="123456789"
                            value={channel.channel_config?.chat_id || ''}
                            onChange={(e) => updateChannel(channel.id, {
                              channel_config: { ...channel.channel_config, chat_id: e.target.value }
                            })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Envía /start a @ObelixIABot para obtener tu Chat ID
                          </p>
                        </div>
                      )}

                      {channel.channel_type === 'email' && (
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            value={channel.channel_config?.email || ''}
                            onChange={(e) => updateChannel(channel.id, {
                              channel_config: { ...channel.channel_config, email: e.target.value }
                            })}
                          />
                        </div>
                      )}

                      {/* Alert levels */}
                      <div>
                        <Label className="mb-2 block">Niveles de alerta a recibir</Label>
                        <div className="flex flex-wrap gap-2">
                          {ALERT_LEVELS.map((level) => (
                            <div key={level.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`${channel.id}-${level.id}`}
                                checked={channel.alert_levels.includes(level.id)}
                                onCheckedChange={() => toggleAlertLevel(channel.id, level.id)}
                              />
                              <label
                                htmlFor={`${channel.id}-${level.id}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge variant="secondary" className={level.color + ' text-white'}>
                                  {level.label}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-700 dark:text-orange-400">
                Configuración de APIs requerida
              </h4>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Para WhatsApp se requiere Twilio configurado. Para Telegram, el bot token.
                Contacta con administración para activar estos canales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertChannelConfig;
