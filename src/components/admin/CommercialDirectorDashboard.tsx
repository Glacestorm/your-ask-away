import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Building2, Target, 
  Calendar, Award, Activity, DollarSign 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

interface GestorData {
  id: string;
  name: string;
  oficina: string;
  totalVisits: number;
  successRate: number;
  avgVinculacion: number;
  companies: number;
  monthlyTrend: Array<{ month: string; visits: number; success: number }>;
  products: Array<{ name: string; count: number }>;
}

export function CommercialDirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [gestoresData, setGestoresData] = useState<GestorData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [oficinas, setOficinas] = useState<string[]>([]);
  const [selectedOficina, setSelectedOficina] = useState<string>('all');

  useEffect(() => {
    fetchCommercialData();
  }, [selectedPeriod, selectedGestor, selectedOficina]);

  const fetchCommercialData = async () => {
    try {
      setLoading(true);

      // Calcular fecha de inicio según período
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

      // Obtener gestores y sus datos
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina');

      if (profilesError || !profiles || profiles.length === 0) {
        console.error('Error fetching profiles:', profilesError);
        setGestoresData([]);
        setOficinas([]);
        setLoading(false);
        return;
      }

      // Obtener oficinas únicas
      const uniqueOficinas = Array.from(new Set(profiles.map(p => p.oficina).filter(Boolean))) as string[];
      setOficinas(uniqueOficinas);

      // Filtrar por oficina si está seleccionada
      let filteredProfiles = profiles;
      if (selectedOficina !== 'all') {
        filteredProfiles = profiles.filter(p => p.oficina === selectedOficina);
      }

      const gestoresDataPromises = filteredProfiles.map(async (gestor) => {
        // Visitas del gestor
        const { data: visits } = await supabase
          .from('visits')
          .select('*, company:companies(name)')
          .eq('gestor_id', gestor.id)
          .gte('visit_date', startDate.toISOString().split('T')[0]);

        // Empresas asignadas
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', gestor.id);

        // Usar valores por defecto si no hay datos
        const safeVisits = visits || [];
        const safeCompanies = companies || [];

        // Calcular métricas con validación estricta
        const totalVisits = safeVisits.length;
        const successfulVisits = safeVisits.filter(v => v.result === 'Exitosa').length;
        const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;
        
        // Filtrar solo visitas con porcentaje_vinculacion válido
        const validVinculaciones = safeVisits.filter(v => 
          v.porcentaje_vinculacion !== null && 
          v.porcentaje_vinculacion !== undefined && 
          !isNaN(v.porcentaje_vinculacion) &&
          isFinite(v.porcentaje_vinculacion)
        );
        
        const avgVinculacion = validVinculaciones.length > 0
          ? Math.round(validVinculaciones.reduce((sum, v) => sum + v.porcentaje_vinculacion!, 0) / validVinculaciones.length)
          : 0;

        // Tendencia mensual
        const monthlyMap: Record<string, { visits: number; success: number }> = {};
        safeVisits.forEach(visit => {
          const month = new Date(visit.visit_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
          if (!monthlyMap[month]) {
            monthlyMap[month] = { visits: 0, success: 0 };
          }
          monthlyMap[month].visits++;
          if (visit.result === 'Exitosa') {
            monthlyMap[month].success++;
          }
        });

        const monthlyTrend = Object.entries(monthlyMap)
          .map(([month, data]) => ({
            month,
            visits: data.visits,
            success: data.visits > 0 ? Math.round((data.success / data.visits) * 100) : 0
          }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
          .slice(-6);

        // Productos ofrecidos
        const productsMap: Record<string, number> = {};
        safeVisits.forEach(visit => {
          if (visit.productos_ofrecidos && Array.isArray(visit.productos_ofrecidos)) {
            visit.productos_ofrecidos.forEach((prod: string) => {
              productsMap[prod] = (productsMap[prod] || 0) + 1;
            });
          }
        });

        const products = Object.entries(productsMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          id: gestor.id,
          name: gestor.full_name || gestor.email,
          oficina: gestor.oficina || 'Sin asignar',
          totalVisits,
          successRate,
          avgVinculacion,
          companies: safeCompanies.length,
          monthlyTrend,
          products
        };
      });

      const data = await Promise.all(gestoresDataPromises);
      
      // Filtrar y validar datos antes de establecerlos
      const validData = data.filter(g => 
        !isNaN(g.totalVisits) && 
        !isNaN(g.successRate) && 
        !isNaN(g.avgVinculacion) &&
        !isNaN(g.companies) &&
        isFinite(g.totalVisits) &&
        isFinite(g.successRate) &&
        isFinite(g.avgVinculacion) &&
        isFinite(g.companies)
      );
      
      setGestoresData(validData.sort((a, b) => b.totalVisits - a.totalVisits));

    } catch (error: any) {
      console.error('Error fetching commercial data:', error);
      toast.error('Error al cargar datos del panel comercial');
      setGestoresData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales globales con validación
  const validGestores = gestoresData.filter(g => 
    !isNaN(g.successRate) && 
    !isNaN(g.avgVinculacion) && 
    isFinite(g.successRate) && 
    isFinite(g.avgVinculacion)
  );
  
  const globalStats = {
    totalVisits: gestoresData.reduce((sum, g) => sum + (g.totalVisits || 0), 0),
    avgSuccessRate: validGestores.length > 0 
      ? Math.round(validGestores.reduce((sum, g) => sum + g.successRate, 0) / validGestores.length)
      : 0,
    totalCompanies: gestoresData.reduce((sum, g) => sum + (g.companies || 0), 0),
    avgVinculacion: validGestores.length > 0
      ? Math.round(validGestores.reduce((sum, g) => sum + g.avgVinculacion, 0) / validGestores.length)
      : 0,
  };

  // Datos por oficina con validación
  const oficinaStats = oficinas.map(oficina => {
    const gestoresOficina = gestoresData.filter(g => g.oficina === oficina);
    const validGestoresOficina = gestoresOficina.filter(g => 
      !isNaN(g.successRate) && isFinite(g.successRate)
    );
    return {
      oficina,
      gestores: gestoresOficina.length,
      visitas: gestoresOficina.reduce((sum, g) => sum + (g.totalVisits || 0), 0),
      successRate: validGestoresOficina.length > 0
        ? Math.round(validGestoresOficina.reduce((sum, g) => sum + g.successRate, 0) / validGestoresOficina.length)
        : 0
    };
  }).sort((a, b) => b.visitas - a.visitas);

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
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Panel del Director Comercial</CardTitle>
              <CardDescription>
                Vista completa del rendimiento de gestores y oficinas
              </CardDescription>
            </div>
            <div className="flex gap-2">
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

              <Select value={selectedOficina} onValueChange={setSelectedOficina}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas las oficinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las oficinas</SelectItem>
                  {oficinas.map(oficina => (
                    <SelectItem key={oficina} value={oficina}>
                      {oficina}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="text-2xl font-bold">{globalStats.totalVisits || 0}</div>
            <p className="text-xs text-muted-foreground">
              {gestoresData.length} gestores activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.avgSuccessRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas en Cartera</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">Total asignadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vinculación Media</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.avgVinculacion || 0}%</div>
            <p className="text-xs text-muted-foreground">Promedio conseguido</p>
          </CardContent>
        </Card>
      </div>

      {gestoresData.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No se encontraron visitas registradas en el período seleccionado. 
              Las métricas se mostrarán una vez que se registren visitas en el sistema.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Análisis - Solo mostrar si hay datos */}
      {gestoresData.length > 0 && (
        <Tabs defaultValue="gestores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gestores">Gestores</TabsTrigger>
          <TabsTrigger value="oficinas">Oficinas</TabsTrigger>
          <TabsTrigger value="evolucion">Evolución</TabsTrigger>
        </TabsList>

        {/* Vista de Gestores */}
        <TabsContent value="gestores" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ranking de Gestores */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking por Visitas</CardTitle>
                <CardDescription>Top 10 gestores más activos</CardDescription>
              </CardHeader>
              <CardContent>
                {gestoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={gestoresData.slice(0, 10)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Bar dataKey="totalVisits" fill={COLORS[0]} name="Visitas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay datos de gestores disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasa de Éxito */}
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Éxito por Gestor</CardTitle>
                <CardDescription>Porcentaje de visitas exitosas</CardDescription>
              </CardHeader>
              <CardContent>
                {gestoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={gestoresData.slice(0, 10).sort((a, b) => b.successRate - a.successRate)} 
                      layout="horizontal"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="successRate" fill={COLORS[1]} name="% Éxito" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vinculación Media */}
            <Card>
              <CardHeader>
                <CardTitle>Vinculación Media por Gestor</CardTitle>
                <CardDescription>Porcentaje promedio conseguido</CardDescription>
              </CardHeader>
              <CardContent>
                {gestoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={gestoresData.slice(0, 10).sort((a, b) => b.avgVinculacion - a.avgVinculacion)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9 }}
                        height={80}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="avgVinculacion" fill={COLORS[2]} name="% Vinculación" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Empresas por Gestor */}
            <Card>
              <CardHeader>
                <CardTitle>Cartera de Empresas</CardTitle>
                <CardDescription>Empresas asignadas por gestor</CardDescription>
              </CardHeader>
              <CardContent>
                {gestoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={gestoresData.slice(0, 10).sort((a, b) => b.companies - a.companies)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9 }}
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="companies" fill={COLORS[3]} name="Empresas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista de Oficinas */}
        <TabsContent value="oficinas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visitas por Oficina</CardTitle>
                <CardDescription>Actividad comercial por ubicación</CardDescription>
              </CardHeader>
              <CardContent>
                {oficinaStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={oficinaStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="oficina" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visitas" fill={COLORS[0]} name="Visitas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay datos de oficinas disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Oficina</CardTitle>
                <CardDescription>Tasa de éxito y número de gestores</CardDescription>
              </CardHeader>
              <CardContent>
                {oficinaStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={oficinaStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="oficina" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="gestores" fill={COLORS[1]} name="Gestores" />
                      <Bar dataKey="successRate" fill={COLORS[2]} name="% Éxito" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista de Evolución */}
        <TabsContent value="evolucion" className="space-y-4">
          {gestoresData.length > 0 ? (
            gestoresData.slice(0, 5).map((gestor) => (
              <Card key={gestor.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{gestor.name}</CardTitle>
                      <CardDescription>
                        {gestor.oficina} • {gestor.totalVisits} visitas • {gestor.successRate}% éxito
                      </CardDescription>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Empresas</div>
                        <div className="font-bold">{gestor.companies}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Vinculación</div>
                        <div className="font-bold">{gestor.avgVinculacion}%</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {gestor.monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={gestor.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="visits" 
                          stroke={COLORS[0]} 
                          fill={COLORS[0]} 
                          fillOpacity={0.3}
                          name="Visitas" 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="success" 
                          stroke={COLORS[1]} 
                          name="% Éxito" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                      No hay datos de evolución disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No hay datos de gestores disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
