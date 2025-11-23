import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Target, Building2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// FASE 1: Solo KPIs básicos sin gráficos

interface BasicStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
}

export function CommercialDirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BasicStats>({
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0
  });

  useEffect(() => {
    fetchBasicStats();
  }, []);

  const fetchBasicStats = async () => {
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

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar estadísticas');
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
            Fase 1: KPIs básicos - Sin gráficos
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

      {/* Mensaje informativo */}
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">✓ Fase 1 funcionando correctamente</p>
            <p className="text-sm">Si no hay errores, podemos continuar con la Fase 2 (gráficos simples)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
