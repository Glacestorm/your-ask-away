import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  X, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  recommendation?: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

interface AdvisorAlertsListProps {
  companyId: string;
}

export function AdvisorAlertsList({ companyId }: AdvisorAlertsListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('erp-advisor-agent', {
        body: {
          action: 'get_alerts',
          company_id: companyId,
          params: { limit: 50 }
        }
      });

      if (error) throw error;
      setAlerts(data?.alerts || []);
    } catch (err) {
      console.error('[AdvisorAlertsList] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [companyId]);

  const dismissAlert = async (alertId: string) => {
    try {
      await supabase.functions.invoke('erp-advisor-agent', {
        body: {
          action: 'dismiss_alert',
          company_id: companyId,
          params: { alert_id: alertId }
        }
      });
      
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta descartada');
    } catch (err) {
      toast.error('Error al descartar alerta');
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-destructive/10', border: 'border-destructive/30', icon: 'text-destructive' };
      case 'high':
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'text-orange-500' };
      case 'medium':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'text-yellow-500' };
      default:
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-pulse text-muted-foreground">Cargando alertas...</div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
        <p className="font-medium">Sin alertas pendientes</p>
        <p className="text-sm text-muted-foreground">El sistema funciona correctamente</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {alerts.map((alert) => {
          const styles = getSeverityStyles(alert.severity);
          return (
            <Card 
              key={alert.id}
              className={cn(
                "p-4 transition-all",
                styles.bg,
                styles.border,
                !alert.is_read && "ring-1 ring-primary/20"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", styles.icon)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {alert.recommendation && (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                      <span className="font-medium">Recomendación:</span> {alert.recommendation}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default AdvisorAlertsList;
