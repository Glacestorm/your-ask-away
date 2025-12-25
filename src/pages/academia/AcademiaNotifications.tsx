import { useState } from 'react';
import { useAcademiaNotifications, AcademiaNotification } from '@/hooks/useAcademiaNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  BookOpen, 
  Trophy, 
  Clock,
  Award,
  Megaphone,
  MessageSquare,
  Settings,
  BellOff,
  ChevronLeft,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const notificationIcons: Record<AcademiaNotification['type'], React.ElementType> = {
  course_update: BookOpen,
  achievement: Trophy,
  reminder: Clock,
  certificate: Award,
  announcement: Megaphone,
  discussion: MessageSquare
};

const notificationColors: Record<AcademiaNotification['type'], string> = {
  course_update: 'text-blue-500 bg-blue-500/10',
  achievement: 'text-yellow-500 bg-yellow-500/10',
  reminder: 'text-orange-500 bg-orange-500/10',
  certificate: 'text-green-500 bg-green-500/10',
  announcement: 'text-purple-500 bg-purple-500/10',
  discussion: 'text-cyan-500 bg-cyan-500/10'
};

export default function AcademiaNotifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    groupedNotifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences
  } = useAcademiaNotifications();

  const preferences = getPreferences();

  const handleNotificationClick = (notification: AcademiaNotification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on reference
    if (notification.reference_type === 'course' && notification.reference_id) {
      navigate(`/academia/course/${notification.reference_id}`);
    } else if (notification.reference_type === 'discussion' && notification.reference_id) {
      navigate(`/academia/community?discussion=${notification.reference_id}`);
    }
  };

  const renderNotification = (notification: AcademiaNotification) => {
    const Icon = notificationIcons[notification.type] || Bell;
    const colorClass = notificationColors[notification.type] || 'text-muted-foreground bg-muted';

    return (
      <div
        key={notification.id}
        className={cn(
          "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors",
          notification.is_read ? "bg-background hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn("font-medium", !notification.is_read && "font-semibold")}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {notification.message}
              </p>
            </div>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true, 
              locale: es 
            })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!notification.is_read && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                markAsRead.mutate(notification.id);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification.mutate(notification.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderNotificationGroup = (title: string, items: AcademiaNotification[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-2">{title}</h3>
        <div className="space-y-1">
          {items.map(renderNotification)}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/academia">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Mantente al día con tu progreso y novedades
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <Card className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  Todas
                  <Badge variant="secondary" className="ml-2">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread">
                  No leídas
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="grouped">Agrupadas</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <TabsContent value="all" className="mt-0 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No tienes notificaciones</p>
                    </div>
                  ) : (
                    notifications.map(renderNotification)
                  )}
                </TabsContent>

                <TabsContent value="unread" className="mt-0 space-y-1">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-500/50 mb-4" />
                      <p className="text-muted-foreground">¡Estás al día!</p>
                      <p className="text-sm text-muted-foreground">No tienes notificaciones pendientes</p>
                    </div>
                  ) : (
                    unreadNotifications.map(renderNotification)
                  )}
                </TabsContent>

                <TabsContent value="grouped" className="mt-0 space-y-6">
                  {renderNotificationGroup('Hoy', groupedNotifications.today)}
                  {renderNotificationGroup('Esta semana', groupedNotifications.thisWeek)}
                  {renderNotificationGroup('Anteriores', groupedNotifications.older)}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-12">
                      <BellOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No tienes notificaciones</p>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </CardContent>
          </Tabs>
        </Card>

        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferencias
            </CardTitle>
            <CardDescription>
              Personaliza qué notificaciones recibir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Tipos de notificaciones</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", notificationColors.course_update)}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <Label htmlFor="course_updates">Actualizaciones de cursos</Label>
                </div>
                <Switch
                  id="course_updates"
                  checked={preferences.course_updates}
                  onCheckedChange={(checked) => updatePreferences({ course_updates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", notificationColors.achievement)}>
                    <Trophy className="w-4 h-4" />
                  </div>
                  <Label htmlFor="achievements">Logros y recompensas</Label>
                </div>
                <Switch
                  id="achievements"
                  checked={preferences.achievements}
                  onCheckedChange={(checked) => updatePreferences({ achievements: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", notificationColors.reminder)}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <Label htmlFor="reminders">Recordatorios</Label>
                </div>
                <Switch
                  id="reminders"
                  checked={preferences.reminders}
                  onCheckedChange={(checked) => updatePreferences({ reminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", notificationColors.certificate)}>
                    <Award className="w-4 h-4" />
                  </div>
                  <Label htmlFor="certificates">Certificados</Label>
                </div>
                <Switch
                  id="certificates"
                  checked={preferences.certificates}
                  onCheckedChange={(checked) => updatePreferences({ certificates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", notificationColors.announcement)}>
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <Label htmlFor="announcements">Anuncios</Label>
                </div>
                <Switch
                  id="announcements"
                  checked={preferences.announcements}
                  onCheckedChange={(checked) => updatePreferences({ announcements: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", notificationColors.discussion)}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <Label htmlFor="discussions">Discusiones</Label>
                </div>
                <Switch
                  id="discussions"
                  checked={preferences.discussions}
                  onCheckedChange={(checked) => updatePreferences({ discussions: checked })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Canales de notificación</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Notificaciones por email</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe un resumen diario
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
