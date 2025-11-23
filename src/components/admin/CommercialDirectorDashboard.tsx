import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, Building2, Target, 
  Activity 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GestorMetrics {
  name: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

export function CommercialDirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [gestoresMetrics, setGestoresMetrics] = useState<GestorMetrics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [globalStats, setGlobalStats] = useState({
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Calcular fecha de inicio
      const startDate = new Date();
      switch (selectedPeriod) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Obtener perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (profilesError || !profiles) {
        throw profilesError;
      }

      // Obtener métricas de cada gestor
      const metricsPromises = profiles.map(async (profile) => {
        const { data: visits } = await supabase
          .from('visits')
          .select('id, result')
          .eq('gestor_id', profile.id)
          .gte('visit_date', startDate.toISOString().split('T')[0]);

        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', profile.id);

        const totalVisits = visits?.length || 0;
        const successfulVisits = visits?.filter(v => v.result === 'Exitosa').length || 0;
        const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;

        return {
          name: profile.full_name || profile.email,
          totalVisits,
          successRate,
          companies: companies?.length || 0
        };
      });

      const metrics = await Promise.all(metricsPromises);
      
      // Filtrar gestores con actividad
      const activeMetrics = metrics.filter(m => m.totalVisits > 0);
      setGestoresMetrics(activeMetrics.sort((a, b) => b.totalVisits - a.totalVisits));

      // Calcular estadísticas globales
      const totalVisits = activeMetrics.reduce((sum, m) => sum + m.totalVisits, 0);
      const avgSuccessRate = activeMetrics.length > 0
        ? Math.round(activeMetrics.reduce((sum, m) => sum + m.successRate, 0) / activeMetrics.length)
        : 0;
      const totalCompanies = metrics.reduce((sum, m) => sum + m.companies, 0);

      setGlobalStats({
        totalVisits,
        avgSuccessRate,
        totalCompanies,
        activeGestores: activeMetrics.length
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos del panel');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Filtro de período */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Panel del Director Comercial</CardTitle>
              <CardDescription>
                Vista general del rendimiento comercial
              </CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 mes</SelectItem>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {globalStats.activeGestores} gestores activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Total en cartera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.activeGestores}</div>
            <p className="text-xs text-muted-foreground">Con actividad</p>
          </CardContent>
        </Card>
      </div>

      {gestoresMetrics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No se encontraron visitas en el período seleccionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Ranking por Visitas */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking por Visitas</CardTitle>
              <CardDescription>Top gestores más activos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={gestoresMetrics.slice(0, 10)} 
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalVisits" fill="hsl(var(--chart-1))" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tasa de Éxito */}
          <Card>
            <CardHeader>
              <CardTitle>Tasa de Éxito</CardTitle>
              <CardDescription>Porcentaje de visitas exitosas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={gestoresMetrics
                    .slice(0, 10)
                    .sort((a, b) => b.successRate - a.successRate)
                  } 
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="successRate" fill="hsl(var(--chart-2))" name="% Éxito" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
