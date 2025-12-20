import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, Folder, Clock, Receipt, FileText, 
  RefreshCw, Calendar, Euro, AlertTriangle, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const hoursData = [
  { month: 'Ene', hours: 120, billed: 95 },
  { month: 'Feb', hours: 145, billed: 130 },
  { month: 'Mar', hours: 132, billed: 118 },
  { month: 'Abr', hours: 168, billed: 145 },
  { month: 'May', hours: 155, billed: 140 },
  { month: 'Jun', hours: 149, billed: 135 },
];

const caseTypeData = [
  { name: 'Mercantil', value: 35, color: '#8b5cf6' },
  { name: 'Laboral', value: 25, color: '#3b82f6' },
  { name: 'Civil', value: 20, color: '#10b981' },
  { name: 'Fiscal', value: 15, color: '#f59e0b' },
  { name: 'Penal', value: 5, color: '#ef4444' },
];

const billingData = [
  { month: 'Ene', facturado: 12500, cobrado: 10800 },
  { month: 'Feb', facturado: 15200, cobrado: 13500 },
  { month: 'Mar', facturado: 14100, cobrado: 12900 },
  { month: 'Abr', facturado: 18500, cobrado: 16200 },
  { month: 'May', facturado: 16800, cobrado: 14500 },
  { month: 'Jun', facturado: 17200, cobrado: 15800 },
];

export const LegalDashboard: React.FC = () => {
  const cases = [
    { id: 'EXP-2024-001', client: 'Empresa ABC S.L.', type: 'Mercantil', status: 'active', hours: 45.5, pendingBilling: 4550, deadline: '2024-02-15' },
    { id: 'EXP-2024-002', client: 'García Hermanos', type: 'Laboral', status: 'active', hours: 23.0, pendingBilling: 2300, deadline: '2024-02-20' },
    { id: 'EXP-2024-003', client: 'Constructora Norte', type: 'Civil', status: 'pending_docs', hours: 12.5, pendingBilling: 1250, deadline: '2024-02-10' },
    { id: 'EXP-2024-004', client: 'Inversiones Sur', type: 'Fiscal', status: 'closed', hours: 68.0, pendingBilling: 0, deadline: null },
  ];

  const totalHours = cases.reduce((s, c) => s + c.hours, 0);
  const totalPending = cases.reduce((s, c) => s + c.pendingBilling, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Activo</Badge>;
      case 'pending_docs': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pte. Docs</Badge>;
      case 'closed': return <Badge variant="outline">Cerrado</Badge>;
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Scale className="h-6 w-6 text-white" />
            </div>
            Servicios Profesionales / Legal
          </h1>
          <p className="text-muted-foreground mt-1">Gestión de expedientes, timesheet y facturación</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
          <Folder className="h-4 w-4 mr-2" />
          Nuevo Expediente
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expedientes Activos</p>
                <p className="text-3xl font-bold mt-1">{cases.filter(c => c.status === 'active').length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+2 este mes</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Folder className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Este Mes</p>
                <p className="text-3xl font-bold mt-1">{totalHours}h</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">85% facturable</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Clock className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pte. Facturar</p>
                <p className="text-3xl font-bold mt-1">{totalPending.toLocaleString()} €</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-amber-500">3 expedientes</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Euro className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencimientos Próximos</p>
                <p className="text-3xl font-bold mt-1">3</p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">1 urgente</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-7 w-7 text-white" />
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
              <Clock className="h-5 w-5 text-violet-500" />
              Horas Trabajadas vs Facturadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hoursData}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fill="url(#hoursGradient)" strokeWidth={2} name="Trabajadas" />
                <Area type="monotone" dataKey="billed" stroke="#10b981" fill="url(#billedGradient)" strokeWidth={2} name="Facturadas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5 text-violet-500" />
              Por Tipo de Caso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={caseTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {caseTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {caseTypeData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Billing Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5 text-violet-500" />
              Facturación vs Cobros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={billingData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${value.toLocaleString()} €`}
                />
                <Bar dataKey="facturado" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Facturado" />
                <Bar dataKey="cobrado" fill="#10b981" radius={[4, 4, 0, 0]} name="Cobrado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Folder, label: 'Expedientes', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Clock, label: 'Timesheet', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { icon: Receipt, label: 'Facturación', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: FileText, label: 'Documentos', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: RefreshCw, label: 'Renovaciones', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-violet-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Active Cases */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-violet-500" />
              Expedientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cases.map((caseItem, index) => (
                <motion.div 
                  key={caseItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-colors">
                      <Folder className="h-6 w-6 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-medium">{caseItem.client}</p>
                      <p className="text-sm text-muted-foreground">{caseItem.id} · {caseItem.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">{caseItem.hours}h</p>
                      <p className="text-xs text-muted-foreground">{caseItem.pendingBilling.toLocaleString()} €</p>
                    </div>
                    {caseItem.deadline && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Vencimiento</p>
                        <p className="text-sm font-medium">{caseItem.deadline}</p>
                      </div>
                    )}
                    {getStatusBadge(caseItem.status)}
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
