import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductionOrder {
  id: string;
  product: string;
  productCode: string;
  quantity: number;
  completed: number;
  status: 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  dueDate: string;
  assignedTo: string;
  machine: string;
  lotNumber: string;
  notes?: string;
}

const productionOrders: ProductionOrder[] = [
  {
    id: 'OP-2024-001',
    product: 'Máquina Ensambladora A-100',
    productCode: 'PROD-001',
    quantity: 5,
    completed: 3,
    status: 'in_progress',
    priority: 'high',
    startDate: '2024-02-01',
    dueDate: '2024-02-15',
    assignedTo: 'Carlos García',
    machine: 'Centro Mecanizado',
    lotNumber: 'LOT-2024-0234',
  },
  {
    id: 'OP-2024-002',
    product: 'Panel de Control',
    productCode: 'ASM-002',
    quantity: 20,
    completed: 20,
    status: 'completed',
    priority: 'medium',
    startDate: '2024-01-25',
    dueDate: '2024-02-05',
    assignedTo: 'María López',
    machine: 'Línea Ensamblaje 1',
    lotNumber: 'LOT-2024-0233',
  },
  {
    id: 'OP-2024-003',
    product: 'Módulo Motor Principal',
    productCode: 'ASM-001',
    quantity: 15,
    completed: 8,
    status: 'in_progress',
    priority: 'urgent',
    startDate: '2024-02-03',
    dueDate: '2024-02-10',
    assignedTo: 'Pedro Martínez',
    machine: 'CNC Fresadora 1',
    lotNumber: 'LOT-2024-0235',
    notes: 'Prioridad cliente VIP'
  },
  {
    id: 'OP-2024-004',
    product: 'Estructura Base',
    productCode: 'ASM-003',
    quantity: 10,
    completed: 0,
    status: 'planned',
    priority: 'medium',
    startDate: '2024-02-12',
    dueDate: '2024-02-22',
    assignedTo: 'Ana Sánchez',
    machine: 'Robot Soldadura',
    lotNumber: 'LOT-2024-0236',
  },
  {
    id: 'OP-2024-005',
    product: 'Robot Paletizador B-200',
    productCode: 'PROD-002',
    quantity: 2,
    completed: 1,
    status: 'paused',
    priority: 'low',
    startDate: '2024-01-28',
    dueDate: '2024-02-20',
    assignedTo: 'Luis Fernández',
    machine: 'Centro Mecanizado',
    lotNumber: 'LOT-2024-0232',
    notes: 'Esperando componentes'
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { 
        label: 'Completada', 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2
      };
    case 'in_progress':
      return { 
        label: 'En Proceso', 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: PlayCircle
      };
    case 'paused':
      return { 
        label: 'Pausada', 
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: PauseCircle
      };
    case 'planned':
      return { 
        label: 'Planificada', 
        color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        icon: Clock
      };
    case 'cancelled':
      return { 
        label: 'Cancelada', 
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertTriangle
      };
    default:
      return { 
        label: status, 
        color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        icon: Clock
      };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgente', color: 'bg-red-500 text-white' };
    case 'high':
      return { label: 'Alta', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'medium':
      return { label: 'Media', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'low':
      return { label: 'Baja', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    default:
      return { label: priority, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  }
};

export const ManufacturingOrdersModule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = productionOrders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.lotNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Órdenes', value: productionOrders.length, color: 'text-white' },
    { label: 'En Proceso', value: productionOrders.filter(o => o.status === 'in_progress').length, color: 'text-blue-400' },
    { label: 'Completadas', value: productionOrders.filter(o => o.status === 'completed').length, color: 'text-emerald-400' },
    { label: 'Planificadas', value: productionOrders.filter(o => o.status === 'planned').length, color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-400" />
            Órdenes de Producción
          </h1>
          <p className="text-slate-400 mt-1">Gestión y seguimiento de órdenes de fabricación</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
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
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por ID, producto o lote..."
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
              <SelectItem value="in_progress">En Proceso</SelectItem>
              <SelectItem value="planned">Planificadas</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => {
          const statusConfig = getStatusConfig(order.status);
          const priorityConfig = getPriorityConfig(order.priority);
          const progress = (order.completed / order.quantity) * 100;
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        order.status === 'in_progress' ? 'bg-blue-500/20' :
                        order.status === 'completed' ? 'bg-emerald-500/20' :
                        order.status === 'paused' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                      }`}>
                        <StatusIcon className={`w-6 h-6 ${
                          order.status === 'in_progress' ? 'text-blue-400' :
                          order.status === 'completed' ? 'text-emerald-400' :
                          order.status === 'paused' ? 'text-amber-400' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-slate-500">{order.id}</span>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-white">{order.product}</h3>
                        <p className="text-sm text-slate-400">Código: {order.productCode} • Lote: {order.lotNumber}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-300">Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300">Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300">Pausar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">Cancelar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Progreso</span>
                      <span className="text-white font-medium">{order.completed} / {order.quantity} unidades ({progress.toFixed(0)}%)</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Fecha Inicio</p>
                        <p className="text-sm text-white">{order.startDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Fecha Entrega</p>
                        <p className="text-sm text-white">{order.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Asignado a</p>
                        <p className="text-sm text-white">{order.assignedTo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">Máquina</p>
                        <p className="text-sm text-white">{order.machine}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm text-amber-400">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {order.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ManufacturingOrdersModule;
