import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Bell, BellOff, ExternalLink } from 'lucide-react';
import { format, differenceInMinutes, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Visit {
  id: string;
  visit_date: string;
  notes: string | null;
  company_id: string;
  companies: {
    name: string;
    address: string;
  } | null;
}

interface ReminderPreference {
  enabled: boolean;
  minutes_before: number;
}

export const UpcomingVisitsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [reminderPreference, setReminderPreference] = useState<ReminderPreference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch reminder preferences
      const { data: prefData } = await supabase
        .from('visit_reminder_preferences' as any)
        .select('enabled, minutes_before')
        .eq('user_id', user.id)
        .maybeSingle();

      setReminderPreference((prefData as unknown as ReminderPreference) || { enabled: false, minutes_before: 60 });

      // Fetch upcoming visits for the next 7 days
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { data: visitsData, error } = await supabase
        .from('visits' as any)
        .select(`
          id,
          visit_date,
          notes,
          company_id,
          companies (
            name,
            address
          )
        `)
        .eq('gestor_id', user.id)
        .gte('visit_date', today.toISOString().split('T')[0])
        .lte('visit_date', nextWeek.toISOString().split('T')[0])
        .order('visit_date', { ascending: true });

      if (error) throw error;

      setVisits((visitsData as any) || []);
    } catch (error: any) {
      console.error('Error fetching visits:', error);
      toast.error('Error al cargar las visitas');
    } finally {
      setLoading(false);
    }
  };

  const getReminderStatus = (visitDate: string) => {
    if (!reminderPreference?.enabled) {
      return { status: 'disabled', label: 'Sin recordatorio', variant: 'secondary' as const };
    }

    const visit = new Date(visitDate);
    const now = new Date();
    const reminderTime = new Date(visit.getTime() - reminderPreference.minutes_before * 60 * 1000);

    if (isPast(visit)) {
      return { status: 'past', label: 'Completada', variant: 'outline' as const };
    }

    if (isPast(reminderTime) && isFuture(visit)) {
      return { status: 'sent', label: 'Recordatorio enviado', variant: 'default' as const };
    }

    const minutesUntilReminder = differenceInMinutes(reminderTime, now);
    
    if (minutesUntilReminder < 60) {
      return { 
        status: 'soon', 
        label: `Recordatorio en ${minutesUntilReminder} min`, 
        variant: 'default' as const 
      };
    } else if (minutesUntilReminder < 1440) {
      const hours = Math.floor(minutesUntilReminder / 60);
      return { 
        status: 'scheduled', 
        label: `Recordatorio en ${hours}h`, 
        variant: 'secondary' as const 
      };
    } else {
      const days = Math.floor(minutesUntilReminder / 1440);
      return { 
        status: 'scheduled', 
        label: `Recordatorio en ${days}d`, 
        variant: 'secondary' as const 
      };
    }
  };

  const handleViewOnMap = (companyId: string) => {
    navigate(`/map?company=${companyId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Visitas
          </CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Visitas
            </CardTitle>
            <CardDescription>
              Visitas programadas para los próximos 7 días
            </CardDescription>
          </div>
          {reminderPreference?.enabled ? (
            <Badge variant="default" className="gap-1">
              <Bell className="h-3 w-3" />
              Recordatorios activos
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <BellOff className="h-3 w-3" />
              Sin recordatorios
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tienes visitas programadas para los próximos 7 días</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {visits.map((visit) => {
                const reminderStatus = getReminderStatus(visit.visit_date);
                const visitDate = new Date(visit.visit_date);
                const isToday = format(visitDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <div
                    key={visit.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {visit.companies?.name || 'Empresa sin nombre'}
                          </h4>
                          {isToday && (
                            <Badge variant="destructive" className="text-xs">
                              HOY
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(visitDate, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </div>
                        {visit.companies?.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {visit.companies.address}
                          </div>
                        )}
                        {visit.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {visit.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant={reminderStatus.variant} className="gap-1">
                        {reminderStatus.status === 'disabled' ? (
                          <BellOff className="h-3 w-3" />
                        ) : (
                          <Bell className="h-3 w-3" />
                        )}
                        {reminderStatus.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOnMap(visit.company_id)}
                        className="gap-1"
                      >
                        Ver en mapa
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
