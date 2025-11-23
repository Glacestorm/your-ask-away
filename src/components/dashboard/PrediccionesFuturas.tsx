import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Target, AlertCircle, Calendar } from 'lucide-react';
import { subMonths, addMonths, format, startOfMonth, endOfMonth } from 'date-fns';

interface PredictionData {
  month: string;
  actual?: number;
  predicted: number;
  type: 'historical' | 'forecast';
}

interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

const calculateLinearRegression = (data: { x: number; y: number }[]): RegressionResult => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
  const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
  const ssResidual = data.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  const r2 = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { slope, intercept, r2 };
};

export const PrediccionesFuturas = () => {
  const [loading, setLoading] = useState(true);
  const [visitsPrediction, setVisitsPrediction] = useState<PredictionData[]>([]);
  const [successPrediction, setSuccessPrediction] = useState<PredictionData[]>([]);
  const [quarterMetrics, setQuarterMetrics] = useState({
    predictedVisits: 0,
    predictedSuccess: 0,
    confidenceVisits: 0,
    confidenceSuccess: 0,
    trendVisits: 0,
    trendSuccess: 0,
  });

  useEffect(() => {
    fetchHistoricalDataAndPredict();
  }, []);

  const fetchHistoricalDataAndPredict = async () => {
    try {
      setLoading(true);

      // Fetch last 12 months of data for analysis
      const startDate = startOfMonth(subMonths(new Date(), 12));
      const endDate = endOfMonth(new Date());

      const { data: visits, error } = await supabase
        .from('visits')
        .select('visit_date, result')
        .gte('visit_date', startDate.toISOString())
        .lte('visit_date', endDate.toISOString());

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { total: number; successful: number } } = {};
      
      visits?.forEach((visit) => {
        const monthKey = format(new Date(visit.visit_date), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, successful: 0 };
        }
        monthlyData[monthKey].total++;
        if (visit.result === 'Exitosa') {
          monthlyData[monthKey].successful++;
        }
      });

      // Prepare data for regression
      const months = Object.keys(monthlyData).sort();
      const visitsData = months.map((month, index) => ({
        x: index,
        y: monthlyData[month].total,
        month,
      }));

      const successRateData = months.map((month, index) => ({
        x: index,
        y: monthlyData[month].total > 0 
          ? (monthlyData[month].successful / monthlyData[month].total) * 100 
          : 0,
        month,
      }));

      // Calculate regression
      const visitsRegression = calculateLinearRegression(visitsData);
      const successRegression = calculateLinearRegression(successRateData);

      // Generate predictions for next 3 months
      const currentIndex = months.length;
      const futureMonths = [1, 2, 3].map(offset => 
        format(addMonths(new Date(), offset), 'yyyy-MM')
      );

      // Build visits prediction data
      const visitsPredictionData: PredictionData[] = [
        ...visitsData.map(d => ({
          month: format(new Date(d.month), 'MMM yy'),
          actual: d.y,
          predicted: Math.round(visitsRegression.slope * d.x + visitsRegression.intercept),
          type: 'historical' as const,
        })),
        ...futureMonths.map((month, index) => ({
          month: format(new Date(month), 'MMM yy'),
          predicted: Math.max(0, Math.round(visitsRegression.slope * (currentIndex + index) + visitsRegression.intercept)),
          type: 'forecast' as const,
        })),
      ];

      // Build success rate prediction data
      const successPredictionData: PredictionData[] = [
        ...successRateData.map(d => ({
          month: format(new Date(d.month), 'MMM yy'),
          actual: Math.round(d.y * 10) / 10,
          predicted: Math.round((successRegression.slope * d.x + successRegression.intercept) * 10) / 10,
          type: 'historical' as const,
        })),
        ...futureMonths.map((month, index) => ({
          month: format(new Date(month), 'MMM yy'),
          predicted: Math.max(0, Math.min(100, Math.round((successRegression.slope * (currentIndex + index) + successRegression.intercept) * 10) / 10)),
          type: 'forecast' as const,
        })),
      ];

      setVisitsPrediction(visitsPredictionData);
      setSuccessPrediction(successPredictionData);

      // Calculate quarter metrics
      const q1Visits = visitsPredictionData.slice(-3).reduce((sum, d) => sum + d.predicted, 0);
      const q1Success = successPredictionData.slice(-3).reduce((sum, d) => sum + d.predicted, 0) / 3;

      const lastActualVisits = visitsData[visitsData.length - 1]?.y || 0;
      const lastActualSuccess = successRateData[successRateData.length - 1]?.y || 0;

      setQuarterMetrics({
        predictedVisits: Math.round(q1Visits),
        predictedSuccess: Math.round(q1Success * 10) / 10,
        confidenceVisits: Math.round(visitsRegression.r2 * 100),
        confidenceSuccess: Math.round(successRegression.r2 * 100),
        trendVisits: lastActualVisits > 0 ? ((q1Visits / 3 - lastActualVisits) / lastActualVisits) * 100 : 0,
        trendSuccess: lastActualSuccess > 0 ? ((q1Success - lastActualSuccess) / lastActualSuccess) * 100 : 0,
      });

    } catch (error) {
      console.error('Error fetching prediction data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quarter Predictions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Visitas Previstas Q1</p>
              <p className="text-3xl font-bold mt-2">{quarterMetrics.predictedVisits}</p>
              <div className="flex items-center gap-2 mt-2">
                {quarterMetrics.trendVisits >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                )}
                <span className={`text-sm font-medium ${
                  quarterMetrics.trendVisits >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Math.abs(Math.round(quarterMetrics.trendVisits))}%
                </span>
              </div>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa Éxito Prevista</p>
              <p className="text-3xl font-bold mt-2">{quarterMetrics.predictedSuccess}%</p>
              <div className="flex items-center gap-2 mt-2">
                {quarterMetrics.trendSuccess >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                )}
                <span className={`text-sm font-medium ${
                  quarterMetrics.trendSuccess >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Math.abs(Math.round(quarterMetrics.trendSuccess))}%
                </span>
              </div>
            </div>
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Confianza Visitas</p>
              <p className="text-3xl font-bold mt-2">{quarterMetrics.confidenceVisits}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                Coeficiente R²
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Confianza Éxito</p>
              <p className="text-3xl font-bold mt-2">{quarterMetrics.confidenceSuccess}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                Coeficiente R²
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Visits Prediction Chart */}
      {visitsPrediction.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Predicción de Visitas (Próximo Trimestre)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitsPrediction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine 
                x={visitsPrediction.find(d => d.type === 'forecast')?.month || ''} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                label="Hoy"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Visitas Reales"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicción"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4">
            * La línea punteada indica predicciones basadas en análisis de regresión lineal de los últimos 12 meses
          </p>
        </Card>
      )}

      {/* Success Rate Prediction Chart */}
      {successPrediction.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Predicción de Tasa de Éxito (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={successPrediction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <ReferenceLine 
                x={successPrediction.find(d => d.type === 'forecast')?.month || ''} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                label="Hoy"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Tasa Real"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicción"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4">
            * Predicción calculada mediante regresión lineal con tendencias históricas
          </p>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6 border-l-4 border-l-primary">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recomendaciones Basadas en Predicciones
        </h3>
        <div className="space-y-3">
          {quarterMetrics.trendVisits < 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                ⚠ Tendencia decreciente en visitas: Se recomienda intensificar actividades comerciales
              </p>
            </div>
          )}
          {quarterMetrics.trendSuccess < -5 && (
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive">
                ⚠ Disminución en tasa de éxito: Revisar estrategias de cierre y cualificación de leads
              </p>
            </div>
          )}
          {quarterMetrics.trendVisits >= 0 && quarterMetrics.trendSuccess >= 0 && (
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-sm font-medium text-green-600">
                ✓ Tendencias positivas: Mantener el ritmo actual y considerar expansión
              </p>
            </div>
          )}
          {quarterMetrics.confidenceVisits < 70 || quarterMetrics.confidenceSuccess < 70 && (
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <p className="text-sm font-medium text-orange-600">
                ℹ Confianza moderada en predicciones: Se recomienda validar con análisis adicionales
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
