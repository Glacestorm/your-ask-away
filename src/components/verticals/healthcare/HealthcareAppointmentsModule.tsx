import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Calendar, Clock, Users, Phone, Plus, CheckCircle, XCircle, 
  AlertCircle, ChevronLeft, ChevronRight, Stethoscope, Activity,
  Search, User, FileText, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

const weeklyData = [
  { day: 'Lun', citas: 24, completadas: 22 },
  { day: 'Mar', citas: 28, completadas: 25 },
  { day: 'Mié', citas: 20, completadas: 20 },
  { day: 'Jue', citas: 32, completadas: 28 },
  { day: 'Vie', citas: 26, completadas: 24 },
  { day: 'Sáb', citas: 12, completadas: 11 },
];

const typeData = [
  { name: 'Consulta General', value: 40, color: '#3b82f6' },
  { name: 'Especialista', value: 25, color: '#10b981' },
  { name: 'Urgencia', value: 15, color: '#ef4444' },
  { name: 'Revisión', value: 20, color: '#8b5cf6' },
];

const hourlyDistribution = [
  { hour: '08:00', citas: 8 },
  { hour: '09:00', citas: 12 },
  { hour: '10:00', citas: 15 },
  { hour: '11:00', citas: 14 },
  { hour: '12:00', citas: 10 },
  { hour: '13:00', citas: 6 },
  { hour: '16:00', citas: 11 },
  { hour: '17:00', citas: 13 },
  { hour: '18:00', citas: 9 },
  { hour: '19:00', citas: 5 },
];

const doctorPerformance = [
  { name: 'Dr. García', citas: 45, satisfaccion: 4.8 },
  { name: 'Dra. López', citas: 52, satisfaccion: 4.9 },
  { name: 'Dr. Martínez', citas: 38, satisfaccion: 4.7 },
  { name: 'Dra. Sánchez', citas: 41, satisfaccion: 4.6 },
];

export const HealthcareAppointmentsModule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [activeTab, setActiveTab] = useState('agenda');
  const [searchTerm, setSearchTerm] = useState('');

  const appointments = [
    { id: '1', time: '09:00', patient: 'María García López', type: 'Consulta General', duration: 30, status: 'confirmed', doctor: 'Dr. García', phone: '+34 612 345 678', notes: 'Primera visita' },
    { id: '2', time: '09:30', patient: 'Juan Pérez Ruiz', type: 'Revisión', duration: 20, status: 'waiting', doctor: 'Dra. López', phone: '+34 623 456 789', notes: 'Control mensual' },
    { id: '3', time: '10:00', patient: 'Ana Martínez Soto', type: 'Especialista', duration: 45, status: 'in_progress', doctor: 'Dr. Martínez', phone: '+34 634 567 890', notes: 'Derivación cardiología' },
    { id: '4', time: '10:45', patient: 'Carlos López Vega', type: 'Urgencia', duration: 30, status: 'pending', doctor: 'Dra. Sánchez', phone: '+34 645 678 901', notes: 'Dolor agudo' },
    { id: '5', time: '11:15', patient: 'Laura Fernández', type: 'Consulta General', duration: 30, status: 'confirmed', doctor: 'Dr. García', phone: '+34 656 789 012', notes: 'Seguimiento tratamiento' },
    { id: '6', time: '11:45', patient: 'Pedro Sánchez Gil', type: 'Revisión', duration: 20, status: 'cancelled', doctor: 'Dra. López', phone: '+34 667 890 123', notes: 'Cancelada por paciente' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" />Confirmada</Badge>;
      case 'waiting': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />En Espera</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><Activity className="h-3 w-3 mr-1" />En Curso</Badge>;
      case 'pending': return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30"><AlertCircle className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'Consulta General': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      'Especialista': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
      'Urgencia': 'bg-red-500/20 text-red-500 border-red-500/30',
      'Revisión': 'bg-violet-500/20 text-violet-500 border-violet-500/30'
    };
    return <Badge className={colors[type] || 'bg-muted'}>{type}</Badge>;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayStats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'in_progress').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Citas Médicas</h2>
            <p className="text-muted-foreground">Gestión de agenda y pacientes</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border-teal-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citas Hoy</p>
                <p className="text-3xl font-bold">{todayStats.total}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+15% vs ayer</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-3xl font-bold">{todayStats.confirmed}</p>
                <span className="text-xs text-muted-foreground">{Math.round(todayStats.confirmed / todayStats.total * 100)}% del total</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Curso</p>
                <p className="text-3xl font-bold">{todayStats.completed}</p>
                <span className="text-xs text-blue-500">Actualmente</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-3xl font-bold">{todayStats.cancelled}</p>
                <span className="text-xs text-red-500">Requiere seguimiento</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          <TabsTrigger value="medicos">Médicos</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4 mt-4">
          {/* Date Navigation */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedDate}</p>
              </div>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente o médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Appointments List */}
          <motion.div variants={itemVariants} className="space-y-3">
            {filteredAppointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-teal-500/50 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold text-teal-500">{apt.time}</p>
                        <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                      </div>
                      
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center group-hover:from-teal-500/30 group-hover:to-emerald-500/30 transition-colors">
                        <User className="h-6 w-6 text-teal-500" />
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium">{apt.patient}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Stethoscope className="h-3 w-3" />
                          <span>{apt.doctor}</span>
                          <span>·</span>
                          <Phone className="h-3 w-3" />
                          <span>{apt.phone}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getTypeBadge(apt.type)}
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>
                    {apt.notes && (
                      <div className="mt-3 pl-[76px] flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{apt.notes}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4 mt-4">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-teal-500" />
                  Citas por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="citas" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Programadas" />
                    <Bar dataKey="completadas" fill="#10b981" radius={[4, 4, 0, 0]} name="Completadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-500" />
                  Distribución Horaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={hourlyDistribution}>
                    <defs>
                      <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="citas" stroke="#14b8a6" fill="url(#hourlyGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-teal-500" />
                  Por Tipo de Consulta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="40%" height={200}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {typeData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="medicos" className="mt-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-500" />
                  Rendimiento por Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctorPerformance.map((doctor, index) => (
                    <motion.div
                      key={doctor.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-medium">
                          {doctor.name.split(' ')[0][0]}{doctor.name.split(' ')[1][0]}
                        </div>
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.citas} citas este mes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Satisfacción</p>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-amber-500">{doctor.satisfaccion}</span>
                            <span className="text-sm text-muted-foreground">/ 5</span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Alto
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
