import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, User, Calendar as CalendarIcon, FileText, Plus, Edit, Send, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VisitSheetForm } from '@/components/visits/VisitSheetForm';
import { ParticipantsSelector } from '@/components/visits/ParticipantsSelector';
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

interface Company {
  id: string;
  name: string;
  address: string;
}

export function SharedVisitsCalendar() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ email: string; full_name: string | null } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [view, setView] = useState<View>('month');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Form state for creating/editing visits
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [visitTime, setVisitTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<number>(60);
  const [visitType, setVisitType] = useState<string>('Primera visita');
  const [canal, setCanal] = useState<string>('Presencial');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchVisits = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
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

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, address')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
    fetchCompanies();

    // Fetch profile
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();

    const channel = supabase
      .channel('shared-visits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        () => fetchVisits()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visit_participants' },
        () => fetchVisits()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisits, fetchCompanies]);

  const events: CalendarEvent[] = useMemo(() => {
    return visits.map((visit) => {
      const visitDate = new Date(visit.visit_date + 'T09:00:00');
      const isJoint = (visit.participants && visit.participants.length > 0) || false;
      
      return {
        id: visit.id,
        title: visit.company?.name || 'Visita',
        start: visitDate,
        end: new Date(visitDate.getTime() + 60 * 60 * 1000),
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

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedDate(slotInfo.start);
    resetFormState();
    setCreateDialogOpen(true);
  };

  const resetFormState = () => {
    setSelectedCompanyId('');
    setVisitTime('09:00');
    setDuration(60);
    setVisitType('Primera visita');
    setCanal('Presencial');
    setVisitNotes('');
    setSelectedParticipants([]);
  };

  const openEditDialog = () => {
    if (!selectedEvent) return;
    
    setSelectedDate(selectedEvent.start);
    setSelectedCompanyId(selectedEvent.resource.company_id);
    setVisitNotes(selectedEvent.resource.notes || '');
    setSelectedParticipants(
      selectedEvent.resource.participants?.map(p => p.user_id) || []
    );
    
    setDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleCreateVisit = async () => {
    if (!user || !selectedCompanyId) {
      toast.error('Selecciona una empresa');
      return;
    }

    try {
      setSaving(true);
      
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          company_id: selectedCompanyId,
          gestor_id: user.id,
          visit_date: format(selectedDate, 'yyyy-MM-dd'),
          notes: visitNotes || null,
          result: visitType,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Add participants
      if (selectedParticipants.length > 0) {
        const participantsData = selectedParticipants.map(userId => ({
          visit_id: visit.id,
          user_id: userId,
        }));

        const { error: participantsError } = await supabase
          .from('visit_participants')
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      toast.success('Visita creada correctamente');
      setCreateDialogOpen(false);
      fetchVisits();

      // Ask to send calendar invite
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company && profile?.email) {
        const sendInvite = confirm('¿Deseas enviar la invitación de calendario por email?');
        if (sendInvite) {
          await sendCalendarInvite(visit.id, company);
        }
      }
    } catch (error: any) {
      console.error('Error creating visit:', error);
      toast.error('Error al crear la visita');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVisit = async () => {
    if (!selectedEvent || !user) return;

    try {
      setSaving(true);

      const { error: visitError } = await supabase
        .from('visits')
        .update({
          visit_date: format(selectedDate, 'yyyy-MM-dd'),
          notes: visitNotes || null,
          result: visitType,
        })
        .eq('id', selectedEvent.id);

      if (visitError) throw visitError;

      // Update participants
      await supabase
        .from('visit_participants')
        .delete()
        .eq('visit_id', selectedEvent.id);

      if (selectedParticipants.length > 0) {
        const participantsData = selectedParticipants.map(userId => ({
          visit_id: selectedEvent.id,
          user_id: userId,
        }));

        const { error: participantsError } = await supabase
          .from('visit_participants')
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      toast.success('Visita actualizada correctamente');
      setEditDialogOpen(false);
      fetchVisits();
    } catch (error: any) {
      console.error('Error updating visit:', error);
      toast.error('Error al actualizar la visita');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVisit = async () => {
    if (!selectedEvent) return;

    const confirm = window.confirm('¿Estás seguro de eliminar esta visita?');
    if (!confirm) return;

    try {
      setSaving(true);

      await supabase
        .from('visit_participants')
        .delete()
        .eq('visit_id', selectedEvent.id);

      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast.success('Visita eliminada');
      setDialogOpen(false);
      setEditDialogOpen(false);
      fetchVisits();
    } catch (error: any) {
      console.error('Error deleting visit:', error);
      toast.error('Error al eliminar la visita');
    } finally {
      setSaving(false);
    }
  };

  const sendCalendarInvite = async (visitId: string, company: Company) => {
    if (!profile?.email || !user) return;

    try {
      setSendingEmail(true);

      // Get participant details
      const { data: participants } = await supabase
        .from('visit_participants')
        .select('user_id, profiles:user_id(full_name, email)')
        .eq('visit_id', visitId);

      const participantsList = participants?.map(p => ({
        name: (p.profiles as any)?.full_name || 'Participante',
        email: (p.profiles as any)?.email || '',
      })).filter(p => p.email) || [];

      const response = await supabase.functions.invoke('send-visit-calendar-invite', {
        body: {
          to: profile.email,
          gestorName: profile.full_name || profile.email,
          companyName: company.name,
          companyAddress: company.address,
          visitDate: format(selectedDate, 'yyyy-MM-dd'),
          visitTime: visitTime,
          duration: duration,
          visitType: visitType,
          canal: canal,
          notes: visitNotes || undefined,
          participants: participantsList,
        },
      });

      if (response.error) throw response.error;

      toast.success('Invitación de calendario enviada a tu email');
    } catch (error: any) {
      console.error('Error sending calendar invite:', error);
      toast.error('Error al enviar la invitación de calendario');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendEmailForEvent = async () => {
    if (!selectedEvent?.resource.company || !profile?.email) return;

    const company = {
      id: selectedEvent.resource.company_id,
      name: selectedEvent.resource.company.name,
      address: selectedEvent.resource.company.address,
    };

    await sendCalendarInvite(selectedEvent.id, company);
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
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <Card className="flex-1">
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center gap-4">
              <span>Leyenda:</span>
              <div className="flex flex-wrap gap-4 font-normal text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Individual
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Conjunta
                  </span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
        <Button onClick={() => { resetFormState(); setSelectedDate(new Date()); setCreateDialogOpen(true); }} className="ml-4">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Visita
        </Button>
      </div>

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
              onSelectSlot={handleSelectSlot}
              selectable
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
              <Badge variant={selectedEvent.isJoint ? 'default' : 'secondary'}>
                {selectedEvent.isJoint ? 'Visita Conjunta' : 'Visita Individual'}
              </Badge>

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
                      <p className="text-sm font-medium">Tipo</p>
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

              <div className="pt-4 border-t space-y-2">
                <Button 
                  onClick={() => {
                    setDialogOpen(false);
                    setSheetDialogOpen(true);
                  }}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver/Crear Ficha Completa
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modificar
                  </Button>
                  <Button variant="outline" onClick={handleSendEmailForEvent} disabled={sendingEmail}>
                    {sendingEmail ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar Email
                  </Button>
                </div>
                <Button variant="destructive" onClick={handleDeleteVisit} className="w-full" disabled={saving}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Visita
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Visit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Visita - {format(selectedDate, "dd/MM/yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Visita</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primera visita">Primera visita</SelectItem>
                    <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="Postventa">Postventa</SelectItem>
                    <SelectItem value="Renovación">Renovación</SelectItem>
                    <SelectItem value="TPV">TPV</SelectItem>
                    <SelectItem value="Visita 360°">Visita 360°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Presencial">Presencial</SelectItem>
                    <SelectItem value="Teléfono">Teléfono</SelectItem>
                    <SelectItem value="Videollamada">Videollamada</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Participantes adicionales</Label>
              <ParticipantsSelector
                selectedParticipants={selectedParticipants}
                onParticipantsChange={setSelectedParticipants}
                currentUserId={user?.id || ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateVisit} disabled={saving || !selectedCompanyId}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modificar Visita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Visita</Label>
              <Select value={visitType} onValueChange={setVisitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primera visita">Primera visita</SelectItem>
                  <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="Postventa">Postventa</SelectItem>
                  <SelectItem value="Renovación">Renovación</SelectItem>
                  <SelectItem value="TPV">TPV</SelectItem>
                  <SelectItem value="Visita 360°">Visita 360°</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Participantes adicionales</Label>
              <ParticipantsSelector
                selectedParticipants={selectedParticipants}
                onParticipantsChange={setSelectedParticipants}
                currentUserId={user?.id || ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateVisit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Sheet Dialog */}
      {selectedEvent && (
        <VisitSheetForm
          visitId={selectedEvent.id}
          companyId={selectedEvent.resource.company_id}
          open={sheetDialogOpen}
          onOpenChange={setSheetDialogOpen}
          onSaved={() => {
            toast.success('Ficha de visita guardada');
            fetchVisits();
          }}
        />
      )}
    </div>
  );
}
