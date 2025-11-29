import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CompanyWithDetails } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ParticipantsSelector } from '@/components/visits/ParticipantsSelector';

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
}

interface VisitsPanelProps {
  company?: CompanyWithDetails;
}

export function VisitsPanel({ company }: VisitsPanelProps) {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    visit_date: new Date(),
    result: '',
    notes: '',
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (company) {
      fetchVisits();
    }
  }, [company]);

  const fetchVisits = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          company:companies(name, address)
        `)
        .eq('company_id', company.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      console.error('Error fetching visits:', error);
      toast.error(t('form.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !company) return;

    try {
      setLoading(true);
      
      // Insert visit
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .insert({
          company_id: company.id,
          gestor_id: user.id,
          visit_date: format(formData.visit_date, 'yyyy-MM-dd'),
          result: formData.result || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Insert participants if any
      if (selectedParticipants.length > 0 && visitData) {
        const participantsData = selectedParticipants.map(userId => ({
          visit_id: visitData.id,
          user_id: userId,
        }));

        const { error: participantsError } = await supabase
          .from('visit_participants')
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      // Update company's last visit date
      await supabase
        .from('companies')
        .update({ fecha_ultima_visita: format(formData.visit_date, 'yyyy-MM-dd') })
        .eq('id', company.id);

      toast.success(t('visitForm.visitCreated'));
      setDialogOpen(false);
      setFormData({
        visit_date: new Date(),
        result: '',
        notes: '',
      });
      setSelectedParticipants([]);
      fetchVisits();
    } catch (error: any) {
      console.error('Error creating visit:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  if (!company) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            {t('visitForm.noVisits')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Visitas - {company.name}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Visita
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Visita</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Fecha de Visita</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.visit_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.visit_date ? (
                          format(formData.visit_date, "dd 'de' MMMM 'de' yyyy", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.visit_date}
                        onSelect={(date) => date && setFormData({ ...formData, visit_date: date })}
                        locale={es}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result">Resultado</Label>
                  <Input
                    id="result"
                    placeholder="Ej: Reunión productiva, contrato firmado..."
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Detalles adicionales sobre la visita..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                {user && (
                  <ParticipantsSelector
                    selectedParticipants={selectedParticipants}
                    onParticipantsChange={setSelectedParticipants}
                    currentUserId={user.id}
                  />
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Visita'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading && visits.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Cargando visitas...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No hay visitas registradas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <Card key={visit.id} className="border-l-4 border-l-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {format(new Date(visit.visit_date), "dd MMM yyyy", { locale: es })}
                          </Badge>
                        </div>
                        {visit.result && (
                          <p className="text-sm font-medium mb-1">{visit.result}</p>
                        )}
                        {visit.notes && (
                          <p className="text-sm text-muted-foreground">{visit.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
