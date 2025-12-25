import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UtensilsCrossed, Calendar, Users, Euro,
  TrendingUp, Star, Clock, ChefHat, Bed, Wine, BarChart3, Coffee
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const ocupacionData = [
  { dia: 'Lun', ocupacion: 65, reservas: 42 },
  { dia: 'Mar', ocupacion: 72, reservas: 48 },
  { dia: 'Mié', ocupacion: 68, reservas: 45 },
  { dia: 'Jue', ocupacion: 78, reservas: 52 },
  { dia: 'Vie', ocupacion: 92, reservas: 68 },
  { dia: 'Sáb', ocupacion: 98, reservas: 75 },
  { dia: 'Dom', ocupacion: 85, reservas: 58 },
];

const serviciosData = [
  { name: 'Restaurante', value: 45, color: '#f59e0b' },
  { name: 'Habitaciones', value: 30, color: '#3b82f6' },
  { name: 'Bar/Cafetería', value: 15, color: '#8b5cf6' },
  { name: 'Eventos', value: 10, color: '#10b981' },
];

const ingresosData = [
  { mes: 'Ene', ingresos: 125000 },
  { mes: 'Feb', ingresos: 135000 },
  { mes: 'Mar', ingresos: 142000 },
  { mes: 'Abr', ingresos: 138000 },
  { mes: 'May', ingresos: 165000 },
  { mes: 'Jun', ingresos: 185000 },
];

export const HospitalityDashboard: React.FC = () => {
  const reservasHoy = [
    { hora: '12:00', cliente: 'Mesa 5 - García', personas: 4, tipo: 'Almuerzo', estado: 'confirmada' },
    { hora: '13:30', cliente: 'Mesa 12 - Empresa ABC', personas: 8, tipo: 'Almuerzo Trabajo', estado: 'confirmada' },
    { hora: '14:00', cliente: 'Mesa 3 - López', personas: 2, tipo: 'Almuerzo', estado: 'pendiente' },
    { hora: '20:00', cliente: 'Salón Privado - Boda', personas: 45, tipo: 'Evento', estado: 'confirmada' },
    { hora: '21:00', cliente: 'Mesa 8 - Martínez', personas: 6, tipo: 'Cena', estado: 'confirmada' },
  ];

  const habitaciones = [
    { numero: '101', tipo: 'Suite', estado: 'ocupada', huesped: 'Sr. García', checkout: 'Mañana' },
    { numero: '102', tipo: 'Doble', estado: 'disponible', huesped: '-', checkout: '-' },
    { numero: '103', tipo: 'Individual', estado: 'ocupada', huesped: 'Sra. López', checkout: 'Hoy' },
    { numero: '201', tipo: 'Suite Premium', estado: 'limpieza', huesped: '-', checkout: '-' },
    { numero: '202', tipo: 'Doble', estado: 'ocupada', huesped: 'Familia Pérez', checkout: '3 días' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Confirmada</Badge>;
      case 'pendiente': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pendiente</Badge>;
      case 'ocupada': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Ocupada</Badge>;
      case 'disponible': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Disponible</Badge>;
      case 'limpieza': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Limpieza</Badge>;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            Hostelería
          </h1>
          <p className="text-muted-foreground mt-1">Gestión hotelera y restauración - Reservas y servicios</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25">
          <Calendar className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación Hoy</p>
                <p className="text-3xl font-bold mt-1">92%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500">+8% vs semana ant.</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Bed className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas Hoy</p>
                <p className="text-3xl font-bold mt-1">68</p>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">185 comensales</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturación Hoy</p>
                <p className="text-3xl font-bold mt-1">8.5K€</p>
                <div className="flex items-center gap-1 mt-2">
                  <Euro className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-500">+12% vs objetivo</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Euro className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valoración Media</p>
                <p className="text-3xl font-bold mt-1">4.8</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-3 w-3 text-violet-500 fill-violet-500" />
                  <span className="text-xs text-violet-500">125 reseñas</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Star className="h-7 w-7 text-white" />
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
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Ocupación Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ocupacionData}>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="ocupacion" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Ocupación %" />
                <Bar dataKey="reservas" fill="#10b981" radius={[4, 4, 0, 0]} name="Reservas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              Ingresos por Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={serviciosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {serviciosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {serviciosData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ingresos Trend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5 text-orange-500" />
              Facturación Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ingresosData}>
                <defs>
                  <linearGradient id="hospitalityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v/1000}K`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()}€`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#f59e0b" fill="url(#hospitalityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Calendar, label: 'Reservas', color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/25' },
          { icon: Bed, label: 'Habitaciones', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/25' },
          { icon: ChefHat, label: 'Cocina', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: Wine, label: 'Bar', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Coffee, label: 'Eventos', color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-orange-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Reservas y Habitaciones */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Reservas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservasHoy.map((reserva, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="text-lg font-mono font-bold">{reserva.hora}</span>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium text-sm">{reserva.cliente}</p>
                      <p className="text-xs text-muted-foreground">{reserva.tipo} • {reserva.personas} pers.</p>
                    </div>
                  </div>
                  {getEstadoBadge(reserva.estado)}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-orange-500" />
              Estado Habitaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitaciones.map((hab, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="text-lg font-mono font-bold">{hab.numero}</span>
                      <p className="text-xs text-muted-foreground">{hab.tipo}</p>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium text-sm">{hab.huesped}</p>
                      {hab.checkout !== '-' && <p className="text-xs text-muted-foreground">Checkout: {hab.checkout}</p>}
                    </div>
                  </div>
                  {getEstadoBadge(hab.estado)}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
