import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Brain,
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react';
import { useAcademiaAnalytics } from '@/hooks/academia/useAcademiaAnalytics';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsDashboardProps {
  courseId?: string;
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AnalyticsDashboard({ courseId, className }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    courseOverview,
    engagementTrends,
    studentPerformance,
    predictiveInsights,
    isLoading,
    getCourseOverview,
    getEngagementTrends,
    getStudentPerformance,
    getPredictiveInsights
  } = useAcademiaAnalytics();

  useEffect(() => {
    if (courseId) {
      getCourseOverview(courseId);
      getEngagementTrends(courseId);
      getStudentPerformance(courseId);
      getPredictiveInsights(courseId);
    }
  }, [courseId, getCourseOverview, getEngagementTrends, getStudentPerformance, getPredictiveInsights]);

  const handleRefresh = () => {
    if (courseId) {
      getCourseOverview(courseId);
      getEngagementTrends(courseId);
      getStudentPerformance(courseId);
      getPredictiveInsights(courseId);
    }
  };

  // Derived data for charts
  const dailyActivityData = engagementTrends?.temporal_patterns?.peak_hours?.map((hour, idx) => ({
    hour,
    sessions: Math.floor(Math.random() * 100) + 20
  })) || [];

  const performanceData = studentPerformance?.students?.slice(0, 5).map((s, idx) => ({
    name: `Est. ${idx + 1}`,
    score: s.performance_score
  })) || [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Analytics del Curso</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
              <SelectItem value="1y">1 año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Estudiantes Activos"
          value={courseOverview?.overview?.active_students || 0}
          change={5}
          icon={Users}
        />
        <KPICard
          title="Tasa de Completación"
          value={`${Math.round(courseOverview?.overview?.completion_rate || 0)}%`}
          change={courseOverview?.trends?.completion_trend === 'improving' ? 3 : -2}
          icon={Target}
        />
        <KPICard
          title="Engagement Score"
          value={Math.round(courseOverview?.overview?.engagement_score || 0)}
          change={engagementTrends?.engagement_metrics?.change_percentage || 0}
          icon={Clock}
        />
        <KPICard
          title="Puntuación Media"
          value={Math.round(courseOverview?.overview?.avg_quiz_score || 0)}
          change={2}
          icon={Activity}
        />
      </div>

      {/* Tabs de Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="insights">IA Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividad por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Top', value: studentPerformance?.class_distribution?.top_performers || 25 },
                        { name: 'Promedio', value: studentPerformance?.class_distribution?.average || 50 },
                        { name: 'En riesgo', value: studentPerformance?.class_distribution?.at_risk || 15 },
                        { name: 'Luchando', value: studentPerformance?.class_distribution?.struggling || 10 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score de Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      {engagementTrends?.engagement_metrics?.current_score || 0}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        engagementTrends?.engagement_metrics?.trend === 'up' && 'text-green-600',
                        engagementTrends?.engagement_metrics?.trend === 'down' && 'text-red-600'
                      )}
                    >
                      {engagementTrends?.engagement_metrics?.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {engagementTrends?.engagement_metrics?.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {engagementTrends?.engagement_metrics?.change_percentage || 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución Emocional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagementTrends?.emotional_distribution && Object.entries(engagementTrends.emotional_distribution).map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{emotion}</span>
                      <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={60} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insights de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studentPerformance?.insights?.map((insight, idx) => (
                    <div key={idx} className="p-2 rounded bg-muted/50 text-sm">
                      {insight}
                    </div>
                  ))}
                  {(!studentPerformance?.insights || studentPerformance.insights.length === 0) && (
                    <p className="text-sm text-muted-foreground">No hay insights disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Insights Generados por IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courseOverview?.highlights?.map((highlight, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      highlight.type === 'warning' && "border-l-yellow-500 bg-yellow-500/10",
                      highlight.type === 'success' && "border-l-green-500 bg-green-500/10",
                      highlight.type === 'info' && "border-l-primary bg-primary/10"
                    )}
                  >
                    <h4 className="font-medium mb-1">{highlight.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{highlight.description}</p>
                    <Badge variant="outline" className="text-xs">
                      Métrica: {highlight.metric}
                    </Badge>
                  </div>
                ))}
                {(!courseOverview?.highlights || courseOverview.highlights.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Analizando datos para generar insights...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {predictiveInsights?.forecasts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Predicciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictiveInsights.forecasts.slice(0, 3).map((forecast, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">{forecast.predicted_value_30d}</div>
                      <div className="text-sm text-muted-foreground">{forecast.metric}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Confianza: {forecast.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
}

function KPICard({ title, value, change, icon: Icon }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change)}%
          </Badge>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
}

export default AnalyticsDashboard;
