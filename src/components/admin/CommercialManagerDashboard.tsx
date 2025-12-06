import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, Building2, Users, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format } from 'date-fns';
import { MetricsExplorer } from '@/components/admin/MetricsExplorer';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuickVisitManager } from '@/components/dashboard/QuickVisitManager';
import { MapButton } from '@/components/dashboard/MapButton';
import { MapDashboardCard } from '@/components/dashboard/MapDashboardCard';
import { QuickVisitSheetCard } from '@/components/dashboard/QuickVisitSheetCard';
import { AccountingDashboardCard } from '@/components/dashboard/AccountingDashboardCard';
import { MetricsCardsSection } from '@/components/dashboard/MetricsCardsSection';
import { CompaniesDashboardCard } from '@/components/dashboard/CompaniesDashboardCard';
import { AlertHistoryDashboardCard } from '@/components/dashboard/AlertHistoryDashboardCard';
import { ContractedProductsDashboardCard } from '@/components/dashboard/ContractedProductsDashboardCard';
import { GoalsAlertsDashboardCard } from '@/components/dashboard/GoalsAlertsDashboardCard';
import { KPIDashboardCard } from '@/components/dashboard/KPIDashboardCard';
import { AdvancedAnalyticsDashboardCard } from '@/components/dashboard/AdvancedAnalyticsDashboardCard';

// Panel del Responsable Comercial con vista general y explorador de métricas

interface BasicStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
}

interface ValidationMetrics {
  avgValidationTimeHours: number;
  approvalRate: number;
  totalValidated: number;
  approved: number;
  rejected: number;
}

interface GestorRanking {
  name: string;
  visits: number;
}

interface GestorDetail {
  name: string;
  oficina: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

export function CommercialManagerDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });
  const [stats, setStats] = useState<BasicStats>({
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0
  });
