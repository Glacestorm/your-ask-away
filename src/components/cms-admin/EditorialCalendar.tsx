import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Edit2, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
  id: string;
  content_id: string | null;
  workflow_id: string | null;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  channel: string;
  status: string;
  color: string;
  assignee: string | null;
  metadata: Record<string, unknown>;
}

const channelOptions = [
  { value: 'web', label: 'Web', color: 'bg-blue-500' },
  { value: 'blog', label: 'Blog', color: 'bg-red-500' },
  { value: 'email', label: 'Email', color: 'bg-green-500' },
  { value: 'social', label: 'Redes Sociales', color: 'bg-purple-500' },
  { value: 'webinar', label: 'Webinar', color: 'bg-amber-500' },
];

const statusOptions = [
  { value: 'scheduled', label: 'Programado', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'En Progreso', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completado', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
];

export const EditorialCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '',
    channel: 'web',
    status: 'scheduled',
    color: '#3b82f6',
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const { data, error } = await supabase
        .from('cms_editorial_calendar')
        .select('*')
        .gte('scheduled_date', format(start, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(end, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setEvents((data || []) as CalendarEvent[]);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase
        .from('cms_editorial_calendar')
        .insert({
          title: formData.title,
          description: formData.description || null,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time || null,
          channel: formData.channel,
          status: formData.status,
          color: formData.color,
        });

      if (error) throw error;
      
      toast.success('Evento creado correctamente');
      setIsDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error al crear evento');
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from('cms_editorial_calendar')
        .update({
          title: formData.title,
          description: formData.description || null,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time || null,
          channel: formData.channel,
          status: formData.status,
          color: formData.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;
      
      toast.success('Evento actualizado');
      setIsDialogOpen(false);
      setIsEditing(false);
      setSelectedEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Error al actualizar evento');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('cms_editorial_calendar')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success('Evento eliminado');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error al eliminar evento');
    }
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date) => {
    if (!draggedEvent) return;

    try {
      const { error } = await supabase
        .from('cms_editorial_calendar')
        .update({
          scheduled_date: format(date, 'yyyy-MM-dd'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', draggedEvent.id);

      if (error) throw error;
      
      toast.success('Evento movido');
      setDraggedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error moving event:', error);
      toast.error('Error al mover evento');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '',
      channel: 'web',
      status: 'scheduled',
      color: '#3b82f6',
    });
  };

  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      scheduled_date: event.scheduled_date,
      scheduled_time: event.scheduled_time || '',
      channel: event.channel,
      status: event.status,
      color: event.color,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openCreateDialog = (date?: Date) => {
    setSelectedEvent(null);
    setIsEditing(false);
    resetForm();
    if (date) {
      setFormData(prev => ({ ...prev, scheduled_date: format(date, 'yyyy-MM-dd') }));
    }
    setIsDialogOpen(true);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.scheduled_date), date));
  };

  const getChannelBadge = (channel: string) => {
    const option = channelOptions.find(c => c.value === channel);
    return option ? (
      <Badge className={`${option.color} text-white text-xs`}>
        {option.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendario Editorial
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[150px] text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => openCreateDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-center font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: (new Date(days[0]).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] bg-muted/30 rounded-lg" />
            ))}
            
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <motion.div
                  key={day.toString()}
                  className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                  } ${isToday(day) ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(day)}
                  onClick={() => openCreateDialog(day)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday(day) ? 'text-primary' : 'text-foreground'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <AnimatePresence>
                    {dayEvents.slice(0, 3).map(event => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="mb-1 p-1 rounded text-xs cursor-move group"
                        style={{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }}
                        draggable
                        onDragStart={() => handleDragStart(event)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(event);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="truncate font-medium">{event.title}</span>
                        </div>
                        {event.scheduled_time && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {event.scheduled_time.slice(0, 5)}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4">
            {channelOptions.map(channel => (
              <div key={channel.value} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${channel.color}`} />
                <span className="text-sm text-muted-foreground">{channel.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título del evento"
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Canal</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => setFormData({ ...formData, channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              {isEditing && selectedEvent && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteEvent(selectedEvent.id);
                    setIsDialogOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={isEditing ? handleUpdateEvent : handleCreateEvent}>
                  {isEditing ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
