/**
 * NotificationsPanel - Panel de notificaciones inteligentes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Sparkles,
  Info,
  AlertTriangle,
  Trophy,
  Clock,
  Target,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';
import { useAcademiaNotificationsAI, SmartNotification } from '@/hooks/academia/useAcademiaNotificationsAI';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationsPanelProps {
  className?: string;
}

export function NotificationsPanel({ className }: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const {
    isLoading,
    notifications,
    digest,
    preferences,
    unreadCount,
    urgentNotifications,
    fetchNotifications,
    getDigest,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    generateSmartReminders,
    startAutoRefresh,
    stopAutoRefresh
  } = useAcademiaNotificationsAI();

  useEffect(() => {
    fetchNotifications();
    getDigest();
    getPreferences();
    startAutoRefresh(60000);
    return () => stopAutoRefresh();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'reminder': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'recommendation': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.priority === 'urgent' || n.priority === 'high');

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent relative">
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-base">Notificaciones</CardTitle>
              <p className="text-xs text-muted-foreground">
                {unreadCount} sin leer • {urgentNotifications.length} urgentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Leer todo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* AI Digest */}
        {digest && (
          <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Resumen IA del día</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{digest.summary}</p>
              {digest.actionItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">Acciones pendientes:</p>
                  {digest.actionItems.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Panel */}
        {showSettings && preferences && (
          <Card className="mb-4 border-muted">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Notificaciones por email</span>
                <Switch
                  checked={preferences.emailEnabled}
                  onCheckedChange={(checked) => updatePreferences({ emailEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Notificaciones push</span>
                <Switch
                  checked={preferences.pushEnabled}
                  onCheckedChange={(checked) => updatePreferences({ pushEnabled: checked })}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSmartReminders}
                className="w-full gap-2"
              >
                <Zap className="h-4 w-4" />
                Generar recordatorios inteligentes
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="all" className="text-xs">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Sin leer ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="important" className="text-xs">
              Importantes ({urgentNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellRing className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={() => markAsRead(notification.id)}
                      onDelete={() => deleteNotification(notification.id)}
                      getIcon={getNotificationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// === Notification Card Component ===
function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  getIcon,
  getPriorityColor
}: {
  notification: SmartNotification;
  onMarkRead: () => void;
  onDelete: () => void;
  getIcon: (type: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
}) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-colors",
        notification.isRead ? "bg-muted/30" : "bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "text-sm truncate",
              !notification.isRead && "font-medium"
            )}>
              {notification.title}
            </h4>
            <Badge variant="outline" className={cn("text-xs", getPriorityColor(notification.priority))}>
              {notification.priority}
            </Badge>
            {notification.aiGenerated && (
              <Sparkles className="h-3 w-3 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { locale: es, addSuffix: true })}
            </span>
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMarkRead}
                  className="h-6 w-6"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {notification.isActionable && notification.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-1 text-xs"
              asChild
            >
              <a href={notification.actionUrl}>
                {notification.actionLabel || 'Ver más'} →
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPanel;
