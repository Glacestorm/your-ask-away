import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ActiveAlert {
  id: string;
  alert_name: string;
  metric_type: string;
  metric_value: number;
  threshold_value: number;
  condition_type: string;
  triggered_at: string;
}

export function AlertsBadge() {
  const { user, userRole } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canSeeAlerts = userRole && ['superadmin', 'director_comercial', 'responsable_comercial', 'director_oficina'].includes(userRole);

  useEffect(() => {
    if (user && canSeeAlerts) {
      fetchActiveAlerts();

      const channel = supabase
        .channel('alert-history-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'alert_history',
          },
          () => {
            fetchActiveAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, canSeeAlerts]);

  const fetchActiveAlerts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('alert_history')
        .select('*')
        .is('resolved_at', null)
        .order('triggered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActiveAlerts(data || []);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSeeAlerts) return null;

  const alertCount = activeAlerts.length;
  const hasCritical = activeAlerts.some(a => a.condition_type === 'below');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "relative",
            hasCritical && alertCount > 0 && "border-destructive"
          )}
        >
          <AlertTriangle className={cn(
            "h-5 w-5",
            alertCount > 0 ? "text-destructive" : "text-muted-foreground"
          )} />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border border-border shadow-lg z-50" align="end">
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alertas Activas
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {alertCount} alerta{alertCount !== 1 ? 's' : ''} sin resolver
          </p>
        </div>

        <div className="max-h-64 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Cargando...
            </div>
          ) : alertCount === 0 ? (
            <div className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay alertas activas
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activeAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {alert.alert_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.metric_type}: {alert.metric_value} / {alert.threshold_value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.triggered_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {alertCount > 5 && (
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full justify-between">
              Ver todas ({alertCount})
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
