import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Target, Users, CheckCircle2, Search, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  oficina: string | null;
}

const metricTypes = [
  { value: 'total_visits', label: 'Total Visites' },
  { value: 'successful_visits', label: 'Visites Reeixides' },
  { value: 'assigned_companies', label: 'Empreses Assignades' },
  { value: 'products_offered', label: 'Productes Oferts' },
  { value: 'average_vinculacion', label: 'Vinculació Mitjana' },
  { value: 'new_clients', label: 'Nous Clients' },
  { value: 'visit_sheets', label: 'Fitxes de Visita' },
  { value: 'tpv_volume', label: 'Volum TPV' },
  { value: 'conversion_rate', label: 'Taxa de Conversió' },
  { value: 'client_facturacion', label: 'Facturació Clients' },
  { value: 'products_per_client', label: 'Productes per Client' },
  { value: 'follow_ups', label: 'Seguiments' },
];

const periodTypes = [
  { value: 'weekly', label: 'Setmanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export function BulkGoalsAssignment() {
  const { user, isAdmin, isSuperAdmin, isCommercialDirector, isOfficeDirector, isCommercialManager } = useAuth();
  const { t } = useLanguage();
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [selectedGestores, setSelectedGestores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOficina, setFilterOficina] = useState<string>('all');
  const [oficinas, setOficinas] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    metric_type: 'total_visits',
    target_value: 10,
    period_type: 'monthly',
    period_start: format(new Date(), 'yyyy-MM-dd'),
    period_end: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    description: '',
  });

  const canManageGoals = isAdmin || isSuperAdmin || isCommercialDirector || isOfficeDirector || isCommercialManager;

  useEffect(() => {
    fetchGestores();
  }, []);

  const fetchGestores = async () => {
    try {
      // Get all users with 'user' role (gestores)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (rolesError) throw rolesError;

      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map(r => r.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, oficina')
          .in('id', userIds)
          .order('full_name');

        if (profilesError) throw profilesError;

        setGestores(profiles || []);
        
        // Extract unique oficinas
        const uniqueOficinas = [...new Set(profiles?.map(p => p.oficina).filter(Boolean) as string[])];
        setOficinas(uniqueOficinas);
      }
    } catch (error) {
      console.error('Error fetching gestores:', error);
      toast.error('Error al carregar gestors');
    } finally {
      setLoading(false);
    }
  };

  const filteredGestores = gestores.filter(g => {
    const matchesSearch = 
      g.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOficina = filterOficina === 'all' || g.oficina === filterOficina;
    return matchesSearch && matchesOficina;
  });

  const handleSelectAll = () => {
    if (selectedGestores.length === filteredGestores.length) {
      setSelectedGestores([]);
    } else {
      setSelectedGestores(filteredGestores.map(g => g.id));
    }
  };

  const handleToggleGestor = (gestorId: string) => {
    setSelectedGestores(prev => 
      prev.includes(gestorId) 
        ? prev.filter(id => id !== gestorId)
        : [...prev, gestorId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGestores.length === 0) {
      toast.error('Selecciona almenys un gestor');
      return;
    }

    if (!formData.metric_type || !formData.target_value || !formData.period_start || !formData.period_end) {
      toast.error('Omple tots els camps obligatoris');
      return;
    }

    setSubmitting(true);

    try {
      const goalsToInsert = selectedGestores.map(gestorId => ({
        metric_type: formData.metric_type,
        target_value: formData.target_value,
        period_type: formData.period_type,
        period_start: formData.period_start,
        period_end: formData.period_end,
        description: formData.description || null,
        assigned_to: gestorId,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('goals')
        .insert(goalsToInsert);

      if (error) throw error;

      toast.success(`${selectedGestores.length} objectius assignats correctament`);
      setSelectedGestores([]);
      setFormData({
        metric_type: 'total_visits',
        target_value: 10,
        period_type: 'monthly',
        period_start: format(new Date(), 'yyyy-MM-dd'),
        period_end: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
        description: '',
      });
    } catch (error) {
      console.error('Error creating goals:', error);
      toast.error('Error al crear objectius');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageGoals) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No tens permisos per assignar objectius
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Assignació Massiva d'Objectius
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goal Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipus de Mètrica *</Label>
              <Select
                value={formData.metric_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Objectiu *</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                step={['average_vinculacion', 'conversion_rate', 'products_per_client'].includes(formData.metric_type) ? '0.1' : '1'}
              />
            </div>

            <div className="space-y-2">
              <Label>Període *</Label>
              <Select
                value={formData.period_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, period_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inici *</Label>
              <Input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fi *</Label>
              <Input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label>Descripció</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripció opcional de l'objectiu..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestores Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seleccionar Gestors
              {selectedGestores.length > 0 && (
                <Badge variant="secondary">{selectedGestores.length} seleccionats</Badge>
              )}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cercar gestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              {oficinas.length > 0 && (
                <Select value={filterOficina} onValueChange={setFilterOficina}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Totes les oficines</SelectItem>
                    {oficinas.map(oficina => (
                      <SelectItem key={oficina} value={oficina}>{oficina}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedGestores.length === filteredGestores.length ? 'Deseleccionar tots' : 'Seleccionar tots'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGestores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No s'han trobat gestors
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredGestores.map(gestor => (
                <div
                  key={gestor.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGestores.includes(gestor.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleGestor(gestor.id)}
                >
                  <Checkbox
                    checked={selectedGestores.includes(gestor.id)}
                    onCheckedChange={() => handleToggleGestor(gestor.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {gestor.full_name || gestor.email}
                    </p>
                    {gestor.oficina && (
                      <p className="text-xs text-muted-foreground truncate">
                        {gestor.oficina}
                      </p>
                    )}
                  </div>
                  {selectedGestores.includes(gestor.id) && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting || selectedGestores.length === 0}
          size="lg"
          className="gap-2"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
          Assignar Objectius a {selectedGestores.length} Gestors
        </Button>
      </div>
    </div>
  );
}
