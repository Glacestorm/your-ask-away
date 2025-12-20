import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Bell, Clock, Globe, Plus, ChevronLeft, ChevronRight, Search, User, Phone, Video, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const weeklyData = [
  { day: 'Lun', citas: 24, confirmadas: 22 },
  { day: 'Mar', citas: 28, confirmadas: 25 },
  { day: 'Mié', citas: 22, confirmadas: 20 },
  { day: 'Jue', citas: 30, confirmadas: 27 },
  { day: 'Vie', citas: 26, confirmadas: 24 },
];

const typeData = [
  { name: 'Consulta', value: 40, color: '#ef4444' },
  { name: 'Revisión', value: 25, color: '#3b82f6' },
  { name: 'Primera Visita', value: 20, color: '#10b981' },
  { name: 'Urgencia', value: 15, color: '#f59e0b' },
];

export const HealthcareAppointmentsModule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');

  const appointments = [
    { time: '09:00', patient: 'María García López', type: 'Consulta General', duration: 30, status: 'confirmed', phone: '+34 612 345 678' },
    { time: '09:30', patient: 'Juan Pérez Martín', type: 'Revisión', duration: 20, status: 'confirmed', phone: '+34 623 456 789' },
    { time: '10:00', patient: 'Ana Rodríguez Sanz', type: 'Primera Visita', duration: 45, status: 'pending', phone: '+34 634 567 890' },
    { time: '11:00', patient: 'Pedro Fernández Gil', type: 'Seguimiento', duration: 30, status: 'confirmed', phone: '+34 645 678 901' },
    { time: '12:00', patient: 'Laura Martínez Ruiz', type: 'Consulta General', duration: 30, status: 'confirmed', phone: '+34 656 789 012' },
    { time: '12:30', patient: 'Carlos López Díaz', type: 'Urgencia', duration: 15, status: 'waiting', phone: '+34 667 890 123' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Confirmada</Badge>;
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pendiente</Badge>;
      case 'waiting': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 animate-pulse">En Espera</Badge>;
      case 'cancelled': return <Badge variant="outline">Cancelada</Badge>;
      default: return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Citas</h2>
            <p className="text-muted-foreground">Agenda y recordatorios</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </motion.div>

      {/* Features */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Agenda Inteligente', desc: 'Optimización automática', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
          { icon: Bell, label: 'Recordatorios', desc: 'SMS y Email', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: Clock, label: 'Lista Espera', desc: 'Gestión automática', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { icon: Globe, label: 'Citas Online', desc: 'Portal pacientes', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
        ].map((feature, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="cursor-pointer hover:border-red-500/50 transition-all group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg ${feature.shadow}`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              Citas de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="citas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Programadas" />
                <Bar dataKey="confirmadas" fill="#10b981" radius={[4, 4, 0, 0]} name="Confirmadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {typeData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar View */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-500" />
                Lunes, 15 de Enero 2024
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">Hoy</Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 rounded-r-xl hover:from-red-500/20 transition-all cursor-pointer group"
                >
                  <div className="w-20 text-center">
                    <p className="font-mono font-bold text-xl">{apt.time}</p>
                    <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{apt.patient}</p>
                    <p className="text-sm text-muted-foreground">{apt.type}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                  {getStatusBadge(apt.status)}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Citas Hoy</p>
              <p className="text-2xl font-bold">{appointments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
              <p className="text-2xl font-bold">{appointments.filter(a => a.status === 'confirmed').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tiempo Total</p>
              <p className="text-2xl font-bold">{appointments.reduce((s, a) => s + a.duration, 0)} min</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
