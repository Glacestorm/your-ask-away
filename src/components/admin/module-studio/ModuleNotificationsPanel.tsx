import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Shield,
  Zap,
  Upload,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useModuleNotifications, ModuleNotification } from '@/hooks/admin/useModuleNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleNotificationsPanelProps {
  className?: string;
  compact?: boolean;
}

export function ModuleNotificationsPanel({ className, compact = false }: ModuleNotificationsPanelProps) {
  const [showSettings, setShowSettings] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences
  } = useModuleNotifications();

  const getNotificationIcon = (type: ModuleNotification['type']) => {
    switch (type) {
      case 'deploy': return <Upload className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'update': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: ModuleNotification['severity']) => {
    switch (severity) {
      case 'critical': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'info': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-sm">Notificaciones</h4>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Leer todo
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <BellOff className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn("p-1.5 rounded", getSeverityColor(notification.severity))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Notificaciones
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount} nuevas
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Alertas y eventos de módulos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Leer todo
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {showSettings ? (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Preferencias</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Notificaciones de escritorio</span>
                <Switch 
                  checked={preferences.enableDesktop}
                  onCheckedChange={(checked) => updatePreferences({ enableDesktop: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sonido</span>
                <Switch 
                  checked={preferences.enableSound}
                  onCheckedChange={(checked) => updatePreferences({ enableSound: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email</span>
                <Switch 
                  checked={preferences.enableEmail}
                  onCheckedChange={(checked) => updatePreferences({ enableEmail: checked })}
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setShowSettings(false)}
            >
              Cerrar configuración
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                <p className="text-xs text-muted-foreground">Las alertas aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      !notification.read && "bg-primary/5 border-primary/20",
                      notification.read && "bg-card opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", getSeverityColor(notification.severity))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.moduleName}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.timestamp), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive"
                    onClick={clearAll}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar todo
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default ModuleNotificationsPanel;
