/**
 * Módulo de Compras ERP
 * Flujo: Pedido Compra → Albarán Entrada → Factura Proveedor
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Package, ShoppingCart, Truck, FileText, 
  Plus, Search, RefreshCw, Loader2, Users
} from 'lucide-react';
import { useERPPurchases } from '@/hooks/erp/useERPPurchases';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  confirmed: 'bg-green-500',
  partial: 'bg-yellow-500',
  received: 'bg-green-600',
  cancelled: 'bg-red-600',
  posted: 'bg-blue-500',
  paid: 'bg-green-600',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  partial: 'Parcial',
  received: 'Recibido',
  cancelled: 'Cancelado',
  posted: 'Contabilizada',
  paid: 'Pagada',
};

export function PurchasesModule() {
  const { currentCompany } = useERPContext();
  const { 
    isLoading, 
    fetchSuppliers,
    fetchPurchaseOrders, 
    fetchGoodsReceipts, 
    fetchSupplierInvoices,
  } = useERPPurchases();

  const [activeTab, setActiveTab] = useState('orders');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany, activeTab]);

  const loadData = async () => {
    switch (activeTab) {
      case 'suppliers':
        setSuppliers(await fetchSuppliers());
        break;
      case 'orders':
        setOrders(await fetchPurchaseOrders());
        break;
      case 'receipts':
        setReceipts(await fetchGoodsReceipts());
        break;
      case 'invoices':
        setInvoices(await fetchSupplierInvoices());
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para ver el módulo de compras
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
              <Package className="h-5 w-5" />
              Compras
            </CardTitle>
            <CardDescription>
              Gestión del ciclo de compras: Pedido → Albarán Entrada → Factura
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
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="suppliers" className="gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Proveedores</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Albaranes</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Facturas</span>
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
            <Button className="gap-2">
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
              <TabsContent value="suppliers">
                <DocumentTable
                  data={suppliers}
                  columns={['Código', 'Nombre', 'CIF', 'Teléfono', 'Email', 'Estado']}
                  renderRow={(s) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{s.code || '-'}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.tax_id || '-'}</TableCell>
                      <TableCell>{s.phone || '-'}</TableCell>
                      <TableCell>{s.email || '-'}</TableCell>
                      <TableCell>
                        <Badge className={s.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                          {s.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchField="name"
                  emptyMessage="No hay proveedores"
                />
              </TabsContent>

              <TabsContent value="orders">
                <DocumentTable
                  data={orders}
                  columns={['Número', 'Proveedor', 'Fecha', 'Entrega prevista', 'Total', 'Estado']}
                  renderRow={(o) => (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{o.document_number || '-'}</TableCell>
                      <TableCell>{o.supplier_name || '-'}</TableCell>
                      <TableCell>{formatDate(o.order_date)}</TableCell>
                      <TableCell>{formatDate(o.expected_date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(o.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[o.status]}>{statusLabels[o.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchField="supplier_name"
                  emptyMessage="No hay pedidos de compra"
                />
              </TabsContent>

              <TabsContent value="receipts">
                <DocumentTable
                  data={receipts}
                  columns={['Número', 'Proveedor', 'Fecha', 'Almacén', 'Estado']}
                  renderRow={(r) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{r.document_number || '-'}</TableCell>
                      <TableCell>{r.supplier_name || '-'}</TableCell>
                      <TableCell>{formatDate(r.receipt_date)}</TableCell>
                      <TableCell>{r.warehouse_name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchField="supplier_name"
                  emptyMessage="No hay albaranes de entrada"
                />
              </TabsContent>

              <TabsContent value="invoices">
                <DocumentTable
                  data={invoices}
                  columns={['Número', 'Nº Proveedor', 'Proveedor', 'Fecha', 'Vencimiento', 'Total', 'Estado']}
                  renderRow={(i) => (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{i.document_number || '-'}</TableCell>
                      <TableCell>{i.supplier_invoice_number || '-'}</TableCell>
                      <TableCell>{i.supplier_name || '-'}</TableCell>
                      <TableCell>{formatDate(i.invoice_date)}</TableCell>
                      <TableCell>{formatDate(i.due_date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(i.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[i.status]}>{statusLabels[i.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  searchField="supplier_name"
                  emptyMessage="No hay facturas de proveedor"
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DocumentTable({ 
  data, 
  columns, 
  renderRow, 
  search, 
  searchField,
  emptyMessage 
}: { 
  data: any[]; 
  columns: string[]; 
  renderRow: (item: any) => React.ReactNode;
  search: string;
  searchField: string;
  emptyMessage: string;
}) {
  const filtered = data.filter(item => 
    !search || 
    item[searchField]?.toLowerCase().includes(search.toLowerCase()) ||
    item.document_number?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.toLowerCase().includes(search.toLowerCase())
  );

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

export default PurchasesModule;
