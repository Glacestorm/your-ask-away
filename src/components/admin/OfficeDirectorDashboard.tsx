import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, Building2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format } from 'date-fns';
import { MetricsExplorer } from '@/components/admin/MetricsExplorer';
import { useAuth } from '@/hooks/useAuth';

// Panel del Director de Oficina con vista filtrada por su oficina

interface BasicStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
}

interface GestorRanking {
  name: string;
  visits: number;
}

interface GestorDetail {
  name: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

export function OfficeDirectorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userOficina, setUserOficina] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });
  const [stats, setStats] = useState<BasicStats>({
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0
  });
  const [gestorRanking, setGestorRanking] = useState<GestorRanking[]>([]);
  const [gestorDetails, setGestorDetails] = useState<GestorDetail[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserOffice();
    }
  }, [user]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to && userOficina) {
      fetchData();
    }
  }, [dateRange, userOficina]);

  const fetchUserOffice = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('oficina')
        .eq('id', user.id)
        .single();

      if (profile?.oficina) {
        setUserOficina(profile.oficina);
      } else {
        toast.error('No tienes una oficina asignada. Contacta al administrador.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user office:', error);
      toast.error('Error al obtener tu oficina');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!userOficina) return;

    try {
      setLoading(true);

      if (!dateRange?.from || !dateRange?.to) return;

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Obtener gestores de la oficina
      const { data: officeProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('oficina', userOficina);

      if (!officeProfiles || officeProfiles.length === 0) {
        toast.error('No hay gestores en tu oficina');
        setLoading(false);
        return;
      }

      const gestorIds = officeProfiles.map(p => p.id);

      // Contar visitas totales de la oficina en el período
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Contar visitas exitosas de la oficina en el período
      const { count: successCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds)
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Contar empresas de la oficina
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds);

      const totalVisits = visitsCount || 0;
      const successfulVisits = successCount || 0;
      const avgSuccessRate = totalVisits > 0 
        ? Math.round((successfulVisits / totalVisits) * 100) 
        : 0;

      setStats({
        totalVisits,
        avgSuccessRate,
        totalCompanies: companiesCount || 0,
        activeGestores: officeProfiles.length
      });

      // Obtener datos detallados de cada gestor
      const detailsPromises = officeProfiles.map(async (profile) => {
        // Contar visitas del gestor en el período
        const { count: visitCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', profile.id)
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate);

        // Contar visitas exitosas del gestor en el período
        const { count: successVisitCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', profile.id)
          .eq('result', 'Exitosa')
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate);

        // Contar empresas del gestor
        const { count: companyCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', profile.id);

        const visits = visitCount || 0;
        const successVisits = successVisitCount || 0;
        const successRate = visits > 0 ? Math.round((successVisits / visits) * 100) : 0;

        return {
          name: profile.full_name || profile.email.split('@')[0],
          totalVisits: visits,
          successRate,
          companies: companyCount || 0
        };
      });

      const details = await Promise.all(detailsPromises);
      
      // Para el ranking (solo con visitas)
      const ranking = details
        .filter(d => d.totalVisits > 0)
        .sort((a, b) => b.totalVisits - a.totalVisits)
        .slice(0, 10)
        .map(d => ({ name: d.name, visits: d.totalVisits }));
      
      setGestorRanking(ranking);

      // Para la tabla (todos los gestores)
      const sortedDetails = details.sort((a, b) => b.totalVisits - a.totalVisits);
      setGestorDetails(sortedDetails);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (!userOficina && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error de configuración</CardTitle>
          <CardDescription>
            No tienes una oficina asignada. Contacta al administrador del sistema.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader>
          <CardTitle>Panel del Director de Oficina</CardTitle>
          <CardDescription>
            Vista de tu oficina: {userOficina} - Métricas de gestores y explorador
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="explorer">Explorador de Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filtro de período */}
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
          />

          {/* KPIs de la Oficina */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  De tu oficina
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
                <p className="text-xs text-muted-foreground">Promedio oficina</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empresas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">En cartera</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gestores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeGestores}</div>
                <p className="text-xs text-muted-foreground">En tu oficina</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Gestores</CardTitle>
              <CardDescription>Top gestores de tu oficina por visitas</CardDescription>
            </CardHeader>
            <CardContent>
              {gestorRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={gestorRanking} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="visits" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de Gestores */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Gestores</CardTitle>
              <CardDescription>Información completa de los gestores de tu oficina</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gestor</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                    <TableHead className="text-right">Tasa Éxito</TableHead>
                    <TableHead className="text-right">Empresas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gestorDetails.length > 0 ? (
                    gestorDetails.map((gestor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{gestor.name}</TableCell>
                        <TableCell className="text-right">{gestor.totalVisits}</TableCell>
                        <TableCell className="text-right">{gestor.successRate}%</TableCell>
                        <TableCell className="text-right">{gestor.companies}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer">
          <MetricsExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
