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
import { Users, User, Calendar as CalendarIcon, FileText, Plus, Edit, Send, Loader2, Trash2, Filter, Building2 } from 'lucide-react';
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
  gestor?: {
    full_name: string;
    oficina: string;
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

interface Gestor {
  id: string;
  full_name: string;
  oficina: string | null;
}

export function SharedVisitsCalendar() {
  const { user, userRole, isCommercialDirector, isCommercialManager, isOfficeDirector } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ email: string; full_name: string | null; oficina: string | null } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [view, setView] = useState<View>('month');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Filters
  const [filterGestorId, setFilterGestorId] = useState<string>('all');
  const [filterOficina, setFilterOficina] = useState<string>('all');

  // Check if user can see filters (directors and managers)
  const canSeeFilters = isCommercialDirector || isCommercialManager || isOfficeDirector;
  const canFilterByOffice = isCommercialDirector || isCommercialManager;

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

  // Fetch gestores and offices for filters
  const fetchGestoresAndOffices = useCallback(async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, full_name, oficina')
        .order('full_name');

      if (error) throw error;

      setGestores(profilesData || []);

      // Extract unique offices
      const uniqueOffices = [...new Set(
        (profilesData || [])
          .map(p => p.oficina)
          .filter((o): o is string => o !== null && o !== '')
      )].sort();
      setOffices(uniqueOffices);
    } catch (error) {
      console.error('Error fetching gestores:', error);
    }
  }, []);

  const fetchVisits = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Determine which visits to fetch based on role
      let query = supabase
        .from('visits')
        .select(`
          *,
          company:companies(name, address),
          gestor:profiles!visits_gestor_id_fkey(full_name, oficina),
          participants:visit_participants(
            user_id,
            profiles:user_id(full_name, email)
          )
        `)
        .order('visit_date', { ascending: false });

      // Role-based filtering
      if (isCommercialDirector || isCommercialManager) {
        // Director Comercial y Responsable Comercial: ven todas las visitas
        // No filter needed - they see all
      } else if (isOfficeDirector && profile?.oficina) {
        // Director de Oficina: solo ve visitas de gestores de su oficina
        // Get gestor IDs from their office
        const { data: officeGestores } = await supabase
          .from('profiles')
          .select('id')
          .eq('oficina', profile.oficina);
        
        const officeGestorIds = officeGestores?.map(g => g.id) || [];
        if (officeGestorIds.length > 0) {
          query = query.in('gestor_id', officeGestorIds);
        } else {
          // No gestores in office, return empty
          setVisits([]);
          setLoading(false);
          return;
        }
      } else {
        // Gestor: solo ve sus propias visitas + donde participa
        // First, get visits where user is the gestor
        const { data: gestorVisits, error: gestorError } = await supabase
          .from('visits')
          .select(`
            *,
            company:companies(name, address),
            gestor:profiles!visits_gestor_id_fkey(full_name, oficina),
            participants:visit_participants(
              user_id,
              profiles:user_id(full_name, email)
            )
          `)
          .eq('gestor_id', user.id)
          .order('visit_date', { ascending: false });

        if (gestorError) throw gestorError;

        // Then, get visit IDs where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('visit_participants')
          .select('visit_id')
          .eq('user_id', user.id);

        if (participantError) throw participantError;

        const participantVisitIds = participantData?.map(p => p.visit_id) || [];
        const gestorVisitIds = new Set(gestorVisits?.map(v => v.id) || []);
        const additionalVisitIds = participantVisitIds.filter(id => !gestorVisitIds.has(id));

        let allVisits = gestorVisits || [];

        if (additionalVisitIds.length > 0) {
          const { data: participantVisits, error: pVisitsError } = await supabase
            .from('visits')
            .select(`
              *,
              company:companies(name, address),
              gestor:profiles!visits_gestor_id_fkey(full_name, oficina),
              participants:visit_participants(
                user_id,
                profiles:user_id(full_name, email)
              )
            `)
            .in('id', additionalVisitIds)
            .order('visit_date', { ascending: false });

          if (pVisitsError) throw pVisitsError;
          allVisits = [...allVisits, ...(participantVisits || [])];
        }

        allVisits.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
        setVisits(allVisits);
        setLoading(false);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error('Error fetching visits:', error);
      toast.error('Error al cargar las visitas');
    } finally {
      setLoading(false);
    }
  }, [user, isCommercialDirector, isCommercialManager, isOfficeDirector, profile?.oficina]);

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
    // Fetch profile first
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('email, full_name, oficina')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
    fetchGestoresAndOffices();
    fetchCompanies();
  }, [user, fetchGestoresAndOffices, fetchCompanies]);

  useEffect(() => {
    if (profile !== null || !canSeeFilters) {
      fetchVisits();
    }
  }, [profile, canSeeFilters, fetchVisits]);

  useEffect(() => {
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
  }, [fetchVisits]);

  // Filter visits based on selected filters
  const filteredVisits = useMemo(() => {
    let result = visits;

    // Filter by gestor
    if (filterGestorId !== 'all') {
      result = result.filter(v => v.gestor_id === filterGestorId);
    }

    // Filter by office (only for directors and managers)
    if (canFilterByOffice && filterOficina !== 'all') {
      result = result.filter(v => v.gestor?.oficina === filterOficina);
    }

    // For office directors, also apply office filter if set
    if (isOfficeDirector && !canFilterByOffice && filterOficina !== 'all') {
      result = result.filter(v => v.gestor?.oficina === filterOficina);
    }

    return result;
  }, [visits, filterGestorId, filterOficina, canFilterByOffice, isOfficeDirector]);

  // Filter gestores by selected office for the gestor dropdown
  const filteredGestores = useMemo(() => {
    if (filterOficina === 'all') return gestores;
    return gestores.filter(g => g.oficina === filterOficina);
  }, [gestores, filterOficina]);

  // For office directors, filter gestores by their office
  const availableGestores = useMemo(() => {
    if (isOfficeDirector && profile?.oficina) {
      return gestores.filter(g => g.oficina === profile.oficina);
    }
    return filteredGestores;
  }, [isOfficeDirector, profile?.oficina, gestores, filteredGestores]);

  const events: CalendarEvent[] = useMemo(() => {
    return filteredVisits.map((visit) => {
      const visitDate = new Date(visit.visit_date + 'T09:00:00');
      const isJoint = (visit.participants && visit.participants.length > 0) || false;
      
      return {
        id: visit.id,
        title: `${visit.company?.name || 'Visita'}${visit.gestor?.full_name ? ` - ${visit.gestor.full_name}` : ''}`,
        start: visitDate,
        end: new Date(visitDate.getTime() + 60 * 60 * 1000),
        resource: visit,
        isJoint,
      };
    });
  }, [filteredVisits]);

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

  const clearFilters = () => {
    setFilterGestorId('all');
    setFilterOficina('all');
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
      {/* Filters for directors and managers */}
      {canSeeFilters && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap items-center gap-4">
              {/* Office filter - only for commercial director and commercial manager */}
              {canFilterByOffice && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterOficina} onValueChange={(value) => {
                    setFilterOficina(value);
                    // Reset gestor filter when office changes
                    if (value !== 'all') {
                      setFilterGestorId('all');
                    }
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Totes les oficines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Totes les oficines</SelectItem>
                      {offices.map(office => (
                        <SelectItem key={office} value={office}>{office}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Gestor filter */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Select value={filterGestorId} onValueChange={setFilterGestorId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tots els gestors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tots els gestors</SelectItem>
                    {availableGestores.map(gestor => (
                      <SelectItem key={gestor.id} value={gestor.id}>
                        {gestor.full_name || 'Sense nom'}
                        {gestor.oficina && canFilterByOffice && ` (${gestor.oficina})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear filters button */}
              {(filterGestorId !== 'all' || filterOficina !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Netejar filtres
                </Button>
              )}

              {/* Stats */}
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredVisits.length} visites
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <Card className="flex-1">
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center gap-4">
              <span>Llegenda:</span>
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
          Nova Visita
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
                next: 'Següent',
                previous: 'Anterior',
                today: 'Avui',
                month: 'Mes',
                week: 'Setmana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Visita',
                noEventsInRange: 'No hi ha visites en aquest rang de dates',
                showMore: (total) => `+ Veure més (${total})`,
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
              Detalls de la Visita
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
                    <p className="text-sm font-medium">Data</p>
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

                {selectedEvent.resource.gestor && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Gestor</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.resource.gestor.full_name}
                        {selectedEvent.resource.gestor.oficina && (
                          <span className="text-xs ml-1">({selectedEvent.resource.gestor.oficina})</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.resource.result && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tipus</p>
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
                      <p className="text-sm font-medium">Notes</p>
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
                      <p className="text-sm font-medium">Participants</p>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                        {selectedEvent.resource.participants.map((participant, idx) => (
                          <li key={idx}>
                            • {participant.profiles?.full_name || participant.profiles?.email || 'Usuari'}
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
                  Veure/Crear Fitxa Completa
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
              Nova Visita - {format(selectedDate, "dd/MM/yyyy")}
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
                <Label>Duració (min)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipus de Visita</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primera visita">Primera visita</SelectItem>
                    <SelectItem value="Seguiment">Seguiment</SelectItem>
                    <SelectItem value="Postvenda">Postvenda</SelectItem>
                    <SelectItem value="Renovació">Renovació</SelectItem>
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
                    <SelectItem value="Telèfon">Telèfon</SelectItem>
                    <SelectItem value="Videotrucada">Videotrucada</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Notes addicionals..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Participants addicionals</Label>
              <ParticipantsSelector
                selectedParticipants={selectedParticipants}
                onParticipantsChange={setSelectedParticipants}
                currentUserId={user?.id || ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel·lar
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
              <Label>Data</Label>
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipus de Visita</Label>
              <Select value={visitType} onValueChange={setVisitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primera visita">Primera visita</SelectItem>
                  <SelectItem value="Seguiment">Seguiment</SelectItem>
                  <SelectItem value="Postvenda">Postvenda</SelectItem>
                  <SelectItem value="Renovació">Renovació</SelectItem>
                  <SelectItem value="TPV">TPV</SelectItem>
                  <SelectItem value="Visita 360°">Visita 360°</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Notes addicionals..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Participants addicionals</Label>
              <ParticipantsSelector
                selectedParticipants={selectedParticipants}
                onParticipantsChange={setSelectedParticipants}
                currentUserId={user?.id || ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel·lar
            </Button>
            <Button onClick={handleUpdateVisit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Desar Canvis
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
            toast.success('Fitxa de visita desada');
            fetchVisits();
          }}
        />
      )}
    </div>
  );
}