const [gestorRanking, setGestorRanking] = useState<GestorRanking[]>([]);
  const [gestorDetails, setGestorDetails] = useState<GestorDetail[]>([]);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics>({
    avgValidationTimeHours: 0,
    approvalRate: 0,
    totalValidated: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchData();
    }
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!dateRange?.from || !dateRange?.to) return;

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Contar visitas totales en el período
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Contar visitas exitosas en el período
      const { count: successCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

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

      // Fetch validation metrics
      const { data: validatedSheets } = await supabase
        .from('visit_sheets')
        .select('created_at, validated_at, validation_status')
        .not('validation_status', 'is', null)
        .gte('validated_at', dateRange.from.toISOString())
        .lte('validated_at', dateRange.to.toISOString());

      if (validatedSheets && validatedSheets.length > 0) {
        const approved = validatedSheets.filter(s => s.validation_status === 'approved').length;
        const rejected = validatedSheets.filter(s => s.validation_status === 'rejected').length;
        const totalValidated = approved + rejected;
        
        // Calculate average validation time in hours
        let totalHours = 0;
        let validCount = 0;
        validatedSheets.forEach(s => {
          if (s.created_at && s.validated_at) {
            const created = new Date(s.created_at).getTime();
            const validated = new Date(s.validated_at).getTime();
            const hours = (validated - created) / (1000 * 60 * 60);
            if (hours >= 0 && hours < 720) { // Max 30 days
              totalHours += hours;
              validCount++;
            }
          }
        });
        
        const avgValidationTimeHours = validCount > 0 ? Math.round(totalHours / validCount * 10) / 10 : 0;
        const approvalRate = totalValidated > 0 ? Math.round((approved / totalValidated) * 100) : 0;
        
        setValidationMetrics({
          avgValidationTimeHours,
          approvalRate,
          totalValidated,
          approved,
          rejected
        });
      } else {
        setValidationMetrics({
          avgValidationTimeHours: 0,
          approvalRate: 0,
          totalValidated: 0,
          approved: 0,
          rejected: 0
        });
      }

      // Obtener datos de gestores
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina');

      if (profiles) {
        const detailsPromises = profiles.map(async (profile) => {
          // Contar visitas del gestor en el período
          const { count: visitCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id)
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          // Contar visitas exitosas del gestor en el período
          const { count: successVisitCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id)
            .eq('result', 'Exitosa')
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          // Contar empresas del gestor
          const { count: companyCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id);

          const visits = visitCount || 0;
          const successVisits = successVisitCount || 0;
          const successRate = visits > 0 ? Math.round((successVisits / visits) * 100) : 0;

          return {
            name: profile.full_name || profile.email.split('@')[0],
            oficina: profile.oficina || 'Sin asignar',
            totalVisits: visits,
            successRate,
            companies: companyCount || 0
          };
        });

        const details = await Promise.all(detailsPromises);
        
        // Para el ranking (solo top 10)
        const ranking = details
          .sort((a, b) => b.totalVisits - a.totalVisits)
          .slice(0, 10)
          .map(d => ({ name: d.name, visits: d.totalVisits }));
        
        setGestorRanking(ranking);

        // Para la tabla (todos los gestores)
        const sortedDetails = details.sort((a, b) => b.totalVisits - a.totalVisits);
        setGestorDetails(sortedDetails);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
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
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('director.title')}</CardTitle>
            <CardDescription>
              {t('director.subtitle')}
            </CardDescription>
          </div>
          <MapButton />
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-2">
          <TabsTrigger value="overview">{t('director.overviewTab')}</TabsTrigger>
          <TabsTrigger value="explorer">{t('director.explorerTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filtro de período */}
          <DateRangeFilter 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
          />

          {/* KPIs Globales */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('director.totalVisits')}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits}</div>
                <p className="text-xs text-muted-foreground">
                  {t('director.allVisitsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('director.successRate')}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
                <p className="text-xs text-muted-foreground">{t('director.avgDesc')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('director.companies')}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">{t('director.portfolioDesc')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('director.managers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeGestores}</div>
                <p className="text-xs text-muted-foreground">{t('director.registeredDesc')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Validación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Métricas de Validación de Fichas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">{validationMetrics.avgValidationTimeHours}h</div>
                  <p className="text-xs text-muted-foreground">Tiempo medio validación</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">{validationMetrics.approvalRate}%</div>
                  <p className="text-xs text-muted-foreground">Ratio aprobación</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-2xl font-bold text-green-600">{validationMetrics.approved}</div>
                  <p className="text-xs text-muted-foreground">Aprobadas</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <div className="text-2xl font-bold text-red-600">{validationMetrics.rejected}</div>
                  <p className="text-xs text-muted-foreground">Rechazadas</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Activity className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">{validationMetrics.totalValidated}</div>
                  <p className="text-xs text-muted-foreground">Total validadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métriques Cards */}
          <MetricsCardsSection />

          {/* Ficha de Visita, Mapa, Comptabilitat y Empreses Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <QuickVisitSheetCard />
            <MapDashboardCard />
            <AccountingDashboardCard />
            <CompaniesDashboardCard />
          </div>

          {/* Additional Dashboard Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <ContractedProductsDashboardCard />
            <GoalsAlertsDashboardCard />
            <KPIDashboardCard />
          </div>

          {/* Alert History Card */}
          <AlertHistoryDashboardCard />

          {/* Advanced Analytics Card */}
          <AdvancedAnalyticsDashboardCard />

          {/* Gráfico de Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>{t('director.rankingTitle')}</CardTitle>
              <CardDescription>{t('director.rankingDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {gestorRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={gestorRanking} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="visits" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                  {t('director.noData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabla de Gestores */}
          <Card>
            <CardHeader>
              <CardTitle>{t('director.detailsTitle')}</CardTitle>
              <CardDescription>{t('director.detailsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('director.managerCol')}</TableHead>
                    <TableHead>{t('director.officeCol')}</TableHead>
                    <TableHead className="text-right">{t('director.visitsCol')}</TableHead>
                    <TableHead className="text-right">{t('director.successCol')}</TableHead>
                    <TableHead className="text-right">{t('director.companiesCol')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gestorDetails.length > 0 ? (
                    gestorDetails.map((gestor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{gestor.name}</TableCell>
                        <TableCell>{gestor.oficina}</TableCell>
                        <TableCell className="text-right">{gestor.totalVisits}</TableCell>
                        <TableCell className="text-right">{gestor.successRate}%</TableCell>
                        <TableCell className="text-right">{gestor.companies}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {t('director.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer" className="space-y-6">
          <MetricsExplorer />
        </TabsContent>
      </Tabs>

      {/* Quick Visit Manager FAB */}
      <QuickVisitManager />
    </div>
  );
}
