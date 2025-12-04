import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Target, 
  TrendingDown,
  User,
  Building2,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GoalAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metric_value: number | null;
  threshold_value: number | null;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  oficina: string | null;
}

export function DirectorAlertsPanel() {
  const { user, isCommercialDirector, isOfficeDirector, isSuperAdmin } = useAuth();
  const [alerts, setAlerts] = useState<GoalAlert[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchProfiles();
      
      // Real-time subscription for new notifications
      const channel = supabase
        .channel('director-alerts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            console.log('New notification received:', payload);
            fetchAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina');

      if (error) throw error;
      
      const profileMap: Record<string, Profile> = {};
      data?.forEach(p => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch notifications that are goal-related alerts
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or('title.ilike.%objetivo%,title.ilike.%goal%,title.ilike.%riesgo%,title.ilike.%meta%')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const typedData = (data || []).map(n => ({
        ...n,
        severity: n.severity as 'info' | 'warning' | 'critical'
      }));
      
      setAlerts(typedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
    toast.success('Alertas actualizadas');
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Error al marcar como leída');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
      toast.success('Todas las alertas marcadas como leídas');
      fetchAlerts();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Alerta eliminada');
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error al eliminar la alerta');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600">En Riesgo</Badge>;
      default:
        return <Badge variant="secondary">Información</Badge>;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !alert.is_read;
    if (activeTab === 'critical') return alert.severity === 'critical';
    if (activeTab === 'warning') return alert.severity === 'warning';
    return true;
  });

  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.is_read).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length
  };

  const getGestorInfo = (userId: string) => {
    const profile = profiles[userId];
    return profile ? (profile.full_name || profile.email) : 'Usuario desconocido';
  };

  const getOfficeInfo = (userId: string) => {
    const profile = profiles[userId];
    return profile?.oficina || 'Sin oficina';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Centro de Alertas - Objetivos en Riesgo
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitorización en tiempo real de objetivos que requieren atención
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {stats.unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas leídas
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alertas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin Leer</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Riesgo</p>
                <p className="text-2xl font-bold text-amber-500">{stats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Alerts List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todas ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Sin leer ({stats.unread})
          </TabsTrigger>
          <TabsTrigger value="critical">
            Críticos ({stats.critical})
          </TabsTrigger>
          <TabsTrigger value="warning">
            En riesgo ({stats.warning})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[calc(100vh-450px)]">
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No hay alertas en esta categoría</p>
                    <p className="text-sm">Los objetivos están en buen camino</p>
                  </div>
                </Card>
              ) : (
                filteredAlerts.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className={`transition-all hover:shadow-md ${
                      !alert.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{alert.title}</h4>
                              {getSeverityBadge(alert.severity)}
                              {!alert.is_read && (
                                <Badge variant="outline" className="text-xs">Nuevo</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(alert.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {alert.message}
                          </p>

                          {/* Gestor and Office info */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{getGestorInfo(alert.user_id)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{getOfficeInfo(alert.user_id)}</span>
                            </div>
                          </div>

                          {/* Metric values */}
                          {alert.metric_value !== null && alert.threshold_value !== null && (
                            <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg text-sm mb-3">
                              <div>
                                <span className="text-muted-foreground">Progreso actual:</span>
                                <span className="font-semibold ml-1">{alert.metric_value}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Esperado:</span>
                                <span className="font-semibold ml-1">{alert.threshold_value}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Diferencia:</span>
                                <span className={`font-semibold ml-1 ${
                                  (alert.metric_value - alert.threshold_value) < 0 
                                    ? 'text-destructive' 
                                    : 'text-green-500'
                                }`}>
                                  {(alert.metric_value - alert.threshold_value).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!alert.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Marcar leída
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAlert(alert.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
