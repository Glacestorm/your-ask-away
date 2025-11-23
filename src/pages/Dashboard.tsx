import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  BarChart3, 
  Package, 
  Users, 
  Target, 
  MapPin, 
  FileText,
  Download,
  GitCompare,
  LineChart,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ResumenEjecutivo } from '@/components/dashboard/ResumenEjecutivo';
import { AnalisisGeografico } from '@/components/dashboard/AnalisisGeografico';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { ComparativaTemporales } from '@/components/dashboard/ComparativaTemporales';
import { PrediccionesFuturas } from '@/components/dashboard/PrediccionesFuturas';
import { ObjetivosYMetas } from '@/components/dashboard/ObjetivosYMetas';
import { VisitsMetrics } from '@/components/admin/VisitsMetrics';
import { ProductsMetrics } from '@/components/admin/ProductsMetrics';
import { GestoresMetrics } from '@/components/admin/GestoresMetrics';
import { VinculacionMetrics } from '@/components/admin/VinculacionMetrics';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      toast.error('Debes iniciar sesión para acceder');
    }
  }, [user, authLoading, navigate]);

  const exportToExcel = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*, status_colors(status_name), profiles(full_name, email)');

      if (!companies) {
        toast.error('No hay datos para exportar');
        return;
      }

      const exportData = companies.map((c: any) => ({
        Nombre: c.name,
        Dirección: c.address,
        Parroquia: c.parroquia,
        Oficina: c.oficina || '',
        CNAE: c.cnae || '',
        Estado: c.status_colors?.status_name || '',
        Gestor: c.profiles?.full_name || c.profiles?.email || '',
        'Última Visita': c.fecha_ultima_visita || '',
        Empleados: c.employees || '',
        Facturación: c.turnover || '',
        Teléfono: c.phone || '',
        Email: c.email || '',
        Web: c.website || '',
        Observaciones: c.observaciones || '',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
      XLSX.writeFile(wb, `empresas_dashboard_${new Date().toISOString().split('T')[0]}.xlsx`);

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

  const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Comercial</h1>
              <p className="text-muted-foreground">Análisis integral de gestión y rendimiento</p>
            </div>
          </div>
          <Button onClick={exportToExcel} className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar Datos
          </Button>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
        />

        {/* Dashboard Tabs */}
        <Tabs defaultValue="resumen" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10 h-auto">
            <TabsTrigger value="resumen" className="flex items-center gap-2 py-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="comparativa" className="flex items-center gap-2 py-3">
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">Comparativa</span>
            </TabsTrigger>
            <TabsTrigger value="predicciones" className="flex items-center gap-2 py-3">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Predicciones</span>
            </TabsTrigger>
            <TabsTrigger value="objetivos" className="flex items-center gap-2 py-3">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Objetivos</span>
            </TabsTrigger>
            <TabsTrigger value="visitas" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visitas</span>
            </TabsTrigger>
            <TabsTrigger value="productos" className="flex items-center gap-2 py-3">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="gestores" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Gestores</span>
            </TabsTrigger>
            <TabsTrigger value="vinculacion" className="flex items-center gap-2 py-3">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Vinculación</span>
            </TabsTrigger>
            <TabsTrigger value="geografico" className="flex items-center gap-2 py-3">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Geográfico</span>
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
          </TabsList>

          {/* Resumen Ejecutivo */}
          <TabsContent value="resumen" className="space-y-6">
            <ResumenEjecutivo startDate={startDate} endDate={endDate} />
          </TabsContent>

          {/* Análisis Comparativo */}
          <TabsContent value="comparativa" className="space-y-6">
            <ComparativaTemporales startDate={startDate} endDate={endDate} />
          </TabsContent>

          {/* Predicciones Futuras */}
          <TabsContent value="predicciones" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Predicciones y Tendencias</h2>
                <p className="text-muted-foreground">
                  Proyecciones del próximo trimestre basadas en análisis de regresión
                </p>
              </div>
              <PrediccionesFuturas />
            </div>
          </TabsContent>

          {/* Objetivos y Metas */}
          <TabsContent value="objetivos" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Objetivos y Metas</h2>
                <p className="text-muted-foreground">
                  Seguimiento de objetivos y comparación con predicciones
                </p>
              </div>
              <ObjetivosYMetas />
            </div>
          </TabsContent>

          {/* Análisis de Visitas */}
          <TabsContent value="visitas" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Análisis de Visitas</h2>
                <p className="text-muted-foreground">
                  Evolución temporal y distribución de visitas comerciales
                </p>
              </div>
              <VisitsMetrics />
            </div>
          </TabsContent>

          {/* Análisis de Productos */}
          <TabsContent value="productos" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Análisis de Productos</h2>
                <p className="text-muted-foreground">
                  Productos más contratados y ofrecidos en visitas
                </p>
              </div>
              <ProductsMetrics />
            </div>
          </TabsContent>

          {/* Rendimiento de Gestores */}
          <TabsContent value="gestores" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Rendimiento de Gestores</h2>
                <p className="text-muted-foreground">
                  Evaluación de desempeño y tasa de éxito por gestor
                </p>
              </div>
              <GestoresMetrics />
            </div>
          </TabsContent>

          {/* Evolución de Vinculación */}
          <TabsContent value="vinculacion" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Evolución de Vinculación</h2>
                <p className="text-muted-foreground">
                  Análisis del porcentaje de vinculación conseguido con clientes
                </p>
              </div>
              <VinculacionMetrics />
            </div>
          </TabsContent>

          {/* Análisis Geográfico */}
          <TabsContent value="geografico" className="space-y-6">
            <AnalisisGeografico startDate={startDate} endDate={endDate} />
          </TabsContent>

          {/* Generación de Reportes */}
          <TabsContent value="reportes" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Generador de Reportes</h2>
                <p className="text-muted-foreground">
                  Crea reportes personalizados en formato PDF
                </p>
              </div>
              <ReportGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
