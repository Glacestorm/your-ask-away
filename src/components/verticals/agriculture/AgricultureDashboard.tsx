import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, MapPin, Droplets, Sun, 
  Thermometer, Wind, Calendar, Package, TrendingUp, AlertTriangle, CheckCircle, BarChart3
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const cosechasData = [
  { mes: 'Ene', produccion: 0, objetivo: 0 },
  { mes: 'Feb', produccion: 0, objetivo: 0 },
  { mes: 'Mar', produccion: 120, objetivo: 100 },
  { mes: 'Abr', produccion: 280, objetivo: 250 },
  { mes: 'May', produccion: 450, objetivo: 400 },
  { mes: 'Jun', produccion: 380, objetivo: 350 },
];

const cultivosData = [
  { name: 'Olivos', value: 45, color: '#84cc16' },
  { name: 'Viñedos', value: 25, color: '#8b5cf6' },
  { name: 'Cereales', value: 20, color: '#f59e0b' },
  { name: 'Hortalizas', value: 10, color: '#10b981' },
];

const riegoData = [
  { dia: 'Lun', litros: 12500, programado: 12000 },
  { dia: 'Mar', litros: 11800, programado: 12000 },
  { dia: 'Mié', litros: 13200, programado: 12000 },
  { dia: 'Jue', litros: 11500, programado: 12000 },
  { dia: 'Vie', litros: 12800, programado: 12000 },
  { dia: 'Sáb', litros: 10200, programado: 10000 },
  { dia: 'Dom', litros: 8500, programado: 8000 },
];

export const AgricultureDashboard: React.FC = () => {
  const parcelas = [
    { id: 'P-001', nombre: 'Finca Norte', cultivo: 'Olivos', hectareas: 25, estado: 'healthy', humedad: 68, temperatura: 24 },
    { id: 'P-002', nombre: 'Viñedo Principal', cultivo: 'Viñedos', hectareas: 15, estado: 'warning', humedad: 42, temperatura: 28 },
    { id: 'P-003', nombre: 'Campo Sur', cultivo: 'Cereales', hectareas: 40, estado: 'healthy', humedad: 55, temperatura: 26 },
    { id: 'P-004', nombre: 'Huerta Este', cultivo: 'Hortalizas', hectareas: 8, estado: 'critical', humedad: 35, temperatura: 30 },
  ];

  const tareasPendientes = [
    { id: 1, tarea: 'Tratamiento fitosanitario - Viñedo', fecha: '2024-01-15', prioridad: 'alta' },
    { id: 2, tarea: 'Revisión sistema de riego - P-004', fecha: '2024-01-16', prioridad: 'urgente' },
    { id: 3, tarea: 'Poda olivos - Sector A', fecha: '2024-01-18', prioridad: 'media' },
    { id: 4, tarea: 'Análisis de suelo - Campo Sur', fecha: '2024-01-20', prioridad: 'baja' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'healthy': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Óptimo</Badge>;
      case 'warning': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Atención</Badge>;
      case 'critical': return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Crítico</Badge>;
      default: return null;
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Urgente</Badge>;
      case 'alta': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Alta</Badge>;
      case 'media': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Media</Badge>;
      case 'baja': return <Badge variant="outline">Baja</Badge>;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-lg shadow-lime-500/25">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            Agricultura
          </h1>
          <p className="text-muted-foreground mt-1">Gestión agrícola integral - Cuaderno de campo digital</p>
        </div>
        <Button className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 shadow-lg shadow-lime-500/25">
          <MapPin className="h-4 w-4 mr-2" />
          Nueva Parcela
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-lime-500/10 via-lime-500/5 to-transparent border-lime-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hectáreas Totales</p>
                <p className="text-3xl font-bold mt-1">88</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-lime-500" />
                  <span className="text-xs text-lime-500">4 parcelas activas</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-lg shadow-lime-500/25">
                <MapPin className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumo Agua (L)</p>
                <p className="text-3xl font-bold mt-1">80.5K</p>
                <div className="flex items-center gap-1 mt-2">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">-5% vs semana ant.</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Droplets className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temperatura Media</p>
                <p className="text-3xl font-bold mt-1">26°C</p>
                <div className="flex items-center gap-1 mt-2">
                  <Sun className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-500">Óptima para cultivo</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Thermometer className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Producción (Tn)</p>
                <p className="text-3xl font-bold mt-1">1,230</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+12% vs objetivo</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Package className="h-7 w-7 text-white" />
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
              <Droplets className="h-5 w-5 text-blue-500" />
              Consumo de Riego Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riegoData}>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="litros" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Consumo Real" />
                <Bar dataKey="programado" fill="#10b981" radius={[4, 4, 0, 0]} name="Programado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-lime-500" />
              Distribución Cultivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={cultivosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {cultivosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {cultivosData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Producción Mensual */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lime-500" />
              Producción Mensual (Toneladas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cosechasData}>
                <defs>
                  <linearGradient id="produccionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="produccion" stroke="#84cc16" fill="url(#produccionGradient)" strokeWidth={2} name="Producción" />
                <Line type="monotone" dataKey="objetivo" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Objetivo" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: MapPin, label: 'Parcelas', color: 'from-lime-500 to-green-600', shadow: 'shadow-lime-500/25' },
          { icon: Droplets, label: 'Riego', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/25' },
          { icon: Calendar, label: 'Cuaderno', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Package, label: 'Inventario', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: BarChart3, label: 'Cosechas', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-lime-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Parcelas y Tareas */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-lime-500" />
              Estado de Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parcelas.map((parcela, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="text-sm font-mono font-bold">{parcela.id}</span>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium">{parcela.nombre}</p>
                      <p className="text-sm text-muted-foreground">{parcela.cultivo} • {parcela.hectareas} ha</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <p>💧 {parcela.humedad}%</p>
                      <p>🌡️ {parcela.temperatura}°C</p>
                    </div>
                    {getEstadoBadge(parcela.estado)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lime-500" />
              Tareas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tareasPendientes.map((tarea, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-sm">{tarea.tarea}</p>
                    <p className="text-xs text-muted-foreground">{tarea.fecha}</p>
                  </div>
                  {getPrioridadBadge(tarea.prioridad)}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
