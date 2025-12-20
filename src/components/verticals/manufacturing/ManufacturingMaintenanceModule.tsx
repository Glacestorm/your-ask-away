import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Settings,
  History,
  Bell,
  Filter,
  Search
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

interface MaintenanceTask {
  id: string;
  machine: string;
  machineCode: string;
  type: 'preventive' | 'corrective' | 'predictive';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  completedDate?: string;
  assignedTo: string;
  estimatedHours: number;
  actualHours?: number;
  notes?: string;
}

interface MaintenanceAlert {
  id: string;
  machine: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

const maintenanceTasks: MaintenanceTask[] = [
  {
    id: 'MT-001',
    machine: 'CNC Fresadora 1',
    machineCode: 'M-001',
    type: 'preventive',
    description: 'Cambio de aceite y filtros',
    status: 'pending',
    priority: 'medium',
    scheduledDate: '2024-02-12',
    assignedTo: 'Juan Técnico',
    estimatedHours: 2,
  },
  {
    id: 'MT-002',
    machine: 'Torno CNC 1',
    machineCode: 'M-003',
    type: 'corrective',
    description: 'Reparación de husillo principal',
    status: 'in_progress',
    priority: 'critical',
    scheduledDate: '2024-02-08',
    assignedTo: 'Pedro Mecánico',
    estimatedHours: 8,
    notes: 'Husillo dañado, requiere recambio'
  },
  {
    id: 'MT-003',
    machine: 'Centro Mecanizado',
    machineCode: 'M-004',
    type: 'preventive',
    description: 'Calibración de ejes',
    status: 'completed',
    priority: 'high',
    scheduledDate: '2024-02-05',
    completedDate: '2024-02-05',
    assignedTo: 'María Técnico',
    estimatedHours: 4,
    actualHours: 3.5,
  },
  {
    id: 'MT-004',
    machine: 'Robot Soldadura',
    machineCode: 'M-006',
    type: 'predictive',
    description: 'Revisión preventiva detectada por sensores',
    status: 'pending',
    priority: 'medium',
    scheduledDate: '2024-02-15',
    assignedTo: 'Luis Técnico',
    estimatedHours: 3,
    notes: 'Vibraciones anómalas detectadas'
  },
  {
    id: 'MT-005',
    machine: 'Prensa Hidráulica',
    machineCode: 'M-005',
    type: 'preventive',
    description: 'Inspección de cilindros hidráulicos',
    status: 'overdue',
    priority: 'high',
    scheduledDate: '2024-02-01',
    assignedTo: 'Carlos Mecánico',
    estimatedHours: 4,
  },
];

const maintenanceAlerts: MaintenanceAlert[] = [
  {
    id: 'ALT-001',
    machine: 'CNC Fresadora 2',
    type: 'warning',
    message: 'Próximo mantenimiento preventivo en 48 horas',
    timestamp: '2024-02-08 10:30',
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    machine: 'Torno CNC 1',
    type: 'critical',
    message: 'Máquina detenida - Mantenimiento correctivo en curso',
    timestamp: '2024-02-08 08:15',
    acknowledged: true,
  },
  {
    id: 'ALT-003',
    machine: 'Robot Soldadura',
    type: 'warning',
    message: 'Vibraciones por encima del umbral normal detectadas',
    timestamp: '2024-02-08 09:45',
    acknowledged: false,
  },
  {
    id: 'ALT-004',
    machine: 'Prensa Hidráulica',
    type: 'critical',
    message: 'Mantenimiento preventivo vencido hace 7 días',
    timestamp: '2024-02-07 14:00',
    acknowledged: false,
  },
];

const maintenanceHistory = [
  { date: '2024-02-05', machine: 'Centro Mecanizado', type: 'Preventivo', duration: '3.5h', cost: 450, technician: 'María Técnico' },
  { date: '2024-02-03', machine: 'CNC Fresadora 1', type: 'Correctivo', duration: '6h', cost: 1200, technician: 'Pedro Mecánico' },
  { date: '2024-01-28', machine: 'Robot Soldadura', type: 'Preventivo', duration: '2h', cost: 300, technician: 'Juan Técnico' },
  { date: '2024-01-25', machine: 'Torno CNC 1', type: 'Preventivo', duration: '4h', cost: 520, technician: 'Luis Técnico' },
  { date: '2024-01-20', machine: 'Prensa Hidráulica', type: 'Predictivo', duration: '3h', cost: 380, technician: 'Carlos Mecánico' },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: 'Completado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
    case 'in_progress':
      return { label: 'En Curso', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Settings };
    case 'pending':
      return { label: 'Pendiente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock };
    case 'overdue':
      return { label: 'Vencido', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle };
    default:
      return { label: status, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Clock };
  }
};

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'preventive':
      return { label: 'Preventivo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'corrective':
      return { label: 'Correctivo', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    case 'predictive':
      return { label: 'Predictivo', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    default:
      return { label: type, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical':
      return { label: 'Crítica', color: 'bg-red-500 text-white' };
    case 'high':
      return { label: 'Alta', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'medium':
      return { label: 'Media', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    case 'low':
      return { label: 'Baja', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    default:
      return { label: priority, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'critical': return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'info': return <Bell className="w-5 h-5 text-blue-400" />;
    default: return <Bell className="w-5 h-5 text-slate-400" />;
  }
};

export const ManufacturingMaintenanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = maintenanceTasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = 
      task.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Pendientes', value: maintenanceTasks.filter(t => t.status === 'pending').length, color: 'text-amber-400', icon: Clock },
    { label: 'En Curso', value: maintenanceTasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-400', icon: Settings },
    { label: 'Vencidos', value: maintenanceTasks.filter(t => t.status === 'overdue').length, color: 'text-red-400', icon: AlertTriangle },
    { label: 'Completados (mes)', value: maintenanceTasks.filter(t => t.status === 'completed').length, color: 'text-emerald-400', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wrench className="w-8 h-8 text-amber-400" />
            Mantenimiento
          </h1>
          <p className="text-slate-400 mt-1">Gestión de mantenimiento preventivo, correctivo y predictivo</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea
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
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {maintenanceAlerts.filter(a => !a.acknowledged && a.type !== 'info').length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" />
              Alertas Activas ({maintenanceAlerts.filter(a => !a.acknowledged).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {maintenanceAlerts.filter(a => !a.acknowledged).slice(0, 3).map((alert) => (
              <div 
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  alert.type === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="text-white font-medium">{alert.machine}</p>
                    <p className="text-sm text-slate-400">{alert.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{alert.timestamp}</span>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Reconocer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar máquina o tarea..."
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
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="in_progress">En Curso</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task, index) => {
              const statusConfig = getStatusConfig(task.status);
              const typeConfig = getTypeConfig(task.type);
              const priorityConfig = getPriorityConfig(task.priority);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors ${
                    task.status === 'overdue' ? 'border-red-500/50' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            task.type === 'corrective' ? 'bg-red-500/20' :
                            task.type === 'predictive' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                          }`}>
                            <Wrench className={`w-6 h-6 ${
                              task.type === 'corrective' ? 'text-red-400' :
                              task.type === 'predictive' ? 'text-purple-400' : 'text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono text-slate-500">{task.id}</span>
                              <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                              <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-white">{task.machine}</h3>
                            <p className="text-sm text-slate-400">{task.description}</p>
                          </div>
                        </div>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-500">Programado</p>
                            <p className="text-sm text-white">{task.scheduledDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-500">Horas Est.</p>
                            <p className="text-sm text-white">{task.estimatedHours}h</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-500">Técnico</p>
                            <p className="text-sm text-white">{task.assignedTo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs text-slate-500">Máquina</p>
                            <p className="text-sm text-white">{task.machineCode}</p>
                          </div>
                        </div>
                      </div>

                      {task.notes && (
                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-sm text-amber-400">
                            <AlertTriangle className="w-4 h-4 inline mr-2" />
                            {task.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Calendario de Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Vista de calendario próximamente</p>
                <p className="text-sm">Visualiza todas las tareas programadas en un calendario interactivo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Historial de Intervenciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceHistory.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.machine}</p>
                        <p className="text-sm text-slate-400">{item.type} • {item.technician}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <p className="text-white">{item.duration}</p>
                        <p className="text-xs text-slate-500">Duración</p>
                      </div>
                      <div>
                        <p className="text-emerald-400 font-medium">€{item.cost}</p>
                        <p className="text-xs text-slate-500">Coste</p>
                      </div>
                      <div>
                        <p className="text-slate-400">{item.date}</p>
                        <p className="text-xs text-slate-500">Fecha</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManufacturingMaintenanceModule;
