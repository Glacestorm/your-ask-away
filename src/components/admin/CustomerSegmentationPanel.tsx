import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, AreaChart, Area
} from 'recharts';
import {
  Brain, TrendingDown, TrendingUp, DollarSign, Target, AlertCircle,
  CheckCircle, Clock, RefreshCw, GitBranch, Zap, Shield, Users,
  ArrowRight, Activity, BarChart3
} from 'lucide-react';

interface CustomerSegment {
  id: string;
  company_id: string;
  segment_name: string;
  churn_probability: number | null;
  churn_risk_level: string | null;
  clv_estimate: number | null;
  clv_percentile: number | null;
  loyalty_score: number | null;
  engagement_score: number | null;
  profitability_tier: string | null;
  decision_path: string[] | null;
  feature_importance: any;
  model_confidence: number | null;
  recommended_actions: any;
  priority_score: number | null;
  next_best_action: string | null;
  calculated_at: string;
}

interface ActionRecommendation {
  id: string;
  company_id: string;
  action_type: string;
  action_title: string;
  action_description: string;
  priority: number;
  expected_impact: string;
  estimated_value: number;
  status: string;
  source_model: string;
}

interface MLExecution {
  id: string;
  model_type: string;
  execution_status: string;
  companies_processed: number;
  segments_created: number;
  execution_time_ms: number;
  results_summary: any;
  started_at: string;
  completed_at: string;
}

const TIER_COLORS: Record<string, string> = {
  'platinum': '#E5E4E2',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'bronze': '#CD7F32'
};

const RISK_COLORS: Record<string, string> = {
  'critical': '#DC2626',
  'high': '#EF4444',
  'medium': '#F59E0B',
  'low': '#10B981'
};

