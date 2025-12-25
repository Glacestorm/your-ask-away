import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, MapPin, Key, Euro,
  TrendingUp, Users, Calendar, FileText, Eye, Home, BarChart3, Calculator
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const ventasData = [
  { mes: 'Ene', ventas: 12, alquileres: 28 },
  { mes: 'Feb', ventas: 15, alquileres: 32 },
  { mes: 'Mar', ventas: 18, alquileres: 35 },
  { mes: 'Abr', ventas: 14, alquileres: 30 },
  { mes: 'May', ventas: 22, alquileres: 38 },
  { mes: 'Jun', ventas: 19, alquileres: 42 },
];

const tipoInmuebleData = [
  { name: 'Pisos', value: 45, color: '#3b82f6' },
  { name: 'Casas', value: 25, color: '#10b981' },
  { name: 'Locales', value: 15, color: '#f59e0b' },
  { name: 'Oficinas', value: 10, color: '#8b5cf6' },
  { name: 'Otros', value: 5, color: '#6b7280' },
];

const ingresosData = [
  { mes: 'Ene', ingresos: 85000 },
  { mes: 'Feb', ingresos: 92000 },
  { mes: 'Mar', ingresos: 105000 },
  { mes: 'Abr', ingresos: 88000 },
  { mes: 'May', ingresos: 125000 },
  { mes: 'Jun', ingresos: 115000 },
];

export const RealEstateDashboard: React.FC = () => {
  const propiedades = [
    { id: 'INM-001', direccion: 'C/ Gran Vía 45, 3ºA', tipo: 'Piso', precio: 285000, estado: 'disponible', m2: 95, habitaciones: 3 },
    { id: 'INM-002', direccion: 'Av. Diagonal 120', tipo: 'Local', precio: 1200, estado: 'alquilado', m2: 150, esAlquiler: true },
    { id: 'INM-003', direccion: 'C/ Serrano 88, 5º', tipo: 'Oficina', precio: 3500, estado: 'reservado', m2: 120, esAlquiler: true },
    { id: 'INM-004', direccion: 'Urb. Las Lomas 23', tipo: 'Casa', precio: 450000, estado: 'disponible', m2: 220, habitaciones: 5 },
    { id: 'INM-005', direccion: 'C/ Mayor 12, 2ºB', tipo: 'Piso', precio: 198000, estado: 'vendido', m2: 75, habitaciones: 2 },
  ];

  const visitas = [
    { hora: '10:00', propiedad: 'C/ Gran Vía 45', cliente: 'María García', tipo: 'Primera visita' },
    { hora: '11:30', propiedad: 'Urb. Las Lomas 23', cliente: 'Carlos López', tipo: 'Segunda visita' },
    { hora: '16:00', propiedad: 'C/ Serrano 88', cliente: 'Empresa XYZ', tipo: 'Negociación' },
    { hora: '18:00', propiedad: 'C/ Mayor 12', cliente: 'Ana Rodríguez', tipo: 'Primera visita' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Disponible</Badge>;
      case 'reservado': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Reservado</Badge>;
      case 'alquilado': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Alquilado</Badge>;
      case 'vendido': return <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">Vendido</Badge>;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            Inmobiliaria
          </h1>
          <p className="text-muted-foreground mt-1">Gestión de propiedades - Ventas y alquileres</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25">
          <Home className="h-4 w-4 mr-2" />
          Nueva Propiedad
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Propiedades Activas</p>
                <p className="text-3xl font-bold mt-1">248</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-cyan-500" />
                  <span className="text-xs text-cyan-500">+15 este mes</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Building2 className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas (Mes)</p>
                <p className="text-3xl font-bold mt-1">19</p>
                <div className="flex items-center gap-1 mt-2">
                  <Euro className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">4.2M€ facturado</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Key className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alquileres Activos</p>
                <p className="text-3xl font-bold mt-1">142</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-amber-500">85K€/mes recurrente</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visitas Programadas</p>
                <p className="text-3xl font-bold mt-1">28</p>
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="h-3 w-3 text-violet-500" />
                  <span className="text-xs text-violet-500">Esta semana</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Eye className="h-7 w-7 text-white" />
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
              <BarChart3 className="h-5 w-5 text-cyan-500" />
              Operaciones Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventasData}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="ventas" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Ventas" />
                <Bar dataKey="alquileres" fill="#10b981" radius={[4, 4, 0, 0]} name="Alquileres" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-500" />
              Tipo de Inmueble
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={tipoInmuebleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tipoInmuebleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {tipoInmuebleData.slice(0, 4).map((item, i) => (
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
              <Euro className="h-5 w-5 text-cyan-500" />
              Facturación Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={ingresosData}>
                <defs>
                  <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="ingresos" stroke="#06b6d4" fill="url(#ingresosGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Building2, label: 'Propiedades', color: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/25' },
          { icon: Users, label: 'Clientes', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: Calendar, label: 'Visitas', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Calculator, label: 'Valoraciones', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: FileText, label: 'Contratos', color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-cyan-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Propiedades y Visitas */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-500" />
              Propiedades Destacadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {propiedades.map((prop, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <span className="text-xs font-mono font-bold">{prop.id}</span>
                      <p className="text-xs text-muted-foreground">{prop.tipo}</p>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium text-sm">{prop.direccion}</p>
                      <p className="text-xs text-muted-foreground">{prop.m2}m² {prop.habitaciones ? `• ${prop.habitaciones} hab.` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-sm">{prop.precio.toLocaleString()}{prop.esAlquiler ? '€/mes' : '€'}</p>
                    </div>
                    {getEstadoBadge(prop.estado)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-500" />
              Visitas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visitas.map((visita, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="text-lg font-mono font-bold">{visita.hora}</span>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium text-sm">{visita.propiedad}</p>
                      <p className="text-xs text-muted-foreground">{visita.cliente}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{visita.tipo}</Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
