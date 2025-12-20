import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, Calendar, FileText, Receipt, 
  PenTool, Eye, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Activity
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const appointmentsData = [
  { day: 'Lun', citas: 24, completadas: 22 },
  { day: 'Mar', citas: 28, completadas: 26 },
  { day: 'Mié', citas: 22, completadas: 20 },
  { day: 'Jue', citas: 30, completadas: 28 },
  { day: 'Vie', citas: 26, completadas: 24 },
  { day: 'Sáb', citas: 12, completadas: 11 },
];

const serviceTypeData = [
  { name: 'Consulta General', value: 40, color: '#ef4444' },
  { name: 'Revisiones', value: 25, color: '#3b82f6' },
  { name: 'Primera Visita', value: 20, color: '#10b981' },
  { name: 'Urgencias', value: 10, color: '#f59e0b' },
  { name: 'Seguimiento', value: 5, color: '#8b5cf6' },
];

const monthlyTrendData = [
  { month: 'Ene', pacientes: 320, ingresos: 28500 },
  { month: 'Feb', pacientes: 345, ingresos: 31200 },
  { month: 'Mar', pacientes: 380, ingresos: 34800 },
  { month: 'Abr', pacientes: 365, ingresos: 33200 },
  { month: 'May', pacientes: 410, ingresos: 37500 },
  { month: 'Jun', pacientes: 425, ingresos: 39200 },
];

export const HealthcareDashboard: React.FC = () => {
  const todayAppointments = [
    { time: '09:00', patient: 'María García López', type: 'Consulta General', status: 'completed', duration: 30 },
    { time: '09:30', patient: 'Juan Pérez Martín', type: 'Revisión', status: 'completed', duration: 20 },
    { time: '10:00', patient: 'Ana Rodríguez Sanz', type: 'Primera Visita', status: 'in_progress', duration: 45 },
    { time: '10:30', patient: 'Pedro Fernández Gil', type: 'Seguimiento', status: 'waiting', duration: 20 },
    { time: '11:00', patient: 'Laura Martínez Ruiz', type: 'Consulta General', status: 'scheduled', duration: 30 },
    { time: '11:30', patient: 'Carlos López Díaz', type: 'Urgencia', status: 'scheduled', duration: 15 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Completada</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 animate-pulse">En Curso</Badge>;
      case 'waiting': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En Espera</Badge>;
      case 'scheduled': return <Badge variant="outline">Programada</Badge>;
      default: return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Heart className="h-6 w-6 text-white" />
            </div>
            Salud
          </h1>
          <p className="text-muted-foreground mt-1">Gestión sanitaria integral - Clínicas y Consultas</p>
        </div>
        <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/25">
          <Calendar className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citas Hoy</p>
                <p className="text-3xl font-bold mt-1">{todayAppointments.length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Activity className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">2 en curso</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pacientes Atendidos</p>
                <p className="text-3xl font-bold mt-1">{todayAppointments.filter(a => a.status === 'completed').length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+15% vs ayer</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Espera</p>
                <p className="text-3xl font-bold mt-1">{todayAppointments.filter(a => a.status === 'waiting').length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-500">~10 min espera</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-3xl font-bold mt-1">{todayAppointments.filter(a => a.status === 'scheduled').length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-blue-500">Próxima: 11:00</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              Citas de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={appointmentsData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="citas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Programadas" />
                <Bar dataKey="completadas" fill="#10b981" radius={[4, 4, 0, 0]} name="Completadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Tipo de Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {serviceTypeData.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Trend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="patientsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="pacientes" stroke="#ef4444" fill="url(#patientsGradient)" strokeWidth={2} name="Pacientes" />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} dot={false} name="Ingresos (€)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Calendar, label: 'Citas', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
          { icon: FileText, label: 'Expedientes', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { icon: Receipt, label: 'Facturación', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: PenTool, label: 'Consentimientos', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Eye, label: 'Trazabilidad', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-red-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Today's Schedule */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              Agenda de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((apt, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <span className="text-xl font-mono font-bold">{apt.time}</span>
                      <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium">{apt.patient}</p>
                      <p className="text-sm text-muted-foreground">{apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(apt.status)}
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
