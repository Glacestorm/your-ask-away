import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Plus,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Download,
  Mail,
  CreditCard,
  RefreshCcw,
  FileText,
  Euro
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface Donation {
  id: string;
  donor: string;
  email: string;
  amount: number;
  date: string;
  type: 'one_time' | 'recurring';
  method: 'card' | 'transfer' | 'cash' | 'paypal';
  campaign?: string;
  certificateIssued: boolean;
  status: 'completed' | 'pending' | 'failed';
}

interface Campaign {
  id: string;
  name: string;
  goal: number;
  raised: number;
  donors: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
}

const donations: Donation[] = [
  { id: 'DON-001', donor: 'Empresa ABC S.L.', email: 'donaciones@empresaabc.com', amount: 5000, date: '2024-02-08', type: 'one_time', method: 'transfer', campaign: 'Navidad Solidaria', certificateIssued: true, status: 'completed' },
  { id: 'DON-002', donor: 'María García', email: 'maria@email.com', amount: 50, date: '2024-02-07', type: 'recurring', method: 'card', certificateIssued: false, status: 'completed' },
  { id: 'DON-003', donor: 'Fundación XYZ', email: 'contacto@fundacionxyz.org', amount: 10000, date: '2024-02-05', type: 'one_time', method: 'transfer', campaign: 'Becas 2024', certificateIssued: true, status: 'completed' },
  { id: 'DON-004', donor: 'Juan Pérez', email: 'juan@email.com', amount: 25, date: '2024-02-04', type: 'recurring', method: 'paypal', certificateIssued: false, status: 'completed' },
  { id: 'DON-005', donor: 'Carlos López', email: 'carlos@email.com', amount: 100, date: '2024-02-03', type: 'one_time', method: 'card', certificateIssued: false, status: 'completed' },
  { id: 'DON-006', donor: 'Ana Martínez', email: 'ana@email.com', amount: 75, date: '2024-02-02', type: 'recurring', method: 'card', certificateIssued: false, status: 'pending' },
];

const campaigns: Campaign[] = [
  { id: 'CAM-001', name: 'Becas 2024', goal: 50000, raised: 35000, donors: 156, startDate: '2024-01-01', endDate: '2024-06-30', status: 'active' },
  { id: 'CAM-002', name: 'Navidad Solidaria', goal: 20000, raised: 22500, donors: 312, startDate: '2023-11-15', endDate: '2024-01-15', status: 'completed' },
  { id: 'CAM-003', name: 'Vuelta al Cole', goal: 15000, raised: 0, donors: 0, startDate: '2024-08-01', endDate: '2024-09-30', status: 'upcoming' },
];

const monthlyData = [
  { month: 'Sep', amount: 12500, donors: 45 },
  { month: 'Oct', amount: 15200, donors: 52 },
  { month: 'Nov', amount: 18900, donors: 78 },
  { month: 'Dic', amount: 28500, donors: 145 },
  { month: 'Ene', amount: 14200, donors: 62 },
  { month: 'Feb', amount: 12450, donors: 48 },
];

const getMethodIcon = (method: string) => {
  switch (method) {
    case 'card': return <CreditCard className="w-4 h-4 text-blue-400" />;
    case 'transfer': return <Euro className="w-4 h-4 text-emerald-400" />;
    case 'paypal': return <CreditCard className="w-4 h-4 text-indigo-400" />;
    case 'cash': return <Euro className="w-4 h-4 text-amber-400" />;
    default: return <Euro className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completado</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendiente</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fallido</Badge>;
    case 'active':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Activa</Badge>;
    case 'upcoming':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Próxima</Badge>;
    default:
      return null;
  }
};

export const EducationDonationsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('donations');
  const [searchTerm, setSearchTerm] = useState('');

  const totalRaised = donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
  const recurringDonors = donations.filter(d => d.type === 'recurring').length;
  const pendingCertificates = donations.filter(d => !d.certificateIssued && d.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-400" />
            Gestión de Donaciones
          </h1>
          <p className="text-slate-400 mt-1">Control de donaciones, campañas y certificados fiscales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-300">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Donación
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-pink-500/20">
                <Euro className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">€{totalRaised.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Recaudado (mes)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{donations.length}</p>
                <p className="text-sm text-slate-400">Donantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <RefreshCcw className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{recurringDonors}</p>
                <p className="text-sm text-slate-400">Recurrentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{pendingCertificates}</p>
                <p className="text-sm text-slate-400">Certificados pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="donations">Donaciones</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="space-y-6">
          {/* Search */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar donante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Donations Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Donante</TableHead>
                    <TableHead className="text-slate-400">Importe</TableHead>
                    <TableHead className="text-slate-400">Fecha</TableHead>
                    <TableHead className="text-slate-400">Tipo</TableHead>
                    <TableHead className="text-slate-400">Método</TableHead>
                    <TableHead className="text-slate-400">Campaña</TableHead>
                    <TableHead className="text-slate-400">Certificado</TableHead>
                    <TableHead className="text-slate-400">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{donation.donor}</p>
                          <p className="text-xs text-slate-500">{donation.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-bold">€{donation.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-300">{donation.date}</TableCell>
                      <TableCell>
                        {donation.type === 'recurring' ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <RefreshCcw className="w-3 h-3 mr-1" />
                            Recurrente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-600 text-slate-400">Único</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(donation.method)}
                          <span className="text-slate-300 capitalize">{donation.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">{donation.campaign || '-'}</TableCell>
                      <TableCell>
                        {donation.certificateIssued ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Emitido</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-xs">
                            Generar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(donation.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-400">Recaudado</span>
                          <span className="text-white">€{campaign.raised.toLocaleString()} / €{campaign.goal.toLocaleString()}</span>
                        </div>
                        <Progress value={(campaign.raised / campaign.goal) * 100} className="h-3" />
                        <p className="text-right text-sm text-emerald-400 mt-1">
                          {((campaign.raised / campaign.goal) * 100).toFixed(0)}%
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-400">{campaign.donors}</p>
                          <p className="text-xs text-slate-500">Donantes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-purple-400">
                            €{campaign.donors > 0 ? Math.round(campaign.raised / campaign.donors) : 0}
                          </p>
                          <p className="text-xs text-slate-500">Media</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
                        <span><Calendar className="w-4 h-4 inline mr-1" />{campaign.startDate}</span>
                        <span>→</span>
                        <span>{campaign.endDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Evolución de Donaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Recaudado']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#ec4899" 
                    fill="#ec489920"
                    name="Recaudado" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Donantes por Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="donors" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Métricas Clave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Donación media</span>
                  <span className="text-xl font-bold text-emerald-400">€{Math.round(totalRaised / donations.length)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Tasa de conversión</span>
                  <span className="text-xl font-bold text-blue-400">12.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">Retención donantes</span>
                  <span className="text-xl font-bold text-purple-400">78%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationDonationsModule;
