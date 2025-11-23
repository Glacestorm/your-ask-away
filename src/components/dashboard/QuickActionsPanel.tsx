import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, TrendingUp, MapPin, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TodayVisit {
  id: string;
  visit_date: string;
  companies: {
    id: string;
    name: string;
  } | null;
}

interface MostVisitedCompany {
  company_id: string;
  company_name: string;
  visit_count: number;
  last_visit: string;
}

interface Company {
  id: string;
  name: string;
}

export const QuickActionsPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayVisits, setTodayVisits] = useState<TodayVisit[]>([]);
  const [mostVisited, setMostVisited] = useState<MostVisitedCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState('');
  const [visitDate, setVisitDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [visitTime, setVisitTime] = useState(format(new Date(), 'HH:mm'));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch today's visits
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: visitsData } = await supabase
        .from('visits' as any)
        .select(`
          id,
          visit_date,
          companies (
            id,
            name
          )
        `)
        .eq('gestor_id', user.id)
        .eq('visit_date', today)
        .order('visit_date', { ascending: true });

      setTodayVisits((visitsData as any) || []);

      // Fetch most visited companies
      const { data: visitStatsData } = await supabase
        .from('visits' as any)
        .select('company_id, companies(name)')
        .eq('gestor_id', user.id);

      if (visitStatsData) {
        const visitCounts = (visitStatsData as any).reduce((acc: any, visit: any) => {
          const companyId = visit.company_id;
          const companyName = visit.companies?.name || 'Sin nombre';
          if (!acc[companyId]) {
            acc[companyId] = { count: 0, name: companyName };
          }
          acc[companyId].count++;
          return acc;
        }, {});

        const sortedCompanies = Object.entries(visitCounts)
          .map(([id, data]: [string, any]) => ({
            company_id: id,
            company_name: data.name,
            visit_count: data.count,
            last_visit: new Date().toISOString(),
          }))
          .sort((a, b) => b.visit_count - a.visit_count)
          .slice(0, 5);

        setMostVisited(sortedCompanies);
      }

      // Fetch all companies for the dropdown
      const { data: companiesData } = await supabase
        .from('companies' as any)
        .select('id, name')
        .order('name');

      setCompanies((companiesData as any) || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisit = async () => {
    if (!user || !selectedCompany) {
      toast.error('Por favor selecciona una empresa');
      return;
    }

    try {
      setSaving(true);

      const visitDateTime = `${visitDate}T${visitTime}:00`;

      const { error } = await supabase
        .from('visits' as any)
        .insert({
          company_id: selectedCompany,
          gestor_id: user.id,
          visit_date: visitDateTime,
          notes: notes || null,
        });

      if (error) throw error;

      toast.success('Visita creada correctamente');
      setDialogOpen(false);
      setSelectedCompany('');
      setNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error creating visit:', error);
      toast.error('Error al crear la visita');
    } finally {
      setSaving(false);
    }
  };

  const navigateToCompany = (companyId: string) => {
    navigate(`/map?company=${companyId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Create New Visit */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Nueva Visita
          </CardTitle>
          <CardDescription>Programa una visita comercial</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Crear Visita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Visita Comercial</DialogTitle>
                <DialogDescription>
                  Programa una visita a una empresa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger id="company">
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Objetivo de la visita, temas a tratar..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateVisit} disabled={saving || !selectedCompany}>
                  {saving ? 'Guardando...' : 'Crear Visita'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Agenda de Hoy
          </CardTitle>
          <CardDescription>
            {todayVisits.length === 0
              ? 'Sin visitas programadas'
              : `${todayVisits.length} visita${todayVisits.length > 1 ? 's' : ''} hoy`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayVisits.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay visitas programadas para hoy</p>
            </div>
          ) : (
            <>
              {todayVisits.slice(0, 3).map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/50 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => visit.companies && navigateToCompany(visit.companies.id)}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {visit.companies?.name || 'Sin nombre'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {format(new Date(visit.visit_date), 'HH:mm')}
                  </Badge>
                </div>
              ))}
              {todayVisits.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/map')}
                >
                  Ver todas las visitas
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Most Visited Companies */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Más Visitadas
          </CardTitle>
          <CardDescription>
            Empresas con mayor frecuencia de visitas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mostVisited.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aún no hay visitas registradas</p>
            </div>
          ) : (
            <>
              {mostVisited.map((company) => (
                <div
                  key={company.company_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/50 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigateToCompany(company.company_id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {company.company_name}
                    </span>
                  </div>
                  <Badge variant="default" className="text-xs ml-2 flex-shrink-0">
                    {company.visit_count} visita{company.visit_count > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
