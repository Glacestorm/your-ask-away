import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Users, Clock, TrendingDown, Target, Activity, 
  ArrowUp, ArrowDown, Monitor, Smartphone, Tablet,
  Globe, RefreshCw, BarChart3, Share2, Heart, MousePointer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { useContentAnalytics } from '@/hooks/cms/useContentAnalytics';

interface ContentAnalyticsDashboardProps {
  view?: 'dashboard' | 'pages' | 'engagement' | 'realtime' | 'conversions';
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const ContentAnalyticsDashboard: React.FC<ContentAnalyticsDashboardProps> = ({ view = 'dashboard' }) => {
  const [dateRange, setDateRange] = useState<number>(30);
  const { 
    summary, 
    trends, 
    topPages, 
    engagementSummary, 
    conversionFunnel, 
    realtimeVisitors,
    isLoading,
    isRealtimeLoading,
    refetchRealtime
  } = useContentAnalytics(dateRange);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDeviceIcon = (device: string | null) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const KPICard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: { 
    title: string; 
    value: number; 
    change: number; 
    icon: React.ElementType;
    format?: 'number' | 'time' | 'percent';
  }) => {
    const isPositive = change >= 0;
    const displayValue = format === 'time' ? formatTime(value) : 
                         format === 'percent' ? `${value.toFixed(1)}%` : 
                         formatNumber(value);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{displayValue}</p>
              <p className="text-xs text-muted-foreground mt-1">{title}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const RealtimeVisitorsPanel = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            Visitantes en Tiempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-500">
              {realtimeVisitors.length} activos
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refetchRealtime()}
              disabled={isRealtimeLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isRealtimeLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {realtimeVisitors.map((visitor, index) => (
            <motion.div
              key={visitor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                {getDeviceIcon(visitor.device_type)}
                <div>
                  <p className="text-sm font-medium text-foreground">{visitor.page_title || visitor.page_path}</p>
                  <p className="text-xs text-muted-foreground">{visitor.city}, {visitor.country}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {visitor.page_path}
              </Badge>
            </motion.div>
          ))}
          {realtimeVisitors.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No hay visitantes activos</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const TrendsChart = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tendencias de Tráfico</CardTitle>
          <div className="flex gap-1">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={dateRange === days ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorViews)"
                name="Vistas"
              />
              <Area 
                type="monotone" 
                dataKey="unique_visitors" 
                stroke="hsl(var(--chart-2))" 
                fillOpacity={1} 
                fill="url(#colorVisitors)"
                name="Visitantes Únicos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const TopPagesChart = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Top Páginas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPages.map((page, index) => (
            <div key={page.page_path} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {page.page_title || page.page_path}
                </span>
                <span className="text-muted-foreground">{formatNumber(page.total_views)}</span>
              </div>
              <Progress 
                value={(page.total_views / (topPages[0]?.total_views || 1)) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const EngagementChart = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Engagement por Contenido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementSummary} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
              <YAxis 
                dataKey="content_title" 
                type="category" 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 13, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="total_clicks" fill="hsl(var(--primary))" name="Clicks" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {engagementSummary.slice(0, 3).map((item, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm mb-1">
                <Share2 className="h-4 w-4" />
                Shares
              </div>
              <p className="text-lg font-bold text-foreground">{formatNumber(item.total_shares)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const ConversionFunnelChart = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          Funnel de Conversión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversionFunnel.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{step.step}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{formatNumber(step.value)}</span>
                  <Badge variant="outline" className="text-xs">
                    {step.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="h-8 rounded-lg overflow-hidden bg-muted/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${step.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full rounded-lg"
                  style={{ 
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    opacity: 1 - (index * 0.15)
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const DeviceDistribution = () => {
    const deviceData = realtimeVisitors.reduce((acc, visitor) => {
      const device = visitor.device_type || 'desktop';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(deviceData).map(([name, value]) => ({ name, value }));

    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Distribución por Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-sm font-medium text-foreground capitalize">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics del Contenido</h2>
          <p className="text-muted-foreground">Métricas y rendimiento de tu contenido</p>
        </div>
        <Badge variant="secondary" className="bg-green-500/20 text-green-500 animate-pulse">
          <Activity className="h-3 w-3 mr-1" />
          {realtimeVisitors.length} usuarios activos
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard 
          title="Total Vistas" 
          value={summary.totalViews} 
          change={summary.viewsChange} 
          icon={Eye} 
        />
        <KPICard 
          title="Visitantes Únicos" 
          value={summary.totalUniqueVisitors} 
          change={summary.visitorsChange} 
          icon={Users} 
        />
        <KPICard 
          title="Tiempo Medio" 
          value={summary.avgTimeOnPage} 
          change={summary.timeChange} 
          icon={Clock}
          format="time"
        />
        <KPICard 
          title="Tasa de Rebote" 
          value={summary.avgBounceRate} 
          change={-summary.bounceChange} 
          icon={TrendingDown}
          format="percent"
        />
        <KPICard 
          title="Conversiones" 
          value={summary.totalConversions} 
          change={summary.conversionsChange} 
          icon={Target} 
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <TrendsChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopPagesChart />
            <ConversionFunnelChart />
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <TrendsChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopPagesChart />
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Métricas Detalladas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {topPages.map((page) => (
                    <div key={page.page_path} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">{page.page_title || page.page_path}</span>
                        <Badge variant="outline" className="text-sm">{formatNumber(page.total_views)} vistas</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span className="font-medium text-foreground">{formatNumber(page.total_visitors)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-medium text-foreground">{page.avg_bounce_rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4" />
                          <span className="font-medium text-foreground">{page.avg_conversion_rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EngagementChart />
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Desglose de Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engagementSummary.map((item, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/30">
                      <p className="font-semibold text-foreground text-base mb-3">{item.content_title}</p>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                          <MousePointer className="h-4 w-4 mx-auto mb-1.5 text-primary" />
                          <p className="text-lg font-bold text-foreground">{formatNumber(item.total_clicks)}</p>
                          <p className="text-sm text-muted-foreground">Clicks</p>
                        </div>
                        <div className="text-center">
                          <BarChart3 className="h-4 w-4 mx-auto mb-1.5 text-blue-500" />
                          <p className="text-lg font-bold text-foreground">{item.avg_scroll_depth.toFixed(0)}%</p>
                          <p className="text-sm text-muted-foreground">Scroll</p>
                        </div>
                        <div className="text-center">
                          <Share2 className="h-4 w-4 mx-auto mb-1.5 text-green-500" />
                          <p className="text-lg font-bold text-foreground">{formatNumber(item.total_shares)}</p>
                          <p className="text-sm text-muted-foreground">Shares</p>
                        </div>
                        <div className="text-center">
                          <Heart className="h-4 w-4 mx-auto mb-1.5 text-red-500" />
                          <p className="text-lg font-bold text-foreground">{formatNumber(item.total_likes)}</p>
                          <p className="text-sm text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RealtimeVisitorsPanel />
            <DeviceDistribution />
          </div>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Páginas Más Visitadas Ahora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(
                  realtimeVisitors.reduce((acc, v) => {
                    acc[v.page_path] = (acc[v.page_path] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([path, count]) => (
                    <div key={path} className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-3xl font-bold text-primary">{count}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">{path}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
