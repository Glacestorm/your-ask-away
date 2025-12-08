import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HistoricalDataPoint {
  month: string;
  visits: number;
  successRate: number;
  products: number;
  vinculacion: number;
  revenue?: number;
}

interface Prediction {
  month: string;
  visits: number;
  successRate: number;
  products: number;
  vinculacion: number;
  revenue?: number;
}

interface PredictionAnalysis {
  trends: string[];
  risks: string[];
  opportunities: string[];
  confidence: 'low' | 'medium' | 'high';
  summary: string;
}

interface MLPredictionsProps {
  historicalData: HistoricalDataPoint[];
  gestorId?: string;
}

const CHART_COLORS = {
  visits: 'hsl(var(--chart-1))',
  successRate: 'hsl(var(--chart-2))',
  products: 'hsl(var(--chart-3))',
  vinculacion: 'hsl(var(--chart-4))',
};

export function MLPredictions({ historicalData, gestorId }: MLPredictionsProps) {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analysis, setAnalysis] = useState<PredictionAnalysis | null>(null);

  const generatePredictions = async () => {
    if (historicalData.length < 3) {
      toast.error('Es necessiten almenys 3 mesos de dades històriques');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ml-predictions', {
        body: {
          historicalData,
          gestorId,
          predictionMonths: 3,
        },
      });

      if (error) throw error;

      if (data.predictions) {
        setPredictions(data.predictions);
        setAnalysis(data.analysis);
        toast.success('Prediccions generades correctament');
      }
    } catch (error: any) {
      console.error('Error generating predictions:', error);
      if (error.message?.includes('429')) {
        toast.error('Límit de peticions superat. Torna-ho a provar més tard.');
      } else if (error.message?.includes('402')) {
        toast.error('Crèdits insuficients. Afegeix crèdits al teu workspace.');
      } else {
        toast.error('Error en generar prediccions');
      }
    } finally {
      setLoading(false);
    }
  };

  const combinedData = [
    ...historicalData.map(d => ({ ...d, type: 'historical' })),
    ...predictions.map(d => ({ ...d, type: 'prediction' })),
  ];

  const confidenceColors = {
    low: 'bg-red-500/20 text-red-700 dark:text-red-400',
    medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    high: 'bg-green-500/20 text-green-700 dark:text-green-400',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Prediccions ML
            </CardTitle>
            <CardDescription>
              Prediccions basades en intel·ligència artificial
            </CardDescription>
          </div>
          <Button 
            onClick={generatePredictions} 
            disabled={loading || historicalData.length < 3}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generant...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generar Prediccions
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : predictions.length > 0 ? (
          <>
            {/* Combined Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData}>
                  <defs>
                    <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.visits} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.visits} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Visites"
                    stroke={CHART_COLORS.visits}
                    fill="url(#visitsGradient)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="successRate"
                    name="Taxa Èxit (%)"
                    stroke={CHART_COLORS.successRate}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Prediction Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {predictions.map((pred, i) => (
                <Card key={i} className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {pred.month}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Visites:</span>
                      <span className="font-medium">{Math.round(pred.visits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa Èxit:</span>
                      <span className="font-medium">{pred.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Productes:</span>
                      <span className="font-medium">{pred.products.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vinculació:</span>
                      <span className="font-medium">{pred.vinculacion.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Analysis */}
            {analysis && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Tendències
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs space-y-1">
                      {analysis.trends.map((trend, i) => (
                        <li key={i} className="text-muted-foreground">• {trend}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Riscos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs space-y-1">
                      {analysis.risks.map((risk, i) => (
                        <li key={i} className="text-muted-foreground">• {risk}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-green-500" />
                      Oportunitats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs space-y-1">
                      {analysis.opportunities.map((opp, i) => (
                        <li key={i} className="text-muted-foreground">• {opp}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Confiança
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={cn(confidenceColors[analysis.confidence])}>
                      {analysis.confidence === 'high' ? 'Alta' : 
                       analysis.confidence === 'medium' ? 'Mitjana' : 'Baixa'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {analysis.summary}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Fes clic a "Generar Prediccions" per obtenir prediccions ML</p>
            {historicalData.length < 3 && (
              <p className="text-sm mt-2 text-amber-500">
                Es necessiten almenys 3 mesos de dades històriques
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
