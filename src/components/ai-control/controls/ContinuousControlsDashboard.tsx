import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCheck,
  Activity,
  Download,
  Bell,
  TrendingUp,
  BarChart3,
  History,
  Target
} from 'lucide-react';
import { useContinuousControls } from '@/hooks/useContinuousControls';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const CHART_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function ContinuousControlsDashboard() {
  const {
    controls,
    stats,
    alerts,
    isLoading,
    isRunning,
    runControls,
    acknowledgeAlert,
    resolveAlert,
    lastRefresh,
    refetchControls,
    refetchAlerts,
  } = useContinuousControls();

  const [activeTab, setActiveTab] = useState('controls');

  const handleRefresh = () => {
    refetchControls();
    refetchAlerts();
  };

  // Datos para gráficos
  const controlStatusData = useMemo(() => {
    return [
      { name: 'Aprobados', value: stats?.passedControls || 0, color: CHART_COLORS[0] },
      { name: 'Fallidos', value: stats?.failedControls || 0, color: CHART_COLORS[1] },
      { name: 'Pendientes', value: (controls?.length || 0) - (stats?.passedControls || 0) - (stats?.failedControls || 0), color: CHART_COLORS[2] },
    ].filter(d => d.value > 0);
  }, [stats, controls]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    controls?.forEach(c => {
      categories[c.control_category] = (categories[c.control_category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));
  }, [controls]);

  // Exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    
    doc.setFontSize(18);
    doc.text('Informe de Controles Continuos', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 20, 28);
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Resumen', 20, 45);
    
    doc.setFontSize(10);
    doc.text(`• Controls OK: ${stats?.passedControls || 0}`, 25, 55);
    doc.text(`• Controls Fallits: ${stats?.failedControls || 0}`, 25, 63);
    doc.text(`• Alertes Obertes: ${stats?.openAlerts || 0}`, 25, 71);
    doc.text(`• Evidències: ${stats?.evidenceGenerated || 0}`, 25, 79);
    
    doc.setFontSize(14);
    doc.text('Detall de Controls', 20, 95);
    
    let yPos = 105;
    controls?.slice(0, 15).forEach((c, idx) => {
      doc.setFontSize(9);
      const status = c.last_status === 'passed' ? '✓' : c.last_status === 'failed' ? '✗' : '○';
      doc.text(`${status} ${c.control_name} - ${c.control_category}`, 25, yPos);
      yPos += 7;
    });
    
    doc.save(`controls-report-${now.getTime()}.pdf`);
    toast.success('Informe PDF descargado');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {lastRefresh 
              ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
              : 'Sincronizando...'
            }
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.passedControls || 0}</p>
                <p className="text-xs text-muted-foreground">Controls OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.failedControls || 0}</p>
                <p className="text-xs text-muted-foreground">Fallits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.openAlerts || 0}</p>
                <p className="text-xs text-muted-foreground">Alertes Obertes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.evidenceGenerated || 0}</p>
                <p className="text-xs text-muted-foreground">Evidències</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="flex flex-row items-center justify-between">
            <TabsList>
              <TabsTrigger value="controls" className="gap-2">
                <Shield className="h-4 w-4" />
                Controls
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button onClick={() => runControls(undefined)} disabled={isRunning} className="gap-2">
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Executar Tots
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="controls" className="mt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {controls?.map((control) => (
                    <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {control.last_status === 'passed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : control.last_status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{control.control_name}</p>
                          <p className="text-xs text-muted-foreground">{control.control_category} • {control.check_frequency}</p>
                        </div>
                      </div>
                      <Badge variant={control.last_status === 'passed' ? 'default' : control.last_status === 'failed' ? 'destructive' : 'secondary'}>
                        {control.last_status || 'Pendent'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estado de Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {controlStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={controlStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {controlStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                        Sin datos
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                        Sin datos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tasa de cumplimiento */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Tasa de Cumplimiento</p>
                      <p className="text-xs text-muted-foreground">Controles aprobados vs total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {((stats?.passedControls || 0) / Math.max((controls?.length || 1), 1) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={(stats?.passedControls || 0) / Math.max((controls?.length || 1), 1) * 100} 
                    className="mt-3 h-2" 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg border-amber-500/30 bg-amber-500/5">
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                      Reconèixer
                    </Button>
                    <Button size="sm" onClick={() => resolveAlert({ alertId: alert.id })}>
                      Resoldre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
