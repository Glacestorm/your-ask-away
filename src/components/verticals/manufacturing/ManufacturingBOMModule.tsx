import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  ChevronRight, 
  ChevronDown,
  Package,
  DollarSign,
  Clock,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface BOMItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  type: 'raw' | 'component' | 'assembly';
  children?: BOMItem[];
}

// Sample BOM data - hierarchical structure
const bomData: BOMItem[] = [
  {
    id: '1',
    code: 'PROD-001',
    name: 'Máquina Ensambladora A-100',
    quantity: 1,
    unit: 'ud',
    unitCost: 15000,
    type: 'assembly',
    children: [
      {
        id: '1.1',
        code: 'ASM-001',
        name: 'Módulo Motor Principal',
        quantity: 1,
        unit: 'ud',
        unitCost: 4500,
        type: 'assembly',
        children: [
          { id: '1.1.1', code: 'MOT-001', name: 'Motor Eléctrico 1.5kW', quantity: 1, unit: 'ud', unitCost: 850, type: 'component' },
          { id: '1.1.2', code: 'ROD-001', name: 'Rodamiento SKF 6205', quantity: 4, unit: 'ud', unitCost: 25, type: 'component' },
          { id: '1.1.3', code: 'ACE-001', name: 'Acero Inoxidable 304', quantity: 15, unit: 'kg', unitCost: 12, type: 'raw' },
          { id: '1.1.4', code: 'TOR-001', name: 'Tornillos M8x25', quantity: 24, unit: 'ud', unitCost: 0.35, type: 'raw' },
        ]
      },
      {
        id: '1.2',
        code: 'ASM-002',
        name: 'Panel de Control',
        quantity: 1,
        unit: 'ud',
        unitCost: 2800,
        type: 'assembly',
        children: [
          { id: '1.2.1', code: 'PLC-001', name: 'PLC Siemens S7-1200', quantity: 1, unit: 'ud', unitCost: 1200, type: 'component' },
          { id: '1.2.2', code: 'HMI-001', name: 'Pantalla HMI 7"', quantity: 1, unit: 'ud', unitCost: 650, type: 'component' },
          { id: '1.2.3', code: 'CAB-001', name: 'Cable Eléctrico 2.5mm²', quantity: 25, unit: 'm', unitCost: 2.5, type: 'raw' },
          { id: '1.2.4', code: 'CON-001', name: 'Conectores Industriales', quantity: 8, unit: 'ud', unitCost: 18, type: 'component' },
        ]
      },
      {
        id: '1.3',
        code: 'ASM-003',
        name: 'Estructura Base',
        quantity: 1,
        unit: 'ud',
        unitCost: 3200,
        type: 'assembly',
        children: [
          { id: '1.3.1', code: 'ALU-001', name: 'Aluminio 6061-T6', quantity: 45, unit: 'kg', unitCost: 8, type: 'raw' },
          { id: '1.3.2', code: 'ACE-002', name: 'Perfiles Acero', quantity: 12, unit: 'm', unitCost: 25, type: 'raw' },
          { id: '1.3.3', code: 'TOR-002', name: 'Tornillos M10x40', quantity: 48, unit: 'ud', unitCost: 0.55, type: 'raw' },
          { id: '1.3.4', code: 'RUE-001', name: 'Ruedas Industriales', quantity: 4, unit: 'ud', unitCost: 45, type: 'component' },
        ]
      },
    ]
  }
];

const products = [
  { code: 'PROD-001', name: 'Máquina Ensambladora A-100', totalCost: 15000, components: 16, leadTime: '15 días' },
  { code: 'PROD-002', name: 'Robot Paletizador B-200', totalCost: 28500, components: 24, leadTime: '20 días' },
  { code: 'PROD-003', name: 'Cinta Transportadora C-300', totalCost: 8200, components: 12, leadTime: '10 días' },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'assembly': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'component': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'raw': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'assembly': return 'Ensamble';
    case 'component': return 'Componente';
    case 'raw': return 'Materia Prima';
    default: return type;
  }
};

interface BOMTreeItemProps {
  item: BOMItem;
  level: number;
}

