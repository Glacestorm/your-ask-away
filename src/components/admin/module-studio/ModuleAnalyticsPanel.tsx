/**
 * ModuleAnalyticsPanel - Dashboard de métricas mejorado con gráficos interactivos
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Activity, 
  Zap,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useModuleAnalytics } from '@/hooks/admin/useModuleAnalytics';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleAnalyticsPanelProps {
  moduleKey?: string;
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142 76% 36%)', 'hsl(48 96% 53%)', 'hsl(280 65% 60%)'];

const mockTrendData = [
  { date: 'Lun', users: 120, sessions: 340, errors: 5 },
  { date: 'Mar', users: 145, sessions: 420, errors: 3 },
  { date: 'Mié', users: 132, sessions: 380, errors: 8 },
  { date: 'Jue', users: 178, sessions: 510, errors: 2 },
  { date: 'Vie', users: 165, sessions: 480, errors: 4 },
  { date: 'Sáb', users: 89, sessions: 220, errors: 1 },
  { date: 'Dom', users: 95, sessions: 250, errors: 2 },
];

const mockCategoryData = [
  { name: 'Dashboard', value: 35 },
  { name: 'Reports', value: 25 },
  { name: 'Settings', value: 20 },
  { name: 'API', value: 15 },
  { name: 'Other', value: 5 },
];

export function ModuleAnalyticsPanel({ moduleKey, className }: ModuleAnalyticsPanelProps) {
  const [period, setPeriod] = useState('7d');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { isLoading, dashboardData, fetchDashboardData } = useModuleAnalytics(moduleKey);

  useEffect(() => {
    if (moduleKey) fetchDashboardData();
  }, [moduleKey, fetchDashboardData]);

  const stats = useMemo(() => ({
    totalUsers: dashboardData?.summary?.totalUsers || 1250,
    activeModules: dashboardData?.summary?.activeModules || 12,
    avgResponseTime: 145,
    errorRate: 0.8,
    userGrowth: 12.5,
    sessionGrowth: 8.3,
  }), [dashboardData]);

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para ver analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div layout className={cn(isExpanded && "fixed inset-4 z-50")}>
      <Card className={cn("overflow-hidden h-full", className)}>
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Module Analytics</CardTitle>
                <CardDescription className="text-xs">Métricas de uso y rendimiento</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 días</SelectItem>
                  <SelectItem value="30d">30 días</SelectItem>
                  <SelectItem value="90d">90 días</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchDashboardData} disabled={isLoading} className="h-8 w-8">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">Tendencias</TabsTrigger>
              <TabsTrigger value="breakdown" className="text-xs">Desglose</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Usuarios</span>
                    </div>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      {stats.userGrowth}%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Módulos Activos</span>
                    </div>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      {stats.sessionGrowth}%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats.activeModules}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Tiempo Respuesta</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Tasa Error</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.errorRate}%</p>
                </motion.div>
              </div>

              {/* Mini Chart */}
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrendData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Health Scores */}
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {(dashboardData?.healthScores || [
                    { moduleKey: 'core', overallScore: 95 },
                    { moduleKey: 'analytics', overallScore: 88 },
                    { moduleKey: 'auth', overallScore: 92 },
                  ]).map((health: { moduleKey: string; overallScore: number }) => (
                    <motion.div 
                      key={health.moduleKey} 
                      className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{health.moduleKey}</span>
                        <Badge variant={health.overallScore >= 80 ? "default" : "secondary"}>
                          {health.overallScore}
                        </Badge>
                      </div>
                      <Progress value={health.overallScore} className="h-2" />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="trends" className="mt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="Usuarios" />
                    <Area type="monotone" dataKey="sessions" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.2)" name="Sesiones" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {mockCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {mockCategoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                <Download className="h-4 w-4" />
                Exportar Reporte
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ModuleAnalyticsPanel;
