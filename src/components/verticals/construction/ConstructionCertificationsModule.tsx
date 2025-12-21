import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCheck, Ruler, CheckCircle, History, 
  Plus, Download, Send, Clock, Search, Filter,
  TrendingUp, Euro, AlertCircle, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AreaChart,
  Area
} from 'recharts';

interface Certification {
  id: string;
  project: string;
  projectId: string;
  month: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'paid';
  submittedDate?: string;
  approvedDate?: string;
  paidDate?: string;
  items: number;
}

const certifications: Certification[] = [
  { 
    id: 'CERT-2024-001', 
    project: 'Edificio Aurora', 
    projectId: 'PRJ-001',
    month: 'Enero 2024', 
    amount: 156000, 
    status: 'paid', 
    submittedDate: '2024-01-31', 
    approvedDate: '2024-02-05',
    paidDate: '2024-02-15',
    items: 24
  },
  { 
    id: 'CERT-2024-002', 
    project: 'Centro Comercial Plaza Mayor', 
    projectId: 'PRJ-002',
    month: 'Enero 2024', 
    amount: 320000, 
    status: 'approved', 
    submittedDate: '2024-01-31', 
    approvedDate: '2024-02-08',
    items: 45
  },
  { 
    id: 'CERT-2024-003', 
    project: 'Nave Industrial P-47', 
    projectId: 'PRJ-003',
    month: 'Enero 2024', 
    amount: 60000, 
    status: 'pending', 
    submittedDate: '2024-01-31',
    items: 12
  },
  { 
    id: 'CERT-2024-004', 
    project: 'Edificio Aurora', 
    projectId: 'PRJ-001',
    month: 'Febrero 2024', 
    amount: 142000, 
    status: 'draft',
    items: 18
  },
  { 
    id: 'CERT-2024-005', 
    project: 'Rehabilitación Fachada', 
    projectId: 'PRJ-004',
    month: 'Febrero 2024', 
    amount: 45000, 
    status: 'draft',
    items: 8
  },
];

const monthlyCertifications = [
  { month: 'Sep', certificado: 280000, cobrado: 280000 },
  { month: 'Oct', certificado: 340000, cobrado: 340000 },
  { month: 'Nov', certificado: 420000, cobrado: 380000 },
  { month: 'Dic', certificado: 380000, cobrado: 320000 },
  { month: 'Ene', certificado: 536000, cobrado: 156000 },
  { month: 'Feb', certificado: 187000, cobrado: 0 },
];

const certificationsByProject = [
  { project: 'Aurora', total: 298000 },
  { project: 'Plaza Mayor', total: 320000 },
  { project: 'Nave P-47', total: 60000 },
  { project: 'Fachada', total: 45000 },
];

const getStatusBadge = (status: Certification['status']) => {
  switch (status) {
    case 'draft': 
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><Clock className="h-3 w-3 mr-1" /> Borrador</Badge>;
    case 'pending': 
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Send className="h-3 w-3 mr-1" /> Pendiente DF</Badge>;
    case 'approved': 
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Aprobada</Badge>;
    case 'paid': 
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Pagada</Badge>;
  }
};

export const ConstructionCertificationsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('certifications');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCertifications = certifications.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = 
      c.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPending = certifications
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0);

  const totalDraft = certifications
    .filter(c => c.status === 'draft')
    .reduce((s, c) => s + c.amount, 0);

  const stats = [
    { label: 'Total Certificaciones', value: certifications.length, icon: FileCheck, color: 'text-orange-400' },
    { label: 'Pendientes Cobro', value: `${(totalPending / 1000).toFixed(0)}k €`, icon: Clock, color: 'text-amber-400' },
    { label: 'Aprobadas', value: certifications.filter(c => c.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'En Borrador', value: `${(totalDraft / 1000).toFixed(0)}k €`, icon: History, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-orange-400" />
            Certificaciones
          </h1>
          <p className="text-slate-400 mt-1">Certificaciones mensuales de obra ejecutada</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-700/50">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar certificación o proyecto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] bg-slate-900 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Certifications List */}
          <div className="space-y-4">
            {filteredCertifications.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          cert.status === 'paid' ? 'bg-blue-500/20' :
                          cert.status === 'approved' ? 'bg-emerald-500/20' :
                          cert.status === 'pending' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                        }`}>
                          <FileCheck className={`w-6 h-6 ${
                            cert.status === 'paid' ? 'text-blue-400' :
                            cert.status === 'approved' ? 'text-emerald-400' :
                            cert.status === 'pending' ? 'text-amber-400' : 'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-slate-500">{cert.id}</span>
                            {getStatusBadge(cert.status)}
                          </div>
                          <h3 className="text-lg font-semibold text-white">{cert.project}</h3>
                          <p className="text-sm text-slate-400">{cert.month} • {cert.items} partidas</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{cert.amount.toLocaleString()} €</p>
                          {cert.submittedDate && (
                            <p className="text-sm text-slate-400">Enviada: {cert.submittedDate}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Ruler className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Download className="h-4 w-4" />
                          </Button>
                          {cert.status === 'draft' && (
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-400">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Certificado vs Cobrado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyCertifications}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `${value.toLocaleString()} €`}
                    />
                    <Bar dataKey="certificado" fill="#f59e0b" name="Certificado" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cobrado" fill="#10b981" name="Cobrado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Euro className="w-5 h-5 text-blue-400" />
                  Total por Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={certificationsByProject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `${v/1000}k`} />
                    <YAxis dataKey="project" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `${value.toLocaleString()} €`}
                    />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Evolución de Cobros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyCertifications}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${value.toLocaleString()} €`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="certificado" 
                    stroke="#f59e0b" 
                    fill="#f59e0b20" 
                    name="Certificado"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cobrado" 
                    stroke="#10b981" 
                    fill="#10b98120"
                    name="Cobrado" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pending Alert */}
          {totalPending > 0 && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-white font-medium">Certificaciones pendientes de cobro</p>
                  <p className="text-amber-400">Total: {totalPending.toLocaleString()} € en {certifications.filter(c => c.status === 'pending' || c.status === 'approved').length} certificaciones</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConstructionCertificationsModule;
