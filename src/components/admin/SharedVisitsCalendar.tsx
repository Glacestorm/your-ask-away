import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, User, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Visit {
  id: string;
  company_id: string;
  gestor_id: string;
  visit_date: string;
  result: string | null;
  notes: string | null;
  created_at: string;
  company?: {
    name: string;
    address: string;
  };
  participants?: Array<{
    user_id: string;
    profiles?: {
      full_name: string;
      email: string;
    };
  }>;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Visit;
  isJoint: boolean;
}

export function SharedVisitsCalendar() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<View>('month');

  const fetchVisits = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch visits where user is gestor or participant
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          company:companies(name, address),
          participants:visit_participants(
            user_id,
            profiles:user_id(full_name, email)
          )
        `)
        .or(`gestor_id.eq.${user.id},participants.user_id.eq.${user.id}`)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error('Error fetching visits:', error);
      toast.error('Error al cargar las visitas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVisits();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('shared-visits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visits',
        },
        () => {
          fetchVisits();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visit_participants',
        },
        () => {
          fetchVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisits]);

  const events: CalendarEvent[] = useMemo(() => {
    return visits.map((visit) => {
      const visitDate = new Date(visit.visit_date + 'T09:00:00');
      const isJoint = (visit.participants && visit.participants.length > 0) || false;
      
      return {
        id: visit.id,
        title: visit.company?.name || 'Visita',
        start: visitDate,
        end: new Date(visitDate.getTime() + 60 * 60 * 1000), // 1 hora de duración
        resource: visit,
        isJoint,
      };
    });
  }, [visits]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: event.isJoint ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))',
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      padding: '4px 8px',
    };
    return { style };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Cargando calendario...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
              <span className="text-sm flex items-center gap-1">
                <User className="h-3 w-3" />
                Visita Individual
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
              <span className="text-sm flex items-center gap-1">
                <Users className="h-3 w-3" />
                Visita Conjunta
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              culture="es"
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Agenda',
                date: 'Fecha',
                time: 'Hora',
                event: 'Visita',
                noEventsInRange: 'No hay visitas en este rango de fechas',
                showMore: (total) => `+ Ver más (${total})`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.isJoint ? (
                <Users className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              Detalles de la Visita
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Badge variant={selectedEvent.isJoint ? 'default' : 'secondary'}>
                  {selectedEvent.isJoint ? 'Visita Conjunta' : 'Visita Individual'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha</p>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedEvent.start, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Empresa</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.resource.company?.name || 'N/A'}
                    </p>
                    {selectedEvent.resource.company?.address && (
                      <p className="text-xs text-muted-foreground">
                        {selectedEvent.resource.company.address}
                      </p>
                    )}
                  </div>
                </div>

                {selectedEvent.resource.result && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Resultado</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.resource.result}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.resource.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Notas</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.resource.notes}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.isJoint && selectedEvent.resource.participants && selectedEvent.resource.participants.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Participantes</p>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                        {selectedEvent.resource.participants.map((participant, idx) => (
                          <li key={idx}>
                            • {participant.profiles?.full_name || participant.profiles?.email || 'Usuario'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
