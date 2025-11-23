import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, Users, TrendingUp } from 'lucide-react';

interface GestorMetrics {
  id: string;
  name: string;
  oficina: string;
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  companiesManaged: number;
}

interface OficinaMetrics {
  oficina: string;
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  gestoresCount: number;
  companiesCount: number;
}

interface BancoMetrics {
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  oficinasCount: number;
  gestoresCount: number;
  companiesCount: number;
}

export function MetricsExplorer() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });
  
  // Gestor level
  const [gestores, setGestores] = useState<{ id: string; name: string; oficina: string }[]>([]);
  const [selectedGestor, setSelectedGestor] = useState<string>('');
  const [gestorMetrics, setGestorMetrics] = useState<GestorMetrics | null>(null);
  
  // Oficina level
  const [oficinas, setOficinas] = useState<string[]>([]);
  const [selectedOficina, setSelectedOficina] = useState<string>('');
  const [oficinaMetrics, setOficinaMetrics] = useState<OficinaMetrics | null>(null);
  
  // Banco level
  const [bancoMetrics, setBancoMetrics] = useState<BancoMetrics | null>(null);

  useEffect(() => {
    loadGestoresAndOficinas();
  }, []);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      if (selectedGestor) loadGestorMetrics();
    }
  }, [dateRange, selectedGestor]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      if (selectedOficina) loadOficinaMetrics();
    }
  }, [dateRange, selectedOficina]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadBancoMetrics();
    }
  }, [dateRange]);

  const loadGestoresAndOficinas = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina')
        .order('full_name');

      if (profiles) {
        const gestoresList = profiles.map(p => ({
          id: p.id,
          name: p.full_name || p.email.split('@')[0],
          oficina: p.oficina || 'Sin asignar'
        }));
        setGestores(gestoresList);

        const oficinasSet = new Set(profiles.map(p => p.oficina || 'Sin asignar'));
        setOficinas(Array.from(oficinasSet).sort());
      }
    } catch (error) {
      console.error('Error loading gestores:', error);
      toast.error('Error al cargar gestores');
    }
  };

  const loadGestorMetrics = async () => {
    if (!selectedGestor || !dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Get gestor info
      const gestor = gestores.find(g => g.id === selectedGestor);
      if (!gestor) return;

      // Count visits
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', selectedGestor)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', selectedGestor)
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies
      const { count: companiesManaged } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', selectedGestor);

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setGestorMetrics({
        id: gestor.id,
        name: gestor.name,
        oficina: gestor.oficina,
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        companiesManaged: companiesManaged || 0
      });
    } catch (error) {
      console.error('Error loading gestor metrics:', error);
      toast.error('Error al cargar métricas del gestor');
    } finally {
      setLoading(false);
    }
  };

  const loadOficinaMetrics = async () => {
    if (!selectedOficina || !dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Get all gestores from this oficina
      const gestoresInOficina = gestores.filter(g => g.oficina === selectedOficina);
      const gestorIds = gestoresInOficina.map(g => g.id);

      if (gestorIds.length === 0) {
        setOficinaMetrics({
          oficina: selectedOficina,
          totalVisits: 0,
          successfulVisits: 0,
          successRate: 0,
          gestoresCount: 0,
          companiesCount: 0
        });
        setLoading(false);
        return;
      }

      // Count visits from all gestores in oficina
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds)
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies managed by gestores in this oficina
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds);

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setOficinaMetrics({
        oficina: selectedOficina,
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        gestoresCount: gestorIds.length,
        companiesCount: companiesCount || 0
      });
    } catch (error) {
      console.error('Error loading oficina metrics:', error);
      toast.error('Error al cargar métricas de la oficina');
    } finally {
      setLoading(false);
    }
  };

  const loadBancoMetrics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Count all visits in period
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setBancoMetrics({
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        oficinasCount: oficinas.length,
        gestoresCount: gestores.length,
        companiesCount: companiesCount || 0
      });
    } catch (error) {
      console.error('Error loading banco metrics:', error);
      toast.error('Error al cargar métricas del banco');
    } finally {
      setLoading(false);
    }
  };

  const MetricsCards = ({ metrics, type }: { metrics: any; type: 'gestor' | 'oficina' | 'banco' }) => {
    if (!metrics) return null;

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulVisits} exitosas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Del total de visitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {type === 'gestor' ? 'Empresas Gestionadas' : 
               type === 'oficina' ? 'Gestores/Empresas' : 'Oficinas/Gestores'}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {type === 'gestor' ? metrics.companiesManaged :
               type === 'oficina' ? `${metrics.gestoresCount}/${metrics.companiesCount}` :
               `${metrics.oficinasCount}/${metrics.gestoresCount}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {type === 'gestor' ? 'En cartera' :
               type === 'oficina' ? 'Gestores y empresas' : 
               'Cobertura total'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Explorador de Métricas</CardTitle>
          <CardDescription>
            Consulta métricas por gestor, oficina o banco agregado
          </CardDescription>
        </CardHeader>
      </Card>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      <Tabs defaultValue="gestor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gestor">
            <Users className="mr-2 h-4 w-4" />
            Por Gestor
          </TabsTrigger>
          <TabsTrigger value="oficina">
            <Building2 className="mr-2 h-4 w-4" />
            Por Oficina
          </TabsTrigger>
          <TabsTrigger value="banco">
            <TrendingUp className="mr-2 h-4 w-4" />
            Total Banco
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seleccionar Gestor</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGestor} onValueChange={setSelectedGestor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un gestor..." />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map(gestor => (
                    <SelectItem key={gestor.id} value={gestor.id}>
                      {gestor.name} ({gestor.oficina})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && gestorMetrics && (
            <>
              <MetricsCards metrics={gestorMetrics} type="gestor" />
              <Card>
                <CardHeader>
                  <CardTitle>Información del Gestor</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Nombre:</dt>
                      <dd className="font-medium">{gestorMetrics.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Oficina:</dt>
                      <dd className="font-medium">{gestorMetrics.oficina}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="oficina" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seleccionar Oficina</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOficina} onValueChange={setSelectedOficina}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una oficina..." />
                </SelectTrigger>
                <SelectContent>
                  {oficinas.map(oficina => (
                    <SelectItem key={oficina} value={oficina}>
                      {oficina}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && oficinaMetrics && (
            <MetricsCards metrics={oficinaMetrics} type="oficina" />
          )}
        </TabsContent>

        <TabsContent value="banco" className="space-y-4">
          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && bancoMetrics && (
            <MetricsCards metrics={bancoMetrics} type="banco" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
