import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Printer,
  Mail,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface MigrationReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'errors' | 'performance' | 'comparison';
  generatedAt: string;
  period: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  size: string;
  status: 'ready' | 'generating' | 'failed';
}

interface MigrationTrend {
  date: string;
  successful: number;
  failed: number;
  total: number;
  avgSpeed: number;
}

interface EntityStats {
  entity: string;
  migrated: number;
  errors: number;
  successRate: number;
  avgTime: number;
}

interface SourceComparison {
  source: string;
  migrations: number;
  records: number;
  successRate: number;
  avgDuration: number;
}

export function CRMReportsPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');

  // Mock data for reports
  const recentReports: MigrationReport[] = [
    {
      id: '1',
      name: 'Reporte Mensual - Diciembre 2024',
      type: 'summary',
      generatedAt: new Date().toISOString(),
      period: '01/12/2024 - 31/12/2024',
      format: 'pdf',
      size: '2.4 MB',
      status: 'ready'
    },
    {
      id: '2',
      name: 'Análisis de Errores - Salesforce',
      type: 'errors',
      generatedAt: subDays(new Date(), 2).toISOString(),
      period: '15/12/2024 - 20/12/2024',
      format: 'excel',
      size: '856 KB',
      status: 'ready'
    },
    {
      id: '3',
      name: 'Comparativa de Fuentes Q4',
      type: 'comparison',
      generatedAt: subDays(new Date(), 5).toISOString(),
      period: 'Q4 2024',
      format: 'pdf',
      size: '4.1 MB',
      status: 'ready'
    }
  ];

  const trendData: MigrationTrend[] = useMemo(() => {
    const data: MigrationTrend[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const successful = Math.floor(Math.random() * 500) + 200;
      const failed = Math.floor(Math.random() * 50);
      data.push({
        date: format(date, 'dd/MM', { locale: es }),
        successful,
        failed,
        total: successful + failed,
        avgSpeed: Math.floor(Math.random() * 200) + 100
      });
    }
    return data;
  }, []);

  const entityStats: EntityStats[] = [
    { entity: 'Contactos', migrated: 15420, errors: 45, successRate: 99.7, avgTime: 0.8 },
    { entity: 'Empresas', migrated: 3280, errors: 12, successRate: 99.6, avgTime: 1.2 },
    { entity: 'Oportunidades', migrated: 8750, errors: 28, successRate: 99.7, avgTime: 1.5 },
    { entity: 'Actividades', migrated: 42100, errors: 156, successRate: 99.6, avgTime: 0.5 },
    { entity: 'Notas', migrated: 28900, errors: 89, successRate: 99.7, avgTime: 0.3 }
  ];

  const sourceComparison: SourceComparison[] = [
    { source: 'Salesforce', migrations: 24, records: 45000, successRate: 99.8, avgDuration: 45 },
    { source: 'HubSpot', migrations: 18, records: 32000, successRate: 99.5, avgDuration: 38 },
    { source: 'Pipedrive', migrations: 12, records: 18500, successRate: 99.7, avgDuration: 28 },
    { source: 'Zoho CRM', migrations: 8, records: 12000, successRate: 99.4, avgDuration: 32 },
    { source: 'CSV Import', migrations: 156, records: 89000, successRate: 98.9, avgDuration: 15 }
  ];

  const pieData = [
    { name: 'Exitosas', value: 98450, color: 'hsl(var(--chart-1))' },
    { name: 'Con Errores', value: 330, color: 'hsl(var(--chart-2))' },
    { name: 'Parciales', value: 120, color: 'hsl(var(--chart-3))' }
  ];

  const handleGenerateReport = async (type: string) => {
    setIsGenerating(true);
    toast.info('Generando reporte...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
    toast.success(`Reporte ${type} generado correctamente`);
  };

  const handleExport = (format: string) => {
    toast.success(`Exportando datos en formato ${format.toUpperCase()}`);
  };

  const handleDownloadReport = (report: MigrationReport) => {
    toast.success(`Descargando: ${report.name}`);
  };

  const totalMigrated = entityStats.reduce((sum, e) => sum + e.migrated, 0);
  const totalErrors = entityStats.reduce((sum, e) => sum + e.errors, 0);
  const overallSuccessRate = ((totalMigrated - totalErrors) / totalMigrated * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
          <p className="text-muted-foreground">
            Estadísticas detalladas y exportación de datos de migración
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Migrados</p>
                <p className="text-3xl font-bold">{totalMigrated.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-500 text-sm">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12.5% vs mes anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                <p className="text-3xl font-bold">{overallSuccessRate}%</p>
                <div className="flex items-center gap-1 mt-1 text-blue-500 text-sm">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+0.3% mejora</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errores Totales</p>
                <p className="text-3xl font-bold">{totalErrors.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1 text-amber-500 text-sm">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>-8.2% vs mes anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Migraciones</p>
                <p className="text-3xl font-bold">218</p>
                <div className="flex items-center gap-1 mt-1 text-purple-500 text-sm">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+15 este mes</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="h-4 w-4 mr-1" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="entities" className="text-xs">
            <PieChart className="h-4 w-4 mr-1" />
            Por Entidad
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Por Fuente
          </TabsTrigger>
          <TabsTrigger value="exports" className="text-xs">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de tendencia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros Migrados (30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="successful" 
                        stackId="1"
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                        name="Exitosos"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="failed" 
                        stackId="1"
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.6}
                        name="Fallidos"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribución por estado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reportes recientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Reportes Generados</CardTitle>
              <Button 
                size="sm" 
                onClick={() => handleGenerateReport('resumen')}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Nuevo Reporte
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {recentReports.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {report.format === 'pdf' && <FileText className="h-4 w-4 text-primary" />}
                          {report.format === 'excel' && <FileSpreadsheet className="h-4 w-4 text-emerald-500" />}
                          {report.format === 'csv' && <FileSpreadsheet className="h-4 w-4 text-blue-500" />}
                          {report.format === 'json' && <FileJson className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{report.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.period} • {report.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                          {report.status === 'ready' ? 'Listo' : 'Generando...'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadReport(report)}
                          disabled={report.status !== 'ready'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendencia de Migraciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      dot={false}
                      name="Total Registros"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avgSpeed" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      dot={false}
                      name="Velocidad (reg/s)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Promedio Diario</p>
                  <p className="text-3xl font-bold">3,282</p>
                  <p className="text-xs text-muted-foreground mt-1">registros/día</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pico Máximo</p>
                  <p className="text-3xl font-bold">8,450</p>
                  <p className="text-xs text-muted-foreground mt-1">15 Dic 2024</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Velocidad Media</p>
                  <p className="text-3xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground mt-1">registros/segundo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entities" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas por Entidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entityStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="entity" type="category" className="text-xs" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="migrated" fill="hsl(var(--chart-1))" name="Migrados" />
                    <Bar dataKey="errors" fill="hsl(var(--chart-2))" name="Errores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-2">
            {entityStats.map((entity) => (
              <Card key={entity.entity}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <p className="font-medium">{entity.entity}</p>
                      </div>
                      <div className="w-32">
                        <p className="text-sm text-muted-foreground">Migrados</p>
                        <p className="font-semibold">{entity.migrated.toLocaleString()}</p>
                      </div>
                      <div className="w-24">
                        <p className="text-sm text-muted-foreground">Errores</p>
                        <p className="font-semibold text-destructive">{entity.errors}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <p className="text-sm text-muted-foreground mb-1">Tasa de éxito</p>
                        <div className="flex items-center gap-2">
                          <Progress value={entity.successRate} className="h-2 w-20" />
                          <span className="text-sm font-medium">{entity.successRate}%</span>
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-sm text-muted-foreground">Tiempo medio</p>
                        <p className="font-semibold">{entity.avgTime}s</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparativa por Fuente CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="source" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="records" fill="hsl(var(--chart-1))" name="Registros" />
                    <Bar dataKey="migrations" fill="hsl(var(--chart-3))" name="Migraciones" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceComparison.map((source) => (
              <Card key={source.source}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {source.source}
                    <Badge variant="outline">{source.migrations} migraciones</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registros totales</span>
                      <span className="font-medium">{source.records.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tasa de éxito</span>
                      <span className="font-medium text-emerald-500">{source.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duración media</span>
                      <span className="font-medium">{source.avgDuration} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exports" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportación rápida */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exportación Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Formato de exportación
                  </label>
                  <Select value={selectedFormat} onValueChange={(v: 'pdf' | 'excel' | 'csv' | 'json') => setSelectedFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExport(selectedFormat)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Todas las migraciones
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExport(selectedFormat)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Solo errores
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExport(selectedFormat)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Estadísticas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleExport(selectedFormat)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Logs completos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generación de reportes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generar Reporte Personalizado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport('resumen')}
                  disabled={isGenerating}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reporte de Resumen Ejecutivo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport('detallado')}
                  disabled={isGenerating}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reporte Detallado Completo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport('errores')}
                  disabled={isGenerating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Análisis de Errores
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport('rendimiento')}
                  disabled={isGenerating}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reporte de Rendimiento
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Acciones adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Printer className="h-6 w-6 mb-2" />
                  Imprimir Reporte
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Mail className="h-6 w-6 mb-2" />
                  Enviar por Email
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Programar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CRMReportsPanel;
