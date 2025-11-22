import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { ArrowLeft, Download, TrendingUp, Users, Building2, Package, FileText, Calendar, Target, Award } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalProducts: 0,
    totalVisits: 0,
    totalUsers: 0,
    activeProducts: 0,
    companiesWithProducts: 0,
    visitasUltimoMes: 0,
    avgVisitsPorEmpresa: 0,
  });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [parroquiaData, setParroquiaData] = useState<any[]>([]);
  const [monthlyVisits, setMonthlyVisits] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topGestores, setTopGestores] = useState<any[]>([]);
  const [visitTrend, setVisitTrend] = useState<any[]>([]);
  const [productDistribution, setProductDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      toast.error('Debes iniciar sesión para acceder');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Estadísticas generales
      const [companiesRes, productsRes, visitsRes, usersRes, activeProductsRes, companyProductsRes] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('visits').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('company_products').select('company_id', { count: 'exact' }),
      ]);

      // Visitas del último mes
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const { count: visitsLastMonth } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .gte('visit_date', lastMonth.toISOString().split('T')[0]);

      // Empresas únicas con productos
      const uniqueCompanies = new Set(companyProductsRes.data?.map((cp: any) => cp.company_id));
      
      // Promedio de visitas por empresa
      const avgVisits = companiesRes.count ? (visitsRes.count || 0) / companiesRes.count : 0;

      setStats({
        totalCompanies: companiesRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalVisits: visitsRes.count || 0,
        totalUsers: usersRes.count || 0,
        activeProducts: activeProductsRes.count || 0,
        companiesWithProducts: uniqueCompanies.size,
        visitasUltimoMes: visitsLastMonth || 0,
        avgVisitsPorEmpresa: parseFloat(avgVisits.toFixed(1)),
      });

      // Distribución por estado
      const { data: companiesWithStatus } = await supabase
        .from('companies')
        .select('status_id, status_colors(status_name, color_hex)');

      const statusMap: any = {};
      companiesWithStatus?.forEach((company: any) => {
        const statusName = company.status_colors?.status_name || 'Sin estado';
        const colorHex = company.status_colors?.color_hex || '#gray';
        if (!statusMap[statusName]) {
          statusMap[statusName] = { name: statusName, value: 0, color: colorHex };
        }
        statusMap[statusName].value++;
      });

      setStatusData(Object.values(statusMap));

      // Distribución por parroquia
      const { data: companiesByParroquia } = await supabase
        .from('companies')
        .select('parroquia');

      const parroquiaMap: any = {};
      companiesByParroquia?.forEach((company: any) => {
        const parroquia = company.parroquia;
        if (!parroquiaMap[parroquia]) {
          parroquiaMap[parroquia] = { name: parroquia, empresas: 0 };
        }
        parroquiaMap[parroquia].empresas++;
      });

      setParroquiaData(Object.values(parroquiaMap));

      // Visitas mensuales (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: visitsData } = await supabase
        .from('visits')
        .select('visit_date')
        .gte('visit_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('visit_date');

      const monthlyMap: any = {};
      visitsData?.forEach((visit: any) => {
        const date = new Date(visit.visit_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { mes: monthKey, visitas: 0 };
        }
        monthlyMap[monthKey].visitas++;
      });

      setMonthlyVisits(Object.values(monthlyMap));

      // Top 5 productos más contratados
      const { data: companyProductsData } = await supabase
        .from('company_products')
        .select('product_id, products(name)')
        .eq('active', true);

      const productMap: any = {};
      companyProductsData?.forEach((cp: any) => {
        const productName = cp.products?.name || 'Desconocido';
        if (!productMap[productName]) {
          productMap[productName] = { nombre: productName, contratos: 0 };
        }
        productMap[productName].contratos++;
      });

      const sortedProducts = Object.values(productMap)
        .sort((a: any, b: any) => b.contratos - a.contratos)
        .slice(0, 5);
      setTopProducts(sortedProducts);

      // Top gestores por número de visitas
      const { data: gestoresData } = await supabase
        .from('visits')
        .select('gestor_id, profiles(full_name, email)');

      const gestorMap: any = {};
      gestoresData?.forEach((visit: any) => {
        const gestorName = visit.profiles?.full_name || visit.profiles?.email || 'Sin asignar';
        if (!gestorMap[gestorName]) {
          gestorMap[gestorName] = { gestor: gestorName, visitas: 0 };
        }
        gestorMap[gestorName].visitas++;
      });

      const sortedGestores = Object.values(gestorMap)
        .sort((a: any, b: any) => b.visitas - a.visitas)
        .slice(0, 5);
      setTopGestores(sortedGestores);

      // Tendencia de visitas (últimos 12 meses)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: visitsTrendData } = await supabase
        .from('visits')
        .select('visit_date')
        .gte('visit_date', twelveMonthsAgo.toISOString().split('T')[0])
        .order('visit_date');

      const trendMap: any = {};
      visitsTrendData?.forEach((visit: any) => {
        const date = new Date(visit.visit_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!trendMap[monthKey]) {
          trendMap[monthKey] = { mes: monthKey, visitas: 0 };
        }
        trendMap[monthKey].visitas++;
      });

      setVisitTrend(Object.values(trendMap));

      // Distribución de productos por categoría
      const { data: productsData } = await supabase
        .from('products')
        .select('category')
        .eq('active', true);

      const categoryMap: any = {};
      productsData?.forEach((product: any) => {
        const category = product.category || 'Sin categoría';
        if (!categoryMap[category]) {
          categoryMap[category] = { categoria: category, productos: 0 };
        }
        categoryMap[category].productos++;
      });

      setProductDistribution(Object.values(categoryMap));

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*, status_colors(status_name), profiles(full_name, email)');

      if (!companies) return;

      const exportData = companies.map((c: any) => ({
        Nombre: c.name,
        Dirección: c.address,
        Parroquia: c.parroquia,
        CNAE: c.cnae || '',
        Estado: c.status_colors?.status_name || '',
        Gestor: c.profiles?.full_name || c.profiles?.email || '',
        'Última Visita': c.fecha_ultima_visita || '',
        Observaciones: c.observaciones || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
      XLSX.writeFile(wb, `empresas_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Datos exportados correctamente');
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar los datos');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard Analítico</h1>
              <p className="text-muted-foreground">Estadísticas y análisis del sistema</p>
            </div>
          </div>
          <Button onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Datos
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.companiesWithProducts} con productos
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground">
                  De {stats.totalProducts} totales
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.visitasUltimoMes} último mes
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Gestores activos</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Promedio Visitas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgVisitsPorEmpresa}</div>
                <p className="text-xs text-muted-foreground">Por empresa</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mes Actual</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.visitasUltimoMes}</div>
                <p className="text-xs text-muted-foreground">Visitas realizadas</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tasa Cobertura</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalCompanies > 0
                    ? Math.round((stats.companiesWithProducts / stats.totalCompanies) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Empresas con productos</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsers > 0
                    ? Math.round(stats.totalVisits / stats.totalUsers)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Visitas por gestor</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="visits">Visitas</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Informes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Empresas por Estado</CardTitle>
                  <CardDescription>Distribución de empresas según su estado</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-[280px] w-[280px] rounded-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Visitas</CardTitle>
                  <CardDescription>Evolución de visitas en los últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={visitTrend}>
                        <defs>
                          <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="visitas" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorVisitas)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Gestores</CardTitle>
                  <CardDescription>Por número de visitas realizadas</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topGestores} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="gestor" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="visitas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Productos</CardTitle>
                  <CardDescription>Productos más contratados</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nombre" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="contratos" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Empresas por Parroquia</CardTitle>
                <CardDescription>Distribución geográfica de empresas</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={parroquiaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="empresas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Visitas Últimos 6 Meses</CardTitle>
                  <CardDescription>Evolución reciente de visitas</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyVisits}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="visitas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia Anual</CardTitle>
                  <CardDescription>Visitas en los últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visitTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="visitas" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--chart-2))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Productos por Categoría</CardTitle>
                  <CardDescription>Distribución de productos activos</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={(entry) => `${entry.categoria}: ${entry.productos}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="productos"
                        >
                          {productDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Productos Contratados</CardTitle>
                  <CardDescription>Los 5 productos más populares</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="contratos" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ReportGenerator />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Exportaciones Rápidas
                  </CardTitle>
                  <CardDescription>
                    Exporta datos en diferentes formatos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Empresas a Excel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
