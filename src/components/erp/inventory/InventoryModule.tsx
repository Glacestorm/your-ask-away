/**
 * Módulo de Almacén ERP
 * Stock, Movimientos, Inventarios, Transferencias
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Warehouse, Package, ArrowLeftRight, ClipboardList, Boxes,
  Plus, Search, RefreshCw, Loader2, ArrowDown, ArrowUp, Settings
} from 'lucide-react';
import { useERPInventory } from '@/hooks/erp/useERPInventory';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { WarehouseDialog } from './WarehouseDialog';
import { StockMovementDialog } from './StockMovementDialog';
import { StockTransferDialog } from './StockTransferDialog';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  open: 'bg-blue-500',
  counting: 'bg-yellow-500',
  review: 'bg-orange-500',
  closed: 'bg-green-600',
  cancelled: 'bg-red-600',
  in_transit: 'bg-blue-500',
  received: 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  open: 'Abierto',
  counting: 'En conteo',
  review: 'En revisión',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
  in_transit: 'En tránsito',
  received: 'Recibido',
};

const movementTypeLabels: Record<string, string> = {
  in: 'Entrada',
  out: 'Salida',
  transfer: 'Transferencia',
  adjustment: 'Ajuste',
  initial: 'Inicial',
};

const movementTypeColors: Record<string, string> = {
  in: 'bg-green-500',
  out: 'bg-red-500',
  transfer: 'bg-blue-500',
  adjustment: 'bg-yellow-500',
  initial: 'bg-purple-500',
};

export function InventoryModule() {
  const { currentCompany } = useERPContext();
  const { 
    isLoading, 
    fetchWarehouses,
    fetchStock,
    fetchMovements,
    fetchInventoryCounts,
    fetchTransfers,
  } = useERPInventory();

  const [activeTab, setActiveTab] = useState('stock');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany, activeTab]);

  const loadData = async () => {
    switch (activeTab) {
      case 'warehouses':
        setWarehouses(await fetchWarehouses());
        break;
      case 'stock':
        setStock(await fetchStock({ onlyWithStock: true }));
        break;
      case 'movements':
        setMovements(await fetchMovements());
        break;
      case 'inventory':
        setInventories(await fetchInventoryCounts());
        break;
      case 'transfers':
        setTransfers(await fetchTransfers());
        break;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(num || 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  const formatDateTime = (date: string) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para ver el módulo de almacén
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Almacén
            </CardTitle>
            <CardDescription>
              Gestión de stock, movimientos, inventarios y transferencias
            </CardDescription>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="warehouses" className="gap-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Almacenes</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-1">
              <Boxes className="h-4 w-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Movimientos</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Inventarios</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-1">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Transferencias</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              className="gap-2"
              onClick={() => {
                if (activeTab === 'warehouses') setWarehouseDialogOpen(true);
                else if (activeTab === 'movements' || activeTab === 'stock') setMovementDialogOpen(true);
                else if (activeTab === 'transfers') setTransferDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="warehouses">
                <DataTable
                  data={warehouses}
                  columns={['Código', 'Nombre', 'Ciudad', 'País', 'Por defecto', 'Estado']}
                  renderRow={(w) => (
                    <TableRow key={w.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{w.code}</TableCell>
                      <TableCell>{w.name}</TableCell>
                      <TableCell>{w.city || '-'}</TableCell>
                      <TableCell>{w.country}</TableCell>
                      <TableCell>
                        {w.is_default && <Badge className="bg-blue-500">Defecto</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge className={w.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                          {w.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchFields={['name', 'code']}
                  emptyMessage="No hay almacenes"
                />
              </TabsContent>

              <TabsContent value="stock">
                <DataTable
                  data={stock}
                  columns={['Almacén', 'Ubicación', 'Artículo', 'Cantidad', 'Reservado', 'Disponible', 'Coste Medio']}
                  renderRow={(s) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell>{s.warehouse_name}</TableCell>
                      <TableCell className="font-mono">{s.location_code || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">{s.item_code}</span>
                          <p className="font-medium">{s.item_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatNumber(s.quantity)}</TableCell>
                      <TableCell className="text-orange-600">{formatNumber(s.reserved_qty)}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatNumber(s.available_qty)}</TableCell>
                      <TableCell>{formatCurrency(s.avg_cost)}</TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchFields={['item_name', 'item_code', 'warehouse_name']}
                  emptyMessage="No hay stock registrado"
                />
              </TabsContent>

              <TabsContent value="movements">
                <DataTable
                  data={movements}
                  columns={['Fecha', 'Tipo', 'Almacén', 'Artículo', 'Cantidad', 'Coste', 'Referencia']}
                  renderRow={(m) => (
                    <TableRow key={m.id} className="hover:bg-muted/50">
                      <TableCell>{formatDateTime(m.movement_date)}</TableCell>
                      <TableCell>
                        <Badge className={movementTypeColors[m.movement_type]}>
                          <span className="flex items-center gap-1">
                            {m.movement_type === 'in' && <ArrowDown className="h-3 w-3" />}
                            {m.movement_type === 'out' && <ArrowUp className="h-3 w-3" />}
                            {movementTypeLabels[m.movement_type]}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{m.warehouse_name}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">{m.item_code}</span>
                          <p className="font-medium truncate max-w-[150px]">{m.item_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${m.movement_type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                        {m.movement_type === 'out' ? '-' : '+'}{formatNumber(m.quantity)}
                      </TableCell>
                      <TableCell>{formatCurrency(m.unit_cost)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.reference_type || '-'}
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchFields={['item_name', 'item_code', 'warehouse_name']}
                  emptyMessage="No hay movimientos"
                />
              </TabsContent>

              <TabsContent value="inventory">
                <DataTable
                  data={inventories}
                  columns={['Fecha', 'Almacén', 'Estado', 'Notas', 'Cerrado']}
                  renderRow={(i) => (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{formatDate(i.count_date)}</TableCell>
                      <TableCell>{i.warehouse_name}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[i.status]}>{statusLabels[i.status]}</Badge>
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]">{i.notes || '-'}</TableCell>
                      <TableCell>{i.closed_at ? formatDateTime(i.closed_at) : '-'}</TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchFields={['warehouse_name']}
                  emptyMessage="No hay inventarios"
                />
              </TabsContent>

              <TabsContent value="transfers">
                <DataTable
                  data={transfers}
                  columns={['Número', 'Fecha', 'Origen', 'Destino', 'Estado']}
                  renderRow={(t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{t.document_number || '-'}</TableCell>
                      <TableCell>{formatDate(t.transfer_date)}</TableCell>
                      <TableCell>{t.from_warehouse_name}</TableCell>
                      <TableCell>{t.to_warehouse_name}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchFields={['from_warehouse_name', 'to_warehouse_name', 'document_number']}
                  emptyMessage="No hay transferencias"
                />
              </TabsContent>
            </>
          )}
        </Tabs>
        
        {/* Dialogs */}
        <WarehouseDialog 
          open={warehouseDialogOpen} 
          onOpenChange={setWarehouseDialogOpen}
          onSuccess={loadData}
        />
        <StockMovementDialog 
          open={movementDialogOpen} 
          onOpenChange={setMovementDialogOpen}
          onSuccess={loadData}
        />
        <StockTransferDialog 
          open={transferDialogOpen} 
          onOpenChange={setTransferDialogOpen}
          onSuccess={loadData}
        />
      </CardContent>
    </Card>
  );
}

function DataTable({ 
  data, 
  columns, 
  renderRow, 
  search, 
  searchFields,
  emptyMessage 
}: { 
  data: any[]; 
  columns: string[]; 
  renderRow: (item: any) => React.ReactNode;
  search: string;
  searchFields: string[];
  emptyMessage: string;
}) {
  const filtered = data.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return searchFields.some(field => 
      item[field]?.toString().toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map(renderRow)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default InventoryModule;
