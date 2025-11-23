import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, differenceInMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface CohortData {
  cohortMonth: string;
  companiesCount: number;
  retentionByMonth: { [month: number]: number };
  avgVisitsByMonth: { [month: number]: number };
  successRateByMonth: { [month: number]: number };
  vinculacionByMonth: { [month: number]: number };
}

export const AnalisisCohortes = () => {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxMonths, setMaxMonths] = useState(12);

  useEffect(() => {
    fetchCohortData();
  }, []);

  const fetchCohortData = async () => {
    try {
      setLoading(true);
      
      // Fetch all visits with company info
      const { data: visits, error } = await supabase
        .from('visits')
        .select('id, company_id, visit_date, result, porcentaje_vinculacion')
        .order('visit_date', { ascending: true });

      if (error) throw error;
      if (!visits || visits.length === 0) {
        setCohorts([]);
        setLoading(false);
        return;
      }

      // Group visits by company and find first visit (cohort assignment)
      const companyFirstVisit: { [companyId: string]: Date } = {};
      const companyVisitsByMonth: { [companyId: string]: { [month: string]: any[] } } = {};

      visits.forEach((visit) => {
        const visitDate = parseISO(visit.visit_date);
        
        if (!companyFirstVisit[visit.company_id] || visitDate < companyFirstVisit[visit.company_id]) {
          companyFirstVisit[visit.company_id] = visitDate;
        }

        const monthKey = format(startOfMonth(visitDate), 'yyyy-MM');
        if (!companyVisitsByMonth[visit.company_id]) {
          companyVisitsByMonth[visit.company_id] = {};
        }
        if (!companyVisitsByMonth[visit.company_id][monthKey]) {
          companyVisitsByMonth[visit.company_id][monthKey] = [];
        }
        companyVisitsByMonth[visit.company_id][monthKey].push(visit);
      });

      // Group companies by cohort (first visit month)
      const cohortMap: { [cohortMonth: string]: string[] } = {};
      Object.entries(companyFirstVisit).forEach(([companyId, firstVisitDate]) => {
        const cohortMonth = format(startOfMonth(firstVisitDate), 'yyyy-MM');
        if (!cohortMap[cohortMonth]) {
          cohortMap[cohortMonth] = [];
        }
        cohortMap[cohortMonth].push(companyId);
      });

      // Calculate metrics for each cohort
      const cohortDataArray: CohortData[] = [];
      let maxMonthsObserved = 0;

      Object.entries(cohortMap).forEach(([cohortMonth, companyIds]) => {
        const cohortStartDate = parseISO(cohortMonth + '-01');
        const retentionByMonth: { [month: number]: number } = {};
        const avgVisitsByMonth: { [month: number]: number } = {};
        const successRateByMonth: { [month: number]: number } = {};
        const vinculacionByMonth: { [month: number]: number } = {};

        // Calculate up to 12 months or until current month
        const now = new Date();
        const monthsSinceCohort = differenceInMonths(now, cohortStartDate);
        maxMonthsObserved = Math.max(maxMonthsObserved, monthsSinceCohort);

        for (let monthOffset = 0; monthOffset <= Math.min(monthsSinceCohort, 11); monthOffset++) {
          const targetMonth = new Date(cohortStartDate);
          targetMonth.setMonth(targetMonth.getMonth() + monthOffset);
          const targetMonthKey = format(startOfMonth(targetMonth), 'yyyy-MM');

          let activeCompanies = 0;
          let totalVisits = 0;
          let successfulVisits = 0;
          let totalSuccess = 0;
          let totalVinculacion = 0;
          let vinculacionCount = 0;

          companyIds.forEach((companyId) => {
            const visitsInMonth = companyVisitsByMonth[companyId]?.[targetMonthKey] || [];
            
            if (visitsInMonth.length > 0) {
              activeCompanies++;
              totalVisits += visitsInMonth.length;

              visitsInMonth.forEach((visit) => {
                if (visit.result === 'exitosa') {
                  successfulVisits++;
                }
                if (visit.porcentaje_vinculacion != null) {
                  totalVinculacion += visit.porcentaje_vinculacion;
                  vinculacionCount++;
                }
              });
            }
          });

          retentionByMonth[monthOffset] = (activeCompanies / companyIds.length) * 100;
          avgVisitsByMonth[monthOffset] = activeCompanies > 0 ? totalVisits / activeCompanies : 0;
          successRateByMonth[monthOffset] = totalVisits > 0 ? (successfulVisits / totalVisits) * 100 : 0;
          vinculacionByMonth[monthOffset] = vinculacionCount > 0 ? totalVinculacion / vinculacionCount : 0;
        }

        cohortDataArray.push({
          cohortMonth,
          companiesCount: companyIds.length,
          retentionByMonth,
          avgVisitsByMonth,
          successRateByMonth,
          vinculacionByMonth,
        });
      });

      // Sort by cohort month (newest first)
      cohortDataArray.sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth));
      
      setCohorts(cohortDataArray);
      setMaxMonths(Math.min(maxMonthsObserved + 1, 12));
    } catch (error) {
      console.error('Error fetching cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCohortChartData = (metric: 'retention' | 'visits' | 'success' | 'vinculacion') => {
    return cohorts.slice(0, 6).map((cohort) => {
      const dataPoint: any = {
        name: format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es }),
      };

      for (let i = 0; i <= maxMonths; i++) {
        let value = 0;
        if (metric === 'retention') {
          value = cohort.retentionByMonth[i] || 0;
        } else if (metric === 'visits') {
          value = cohort.avgVisitsByMonth[i] || 0;
        } else if (metric === 'success') {
          value = cohort.successRateByMonth[i] || 0;
        } else if (metric === 'vinculacion') {
          value = cohort.vinculacionByMonth[i] || 0;
        }
        dataPoint[`Mes ${i}`] = Number(value.toFixed(1));
      }

      return dataPoint;
    });
  };

  const getRetentionCurveData = () => {
    const months = Array.from({ length: maxMonths + 1 }, (_, i) => i);
    
    return months.map((month) => {
      const dataPoint: any = { month: `Mes ${month}` };
      
      cohorts.slice(0, 6).forEach((cohort) => {
        const cohortLabel = format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es });
        dataPoint[cohortLabel] = cohort.retentionByMonth[month] || 0;
      });

      return dataPoint;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No hay datos suficientes para el análisis de cohortes
        </p>
      </Card>
    );
  }

  const retentionCurveData = getRetentionCurveData();
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa', '#fb923c'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Cohortes</div>
          <div className="text-2xl font-bold">{cohorts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Empresas Totales</div>
          <div className="text-2xl font-bold">
            {cohorts.reduce((sum, c) => sum + c.companiesCount, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Retención Mes 3 (Promedio)</div>
          <div className="text-2xl font-bold">
            {cohorts.length > 0
              ? (
                  cohorts
                    .filter((c) => c.retentionByMonth[3] !== undefined)
                    .reduce((sum, c) => sum + c.retentionByMonth[3], 0) /
                  cohorts.filter((c) => c.retentionByMonth[3] !== undefined).length
                ).toFixed(1)
              : 0}
            %
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Retención Mes 6 (Promedio)</div>
          <div className="text-2xl font-bold">
            {cohorts.length > 0
              ? (
                  cohorts
                    .filter((c) => c.retentionByMonth[6] !== undefined)
                    .reduce((sum, c) => sum + c.retentionByMonth[6], 0) /
                  cohorts.filter((c) => c.retentionByMonth[6] !== undefined).length
                ).toFixed(1)
              : 0}
            %
          </div>
        </Card>
      </div>

      {/* Retention Curve Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Curvas de Retención por Cohorte</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={retentionCurveData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Retención (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {cohorts.slice(0, 6).map((cohort, index) => (
              <Line
                key={cohort.cohortMonth}
                type="monotone"
                dataKey={format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })}
                stroke={colors[index]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Cohort Metrics Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tabla de Retención por Cohorte</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold">Cohorte</th>
                <th className="text-right p-2 font-semibold">Empresas</th>
                {Array.from({ length: Math.min(maxMonths + 1, 12) }, (_, i) => (
                  <th key={i} className="text-right p-2 font-semibold">
                    M{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohortMonth} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    {format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })}
                  </td>
                  <td className="text-right p-2">{cohort.companiesCount}</td>
                  {Array.from({ length: Math.min(maxMonths + 1, 12) }, (_, i) => {
                    const retention = cohort.retentionByMonth[i];
                    return (
                      <td
                        key={i}
                        className="text-right p-2"
                        style={{
                          backgroundColor:
                            retention !== undefined
                              ? `hsl(var(--primary) / ${retention / 100})`
                              : 'transparent',
                        }}
                      >
                        {retention !== undefined ? `${retention.toFixed(0)}%` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Additional Metrics Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="visits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visits">Visitas Promedio</TabsTrigger>
            <TabsTrigger value="success">Tasa de Éxito</TabsTrigger>
            <TabsTrigger value="vinculacion">Vinculación</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-4">
            <h3 className="text-lg font-semibold">Promedio de Visitas por Empresa Activa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionCurveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Visitas', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {cohorts.slice(0, 6).map((cohort, index) => (
                  <Line
                    key={cohort.cohortMonth}
                    type="monotone"
                    dataKey={format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })}
                    data={Array.from({ length: maxMonths + 1 }, (_, i) => ({
                      month: `Mes ${i}`,
                      [format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })]:
                        cohort.avgVisitsByMonth[i] || 0,
                    }))}
                    stroke={colors[index]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="success" className="space-y-4">
            <h3 className="text-lg font-semibold">Tasa de Éxito de Visitas (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionCurveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Éxito (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {cohorts.slice(0, 6).map((cohort, index) => (
                  <Line
                    key={cohort.cohortMonth}
                    type="monotone"
                    dataKey={format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })}
                    data={Array.from({ length: maxMonths + 1 }, (_, i) => ({
                      month: `Mes ${i}`,
                      [format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })]:
                        cohort.successRateByMonth[i] || 0,
                    }))}
                    stroke={colors[index]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="vinculacion" className="space-y-4">
            <h3 className="text-lg font-semibold">Porcentaje de Vinculación Promedio</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionCurveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Vinculación (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {cohorts.slice(0, 6).map((cohort, index) => (
                  <Line
                    key={cohort.cohortMonth}
                    type="monotone"
                    dataKey={format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })}
                    data={Array.from({ length: maxMonths + 1 }, (_, i) => ({
                      month: `Mes ${i}`,
                      [format(parseISO(cohort.cohortMonth + '-01'), 'MMM yyyy', { locale: es })]:
                        cohort.vinculacionByMonth[i] || 0,
                    }))}
                    stroke={colors[index]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
