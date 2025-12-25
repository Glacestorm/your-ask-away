import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Landmark, FileText, Users, Clock,
  CheckCircle, AlertCircle, TrendingUp, BarChart3, Calendar, MessageSquare, Shield, Inbox
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const tramitesData = [
  { mes: 'Ene', recibidos: 450, resueltos: 420 },
  { mes: 'Feb', recibidos: 520, resueltos: 490 },
  { mes: 'Mar', recibidos: 480, resueltos: 465 },
  { mes: 'Abr', recibidos: 560, resueltos: 530 },
  { mes: 'May', recibidos: 610, resueltos: 580 },
  { mes: 'Jun', recibidos: 540, resueltos: 515 },
];

const tipoTramiteData = [
  { name: 'Licencias', value: 35, color: '#3b82f6' },
  { name: 'Urbanismo', value: 25, color: '#10b981' },
  { name: 'Tributos', value: 20, color: '#f59e0b' },
  { name: 'Registro', value: 12, color: '#8b5cf6' },
  { name: 'Otros', value: 8, color: '#6b7280' },
];

const satisfaccionData = [
  { dia: 'Lun', puntuacion: 4.2 },
  { dia: 'Mar', puntuacion: 4.5 },
  { dia: 'Mié', puntuacion: 4.1 },
  { dia: 'Jue', puntuacion: 4.6 },
  { dia: 'Vie', puntuacion: 4.3 },
];

export const GovernmentDashboard: React.FC = () => {
  const expedientes = [
    { id: 'EXP-2024-0156', asunto: 'Licencia de Obras Menores', ciudadano: 'María García López', estado: 'en_tramite', dias: 5, area: 'Urbanismo' },
    { id: 'EXP-2024-0157', asunto: 'Solicitud de Empadronamiento', ciudadano: 'Juan Pérez Martín', estado: 'resuelto', dias: 2, area: 'Registro' },
    { id: 'EXP-2024-0158', asunto: 'Recurso Tributos Locales', ciudadano: 'Ana Rodríguez Sanz', estado: 'pendiente', dias: 12, area: 'Tributos' },
    { id: 'EXP-2024-0159', asunto: 'Licencia Actividad', ciudadano: 'Empresa ABC S.L.', estado: 'en_tramite', dias: 18, area: 'Actividades' },
    { id: 'EXP-2024-0160', asunto: 'Bonificación IBI', ciudadano: 'Pedro Fernández', estado: 'pendiente_doc', dias: 8, area: 'Tributos' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'resuelto': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Resuelto</Badge>;
      case 'en_tramite': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">En Trámite</Badge>;
      case 'pendiente': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pendiente</Badge>;
      case 'pendiente_doc': return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">Pend. Doc.</Badge>;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            Administración Pública
          </h1>
          <p className="text-muted-foreground mt-1">Gestión ciudadana - Portal de servicios municipales</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-lg shadow-indigo-500/25">
          <FileText className="h-4 w-4 mr-2" />
          Nuevo Expediente
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expedientes Activos</p>
                <p className="text-3xl font-bold mt-1">156</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-indigo-500" />
                  <span className="text-xs text-indigo-500">+12 esta semana</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resueltos (Mes)</p>
                <p className="text-3xl font-bold mt-1">580</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">95% tasa resolución</span>
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
                <p className="text-sm text-muted-foreground">Tiempo Medio (días)</p>
                <p className="text-3xl font-bold mt-1">8.5</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-500">-2 días vs anterior</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
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
                <p className="text-sm text-muted-foreground">Satisfacción</p>
                <p className="text-3xl font-bold mt-1">4.5/5</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-violet-500">⭐ Excelente</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
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
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Trámites Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tramitesData}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="recibidos" fill="#6366f1" radius={[4, 4, 0, 0]} name="Recibidos" />
                <Bar dataKey="resueltos" fill="#10b981" radius={[4, 4, 0, 0]} name="Resueltos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="h-5 w-5 text-indigo-500" />
              Tipo de Trámite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={tipoTramiteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {tipoTramiteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {tipoTramiteData.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Satisfacción Trend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Satisfacción Ciudadana (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={satisfaccionData}>
                <defs>
                  <linearGradient id="satisfaccionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="puntuacion" stroke="#6366f1" fill="url(#satisfaccionGradient)" strokeWidth={2} name="Puntuación" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: FileText, label: 'Expedientes', color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/25' },
          { icon: Users, label: 'Ciudadanos', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: Inbox, label: 'Registro', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: Shield, label: 'Cumplimiento', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: MessageSquare, label: 'Atención', color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-indigo-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Expedientes Recientes */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Expedientes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expedientes.map((exp, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[100px]">
                      <span className="text-sm font-mono font-bold">{exp.id}</span>
                      <p className="text-xs text-muted-foreground">{exp.area}</p>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                      <p className="font-medium">{exp.asunto}</p>
                      <p className="text-sm text-muted-foreground">{exp.ciudadano}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{exp.dias} días</p>
                    </div>
                    {getEstadoBadge(exp.estado)}
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
