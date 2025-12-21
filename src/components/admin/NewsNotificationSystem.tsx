import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, TrendingUp, Lightbulb, Newspaper, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface NewsNotification {
  id: string;
  type: 'critical_news' | 'insight' | 'trend';
  title: string;
  description: string;
  importance: string;
  product_connection?: string;
  created_at: string;
  read: boolean;
}

export const NewsNotificationSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NewsNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch critical news and insights
  const { data: criticalData } = useQuery({
    queryKey: ['news-notifications'],
    queryFn: async () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      // Fetch critical news
      const { data: news } = await supabase
        .from('news_articles')
        .select('id, title, importance_level, product_connection, created_at')
        .in('importance_level', ['critical', 'high'])
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent insights
      const { data: insights } = await supabase
        .from('news_improvement_insights')
        .select('id, title, description, impact_level, product_connection, created_at')
        .eq('status', 'pending')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const newsNotifications: NewsNotification[] = (news || []).map((n: any) => ({
        id: n.id,
        type: 'critical_news',
        title: n.title,
        description: `Noticia ${n.importance_level === 'critical' ? 'crítica' : 'importante'} detectada`,
        importance: n.importance_level,
        product_connection: n.product_connection,
        created_at: n.created_at,
        read: false,
      }));

      const insightNotifications: NewsNotification[] = (insights || []).map((i: any) => ({
        id: i.id,
        type: 'insight',
        title: i.title,
        description: i.description,
        importance: i.impact_level,
        product_connection: i.product_connection,
        created_at: i.created_at,
        read: false,
      }));

      return [...newsNotifications, ...insightNotifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (criticalData) {
      setNotifications(criticalData);
      setUnreadCount(criticalData.filter(n => !n.read).length);
    }
  }, [criticalData]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('news-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
          filter: 'importance_level=in.(critical,high)',
        },
        (payload) => {
          const newNotification: NewsNotification = {
            id: payload.new.id,
            type: 'critical_news',
            title: payload.new.title,
            description: `Nueva noticia ${payload.new.importance_level === 'critical' ? 'crítica' : 'importante'}`,
            importance: payload.new.importance_level,
            product_connection: payload.new.product_connection,
            created_at: payload.new.created_at,
            read: false,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_improvement_insights',
        },
        (payload) => {
          const newNotification: NewsNotification = {
            id: payload.new.id,
            type: 'insight',
            title: payload.new.title,
            description: payload.new.description,
            importance: payload.new.impact_level,
            product_connection: payload.new.product_connection,
            created_at: payload.new.created_at,
            read: false,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string, importance: string) => {
    if (type === 'critical_news') {
      return importance === 'critical' ? (
        <AlertTriangle className="w-5 h-5 text-red-400" />
      ) : (
        <Newspaper className="w-5 h-5 text-amber-400" />
      );
    }
    if (type === 'insight') {
      return <Lightbulb className="w-5 h-5 text-purple-400" />;
    }
    return <TrendingUp className="w-5 h-5 text-emerald-400" />;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
      >
        <Bell className="h-5 w-5 text-slate-300" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-96 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">Notificaciones</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      {unreadCount} nuevas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Marcar todas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Bell className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No hay notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/30">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                          !notification.read ? 'bg-purple-500/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'critical_news' && notification.importance === 'critical'
                              ? 'bg-red-500/10'
                              : notification.type === 'insight'
                              ? 'bg-purple-500/10'
                              : 'bg-amber-500/10'
                          }`}>
                            {getIcon(notification.type, notification.importance)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium line-clamp-2 ${
                                !notification.read ? 'text-white' : 'text-slate-300'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {notification.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {notification.product_connection && (
                                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                                  {notification.product_connection}
                                </Badge>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
                <Button
                  variant="ghost"
                  className="w-full text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  Ver todas las notificaciones
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsNotificationSystem;
