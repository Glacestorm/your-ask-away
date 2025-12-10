import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Users, TrendingUp, AlertTriangle, Crown, Heart, Star, 
  UserPlus, Eye, Moon, Skull, RefreshCw, Target, Zap,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';

interface RFMScore {
  id: string;
  company_id: string;
  recency_days: number;
  recency_score: number;
  frequency_count: number;
  frequency_score: number;
  monetary_value: number;
  monetary_score: number;
  rfm_score: number;
  rfm_segment: string;
  segment_description: string;
  recommended_actions: string[];
  calculated_at: string;
}

interface Company {
  id: string;
  name: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  'Champions': '#10B981',
  'Loyal Customers': '#3B82F6',
  'Potential Loyalists': '#8B5CF6',
  'New Customers': '#06B6D4',
  'Promising': '#F59E0B',
  'Need Attention': '#EF4444',
  'About to Sleep': '#F97316',
  'At Risk': '#DC2626',
  'Cannot Lose Them': '#7C3AED',
  'Hibernating': '#6B7280',
  'Lost': '#374151'
};

const SEGMENT_ICONS: Record<string, React.ReactNode> = {
  'Champions': <Crown className="h-4 w-4" />,
  'Loyal Customers': <Heart className="h-4 w-4" />,
  'Potential Loyalists': <Star className="h-4 w-4" />,
  'New Customers': <UserPlus className="h-4 w-4" />,
  'Promising': <TrendingUp className="h-4 w-4" />,
  'Need Attention': <Eye className="h-4 w-4" />,
  'About to Sleep': <Moon className="h-4 w-4" />,
  'At Risk': <AlertTriangle className="h-4 w-4" />,
  'Cannot Lose Them': <Zap className="h-4 w-4" />,
  'Hibernating': <Moon className="h-4 w-4" />,
  'Lost': <Skull className="h-4 w-4" />
};

