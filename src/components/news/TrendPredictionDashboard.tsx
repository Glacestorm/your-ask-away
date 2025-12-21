import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Zap,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Flame,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TrendPrediction {
  id: string;
  trend_name: string;
  current_mentions: number;
  predicted_growth: number;
  confidence_score: number;
  peak_prediction_date: string;
  supporting_articles: string[];
  analysis_date: string;
}

const mockTrendData = [
  { week: 'Sem 1', actual: 45, predicted: null },
  { week: 'Sem 2', actual: 52, predicted: null },
  { week: 'Sem 3', actual: 48, predicted: null },
  { week: 'Sem 4', actual: 61, predicted: null },
  { week: 'Sem 5', actual: null, predicted: 72 },
  { week: 'Sem 6', actual: null, predicted: 85 },
  { week: 'Sem 7', actual: null, predicted: 78 },
  { week: 'Sem 8', actual: null, predicted: 92 },
];

export const TrendPredictionDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('news_trend_predictions')
        .select('*')
        .order('predicted_growth', { ascending: false })
        .limit(12);

      if (error) throw error;

      const typedPredictions = (data || []).map(p => ({
        ...p,
        supporting_articles: p.supporting_articles || []
      }));

      setPredictions(typedPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const { error } = await supabase.functions.invoke('predict-news-trends');
      if (error) throw error;
      toast.success('Predicción de tendencias actualizada');
      fetchPredictions();
    } catch (error) {
      console.error('Error running prediction:', error);
      toast.error('Error al ejecutar predicción');
    } finally {
      setPredicting(false);
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth >= 50) return 'text-green-500';
    if (growth >= 20) return 'text-blue-500';
    if (growth >= 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { label: 'Alta', variant: 'default' as const };
    if (confidence >= 60) return { label: 'Media', variant: 'secondary' as const };
    return { label: 'Baja', variant: 'outline' as const };
  };

  // Mock emerging trends
  const emergingTrends = [
    { name: 'Banca Digital', growth: 85, mentions: 234, isHot: true },
    { name: 'ESG Reporting', growth: 72, mentions: 189, isHot: true },
    { name: 'Open Banking', growth: 65, mentions: 156, isHot: false },
    { name: 'Ciberseguridad', growth: 58, mentions: 203, isHot: true },
    { name: 'IA en Seguros', growth: 45, mentions: 98, isHot: false },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Predicción de Tendencias
          </h2>
          <p className="text-muted-foreground">
            Análisis predictivo de temas emergentes en el sector financiero
          </p>
        </div>
        <Button onClick={runPrediction} disabled={predicting}>
          <RefreshCw className={`h-4 w-4 mr-2 ${predicting ? 'animate-spin' : ''}`} />
          Actualizar Predicciones
        </Button>
      </div>

      {/* Hot Trends */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {emergingTrends.map((trend) => (
          <Card key={trend.name} className={trend.isHot ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''}>
            <CardContent className="p-4 text-center">
              {trend.isHot && (
                <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              )}
              <h4 className="font-medium text-sm mb-1">{trend.name}</h4>
              <div className={`text-2xl font-bold ${getGrowthColor(trend.growth)}`}>
                +{trend.growth}%
              </div>
              <p className="text-xs text-muted-foreground">{trend.mentions} menciones</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución y Predicción</CardTitle>
            <CardDescription>Tendencia "Banca Digital" - Próximas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  fill="url(#actualGradient)"
                  strokeWidth={2}
                  name="Histórico"
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#22c55e" 
                  fill="url(#predictedGradient)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicción"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Prediction Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Predicciones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Ejecuta una predicción para ver resultados</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto">
                {predictions.map((prediction) => {
                  const badge = getConfidenceBadge(prediction.confidence_score);
                  return (
                    <div 
                      key={prediction.id} 
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {prediction.predicted_growth >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{prediction.trend_name}</span>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Menciones</p>
                          <p className="font-medium">{prediction.current_mentions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Crecimiento</p>
                          <p className={`font-medium ${getGrowthColor(prediction.predicted_growth)}`}>
                            {prediction.predicted_growth >= 0 ? '+' : ''}{prediction.predicted_growth.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pico esperado</p>
                          <p className="font-medium">
                            {prediction.peak_prediction_date ? 
                              new Date(prediction.peak_prediction_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) :
                              '-'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Confianza</span>
                          <span>{prediction.confidence_score}%</span>
                        </div>
                        <Progress value={prediction.confidence_score} className="h-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Insight de la Semana</h3>
              <p className="text-muted-foreground">
                La tendencia <strong>"Banca Digital"</strong> está mostrando un crecimiento acelerado 
                del 85% en menciones. Basándose en patrones históricos, nuestro modelo predice que 
                alcanzará su pico en las próximas 2-3 semanas, coincidiendo con el evento sectorial 
                de transformación digital bancaria.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Oportunidad de comunicación
                </Badge>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Actuar antes del 15 Ene
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendPredictionDashboard;
