/**
 * AgingPanel - Vencimientos de Cobro/Pago
 * Panel de gestión de vencimientos con análisis por antigüedad
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgingItem {
  id: string;
  type: 'receivable' | 'payable';
  documentNumber: string;
  entity: string;
  dueDate: Date;
  amount: number;
  pendingAmount: number;
  daysOverdue: number;
  status: 'current' | 'due' | 'overdue' | 'critical';
}

// Mock data para demostración
const mockAgingData: AgingItem[] = [
  { id: '1', type: 'receivable', documentNumber: 'FV-2024-0125', entity: 'Cliente A', dueDate: addDays(new Date(), 15), amount: 5000, pendingAmount: 5000, daysOverdue: -15, status: 'current' },
  { id: '2', type: 'receivable', documentNumber: 'FV-2024-0118', entity: 'Cliente B', dueDate: addDays(new Date(), -5), amount: 3200, pendingAmount: 3200, daysOverdue: 5, status: 'due' },
  { id: '3', type: 'receivable', documentNumber: 'FV-2024-0095', entity: 'Cliente C', dueDate: addDays(new Date(), -35), amount: 8500, pendingAmount: 8500, daysOverdue: 35, status: 'overdue' },
  { id: '4', type: 'receivable', documentNumber: 'FV-2024-0067', entity: 'Cliente D', dueDate: addDays(new Date(), -95), amount: 12000, pendingAmount: 12000, daysOverdue: 95, status: 'critical' },
  { id: '5', type: 'payable', documentNumber: 'FC-2024-0089', entity: 'Proveedor X', dueDate: addDays(new Date(), 10), amount: 4500, pendingAmount: 4500, daysOverdue: -10, status: 'current' },
  { id: '6', type: 'payable', documentNumber: 'FC-2024-0078', entity: 'Proveedor Y', dueDate: addDays(new Date(), -8), amount: 2800, pendingAmount: 2800, daysOverdue: 8, status: 'due' },
  { id: '7', type: 'payable', documentNumber: 'FC-2024-0055', entity: 'Proveedor Z', dueDate: addDays(new Date(), -45), amount: 6200, pendingAmount: 6200, daysOverdue: 45, status: 'overdue' },
];

export function AgingPanel() {
  const { currentCompany } = useERPContext();
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = useMemo(() => {
    return mockAgingData.filter(item => item.type === activeTab);
  }, [activeTab]);

  const agingBuckets = useMemo(() => {
    const buckets = {
      current: { label: 'Al corriente', range: '< 0 días', items: [] as AgingItem[], total: 0 },
      '0-30': { label: '0-30 días', range: '0-30 días', items: [] as AgingItem[], total: 0 },
      '31-60': { label: '31-60 días', range: '31-60 días', items: [] as AgingItem[], total: 0 },
      '61-90': { label: '61-90 días', range: '61-90 días', items: [] as AgingItem[], total: 0 },
      '90+': { label: '> 90 días', range: '> 90 días', items: [] as AgingItem[], total: 0 },
    };

    filteredData.forEach(item => {
      if (item.daysOverdue <= 0) {
        buckets.current.items.push(item);
        buckets.current.total += item.pendingAmount;
      } else if (item.daysOverdue <= 30) {
        buckets['0-30'].items.push(item);
        buckets['0-30'].total += item.pendingAmount;
      } else if (item.daysOverdue <= 60) {
        buckets['31-60'].items.push(item);
        buckets['31-60'].total += item.pendingAmount;
      } else if (item.daysOverdue <= 90) {
        buckets['61-90'].items.push(item);
        buckets['61-90'].total += item.pendingAmount;
      } else {
        buckets['90+'].items.push(item);
        buckets['90+'].total += item.pendingAmount;
      }
    });

    return buckets;
  }, [filteredData]);

  const totalPending = useMemo(() => {
    return Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.total, 0);
  }, [agingBuckets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: AgingItem['status']) => {
    switch (status) {
      case 'current':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Al corriente</Badge>;
      case 'due':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Vencido</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Retrasado</Badge>;
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
    }
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver los vencimientos
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Análisis de Vencimientos</h3>
            <p className="text-sm text-muted-foreground">Aging de cobros y pagos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsLoading(true)}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs Cobro/Pago */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'receivable' | 'payable')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="receivable" className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-green-500" />
            Cuentas a Cobrar
          </TabsTrigger>
          <TabsTrigger value="payable" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            Cuentas a Pagar
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Buckets Summary */}
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(agingBuckets).map(([key, bucket]) => {
              const percentage = totalPending > 0 ? (bucket.total / totalPending) * 100 : 0;
              const colorClass = key === 'current' ? 'bg-green-500' :
                               key === '0-30' ? 'bg-yellow-500' :
                               key === '31-60' ? 'bg-orange-500' :
                               key === '61-90' ? 'bg-red-400' : 'bg-red-600';
              
              return (
                <Card key={key} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{bucket.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {bucket.items.length}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(bucket.total)}</p>
                    <Progress value={percentage} className={cn("h-1.5", colorClass)} />
                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Total Summary */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total {activeTab === 'receivable' ? 'pendiente de cobro' : 'pendiente de pago'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Vencido</p>
                    <p className="font-semibold text-orange-500">
                      {formatCurrency(agingBuckets['0-30'].total + agingBuckets['31-60'].total)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Crítico</p>
                    <p className="font-semibold text-destructive">
                      {formatCurrency(agingBuckets['61-90'].total + agingBuckets['90+'].total)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalle de Vencimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>{activeTab === 'receivable' ? 'Cliente' : 'Proveedor'}</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{item.documentNumber}</TableCell>
                        <TableCell>{item.entity}</TableCell>
                        <TableCell>{format(item.dueDate, 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-mono",
                            item.daysOverdue > 0 ? "text-destructive" : "text-green-600"
                          )}>
                            {item.daysOverdue > 0 ? `+${item.daysOverdue}` : item.daysOverdue}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(item.pendingAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgingPanel;
