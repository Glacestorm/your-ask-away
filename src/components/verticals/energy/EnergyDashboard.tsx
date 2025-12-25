import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Sun, Wind, Droplets,
  TrendingUp, TrendingDown, Gauge, BarChart3, Leaf, Battery, Activity, AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const consumoData = [
  { hora: '00:00', consumo: 120, produccion: 0 },
  { hora: '04:00', consumo: 85, produccion: 0 },
  { hora: '08:00', consumo: 180, produccion: 45 },
  { hora: '12:00', consumo: 220, produccion: 280 },
  { hora: '16:00', consumo: 195, produccion: 180 },
  { hora: '20:00', consumo: 165, produccion: 20 },
];

const fuentesData = [
  { name: 'Solar', value: 45, color: '#f59e0b' },
  { name: 'Eólica', value: 25, color: '#3b82f6' },
  { name: 'Hidráulica', value: 15, color: '#06b6d4' },
  { name: 'Red', value: 15, color: '#6b7280' },
];

const emisionesData = [
  { mes: 'Ene', emisiones: 12.5, ahorro: 8.2 },
  { mes: 'Feb', emisiones: 11.8, ahorro: 9.1 },
  { mes: 'Mar', emisiones: 10.2, ahorro: 10.5 },
  { mes: 'Abr', emisiones: 9.5, ahorro: 11.2 },
  { mes: 'May', emisiones: 8.8, ahorro: 12.8 },
  { mes: 'Jun', emisiones: 7.5, ahorro: 14.2 },
];

export const EnergyDashboard: React.FC = () => {
  const instalaciones = [
    { id: 'INS-001', nombre: 'Planta Solar Norte', tipo: 'Solar', capacidad: '500 kW', produccion: 425, estado: 'operativa', eficiencia: 85 },
    { id: 'INS-002', nombre: 'Parque Eólico Este', tipo: 'Eólica', capacidad: '2 MW', produccion: 1650, estado: 'operativa', eficiencia: 82 },
    { id: 'INS-003', nombre: 'Minicentral Hidro', tipo: 'Hidráulica', capacidad: '150 kW', produccion: 120, estado: 'mantenimiento', eficiencia: 0 },
    { id: 'INS-004', nombre: 'Tejado Solar HQ', tipo: 'Solar', capacidad: '75 kW', produccion: 68, estado: 'operativa', eficiencia: 91 },
  ];

  const alertas = [
    { tipo: 'warning', mensaje: 'Rendimiento bajo en Panel A12 - Planta Norte', hora: '10:32' },
    { tipo: 'info', mensaje: 'Mantenimiento programado completado - Inversor 3', hora: '09:15' },
    { tipo: 'critical', mensaje: 'Minicentral Hidro fuera de línea - Revisión requerida', hora: '08:45' },
    { tipo: 'success', mensaje: 'Nuevo récord de producción solar alcanzado', hora: '12:00' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'operativa': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Operativa</Badge>;
      case 'mantenimiento': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Mantenimiento</Badge>;
      case 'offline': return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Offline</Badge>;
      default: return null;
    }
  };

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-green-600 flex items-center justify-center shadow-lg shadow-yellow-500/25">
              <Zap className="h-6 w-6 text-white" />
            </div>
            Energía
          </h1>
          <p className="text-muted-foreground mt-1">Gestión energética - Renovables y eficiencia</p>
        </div>
        <Button className="bg-gradient-to-r from-yellow-500 to-green-600 hover:from-yellow-600 hover:to-green-700 shadow-lg shadow-yellow-500/25">
          <BarChart3 className="h-4 w-4 mr-2" />
          Informe Energético
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Producción Hoy</p>
                <p className="text-3xl font-bold mt-1">2.26 MW</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">+15% vs ayer</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <Sun className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumo Actual</p>
                <p className="text-3xl font-bold mt-1">1.85 MW</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">-8% vs media</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Gauge className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CO₂ Evitado (Mes)</p>
                <p className="text-3xl font-bold mt-1">14.2 Tn</p>
                <div className="flex items-center gap-1 mt-2">
                  <Leaf className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">Huella reducida</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Leaf className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Autoconsumo</p>
                <p className="text-3xl font-bold mt-1">85%</p>
                <div className="flex items-center gap-1 mt-2">
                  <Battery className="h-3 w-3 text-violet-500" />
                  <span className="text-xs text-violet-500">15% exportado</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Battery className="h-7 w-7 text-white" />
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
              <Activity className="h-5 w-5 text-yellow-500" />
              Producción vs Consumo (Hoy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={consumoData}>
                <defs>
                  <linearGradient id="produccionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="consumoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="produccion" stroke="#f59e0b" fill="url(#produccionGrad)" strokeWidth={2} name="Producción (kW)" />
                <Area type="monotone" dataKey="consumo" stroke="#3b82f6" fill="url(#consumoGrad)" strokeWidth={2} name="Consumo (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Mix Energético
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={fuentesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {fuentesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {fuentesData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Emisiones Trend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" />
              Emisiones vs Ahorro CO₂ (Toneladas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={emisionesData}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="emisiones" fill="#ef4444" radius={[4, 4, 0, 0]} name="Emisiones" />
                <Bar dataKey="ahorro" fill="#10b981" radius={[4, 4, 0, 0]} name="CO₂ Evitado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Sun, label: 'Solar', color: 'from-yellow-500 to-amber-600', shadow: 'shadow-yellow-500/25' },
          { icon: Wind, label: 'Eólica', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/25' },
          { icon: Droplets, label: 'Hidráulica', color: 'from-cyan-500 to-teal-600', shadow: 'shadow-cyan-500/25' },
          { icon: Gauge, label: 'Consumos', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Leaf, label: 'Certificados', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-yellow-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Instalaciones y Alertas */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Instalaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {instalaciones.map((inst, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <span className="text-xs font-mono font-bold">{inst.id}</span>
                      <p className="text-xs text-muted-foreground">{inst.tipo}</p>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium text-sm">{inst.nombre}</p>
                      <p className="text-xs text-muted-foreground">{inst.capacidad} • {inst.produccion} kW actual</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {inst.eficiencia > 0 && (
                      <span className="text-xs font-medium text-emerald-500">{inst.eficiencia}%</span>
                    )}
                    {getEstadoBadge(inst.estado)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas y Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertas.map((alerta, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer"
                >
                  {getAlertIcon(alerta.tipo)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alerta.mensaje}</p>
                    <p className="text-xs text-muted-foreground">{alerta.hora}</p>
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
