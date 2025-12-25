/**
 * AcademiaAnalytics - Dashboard de Analytics para administradores
 * Métricas, reportes y visualizaciones del sistema de formación
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Trophy,
  Target,
  Activity,
  Percent,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademiaAnalytics } from '@/hooks/useAcademiaAnalytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AcademiaAnalytics: React.FC = () => {
  const { language } = useLanguage();
  const [timeFilter, setTimeFilter] = useState('30d');
  
  const {
    overviewMetrics,
    courseMetrics,
    topPerformers,
    timeSeriesData,
    isLoading,
    loadingOverview,
    setDateRange,
    exportToCSV,
    refreshAll,
  } = useAcademiaAnalytics();

  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    const now = new Date();
    let start: Date;
    
    switch (value) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    setDateRange({ start, end: now });
  };

  // Prepare pie chart data
  const statusDistribution = courseMetrics ? [
    { name: 'Completados', value: courseMetrics.reduce((acc, c) => acc + c.completedEnrollments, 0) },
    { name: 'En progreso', value: courseMetrics.reduce((acc, c) => acc + c.activeEnrollments, 0) },
    { name: 'Sin iniciar', value: courseMetrics.reduce((acc, c) => acc + (c.totalEnrollments - c.completedEnrollments - c.activeEnrollments), 0) },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/academia" 
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{language === 'es' ? 'Volver a Academia' : 'Back to Academy'}</span>
            </Link>
            <div className="flex items-center gap-4">
              <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={refreshAll}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {language === 'es' ? 'Analytics de Academia' : 'Academy Analytics'}
            </h1>
          </div>
          <p className="text-slate-400">
            {language === 'es' 
              ? 'Métricas y reportes del sistema de formación' 
              : 'Training system metrics and reports'}
          </p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <OverviewCard
            icon={Users}
            label={language === 'es' ? 'Usuarios Totales' : 'Total Users'}
            value={overviewMetrics?.totalUsers || 0}
            loading={loadingOverview}
            color="blue"
          />
          <OverviewCard
            icon={BookOpen}
            label={language === 'es' ? 'Inscripciones' : 'Enrollments'}
            value={overviewMetrics?.totalEnrollments || 0}
            loading={loadingOverview}
            color="green"
          />
          <OverviewCard
            icon={Target}
            label={language === 'es' ? 'Completados' : 'Completed'}
            value={overviewMetrics?.totalCompletions || 0}
            loading={loadingOverview}
            color="yellow"
          />
          <OverviewCard
            icon={Award}
            label={language === 'es' ? 'Certificados' : 'Certificates'}
            value={overviewMetrics?.totalCertificates || 0}
            loading={loadingOverview}
            color="purple"
          />
          <OverviewCard
            icon={Percent}
            label={language === 'es' ? 'Tasa Completación' : 'Completion Rate'}
            value={`${overviewMetrics?.avgCompletionRate || 0}%`}
            loading={loadingOverview}
            color="pink"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{overviewMetrics?.activeUsersLast7Days || 0}</p>
                  <p className="text-xs text-slate-400">Activos (7 días)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{overviewMetrics?.activeUsersLast30Days || 0}</p>
                  <p className="text-xs text-slate-400">Activos (30 días)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{overviewMetrics?.totalTimeSpentHours || 0}h</p>
                  <p className="text-xs text-slate-400">Tiempo total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{overviewMetrics?.avgScore || 0}%</p>
                  <p className="text-xs text-slate-400">Nota promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {language === 'es' ? 'General' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {language === 'es' ? 'Cursos' : 'Courses'}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              {language === 'es' ? 'Top Performers' : 'Top Performers'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Time Series Chart */}
              <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      {language === 'es' ? 'Tendencias' : 'Trends'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => timeSeriesData && exportToCSV(timeSeriesData as unknown as Record<string, unknown>[], 'tendencias')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b"
                          tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="enrollments" 
                          stackId="1"
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.3}
                          name="Inscripciones"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="completions" 
                          stackId="2"
                          stroke="#10b981" 
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Completados"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="certificates" 
                          stackId="3"
                          stroke="#f59e0b" 
                          fill="#f59e0b"
                          fillOpacity={0.3}
                          name="Certificados"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    {language === 'es' ? 'Estado de Cursos' : 'Course Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {statusDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    {language === 'es' ? 'Métricas por Curso' : 'Course Metrics'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => courseMetrics && exportToCSV(courseMetrics as unknown as Record<string, unknown>[], 'cursos')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead>Curso</TableHead>
                        <TableHead className="text-center">Inscritos</TableHead>
                        <TableHead className="text-center">Completados</TableHead>
                        <TableHead className="text-center">Tasa</TableHead>
                        <TableHead className="text-center">Progreso Prom.</TableHead>
                        <TableHead className="text-center">Nota Prom.</TableHead>
                        <TableHead className="text-center">Certificados</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseMetrics?.map((course) => (
                        <TableRow key={course.courseId} className="border-slate-700">
                          <TableCell className="font-medium text-white max-w-[200px] truncate">
                            {course.courseName}
                          </TableCell>
                          <TableCell className="text-center">{course.totalEnrollments}</TableCell>
                          <TableCell className="text-center text-green-400">{course.completedEnrollments}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                course.completionRate >= 70 ? 'border-green-500/50 text-green-400' :
                                course.completionRate >= 40 ? 'border-yellow-500/50 text-yellow-400' :
                                'border-red-500/50 text-red-400'
                              )}
                            >
                              {Math.round(course.completionRate)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <Progress value={course.avgProgress} className="h-2 w-16" />
                              <span className="text-xs text-slate-400">{course.avgProgress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-blue-400">{course.avgScore}%</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                              <Award className="w-3 h-3 mr-1" />
                              {course.certificatesIssued}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!courseMetrics || courseMetrics.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                            No hay datos de cursos disponibles
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  {language === 'es' ? 'Mejores Estudiantes' : 'Top Performers'}
                </CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Ranking basado en XP total y cursos completados' 
                    : 'Ranking based on total XP and completed courses'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers?.map((performer, index) => (
                    <motion.div
                      key={performer.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        index === 0 ? "bg-yellow-500/10 border-yellow-500/30" :
                        index === 1 ? "bg-slate-500/10 border-slate-500/30" :
                        index === 2 ? "bg-orange-500/10 border-orange-500/30" :
                        "bg-slate-800/50 border-slate-700"
                      )}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-10 h-10">
                        {index === 0 && <span className="text-3xl">🥇</span>}
                        {index === 1 && <span className="text-3xl">🥈</span>}
                        {index === 2 && <span className="text-3xl">🥉</span>}
                        {index > 2 && (
                          <span className="text-xl font-bold text-slate-400">#{index + 1}</span>
                        )}
                      </div>

                      {/* Level Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                        {performer.level}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{performer.userName}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {performer.completedCourses} cursos
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {performer.certificates} certificados
                          </span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{performer.xp.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">XP</p>
                      </div>
                    </motion.div>
                  ))}
                  {(!topPerformers || topPerformers.length === 0) && (
                    <div className="text-center py-12">
                      <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No hay datos de estudiantes disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Overview Card Component
interface OverviewCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  loading?: boolean;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'pink';
}

const OverviewCard: React.FC<OverviewCardProps> = ({ icon: Icon, label, value, loading, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-400',
    green: 'from-green-500 to-green-600 text-green-400',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-400',
    purple: 'from-purple-500 to-purple-600 text-purple-400',
    pink: 'from-pink-500 to-pink-600 text-pink-400',
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-gradient-to-br", colorClasses[color].split(' ').slice(0, 2).join(' '))}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-16 bg-slate-700 animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademiaAnalytics;
