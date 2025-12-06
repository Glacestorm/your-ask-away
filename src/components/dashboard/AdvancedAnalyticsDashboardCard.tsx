import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  BarChart3, 
  GitCompare, 
  LineChart, 
  Award, 
  Target, 
  MapPin, 
  UserCheck, 
  Filter, 
  Activity,
  Download,
  Users,
  FileText
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { subMonths, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Import dashboard components
import { ResumenEjecutivo } from '@/components/dashboard/ResumenEjecutivo';
import { ComparativaTemporales } from '@/components/dashboard/ComparativaTemporales';
import { PrediccionesFuturas } from '@/components/dashboard/PrediccionesFuturas';
import { ObjetivosYMetas } from '@/components/dashboard/ObjetivosYMetas';
import { TPVGoalsDashboard } from '@/components/dashboard/TPVGoalsDashboard';
import { BestPracticesPanel } from '@/components/dashboard/BestPracticesPanel';
import { AnalisisGeografico } from '@/components/dashboard/AnalisisGeografico';
import { AnalisisCohortes } from '@/components/dashboard/AnalisisCohortes';
import { AnalisisEmbudo } from '@/components/dashboard/AnalisisEmbudo';
import { PersonalActivityHistory } from '@/components/dashboard/PersonalActivityHistory';
import { ActivityStatistics } from '@/components/dashboard/ActivityStatistics';
import { GestorComparison } from '@/components/dashboard/GestorComparison';
import { GestorEvolutionTimeline } from '@/components/dashboard/GestorEvolutionTimeline';
import { GestoresLeaderboard } from '@/components/dashboard/GestoresLeaderboard';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { PersonalKPIsDashboard } from '@/components/dashboard/PersonalKPIsDashboard';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { UpcomingVisitsWidget } from '@/components/dashboard/UpcomingVisitsWidget';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { NotificationService } from '@/components/dashboard/NotificationService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

interface AdvancedAnalyticsDashboardCardProps {
  showGestorComparison?: boolean;
  showLeaderboard?: boolean;
  showActivityHistory?: boolean;
}

export function AdvancedAnalyticsDashboardCard({
  showGestorComparison = true,
  showLeaderboard = true,
  showActivityHistory = true
}: AdvancedAnalyticsDashboardCardProps) {
  const { t } = useLanguage();
  const { isCommercialDirector, isCommercialManager, isOfficeDirector, isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  const isDirectorOrManager = isCommercialDirector || isCommercialManager || isOfficeDirector || isSuperAdmin;

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const exportToExcel = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*, status_colors(status_name), profiles(full_name, email)');

      if (!companies) {
        toast.error('No hi ha dades per exportar');
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

      toast.success('Dades exportades correctament');
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar les dades');
    }
  };

  return (
    <>
      <NotificationService />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200/50 dark:border-indigo-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Analítiques Avançades</h3>
                  <p className="text-sm text-muted-foreground">
                    Comparatives, prediccions, embut i més
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    18 mòduls
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-indigo-500" />
              Analítiques Avançades
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header with actions */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <DateRangeFilter 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange}
              />
              <div className="flex items-center gap-2">
                <NotificationsPanel />
                <Button onClick={exportToExcel} size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
                <TabsTrigger value="resumen" className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Resum
                </TabsTrigger>
                <TabsTrigger value="comparativa" className="flex items-center gap-1.5 text-xs">
                  <GitCompare className="h-3.5 w-3.5" />
                  Comparativa
                </TabsTrigger>
                <TabsTrigger value="predicciones" className="flex items-center gap-1.5 text-xs">
                  <LineChart className="h-3.5 w-3.5" />
                  Prediccions
                </TabsTrigger>
                <TabsTrigger value="objetivos" className="flex items-center gap-1.5 text-xs">
                  <Award className="h-3.5 w-3.5" />
                  Objectius
                </TabsTrigger>
                <TabsTrigger value="tpv" className="flex items-center gap-1.5 text-xs">
                  <Target className="h-3.5 w-3.5" />
                  TPV
                </TabsTrigger>
                <TabsTrigger value="practicas" className="flex items-center gap-1.5 text-xs">
                  <Award className="h-3.5 w-3.5" />
                  Pràctiques
                </TabsTrigger>
                <TabsTrigger value="geografico" className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  Geogràfic
                </TabsTrigger>
                <TabsTrigger value="cohortes" className="flex items-center gap-1.5 text-xs">
                  <UserCheck className="h-3.5 w-3.5" />
                  Cohortes
                </TabsTrigger>
                <TabsTrigger value="embudo" className="flex items-center gap-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5" />
                  Embut
                </TabsTrigger>
                {showActivityHistory && (
                  <TabsTrigger value="actividad" className="flex items-center gap-1.5 text-xs">
                    <Activity className="h-3.5 w-3.5" />
                    Activitat
                  </TabsTrigger>
                )}
                <TabsTrigger value="estadisticas" className="flex items-center gap-1.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Estadístiques
                </TabsTrigger>
                {showGestorComparison && isDirectorOrManager && (
                  <TabsTrigger value="comparacion" className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    Comparació
                  </TabsTrigger>
                )}
                <TabsTrigger value="evolucion" className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Evolució
                </TabsTrigger>
                {showLeaderboard && isDirectorOrManager && (
                  <TabsTrigger value="leaderboard" className="flex items-center gap-1.5 text-xs">
                    <Award className="h-3.5 w-3.5" />
                    Rànking
                  </TabsTrigger>
                )}
                <TabsTrigger value="reportes" className="flex items-center gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Informes
                </TabsTrigger>
              </TabsList>

              {/* Resumen */}
              <TabsContent value="resumen" className="space-y-4">
                <PersonalKPIsDashboard />
                <QuickActionsPanel />
                <UpcomingVisitsWidget />
                <ResumenEjecutivo startDate={startDate} endDate={endDate} />
              </TabsContent>

              {/* Comparativa */}
              <TabsContent value="comparativa" className="space-y-4">
                <ComparativaTemporales startDate={startDate} endDate={endDate} />
              </TabsContent>

              {/* Predicciones */}
              <TabsContent value="predicciones" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-4">Prediccions Futures</h3>
                  <PrediccionesFuturas />
                </div>
              </TabsContent>

              {/* Objetivos */}
              <TabsContent value="objetivos" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-4">Objectius i Metes</h3>
                  <ObjetivosYMetas />
                </div>
              </TabsContent>

              {/* TPV Goals */}
              <TabsContent value="tpv" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-4">Objectius de TPV</h3>
                  <TPVGoalsDashboard />
                </div>
              </TabsContent>

              {/* Best Practices */}
              <TabsContent value="practicas" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <BestPracticesPanel />
                </div>
              </TabsContent>

              {/* Geographic Analysis */}
              <TabsContent value="geografico" className="space-y-4">
                <AnalisisGeografico startDate={startDate} endDate={endDate} />
              </TabsContent>

              {/* Cohorts */}
              <TabsContent value="cohortes" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-4">Anàlisi de Cohortes</h3>
                  <AnalisisCohortes />
                </div>
              </TabsContent>

              {/* Funnel */}
              <TabsContent value="embudo" className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-lg font-semibold mb-4">Anàlisi d'Embut</h3>
                  <AnalisisEmbudo />
                </div>
              </TabsContent>

              {/* Activity History */}
              {showActivityHistory && (
                <TabsContent value="actividad" className="space-y-4">
                  <PersonalActivityHistory />
                </TabsContent>
              )}

              {/* Statistics */}
              <TabsContent value="estadisticas" className="space-y-4">
                <ActivityStatistics />
              </TabsContent>

              {/* Gestor Comparison */}
              {showGestorComparison && isDirectorOrManager && (
                <TabsContent value="comparacion" className="space-y-4">
                  <GestorComparison />
                </TabsContent>
              )}

              {/* Evolution */}
              <TabsContent value="evolucion" className="space-y-4">
                <GestorEvolutionTimeline />
              </TabsContent>

              {/* Leaderboard */}
              {showLeaderboard && isDirectorOrManager && (
                <TabsContent value="leaderboard" className="space-y-4">
                  <GestoresLeaderboard />
                </TabsContent>
              )}

              {/* Reports */}
              <TabsContent value="reportes" className="space-y-4">
                <ReportGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
