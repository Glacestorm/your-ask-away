import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Clock, Euro, Users,
  TrendingUp, FileText, Calendar, Target, BarChart3, CheckCircle, Timer, FolderOpen
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const facturacionData = [
  { mes: 'Ene', facturado: 45000, cobrado: 42000 },
  { mes: 'Feb', facturado: 52000, cobrado: 48000 },
  { mes: 'Mar', facturado: 48000, cobrado: 46000 },
  { mes: 'Abr', facturado: 58000, cobrado: 52000 },
  { mes: 'May', facturado: 62000, cobrado: 58000 },
  { mes: 'Jun', facturado: 55000, cobrado: 52000 },
];

const serviciosData = [
  { name: 'Consultoría', value: 40, color: '#3b82f6' },
  { name: 'Desarrollo', value: 30, color: '#10b981' },
  { name: 'Formación', value: 15, color: '#f59e0b' },
  { name: 'Soporte', value: 15, color: '#8b5cf6' },
];

const horasData = [
  { dia: 'Lun', facturables: 32, internas: 8 },
  { dia: 'Mar', facturables: 35, internas: 5 },
  { dia: 'Mié', facturables: 28, internas: 12 },
  { dia: 'Jue', facturables: 38, internas: 6 },
  { dia: 'Vie', facturables: 30, internas: 10 },
];

export const ProfessionalServicesDashboard: React.FC = () => {
  const proyectos = [
    { id: 'PRY-001', nombre: 'Transformación Digital - Corp ABC', cliente: 'Corporación ABC', progreso: 75, horas: 320, presupuesto: 48000, estado: 'en_curso' },
    { id: 'PRY-002', nombre: 'Implementación ERP', cliente: 'Industrias XYZ', progreso: 45, horas: 180, presupuesto: 65000, estado: 'en_curso' },
    { id: 'PRY-003', nombre: 'Auditoría de Procesos', cliente: 'Banco Nacional', progreso: 90, horas: 85, presupuesto: 22000, estado: 'revision' },
    { id: 'PRY-004', nombre: 'Formación Ejecutiva', cliente: 'Grupo Hotelero', progreso: 100, horas: 40, presupuesto: 12000, estado: 'completado' },
    { id: 'PRY-005', nombre: 'Plan Estratégico 2025', cliente: 'Retail Plus', progreso: 20, horas: 45, presupuesto: 35000, estado: 'iniciando' },
  ];

  const tareasPendientes = [
    { tarea: 'Entrega informe final - Corp ABC', fecha: '2024-01-15', proyecto: 'PRY-001', prioridad: 'alta' },
    { tarea: 'Reunión kickoff - Retail Plus', fecha: '2024-01-16', proyecto: 'PRY-005', prioridad: 'media' },
    { tarea: 'Validación UAT - Industrias XYZ', fecha: '2024-01-18', proyecto: 'PRY-002', prioridad: 'alta' },
    { tarea: 'Facturación mensual', fecha: '2024-01-20', proyecto: '-', prioridad: 'media' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Completado</Badge>;
      case 'en_curso': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">En Curso</Badge>;
      case 'revision': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En Revisión</Badge>;
      case 'iniciando': return <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">Iniciando</Badge>;
      default: return null;
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Alta</Badge>;
      case 'media': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Media</Badge>;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/25">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            Servicios Profesionales
          </h1>
          <p className="text-muted-foreground mt-1">Gestión de proyectos - Consultoría y servicios</p>
        </div>
        <Button className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 shadow-lg shadow-slate-500/25">
          <FolderOpen className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-transparent border-slate-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <p className="text-3xl font-bold mt-1">12</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-slate-500" />
                  <span className="text-xs text-slate-500">5 en fase final</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/25">
                <FolderOpen className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturado (Mes)</p>
                <p className="text-3xl font-bold mt-1">62K€</p>
                <div className="flex items-center gap-1 mt-2">
                  <Euro className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+18% vs objetivo</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Euro className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Facturables</p>
                <p className="text-3xl font-bold mt-1">163</p>
                <div className="flex items-center gap-1 mt-2">
                  <Timer className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">Esta semana</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilización</p>
                <p className="text-3xl font-bold mt-1">82%</p>
                <div className="flex items-center gap-1 mt-2">
                  <Target className="h-3 w-3 text-violet-500" />
                  <span className="text-xs text-violet-500">Objetivo: 80%</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Target className="h-7 w-7 text-white" />
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
              <BarChart3 className="h-5 w-5 text-slate-500" />
              Horas por Día (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={horasData}>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="facturables" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Facturables" />
                <Bar dataKey="internas" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Internas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-500" />
              Por Tipo de Servicio
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

      {/* Facturación Trend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5 text-emerald-500" />
              Facturación vs Cobros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={facturacionData}>
                <defs>
                  <linearGradient id="facturadoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                  formatter={(value: number) => [`${value.toLocaleString()}€`, '']}
                />
                <Area type="monotone" dataKey="facturado" stroke="#3b82f6" fill="url(#facturadoGrad)" strokeWidth={2} name="Facturado" />
                <Area type="monotone" dataKey="cobrado" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Cobrado" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: FolderOpen, label: 'Proyectos', color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/25' },
          { icon: Clock, label: 'Timesheet', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/25' },
          { icon: FileText, label: 'Propuestas', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Euro, label: 'Facturación', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: Users, label: 'Equipo', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-slate-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Proyectos y Tareas */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-slate-500" />
              Proyectos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proyectos.map((pry, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center min-w-[60px]">
                      <span className="text-xs font-mono font-bold">{pry.id}</span>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${pry.progreso}%` }}
                        />
                      </div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{pry.nombre}</p>
                      <p className="text-xs text-muted-foreground">{pry.cliente} • {pry.horas}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium">{pry.presupuesto.toLocaleString()}€</span>
                    {getEstadoBadge(pry.estado)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-500" />
              Próximas Entregas
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
                    <p className="text-xs text-muted-foreground">{tarea.fecha} • {tarea.proyecto}</p>
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
