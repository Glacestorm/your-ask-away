import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  FileCheck, FileText, QrCode, Shield, 
  CheckCircle, AlertTriangle, Settings, RefreshCw,
  TrendingUp, Calendar, Clock, ArrowUpRight,
  Eye, Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const invoicesByMonth = [
  { month: 'Sep', facturas: 890, validadas: 885 },
  { month: 'Oct', facturas: 1020, validadas: 1015 },
  { month: 'Nov', facturas: 1150, validadas: 1142 },
  { month: 'Dic', facturas: 1380, validadas: 1370 },
  { month: 'Ene', facturas: 1247, validadas: 1238 },
  { month: 'Feb', facturas: 1180, validadas: 1175 },
];

const validationRate = [
  { day: 'Lun', tasa: 99.2 },
  { day: 'Mar', tasa: 98.8 },
  { day: 'Mié', tasa: 99.5 },
  { day: 'Jue', tasa: 99.1 },
  { day: 'Vie', tasa: 98.9 },
  { day: 'Sáb', tasa: 99.7 },
  { day: 'Dom', tasa: 100 },
];

const statusDistribution = [
  { name: 'Validadas', value: 94, color: '#10b981' },
  { name: 'Pendientes', value: 4, color: '#f59e0b' },
  { name: 'Error', value: 2, color: '#ef4444' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const RetailFiscalModule: React.FC = () => {
  const [ticketbaiEnabled, setTicketbaiEnabled] = useState(true);
  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const recentInvoices = [
    { id: 'TB-2024-001234', date: '2024-01-15 14:32', amount: 45.50, status: 'validated', type: 'ticketbai' },
    { id: 'TB-2024-001233', date: '2024-01-15 14:15', amount: 23.80, status: 'validated', type: 'ticketbai' },
    { id: 'TB-2024-001232', date: '2024-01-15 13:45', amount: 156.00, status: 'pending', type: 'ticketbai' },
    { id: 'TB-2024-001231', date: '2024-01-15 12:30', amount: 89.90, status: 'error', type: 'ticketbai' },
    { id: 'TB-2024-001230', date: '2024-01-15 11:20', amount: 34.50, status: 'validated', type: 'ticketbai' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle className="h-3 w-3" /> Validado</Badge>;
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><RefreshCw className="h-3 w-3" /> Pendiente</Badge>;
      case 'error': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>;
      default: return null;
    }
  };

  const stats = [
    { label: 'Facturas Hoy', value: '47', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/20', change: '+12%' },
    { label: 'Tasa Validación', value: '98.5%', icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', change: '+0.3%' },
    { label: 'QR Generados', value: '47', icon: QrCode, color: 'text-purple-400', bgColor: 'bg-purple-500/20', change: '+12' },
    { label: 'Pendientes', value: '3', icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/20', change: '-2' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            Adaptación Fiscal
          </h2>
          <p className="text-slate-400 mt-1">TicketBAI, VeriFactu y cumplimiento normativo</p>
        </div>
        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Button>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <Card className={`bg-slate-800/50 border-2 ${ticketbaiEnabled ? 'border-emerald-500/50' : 'border-slate-700'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileCheck className="h-5 w-5 text-emerald-400" />
                  TicketBAI
                </CardTitle>
                <Switch
                  checked={ticketbaiEnabled}
                  onCheckedChange={setTicketbaiEnabled}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-4">
                Sistema de facturación obligatorio para el País Vasco
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Estado</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Activo</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Certificado</span>
                  <span className="text-emerald-400">✓ Válido hasta 2025</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Hacienda Foral</span>
                  <span className="text-white">Bizkaia</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Facturas hoy</span>
                  <span className="font-medium text-white">47</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card className={`bg-slate-800/50 border-2 ${verifactuEnabled ? 'border-blue-500/50' : 'border-slate-700'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  VeriFactu
                </CardTitle>
                <Switch
                  checked={verifactuEnabled}
                  onCheckedChange={setVerifactuEnabled}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-4">
                Sistema de facturación electrónica de la AEAT (España)
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Estado</span>
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Desactivado</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Certificado</span>
                  <span className="text-slate-500">No configurado</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Obligatorio desde</span>
                  <span className="text-white">Julio 2025</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2 border-slate-600 text-slate-300 hover:bg-slate-700">
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Facturas por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={invoicesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="facturas" fill="#3b82f6" name="Emitidas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validadas" fill="#10b981" name="Validadas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Estado de Validación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-400">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Facturas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/50">
                      <th className="text-left p-4 font-medium text-slate-400">ID Factura</th>
                      <th className="text-left p-4 font-medium text-slate-400">Fecha/Hora</th>
                      <th className="text-left p-4 font-medium text-slate-400">Importe</th>
                      <th className="text-left p-4 font-medium text-slate-400">Sistema</th>
                      <th className="text-left p-4 font-medium text-slate-400">Estado</th>
                      <th className="text-left p-4 font-medium text-slate-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice, index) => (
                      <motion.tr 
                        key={invoice.id} 
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4 font-mono text-sm text-white">{invoice.id}</td>
                        <td className="p-4 text-sm text-slate-400">{invoice.date}</td>
                        <td className="p-4 font-medium text-white">{invoice.amount.toFixed(2)} €</td>
                        <td className="p-4">
                          <Badge variant="outline" className="uppercase text-xs border-slate-600 text-slate-300">
                            {invoice.type}
                          </Badge>
                        </td>
                        <td className="p-4">{getStatusBadge(invoice.status)}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Tasa de Validación Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={validationRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[95, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasa" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                    name="Tasa de Validación %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-emerald-400">98.5%</p>
                <p className="text-sm text-slate-400">Tasa de Éxito</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">1,247</p>
                <p className="text-sm text-slate-400">Facturas Este Mes</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-amber-400">3</p>
                <p className="text-sm text-slate-400">Pendientes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RetailFiscalModule;
