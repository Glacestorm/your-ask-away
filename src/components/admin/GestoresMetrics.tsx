import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Award, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function GestoresMetrics() {
  const [loading, setLoading] = useState(true);
  const [topGestores, setTopGestores] = useState<any[]>([]);
  const [successRate, setSuccessRate] = useState<any[]>([]);
  const [companiesPerGestor, setCompaniesPerGestor] = useState<any[]>([]);

  useEffect(() => {
    fetchGestoresData();
  }, []);

  const fetchGestoresData = async () => {
    try {
      setLoading(true);

      // Top gestores por número de visitas (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: visits } = await supabase
        .from('visits')
        .select('gestor_id, result, profiles(full_name, email)')
        .gte('visit_date', sixMonthsAgo.toISOString().split('T')[0]);

      const gestorMap: any = {};
      const successMap: any = {};

      visits?.forEach((visit: any) => {
        const gestorName = visit.profiles?.full_name || visit.profiles?.email || 'Sin asignar';
        const gestorId = visit.gestor_id;
        
        // Contador de visitas
        if (!gestorMap[gestorId]) {
          gestorMap[gestorId] = { gestor: gestorName, visitas: 0 };
        }
        gestorMap[gestorId].visitas++;

        // Tasa de éxito
        if (!successMap[gestorId]) {
          successMap[gestorId] = {
            gestor: gestorName,
            exitosas: 0,
            total: 0,
            tasa: 0
          };
        }
        successMap[gestorId].total++;
        if (visit.result === 'Exitosa') {
          successMap[gestorId].exitosas++;
        }
      });

      // Calcular tasas de éxito
      Object.values(successMap).forEach((g: any) => {
        g.tasa = g.total > 0 ? Math.round((g.exitosas / g.total) * 100) : 0;
        if (!isFinite(g.tasa) || isNaN(g.tasa)) {
          g.tasa = 0;
        }
      });

      const sortedGestores = Object.values(gestorMap)
        .sort((a: any, b: any) => (b.visitas || 0) - (a.visitas || 0))
        .slice(0, 10)
        .filter((g: any) => g.gestor && !isNaN(g.visitas));
      setTopGestores(sortedGestores);

      const sortedSuccess = Object.values(successMap)
        .filter((g: any) => g.total >= 5 && g.gestor && !isNaN(g.tasa)) // Solo gestores con al menos 5 visitas
        .sort((a: any, b: any) => (b.tasa || 0) - (a.tasa || 0))
        .slice(0, 10);
      setSuccessRate(sortedSuccess);

      // Empresas asignadas por gestor
      const { data: companies } = await supabase
        .from('companies')
        .select('gestor_id, profiles(full_name, email)');

      const companyMap: any = {};
      companies?.forEach((company: any) => {
        const gestorName = company.profiles?.full_name || company.profiles?.email || 'Sin asignar';
        if (!companyMap[gestorName]) {
          companyMap[gestorName] = { gestor: gestorName, empresas: 0 };
        }
        companyMap[gestorName].empresas++;
      });

      const sortedCompanies = Object.values(companyMap)
        .sort((a: any, b: any) => (b.empresas || 0) - (a.empresas || 0))
        .slice(0, 10)
        .filter((c: any) => c.gestor && !isNaN(c.empresas));
      setCompaniesPerGestor(sortedCompanies);

    } catch (error: any) {
      console.error('Error fetching gestores data:', error);
      toast.error('Error al cargar datos de gestores');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (topGestores.length === 0 && successRate.length === 0 && companiesPerGestor.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Gestores</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Registra visitas y asigna gestores a empresas para ver las estadísticas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestor Más Activo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topGestores.length > 0 ? topGestores[0].gestor : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topGestores.length > 0 ? `${topGestores[0].visitas} visitas` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mayor Tasa de Éxito</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {successRate.length > 0 ? successRate[0].gestor : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {successRate.length > 0 ? `${successRate[0].tasa}% de éxito` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Más Empresas Asignadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {companiesPerGestor.length > 0 ? companiesPerGestor[0].gestor : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {companiesPerGestor.length > 0 ? `${companiesPerGestor[0].empresas} empresas` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Gestores por Visitas */}
        {topGestores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Gestores por Visitas</CardTitle>
              <CardDescription>Gestores con más visitas (últimos 6 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={topGestores.filter(g => 
                    !isNaN(g.visitas) && isFinite(g.visitas)
                  )} 
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis 
                    dataKey="gestor" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Tasa de Éxito por Gestor */}
        {successRate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tasa de Éxito por Gestor</CardTitle>
              <CardDescription>Porcentaje de visitas exitosas (mín. 5 visitas)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={successRate.filter(g => 
                    !isNaN(g.tasa) && isFinite(g.tasa)
                  )} 
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} allowDecimals={false} />
                  <YAxis 
                    dataKey="gestor" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="tasa" fill="hsl(var(--chart-2))" name="% Éxito" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Empresas Asignadas */}
        {companiesPerGestor.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Empresas Asignadas por Gestor</CardTitle>
              <CardDescription>Distribución de empresas en cartera</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={companiesPerGestor.filter(c => 
                    !isNaN(c.empresas) && isFinite(c.empresas)
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="gestor" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="empresas" fill="hsl(var(--chart-3))" name="Empresas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
