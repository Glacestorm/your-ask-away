import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, Building2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// FASE 2: KPIs + Un gráfico simple de barras

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

export function CommercialDirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BasicStats>({
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0
  });
  const [gestorRanking, setGestorRanking] = useState<GestorRanking[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Contar visitas totales
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true });

      // Contar visitas exitosas
      const { count: successCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'Exitosa');

      // Contar empresas
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Contar gestores
      const { count: gestoresCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const totalVisits = visitsCount || 0;
      const successfulVisits = successCount || 0;
      const avgSuccessRate = totalVisits > 0 
        ? Math.round((successfulVisits / totalVisits) * 100) 
        : 0;

      setStats({
        totalVisits,
        avgSuccessRate,
        totalCompanies: companiesCount || 0,
        activeGestores: gestoresCount || 0
      });

      // Obtener ranking de gestores
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (profiles) {
        const rankingPromises = profiles.map(async (profile) => {
          const { count } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id);

          return {
            name: profile.full_name || profile.email.split('@')[0],
            visits: count || 0
          };
        });

        const ranking = await Promise.all(rankingPromises);
        const sortedRanking = ranking
          .filter(r => r.visits > 0)
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 10);
        
        setGestorRanking(sortedRanking);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
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
      {/* Encabezado */}
      <Card>
        <CardHeader>
          <CardTitle>Panel del Director Comercial</CardTitle>
          <CardDescription>
            Fase 2: KPIs + Gráfico simple de barras
          </CardDescription>
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
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              Todas las visitas registradas
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
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Total en cartera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGestores}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Gestores</CardTitle>
          <CardDescription>Top 10 por número de visitas</CardDescription>
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

      {/* Mensaje informativo */}
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">✓ Fase 2 funcionando correctamente</p>
            <p className="text-sm">Si no hay errores, podemos continuar con la Fase 3 (tabla de datos)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
