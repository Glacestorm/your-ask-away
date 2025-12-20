import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar,
  TrendingUp,
  Heart,
  Bell,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Cell
} from 'recharts';

// KPI Data
const kpis = [
  { 
    title: "Alumnos Activos", 
    value: "1,247", 
    change: "+23", 
    trend: "up",
    icon: Users,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  { 
    title: "Cursos Activos", 
    value: "45", 
    change: "+3", 
    trend: "up",
    icon: BookOpen,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20"
  },
  { 
    title: "Asistencia Media", 
    value: "94.2%", 
    change: "+1.5%", 
    trend: "up",
    icon: CheckCircle2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20"
  },
  { 
    title: "Donaciones (mes)", 
    value: "€12,450", 
    change: "+18%", 
    trend: "up",
    icon: Heart,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20"
  }
];

// Enrollment trend
const enrollmentData = [
  { month: 'Sep', alumnos: 980, nuevos: 120 },
  { month: 'Oct', alumnos: 1020, nuevos: 45 },
  { month: 'Nov', alumnos: 1080, nuevos: 65 },
  { month: 'Dic', alumnos: 1100, nuevos: 25 },
  { month: 'Ene', alumnos: 1180, nuevos: 85 },
  { month: 'Feb', alumnos: 1247, nuevos: 72 },
];

// Course distribution
const courseDistribution = [
  { name: 'Idiomas', value: 35, color: '#3b82f6' },
  { name: 'Tecnología', value: 25, color: '#10b981' },
  { name: 'Arte', value: 15, color: '#8b5cf6' },
  { name: 'Deportes', value: 15, color: '#f59e0b' },
  { name: 'Otros', value: 10, color: '#64748b' },
];

// Upcoming events
const upcomingEvents = [
  { id: 1, title: 'Exámenes Finales Inglés B2', date: '15 Feb', type: 'exam', participants: 45 },
  { id: 2, title: 'Taller de Programación Python', date: '18 Feb', type: 'workshop', participants: 20 },
  { id: 3, title: 'Reunión de Padres', date: '20 Feb', type: 'meeting', participants: 120 },
  { id: 4, title: 'Evento de Recaudación', date: '25 Feb', type: 'fundraising', participants: 200 },
];

// Recent donations
const recentDonations = [
  { id: 1, donor: 'Empresa ABC', amount: 2500, date: '08 Feb', type: 'corporate' },
  { id: 2, donor: 'María García', amount: 150, date: '07 Feb', type: 'individual', recurring: true },
  { id: 3, donor: 'Fundación XYZ', amount: 5000, date: '05 Feb', type: 'foundation' },
  { id: 4, donor: 'Juan Pérez', amount: 50, date: '04 Feb', type: 'individual' },
];

// Alerts
const alerts = [
  { id: 1, type: 'warning', message: '5 alumnos con asistencia < 75%', action: 'Ver detalles' },
  { id: 2, type: 'info', message: '12 certificados pendientes de emisión', action: 'Generar' },
  { id: 3, type: 'success', message: 'Objetivo de donaciones mensual alcanzado', action: 'Ver informe' },
];

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'workshop': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'meeting': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'fundraising': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case 'exam': return 'Examen';
    case 'workshop': return 'Taller';
    case 'meeting': return 'Reunión';
    case 'fundraising': return 'Recaudación';
    default: return type;
  }
};

export const EducationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-400" />
            Dashboard Educativo
          </h1>
          <p className="text-slate-400 mt-1">Panel de control para centros educativos y ONGs</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          Curso 2023-2024
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                    {kpi.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-400">{kpi.title}</p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg whitespace-nowrap ${
                    alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    alert.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                   alert.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                   <Bell className="w-4 h-4" />}
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="academic">Académico</TabsTrigger>
          <TabsTrigger value="donations">Donaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Enrollment Chart */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Evolución de Matriculaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="alumnos" 
                      stroke="#3b82f6" 
                      fill="#3b82f620"
                      name="Total Alumnos" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Course Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Distribución por Área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={courseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {courseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {courseDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-400">{item.name}</span>
                      <span className="text-sm text-white font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {upcomingEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getEventTypeColor(event.type)}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      <span className="text-sm text-slate-400">{event.date}</span>
                    </div>
                    <h4 className="text-white font-medium mb-2">{event.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="w-4 h-4" />
                      {event.participants} participantes
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Rendimiento por Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['Inglés B2', 'Python Básico', 'Diseño Gráfico', 'Marketing Digital'].map((course, i) => (
                  <div key={course}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{course}</span>
                      <span className="text-white">{85 + i * 3}%</span>
                    </div>
                    <Progress value={85 + i * 3} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Logros Recientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: '15 certificaciones B2 emitidas', date: 'Hace 2 días' },
                  { title: 'Nuevo récord de asistencia', date: 'Hace 5 días' },
                  { title: '100% aprobados en Python', date: 'Hace 1 semana' },
                ].map((achievement, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">{achievement.title}</p>
                      <p className="text-xs text-slate-500">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Donaciones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div 
                    key={donation.id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        donation.type === 'corporate' ? 'bg-blue-500/20' :
                        donation.type === 'foundation' ? 'bg-purple-500/20' : 'bg-pink-500/20'
                      }`}>
                        <Heart className={`w-5 h-5 ${
                          donation.type === 'corporate' ? 'text-blue-400' :
                          donation.type === 'foundation' ? 'text-purple-400' : 'text-pink-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{donation.donor}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">{donation.date}</span>
                          {donation.recurring && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              Recurrente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-emerald-400">€{donation.amount.toLocaleString()}</span>
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

export default EducationDashboard;
