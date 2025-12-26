import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  FileSpreadsheet,
  File,
  RefreshCw,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useSupportReportGenerator } from '@/hooks/admin/support';
import { cn } from '@/lib/utils';

type ReportType = 'metrics' | 'sessions' | 'performance';
type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

interface ReportsExportPanelProps {
  className?: string;
}

export function ReportsExportPanel({ className }: ReportsExportPanelProps) {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('metrics');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [dateRange, setDateRange] = useState('7d');

  const {
    metricsReport,
    sessionReport,
    performanceReport,
    exportResult,
    templates,
    isLoading,
    generateMetricsReport,
    generateSessionReport,
    generatePerformanceReport,
    exportData,
    getTemplates
  } = useSupportReportGenerator();

  const handleGenerateReport = async () => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const params = {
      start_date: startDate.toISOString(),
      end_date: now.toISOString()
    };

    switch (selectedReportType) {
      case 'metrics':
        await generateMetricsReport(params);
        break;
      case 'sessions':
        await generateSessionReport(params);
        break;
      case 'performance':
        await generatePerformanceReport(params);
        break;
    }
  };

  const handleExport = async () => {
    await exportData({ format: selectedFormat });
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf': return <File className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv': return <FileText className="h-4 w-4" />;
      case 'json': return <FileText className="h-4 w-4" />;
    }
  };

  const currentReport = selectedReportType === 'metrics' 
    ? metricsReport 
    : selectedReportType === 'sessions' 
      ? sessionReport 
      : performanceReport;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Reportes y Exportación</CardTitle>
              <p className="text-xs text-muted-foreground">
                Genera y exporta reportes detallados
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => getTemplates()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="generate" className="text-xs">Generar</TabsTrigger>
            <TabsTrigger value="export" className="text-xs">Exportar</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Tipo de Reporte</label>
                <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metrics">Métricas Generales</SelectItem>
                    <SelectItem value="sessions">Sesiones de Soporte</SelectItem>
                    <SelectItem value="performance">Rendimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Período</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleGenerateReport}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generar Reporte
                </>
              )}
            </Button>

            {currentReport && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Reporte Generado</h4>
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Listo
                    </Badge>
                  </div>
                  
                  {selectedReportType === 'metrics' && metricsReport && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-background">
                        <p className="text-muted-foreground text-xs">Total Sesiones</p>
                        <p className="font-medium">{metricsReport.summary?.total_sessions || 0}</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="text-muted-foreground text-xs">Satisfacción</p>
                        <p className="font-medium">{metricsReport.summary?.satisfaction_score?.toFixed(1) || 0}/5</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="text-muted-foreground text-xs">Tiempo Promedio</p>
                        <p className="font-medium">{metricsReport.summary?.avg_resolution_time_minutes || 0}m</p>
                      </div>
                      <div className="p-2 rounded bg-background">
                        <p className="text-muted-foreground text-xs">Tasa Resolución</p>
                        <p className="font-medium">{metricsReport.summary?.first_contact_resolution_rate || 0}%</p>
                      </div>
                    </div>
                  )}

                  {selectedReportType === 'performance' && performanceReport && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Score Global</span>
                        <span className="font-medium">{performanceReport.system_health?.overall_score || 0}/100</span>
                      </div>
                      <Progress value={performanceReport.system_health?.overall_score || 0} />
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="mt-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Formato</label>
                <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4" />
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
                        <FileText className="h-4 w-4" />
                        CSV
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JSON
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Datos</label>
                <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metrics">Métricas</SelectItem>
                    <SelectItem value="sessions">Sesiones</SelectItem>
                    <SelectItem value="performance">Rendimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleExport}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>

            {exportResult && (
              <Card className="p-4 bg-green-500/10 border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Exportación Completada</p>
                      <p className="text-xs text-muted-foreground">
                        {exportResult.rows_count} registros ({exportResult.file_size_kb} KB)
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={exportResult.download_url} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-4 gap-2">
              {(['pdf', 'excel', 'csv', 'json'] as ExportFormat[]).map((format) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                  className="flex flex-col h-16 gap-1"
                >
                  {getFormatIcon(format)}
                  <span className="text-xs">{format.toUpperCase()}</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.default_format}</Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay plantillas guardadas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ReportsExportPanel;