export function CustomerSegmentationPanel() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [executions, setExecutions] = useState<MLExecution[]>([]);
  const [companies, setCompanies] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch customer segments
      const { data: segmentData, error: segError } = await supabase
        .from('customer_segments')
        .select('*')
        .order('priority_score', { ascending: false });

      if (segError) throw segError;
      setSegments(segmentData || []);

      // Fetch recommendations
      const { data: recData } = await supabase
        .from('customer_action_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(50);

      setRecommendations(recData || []);

      // Fetch execution history
      const { data: execData } = await supabase
        .from('ml_model_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      setExecutions(execData || []);

      // Fetch company names
      if (segmentData && segmentData.length > 0) {
        const companyIds = segmentData.map(s => s.company_id);
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);

        if (companyData) {
          setCompanies(new Map(companyData.map(c => [c.id, c.name])));
        }
      }
    } catch (error) {
      console.error('Error fetching segmentation data:', error);
      toast.error('Error al cargar datos de segmentación');
    } finally {
      setLoading(false);
    }
  };

  const runMLSegmentation = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('segment-customers-ml', {
        body: { includeChurnPrediction: true, includeCLV: true }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Segmentación ML completada: ${data.stats.processed} clientes procesados`);
        await fetchData();
      } else {
        throw new Error(data?.error || 'Error en segmentación');
      }
    } catch (error) {
      console.error('ML Segmentation error:', error);
      toast.error('Error al ejecutar segmentación ML');
    } finally {
      setAnalyzing(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('customer_action_recommendations')
        .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
        .eq('id', id);

      if (error) throw error;
      toast.success('Estado actualizado');
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  // Calculate summary stats
  const totalCustomers = segments.length;
  const avgChurn = segments.length > 0 
    ? (segments.reduce((sum, s) => sum + (s.churn_probability || 0), 0) / segments.length * 100).toFixed(1)
    : 0;
  const totalCLV = segments.reduce((sum, s) => sum + (s.clv_estimate || 0), 0);
  const highRiskCount = segments.filter(s => s.churn_risk_level === 'high' || s.churn_risk_level === 'critical').length;

  // Churn distribution data
  const churnDistribution = [
    { name: 'Bajo', value: segments.filter(s => s.churn_risk_level === 'low').length, fill: '#10B981' },
    { name: 'Medio', value: segments.filter(s => s.churn_risk_level === 'medium').length, fill: '#F59E0B' },
    { name: 'Alto', value: segments.filter(s => s.churn_risk_level === 'high').length, fill: '#EF4444' },
    { name: 'Crítico', value: segments.filter(s => s.churn_risk_level === 'critical').length, fill: '#DC2626' }
  ];

  // Tier distribution
  const tierDistribution = [
    { name: 'Platinum', value: segments.filter(s => s.profitability_tier === 'platinum').length },
    { name: 'Gold', value: segments.filter(s => s.profitability_tier === 'gold').length },
    { name: 'Silver', value: segments.filter(s => s.profitability_tier === 'silver').length },
    { name: 'Bronze', value: segments.filter(s => s.profitability_tier === 'bronze').length }
  ];

  // Feature importance radar data (average across all segments)
  const avgFeatureImportance = segments.length > 0 ? {
    recency: segments.reduce((sum, s) => sum + ((s.feature_importance as any)?.recency || 0), 0) / segments.length * 100,
    frequency: segments.reduce((sum, s) => sum + ((s.feature_importance as any)?.frequency || 0), 0) / segments.length * 100,
    monetary: segments.reduce((sum, s) => sum + ((s.feature_importance as any)?.monetary || 0), 0) / segments.length * 100
  } : { recency: 33, frequency: 33, monetary: 34 };

  const radarData = [
    { feature: 'Recencia', value: avgFeatureImportance.recency },
    { feature: 'Frecuencia', value: avgFeatureImportance.frequency },
    { feature: 'Monetario', value: avgFeatureImportance.monetary }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Segmentación ML (SVM + CART)
          </h2>
          <p className="text-muted-foreground">
            Predicción de Churn, CLV y Políticas de Gestión Automatizadas
          </p>
        </div>
        <Button onClick={runMLSegmentation} disabled={analyzing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Procesando ML...' : 'Ejecutar Segmentación ML'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes Segmentados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Con predicciones ML</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <TrendingDown className="h-4 w-4" />
              Prob. Churn Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{avgChurn}%</div>
            <Progress value={parseFloat(avgChurn as string)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
              <DollarSign className="h-4 w-4" />
              CLV Total Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{(totalCLV / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">Customer Lifetime Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              Alto Riesgo Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">Requieren intervención</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visión General</TabsTrigger>
          <TabsTrigger value="churn">Análisis Churn</TabsTrigger>
          <TabsTrigger value="clv">Customer Lifetime Value</TabsTrigger>
          <TabsTrigger value="cart">Árbol CART</TabsTrigger>
          <TabsTrigger value="actions">Acciones Recomendadas</TabsTrigger>
          <TabsTrigger value="history">Historial ML</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Distribución de Riesgo de Churn
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Clientes">
                      {churnDistribution.map((entry, index) => (
                        <Bar key={`bar-${index}`} dataKey="value" fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Importance Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Importancia de Features
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="feature" />
                    <PolarRadiusAxis domain={[0, 50]} />
                    <Radar name="Importancia" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribución por Tier de Rentabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Clientes">
                    {tierDistribution.map((entry, index) => (
                      <Bar key={`tier-${index}`} dataKey="value" fill={TIER_COLORS[entry.name.toLowerCase()] || '#6B7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes en Riesgo de Churn</CardTitle>
              <CardDescription>Ordenados por probabilidad de abandono</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {segments
                    .filter(s => s.churn_probability >= 0.4)
                    .sort((a, b) => b.churn_probability - a.churn_probability)
                    .slice(0, 20)
                    .map(segment => (
                      <div key={segment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{companies.get(segment.company_id) || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{segment.segment_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {Math.round(segment.churn_probability * 100)}% churn
                            </p>
                            <Badge 
                              variant="outline"
                              style={{ 
                                backgroundColor: RISK_COLORS[segment.churn_risk_level],
                                color: 'white'
                              }}
                            >
                              {segment.churn_risk_level}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">CLV: €{segment.clv_estimate?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{segment.next_best_action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Customer Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {['platinum', 'gold', 'silver', 'bronze'].map(tier => {
                  const tierSegments = segments.filter(s => s.profitability_tier === tier);
                  const tierCLV = tierSegments.reduce((sum, s) => sum + (s.clv_estimate || 0), 0);
                  return (
                    <Card key={tier} className="border-2" style={{ borderColor: TIER_COLORS[tier] }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize">{tier}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">€{(tierCLV / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">{tierSegments.length} clientes</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <ScrollArea className="h-72">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-center p-2">Tier</th>
                      <th className="text-right p-2">CLV</th>
                      <th className="text-center p-2">Percentil</th>
                      <th className="text-center p-2">Lealtad</th>
                      <th className="text-center p-2">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments
                      .sort((a, b) => (b.clv_estimate || 0) - (a.clv_estimate || 0))
                      .slice(0, 30)
                      .map(segment => (
                        <tr key={segment.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{companies.get(segment.company_id) || 'Unknown'}</td>
                          <td className="p-2 text-center">
                            <Badge style={{ backgroundColor: TIER_COLORS[segment.profitability_tier], color: segment.profitability_tier === 'gold' ? 'black' : 'white' }}>
                              {segment.profitability_tier}
                            </Badge>
                          </td>
                          <td className="p-2 text-right font-medium">€{segment.clv_estimate?.toLocaleString()}</td>
                          <td className="p-2 text-center">{segment.clv_percentile}%</td>
                          <td className="p-2 text-center">
                            <Progress value={segment.loyalty_score} className="w-16 mx-auto" />
                          </td>
                          <td className="p-2 text-center">
                            <Progress value={segment.engagement_score} className="w-16 mx-auto" />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Reglas de Decisión CART
              </CardTitle>
              <CardDescription>Caminos de decisión del modelo para cada segmento</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(
                  segments.reduce((acc, s) => {
                    if (!acc[s.segment_name]) acc[s.segment_name] = [];
                    acc[s.segment_name].push(s);
                    return acc;
                  }, {} as Record<string, CustomerSegment[]>)
                ).map(([segmentName, segmentCustomers]) => {
                  const sampleCustomer = segmentCustomers[0];
                  return (
                    <AccordionItem key={segmentName} value={segmentName}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{segmentCustomers.length}</Badge>
                          <span>{segmentName}</span>
                          <span className="text-muted-foreground text-sm">
                            Confianza: {Math.round((sampleCustomer.model_confidence || 0) * 100)}%
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium mb-2">Camino de Decisión:</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {(sampleCustomer.decision_path || []).map((step, idx) => (
                                <React.Fragment key={idx}>
                                  <Badge variant="secondary">{step}</Badge>
                                  {idx < (sampleCustomer.decision_path?.length || 0) - 1 && (
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium mb-2">Importancia de Features:</p>
                            <div className="grid grid-cols-3 gap-4">
                              {Object.entries(sampleCustomer.feature_importance || {}).map(([feature, importance]) => (
                                <div key={feature} className="text-center">
                                  <p className="text-sm capitalize">{feature}</p>
                                  <Progress value={(importance as number) * 100} className="mt-1" />
                                  <p className="text-xs text-muted-foreground">{Math.round((importance as number) * 100)}%</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="font-medium mb-2">Próxima Mejor Acción:</p>
                            <Badge className="bg-primary">{sampleCustomer.next_best_action}</Badge>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Acciones Recomendadas Pendientes
              </CardTitle>
              <CardDescription>Generadas automáticamente por el modelo ML</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={rec.priority >= 4 ? 'destructive' : rec.priority >= 3 ? 'default' : 'secondary'}>
                            P{rec.priority}
                          </Badge>
                          <span className="font-medium">{rec.action_title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.action_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliente: {companies.get(rec.company_id) || 'Unknown'} | 
                          Impacto: {rec.expected_impact} | 
                          Valor: €{rec.estimated_value?.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                        >
                          Descartar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {recommendations.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay acciones pendientes. Ejecuta el análisis ML para generar recomendaciones.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Ejecuciones ML
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72">
                <div className="space-y-3">
                  {executions.map(exec => (
                    <div key={exec.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={exec.execution_status === 'completed' ? 'default' : 'secondary'}>
                            {exec.model_type}
                          </Badge>
                          <Badge variant={exec.execution_status === 'completed' ? 'outline' : 'destructive'}>
                            {exec.execution_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(exec.started_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{exec.companies_processed} empresas</p>
                        <p className="text-xs text-muted-foreground">
                          {exec.execution_time_ms ? `${(exec.execution_time_ms / 1000).toFixed(1)}s` : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
