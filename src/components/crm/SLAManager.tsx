import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Settings, 
  Bell,
  Timer,
  TrendingUp,
  Users,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SLAConfig {
  id: string;
  name: string;
  channel: string;
  priority: string;
  first_response_minutes: number;
  resolution_hours: number;
  escalation_after_minutes: number;
  business_hours_only: boolean;
  is_active: boolean;
}

interface SLATracking {
  id: string;
  conversation_id: string;
  sla_config_id: string;
  first_response_at: string | null;
  first_response_met: boolean | null;
  resolution_at: string | null;
  resolution_met: boolean | null;
  escalated_at: string | null;
  status: string;
  created_at: string;
}

interface SLAMetrics {
  totalConversations: number;
  firstResponseMet: number;
  resolutionMet: number;
  breached: number;
  avgFirstResponseMinutes: number;
  avgResolutionHours: number;
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-500" />,
  email: <Mail className="h-4 w-4 text-blue-500" />,
  phone: <Phone className="h-4 w-4 text-purple-500" />,
  chat: <MessageSquare className="h-4 w-4 text-cyan-500" />,
};

export function SLAManager() {
  const [slaConfigs, setSLAConfigs] = useState<SLAConfig[]>([]);
  const [slaTracking, setSLATracking] = useState<SLATracking[]>([]);
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newConfig, setNewConfig] = useState<Partial<SLAConfig>>({
    name: '',
    channel: 'whatsapp',
    priority: 'normal',
    first_response_minutes: 30,
    resolution_hours: 24,
    escalation_after_minutes: 60,
    business_hours_only: true,
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch SLA configs
      const { data: configs, error: configError } = await supabase
        .from('sla_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (configError) throw configError;
      setSLAConfigs((configs as SLAConfig[]) || []);

      // Fetch recent SLA tracking
      const { data: tracking, error: trackingError } = await supabase
        .from('sla_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (trackingError) throw trackingError;
      setSLATracking((tracking as SLATracking[]) || []);

      // Calculate metrics
      if (tracking && tracking.length > 0) {
        const typedTracking = tracking as SLATracking[];
        const total = typedTracking.length;
        const firstMet = typedTracking.filter(t => t.first_response_met === true).length;
        const resMet = typedTracking.filter(t => t.resolution_met === true).length;
        const breached = typedTracking.filter(t => t.status === 'breached').length;

        setMetrics({
          totalConversations: total,
          firstResponseMet: firstMet,
          resolutionMet: resMet,
          breached,
          avgFirstResponseMinutes: 0, // Would calculate from actual data
          avgResolutionHours: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching SLA data:', error);
      toast.error('Error al cargar datos de SLA');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createSLAConfig = async () => {
    if (!newConfig.name || !newConfig.channel) {
      toast.error('Nombre y canal son requeridos');
      return;
    }

    try {
      const configToInsert = {
        name: newConfig.name!,
        channel: newConfig.channel!,
        priority: newConfig.priority || 'normal',
        first_response_minutes: newConfig.first_response_minutes || 30,
        resolution_hours: newConfig.resolution_hours || 24,
        escalation_after_minutes: newConfig.escalation_after_minutes || 60,
        business_hours_only: newConfig.business_hours_only ?? true,
        is_active: newConfig.is_active ?? true,
      };
      const { error } = await supabase
        .from('sla_configs')
        .insert([configToInsert]);

      if (error) throw error;

      toast.success('SLA creado correctamente');
      setIsDialogOpen(false);
      setNewConfig({
        name: '',
        channel: 'whatsapp',
        priority: 'normal',
        first_response_minutes: 30,
        resolution_hours: 24,
        escalation_after_minutes: 60,
        business_hours_only: true,
        is_active: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error creating SLA config:', error);
      toast.error('Error al crear SLA');
    }
  };

  const toggleSLAStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sla_configs')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setSLAConfigs(prev => 
        prev.map(config => 
          config.id === id ? { ...config, is_active: !isActive } : config
        )
      );
      toast.success(`SLA ${!isActive ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error toggling SLA status:', error);
      toast.error('Error al actualizar SLA');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'met':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Cumplido</Badge>;
      case 'breached':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Incumplido</Badge>;
      case 'escalated':
        return <Badge className="bg-orange-500"><Bell className="h-3 w-3 mr-1" /> Escalado</Badge>;
      default:
        return <Badge variant="secondary"><Timer className="h-3 w-3 mr-1" /> Activo</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Gestión de SLAs
          </h2>
          <p className="text-muted-foreground">
            Configura y monitorea los niveles de servicio
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo SLA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Configuración SLA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newConfig.name || ''}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: SLA WhatsApp Premium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={newConfig.channel}
                    onValueChange={(v) => setNewConfig(prev => ({ ...prev, channel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                      <SelectItem value="chat">Chat Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={newConfig.priority}
                    onValueChange={(v) => setNewConfig(prev => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>1ª Respuesta (min)</Label>
                  <Input
                    type="number"
                    value={newConfig.first_response_minutes || 30}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, first_response_minutes: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resolución (horas)</Label>
                  <Input
                    type="number"
                    value={newConfig.resolution_hours || 24}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, resolution_hours: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Escalado después de (min)</Label>
                <Input
                  type="number"
                  value={newConfig.escalation_after_minutes || 60}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, escalation_after_minutes: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Solo horario laboral</Label>
                <Switch
                  checked={newConfig.business_hours_only}
                  onCheckedChange={(v) => setNewConfig(prev => ({ ...prev, business_hours_only: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={createSLAConfig}>Crear SLA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Conversaciones</p>
                  <p className="text-2xl font-bold">{metrics.totalConversations}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">1ª Respuesta OK</p>
                  <p className="text-2xl font-bold text-green-500">
                    {metrics.totalConversations > 0 
                      ? Math.round((metrics.firstResponseMet / metrics.totalConversations) * 100)
                      : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolución OK</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {metrics.totalConversations > 0 
                      ? Math.round((metrics.resolutionMet / metrics.totalConversations) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SLA Incumplidos</p>
                  <p className="text-2xl font-bold text-red-500">{metrics.breached}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* SLA Configurations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuraciones SLA
            </CardTitle>
            <CardDescription>Políticas de nivel de servicio activas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : slaConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay configuraciones SLA. Crea una nueva.
                </div>
              ) : (
                <div className="space-y-3">
                  {slaConfigs.map((config) => (
                    <Card key={config.id} className={`${!config.is_active ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {channelIcons[config.channel] || <MessageSquare className="h-4 w-4" />}
                            <span className="font-medium">{config.name}</span>
                          </div>
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => toggleSLAStatus(config.id, config.is_active)}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">1ª Resp:</span>
                            <span className="ml-1 font-medium">{config.first_response_minutes}min</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Resolución:</span>
                            <span className="ml-1 font-medium">{config.resolution_hours}h</span>
                          </div>
                          <div>
                            <span className={`font-medium ${getPriorityColor(config.priority)}`}>
                              {config.priority.charAt(0).toUpperCase() + config.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent SLA Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Seguimiento Reciente
            </CardTitle>
            <CardDescription>Estado de conversaciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {slaTracking.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay conversaciones activas con SLA
                </div>
              ) : (
                <div className="space-y-3">
                  {slaTracking.map((tracking) => (
                    <Card key={tracking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-mono text-muted-foreground">
                            {tracking.conversation_id?.slice(0, 8)}...
                          </span>
                          {getStatusBadge(tracking.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">1ª Respuesta:</span>
                            {tracking.first_response_met !== null && (
                              <Badge 
                                variant={tracking.first_response_met ? 'default' : 'destructive'} 
                                className="ml-2"
                              >
                                {tracking.first_response_met ? 'OK' : 'Tarde'}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Resolución:</span>
                            {tracking.resolution_met !== null && (
                              <Badge 
                                variant={tracking.resolution_met ? 'default' : 'destructive'} 
                                className="ml-2"
                              >
                                {tracking.resolution_met ? 'OK' : 'Pendiente'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Creado {formatDistanceToNow(new Date(tracking.created_at), { locale: es, addSuffix: true })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SLAManager;
