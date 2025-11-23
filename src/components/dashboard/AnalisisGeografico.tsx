import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface AnalisisGeograficoProps {
  startDate?: string;
  endDate?: string;
}

export function AnalisisGeografico({ startDate, endDate }: AnalisisGeograficoProps) {
  const [loading, setLoading] = useState(true);
  const [parroquiaData, setParroquiaData] = useState<any[]>([]);
  const [visitasPorParroquia, setVisitasPorParroquia] = useState<any[]>([]);
  const [oficinaData, setOficinaData] = useState<any[]>([]);

  useEffect(() => {
    fetchGeographicData();
  }, [startDate, endDate]);

  const fetchGeographicData = async () => {
    try {
      setLoading(true);

      // Distribución de empresas por parroquia
      const { data: companies } = await supabase
        .from('companies')
        .select('parroquia, oficina');

      const parroquiaMap: any = {};
      const oficinaMap: any = {};
      
      companies?.forEach((company: any) => {
        const parroquia = company.parroquia || 'Sin parroquia';
        if (!parroquiaMap[parroquia]) {
          parroquiaMap[parroquia] = { name: parroquia, value: 0 };
        }
        parroquiaMap[parroquia].value++;

        const oficina = company.oficina || 'Sin oficina';
        if (!oficinaMap[oficina]) {
          oficinaMap[oficina] = { oficina, empresas: 0 };
        }
        oficinaMap[oficina].empresas++;
      });

      setParroquiaData(Object.values(parroquiaMap).sort((a: any, b: any) => b.value - a.value));
      setOficinaData(Object.values(oficinaMap).sort((a: any, b: any) => b.empresas - a.empresas));

      // Visitas por parroquia en el periodo
      let visitsQuery = supabase
        .from('visits')
        .select('company_id, companies(parroquia)');
      
      if (startDate) visitsQuery = visitsQuery.gte('visit_date', startDate);
      if (endDate) visitsQuery = visitsQuery.lte('visit_date', endDate);

      const { data: visits } = await visitsQuery;

      const visitasParroquiaMap: any = {};
      visits?.forEach((visit: any) => {
        const parroquia = visit.companies?.parroquia || 'Sin parroquia';
        if (!visitasParroquiaMap[parroquia]) {
          visitasParroquiaMap[parroquia] = { parroquia, visitas: 0 };
        }
        visitasParroquiaMap[parroquia].visitas++;
      });

      setVisitasPorParroquia(
        Object.values(visitasParroquiaMap)
          .sort((a: any, b: any) => b.visitas - a.visitas)
          .slice(0, 10)
      );

    } catch (error: any) {
      console.error('Error fetching geographic data:', error);
      toast.error('Error al cargar datos geográficos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Análisis Geográfico</h2>
        <p className="text-muted-foreground">Distribución territorial de empresas y actividad comercial</p>
      </div>

      {/* KPIs Geográficos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parroquias</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parroquiaData.length}</div>
            <p className="text-xs text-muted-foreground">Con empresas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parroquia Más Activa</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {parroquiaData.length > 0 ? parroquiaData[0].name : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {parroquiaData.length > 0 ? `${parroquiaData[0].value} empresas` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Oficinas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oficinaData.length}</div>
            <p className="text-xs text-muted-foreground">Gestoras activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribución por Parroquia */}
        {parroquiaData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Empresas por Parroquia</CardTitle>
              <CardDescription>Distribución del portfolio empresarial</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={parroquiaData.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {parroquiaData.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Visitas por Parroquia */}
        {visitasPorParroquia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Visitas por Parroquia</CardTitle>
              <CardDescription>Actividad comercial por zona en periodo seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visitasPorParroquia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="parroquia" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Empresas por Oficina */}
        {oficinaData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Distribución por Oficina Gestora</CardTitle>
              <CardDescription>Cartera de empresas por oficina</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={oficinaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="oficina" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="empresas" fill="hsl(var(--chart-2))" name="Empresas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
