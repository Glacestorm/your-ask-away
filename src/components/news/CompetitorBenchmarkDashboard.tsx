import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Building2, 
  BarChart3, 
  ThumbsUp, 
  ThumbsDown,
  AlertCircle,
  RefreshCw
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Competitor {
  id: string;
  name: string;
  keywords: string[];
  website: string;
  is_active: boolean;
}

interface CompetitorMention {
  id: string;
  competitor_id: string;
  article_id: string;
  mention_context: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  detected_at: string;
}

interface MentionStats {
  competitor_id: string;
  competitor_name: string;
  total_mentions: number;
  positive: number;
  negative: number;
  neutral: number;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
}

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#94a3b8',
};

export const CompetitorBenchmarkDashboard: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [mentions, setMentions] = useState<CompetitorMention[]>([]);
  const [stats, setStats] = useState<MentionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [competitorsRes, mentionsRes] = await Promise.all([
        supabase.from('news_competitors').select('*').eq('is_active', true),
        supabase.from('news_competitor_mentions').select('*').order('detected_at', { ascending: false }).limit(100)
      ]);

      if (competitorsRes.error) throw competitorsRes.error;
      if (mentionsRes.error) throw mentionsRes.error;

      const typedCompetitors = (competitorsRes.data || []).map(c => ({
        ...c,
        keywords: c.keywords || [],
        website: c.website || ''
      }));

      const typedMentions = (mentionsRes.data || []).map(m => ({
        ...m,
        sentiment: m.sentiment as 'positive' | 'negative' | 'neutral',
        mention_context: m.mention_context || ''
      }));

      setCompetitors(typedCompetitors);
      setMentions(typedMentions);
      calculateStats(typedCompetitors, typedMentions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos de competencia');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (comps: Competitor[], ments: CompetitorMention[]) => {
    const statsMap = new Map<string, MentionStats>();

    comps.forEach(comp => {
      statsMap.set(comp.id, {
        competitor_id: comp.id,
        competitor_name: comp.name,
        total_mentions: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        trend: 'stable',
        change_percent: 0,
      });
    });

    ments.forEach(mention => {
      const stat = statsMap.get(mention.competitor_id);
      if (stat) {
        stat.total_mentions++;
        stat[mention.sentiment]++;
      }
    });

    // Calculate trends (mock - would need historical data)
    const statsArray: MentionStats[] = Array.from(statsMap.values()).map(stat => {
      const randomTrend = Math.random();
      const trend: 'up' | 'down' | 'stable' = randomTrend > 0.66 ? 'up' : randomTrend > 0.33 ? 'down' : 'stable';
      return {
        ...stat,
        trend,
        change_percent: Math.floor(Math.random() * 30) - 10,
      };
    });

    setStats(statsArray.sort((a, b) => b.total_mentions - a.total_mentions));
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('analyze-competitor-mentions');
      if (error) throw error;
      toast.success('Análisis completado');
      fetchData();
    } catch (error) {
      console.error('Error running analysis:', error);
      toast.error('Error al ejecutar análisis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Mock trend data for chart
  const trendData = [
    { date: 'Lun', 'Tu Empresa': 12, 'Competidor A': 8, 'Competidor B': 5 },
    { date: 'Mar', 'Tu Empresa': 15, 'Competidor A': 10, 'Competidor B': 7 },
    { date: 'Mié', 'Tu Empresa': 10, 'Competidor A': 12, 'Competidor B': 4 },
    { date: 'Jue', 'Tu Empresa': 18, 'Competidor A': 9, 'Competidor B': 8 },
    { date: 'Vie', 'Tu Empresa': 22, 'Competidor A': 11, 'Competidor B': 6 },
    { date: 'Sáb', 'Tu Empresa': 14, 'Competidor A': 7, 'Competidor B': 3 },
    { date: 'Dom', 'Tu Empresa': 8, 'Competidor A': 5, 'Competidor B': 2 },
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
            <BarChart3 className="h-6 w-6" />
            Benchmark Competitivo
          </h2>
          <p className="text-muted-foreground">
            Comparativa de menciones en noticias del sector
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analizando...' : 'Actualizar Análisis'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {stats.reduce((acc, s) => acc + s.total_mentions, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Menciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">
              {stats.reduce((acc, s) => acc + s.positive, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Positivas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">
              {stats.reduce((acc, s) => acc + s.negative, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Negativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{competitors.length}</div>
            <p className="text-sm text-muted-foreground">Competidores</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="sentiment">Sentimiento</TabsTrigger>
          <TabsTrigger value="mentions">Menciones Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitor Ranking */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Menciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No hay datos de competidores aún
                    </p>
                  ) : (
                    stats.map((stat, index) => (
                      <div key={stat.competitor_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-muted-foreground">
                              #{index + 1}
                            </span>
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">{stat.competitor_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(stat.trend)}
                            <Badge variant={stat.change_percent >= 0 ? 'default' : 'secondary'}>
                              {stat.change_percent >= 0 ? '+' : ''}{stat.change_percent}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(stat.total_mentions / Math.max(...stats.map(s => s.total_mentions))) * 100} 
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">
                            {stat.total_mentions}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Sentimiento</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Positivo', value: stats.reduce((a, s) => a + s.positive, 0) },
                          { name: 'Negativo', value: stats.reduce((a, s) => a + s.negative, 0) },
                          { name: 'Neutral', value: stats.reduce((a, s) => a + s.neutral, 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill={SENTIMENT_COLORS.positive} />
                        <Cell fill={SENTIMENT_COLORS.negative} />
                        <Cell fill={SENTIMENT_COLORS.neutral} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Sin datos de sentimiento
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Menciones (Últimos 7 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Tu Empresa" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Competidor A" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Competidor B" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const total = stat.positive + stat.negative + stat.neutral || 1;
              return (
                <Card key={stat.competitor_id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{stat.competitor_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span>Positivo</span>
                        </div>
                        <span className="font-medium">
                          {Math.round((stat.positive / total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(stat.positive / total) * 100} 
                        className="bg-green-100"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                          <span>Negativo</span>
                        </div>
                        <span className="font-medium">
                          {Math.round((stat.negative / total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(stat.negative / total) * 100} 
                        className="bg-red-100"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span>Neutral</span>
                        </div>
                        <span className="font-medium">
                          {Math.round((stat.neutral / total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(stat.neutral / total) * 100} 
                        className="bg-slate-100"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="mentions">
          <Card>
            <CardHeader>
              <CardTitle>Menciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {mentions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay menciones detectadas aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentions.slice(0, 10).map((mention) => {
                    const competitor = competitors.find(c => c.id === mention.competitor_id);
                    return (
                      <div key={mention.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{competitor?.name || 'Desconocido'}</Badge>
                          <Badge
                            variant={
                              mention.sentiment === 'positive' ? 'default' :
                              mention.sentiment === 'negative' ? 'destructive' : 'secondary'
                            }
                          >
                            {mention.sentiment === 'positive' ? '👍 Positivo' :
                             mention.sentiment === 'negative' ? '👎 Negativo' : '😐 Neutral'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "{mention.mention_context}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(mention.detected_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorBenchmarkDashboard;