export function RFMDashboard() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [rfmScores, setRfmScores] = useState<RFMScore[]>([]);
  const [companies, setCompanies] = useState<Map<string, Company>>(new Map());
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: scores, error } = await supabase
        .from('customer_rfm_scores')
        .select('*')
        .order('rfm_score', { ascending: false });

      if (error) throw error;

      if (scores && scores.length > 0) {
        setRfmScores(scores);
        setLastUpdated(scores[0].calculated_at);

        const companyIds = scores.map(s => s.company_id);
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);

        if (companyData) {
          setCompanies(new Map(companyData.map(c => [c.id, c])));
        }
      }
    } catch (error) {
      console.error('Error fetching RFM data:', error);
      toast.error('Error al cargar datos RFM');
    } finally {
      setLoading(false);
    }
  };

  const runRFMAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-rfm-analysis', {
        body: {}
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Análisis RFM completado: ${data.stats.processed} empresas procesadas`);
        await fetchData();
      } else {
        throw new Error(data?.error || 'Error en análisis');
      }
    } catch (error) {
      console.error('RFM Analysis error:', error);
      toast.error('Error al ejecutar análisis RFM');
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate segment distribution
  const segmentDistribution = rfmScores.reduce((acc, score) => {
    acc[score.rfm_segment] = (acc[score.rfm_segment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(segmentDistribution).map(([name, value]) => ({
    name,
    value,
    color: SEGMENT_COLORS[name] || '#6B7280'
  }));

  // Calculate average scores by segment
  const segmentAverages = Object.keys(segmentDistribution).map(segment => {
    const segmentScores = rfmScores.filter(s => s.rfm_segment === segment);
    return {
      segment,
      recency: Math.round(segmentScores.reduce((sum, s) => sum + s.recency_score, 0) / segmentScores.length * 20),
      frequency: Math.round(segmentScores.reduce((sum, s) => sum + s.frequency_score, 0) / segmentScores.length * 20),
      monetary: Math.round(segmentScores.reduce((sum, s) => sum + s.monetary_score, 0) / segmentScores.length * 20)
    };
  });

  // Scatter plot data for RFM visualization
  const scatterData = rfmScores.map(score => ({
    x: score.recency_score,
    y: score.frequency_score,
    z: score.monetary_value,
    segment: score.rfm_segment,
    name: companies.get(score.company_id)?.name || 'Unknown'
  }));

  // Filter scores by selected segment
  const filteredScores = selectedSegment === 'all' 
    ? rfmScores 
    : rfmScores.filter(s => s.rfm_segment === selectedSegment);

  // Summary stats
  const totalCustomers = rfmScores.length;
  const avgRFMScore = rfmScores.length > 0 
    ? Math.round(rfmScores.reduce((sum, s) => sum + s.rfm_score, 0) / rfmScores.length)
    : 0;
  const championsCount = segmentDistribution['Champions'] || 0;
  const atRiskCount = (segmentDistribution['At Risk'] || 0) + 
                      (segmentDistribution['Cannot Lose Them'] || 0) +
                      (segmentDistribution['About to Sleep'] || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis RFM</h2>
          <p className="text-muted-foreground">
            Segmentación de clientes por Recencia, Frecuencia y Valor Monetario
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Última actualización: {new Date(lastUpdated).toLocaleDateString()}
            </span>
          )}
          <Button onClick={runRFMAnalysis} disabled={analyzing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analizando...' : 'Ejecutar Análisis RFM'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Analizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Score RFM Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRFMScore}</div>
            <Progress value={avgRFMScore / 555 * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
              <Crown className="h-4 w-4" />
              Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{championsCount}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {totalCustomers > 0 ? Math.round(championsCount / totalCustomers * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              En Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{atRiskCount}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />
              Requieren atención urgente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visión General</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="matrix">Matriz RFM</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Segmentos</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Scores por Segmento</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentAverages} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="segment" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="recency" name="Recencia" fill="#3B82F6" />
                    <Bar dataKey="frequency" name="Frecuencia" fill="#10B981" />
                    <Bar dataKey="monetary" name="Monetario" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(segmentDistribution).sort((a, b) => b[1] - a[1]).map(([segment, count]) => {
              const segmentScores = rfmScores.filter(s => s.rfm_segment === segment);
              const sampleScore = segmentScores[0];
              
              return (
                <Card key={segment} className="border-l-4" style={{ borderLeftColor: SEGMENT_COLORS[segment] }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {SEGMENT_ICONS[segment]}
                      {segment}
                    </CardTitle>
                    <CardDescription>{sampleScore?.segment_description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold">{count}</span>
                      <Badge variant="outline">
                        {totalCustomers > 0 ? Math.round(count / totalCustomers * 100) : 0}%
                      </Badge>
                    </div>
                    
                    {sampleScore?.recommended_actions && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Acciones Recomendadas:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {sampleScore.recommended_actions.slice(0, 3).map((action, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz RFM - Recencia vs Frecuencia</CardTitle>
              <CardDescription>Cada punto representa un cliente, el tamaño indica valor monetario</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Recencia" domain={[0, 6]} label={{ value: 'Score Recencia', position: 'bottom' }} />
                  <YAxis type="number" dataKey="y" name="Frecuencia" domain={[0, 6]} label={{ value: 'Score Frecuencia', angle: -90, position: 'left' }} />
                  <ZAxis type="number" dataKey="z" name="Valor" range={[50, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border p-2 rounded shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-muted-foreground">{data.segment}</p>
                          <p className="text-xs">R: {data.x} | F: {data.y} | M: €{Math.round(data.z).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  {Object.keys(SEGMENT_COLORS).map(segment => (
                    <Scatter 
                      key={segment}
                      name={segment} 
                      data={scatterData.filter(d => d.segment === segment)} 
                      fill={SEGMENT_COLORS[segment]} 
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Listado de Clientes</CardTitle>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los segmentos</SelectItem>
                    {Object.keys(segmentDistribution).map(segment => (
                      <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Empresa</th>
                      <th className="text-center p-2">Segmento</th>
                      <th className="text-center p-2">R</th>
                      <th className="text-center p-2">F</th>
                      <th className="text-center p-2">M</th>
                      <th className="text-center p-2">Score</th>
                      <th className="text-left p-2">Última Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScores.slice(0, 50).map(score => (
                      <tr key={score.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          {companies.get(score.company_id)?.name || 'Unknown'}
                        </td>
                        <td className="p-2 text-center">
                          <Badge 
                            style={{ backgroundColor: SEGMENT_COLORS[score.rfm_segment], color: 'white' }}
                          >
                            {score.rfm_segment}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">{score.recency_score}</td>
                        <td className="p-2 text-center">{score.frequency_score}</td>
                        <td className="p-2 text-center">{score.monetary_score}</td>
                        <td className="p-2 text-center font-bold">{score.rfm_score}</td>
                        <td className="p-2 text-muted-foreground">
                          {score.recommended_actions?.[0] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