const BOMTreeItem: React.FC<BOMTreeItemProps> = ({ item, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = item.children && item.children.length > 0;
  const totalCost = item.quantity * item.unitCost;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
          flex items-center gap-3 p-3 rounded-lg border border-transparent
          hover:bg-slate-700/30 hover:border-slate-600 transition-all cursor-pointer
        `}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse */}
        <div className="w-5 h-5 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <div className="w-2 h-2 rounded-full bg-slate-600" />
          )}
        </div>

        {/* Icon based on type */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          item.type === 'assembly' ? 'bg-purple-500/20' :
          item.type === 'component' ? 'bg-blue-500/20' : 'bg-amber-500/20'
        }`}>
          <Layers className={`w-4 h-4 ${
            item.type === 'assembly' ? 'text-purple-400' :
            item.type === 'component' ? 'text-blue-400' : 'text-amber-400'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{item.code}</span>
            <Badge className={getTypeColor(item.type)} variant="outline">
              {getTypeLabel(item.type)}
            </Badge>
          </div>
          <p className="text-white font-medium truncate">{item.name}</p>
        </div>

        {/* Quantity */}
        <div className="text-right">
          <p className="text-white font-medium">{item.quantity} {item.unit}</p>
          <p className="text-xs text-slate-400">× €{item.unitCost.toFixed(2)}</p>
        </div>

        {/* Total Cost */}
        <div className="w-24 text-right">
          <p className="text-emerald-400 font-semibold">€{totalCost.toLocaleString()}</p>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children?.map((child) => (
              <BOMTreeItem key={child.id} item={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ManufacturingBOMModule: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState('PROD-001');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-400" />
            Listas de Materiales (BOM)
          </h1>
          <p className="text-slate-400 mt-1">Gestión de estructura de productos multinivel</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo BOM
        </Button>
      </div>

      {/* Product Selection */}
      <div className="grid lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <motion.div
            key={product.code}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedProduct(product.code)}
          >
            <Card className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-all ${
              selectedProduct === product.code ? 'border-purple-500 ring-1 ring-purple-500/30' : 'hover:border-slate-600'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-500">{product.code}</span>
                    <h3 className="text-white font-medium">{product.name}</h3>
                  </div>
                  {selectedProduct === product.code && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Seleccionado
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-white font-semibold">€{product.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Coste Total</p>
                  </div>
                  <div>
                    <Package className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-white font-semibold">{product.components}</p>
                    <p className="text-xs text-slate-400">Componentes</p>
                  </div>
                  <div>
                    <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-white font-semibold">{product.leadTime}</p>
                    <p className="text-xs text-slate-400">Lead Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* BOM Tree */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Estructura del Producto
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar componente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-600 text-white w-64"
              />
            </div>
            <Button variant="outline" size="icon" className="border-slate-600 text-slate-300">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-slate-600 text-slate-300">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700">
            <span className="text-sm text-slate-400">Leyenda:</span>
            <Badge className={getTypeColor('assembly')} variant="outline">Ensamble</Badge>
            <Badge className={getTypeColor('component')} variant="outline">Componente</Badge>
            <Badge className={getTypeColor('raw')} variant="outline">Materia Prima</Badge>
          </div>

          {/* Tree Structure */}
          <div className="space-y-1">
            {bomData.map((item) => (
              <BOMTreeItem key={item.id} item={item} level={0} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Desglose de Costes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Materias Primas</span>
                <span className="text-white font-medium">€2,450</span>
              </div>
              <Progress value={16} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Componentes</span>
                <span className="text-white font-medium">€5,890</span>
              </div>
              <Progress value={39} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ensamblajes</span>
                <span className="text-white font-medium">€6,660</span>
              </div>
              <Progress value={44} className="h-2" />
            </div>
            <div className="pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Coste Total</span>
                <span className="text-emerald-400 font-bold text-xl">€15,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Resumen de Componentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Ensamblajes</p>
                    <p className="text-xs text-slate-400">Subensambles y módulos</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Componentes</p>
                    <p className="text-xs text-slate-400">Piezas compradas</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-400">8</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Materias Primas</p>
                    <p className="text-xs text-slate-400">Materiales base</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-400">8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManufacturingBOMModule;
