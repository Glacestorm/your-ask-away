/**
 * Módulo de Ventas ERP - Fase 2
 * Flujo: Presupuesto → Pedido → Albarán → Factura → Abono
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  FileText, ShoppingCart, Truck, Receipt, CreditCard, 
  Plus, Search, RefreshCw, ArrowRight, Loader2 
} from 'lucide-react';
import { useERPSales } from '@/hooks/erp/useERPSales';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  sent: 'bg-blue-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  expired: 'bg-orange-500',
  converted: 'bg-purple-500',
  confirmed: 'bg-green-500',
  partial: 'bg-yellow-500',
  completed: 'bg-green-600',
  cancelled: 'bg-red-600',
  ready: 'bg-blue-400',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  invoiced: 'bg-purple-500',
  paid: 'bg-green-600',
  overdue: 'bg-red-500',
  applied: 'bg-green-500',
  unpaid: 'bg-red-400',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Expirado',
  converted: 'Convertido',
  confirmed: 'Confirmado',
  partial: 'Parcial',
  completed: 'Completado',
  cancelled: 'Cancelado',
  ready: 'Preparado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  invoiced: 'Facturado',
  paid: 'Pagado',
  overdue: 'Vencido',
  applied: 'Aplicado',
  unpaid: 'Pendiente',
};

export function SalesModule() {
  const { currentCompany } = useERPContext();
  const { 
    isLoading, 
    fetchQuotes, 
    fetchOrders, 
    fetchDeliveryNotes, 
    fetchInvoices, 
    fetchCreditNotes,
    fetchReceivables 
  } = useERPSales();

  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany, activeTab]);

  const loadData = async () => {
    switch (activeTab) {
      case 'quotes':
        setQuotes(await fetchQuotes());
        break;
      case 'orders':
        setOrders(await fetchOrders());
        break;
      case 'delivery':
        setDeliveryNotes(await fetchDeliveryNotes());
        break;
      case 'invoices':
        setInvoices(await fetchInvoices());
        break;
      case 'credits':
        setCreditNotes(await fetchCreditNotes());
        break;
      case 'receivables':
        setReceivables(await fetchReceivables());
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para ver el módulo de ventas
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
              <Receipt className="h-5 w-5" />
              Ventas
            </CardTitle>
            <CardDescription>
              Gestión del ciclo de ventas: Presupuesto → Pedido → Albarán → Factura
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
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="quotes" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Presupuestos</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Albaranes</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Facturas</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-1">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Abonos</span>
            </TabsTrigger>
            <TabsTrigger value="receivables" className="gap-1">
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">Vencimientos</span>
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
              <TabsContent value="quotes">
                <DocumentTable
                  data={quotes}
                  columns={['Número', 'Cliente', 'Fecha', 'Válido hasta', 'Total', 'Estado']}
                  renderRow={(q) => (
                    <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{q.number || '-'}</TableCell>
                      <TableCell>{q.customer_name}</TableCell>
                      <TableCell>{formatDate(q.date)}</TableCell>
                      <TableCell>{q.valid_until ? formatDate(q.valid_until) : '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(q.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[q.status]}>{statusLabels[q.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  emptyMessage="No hay presupuestos"
                />
              </TabsContent>

              <TabsContent value="orders">
                <DocumentTable
                  data={orders}
                  columns={['Número', 'Cliente', 'Fecha', 'Entrega', 'Total', 'Estado']}
                  renderRow={(o) => (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{o.number || '-'}</TableCell>
                      <TableCell>{o.customer_name}</TableCell>
                      <TableCell>{formatDate(o.date)}</TableCell>
                      <TableCell>{o.delivery_date ? formatDate(o.delivery_date) : '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(o.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[o.status]}>{statusLabels[o.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  emptyMessage="No hay pedidos"
                />
              </TabsContent>

              <TabsContent value="delivery">
                <DocumentTable
                  data={deliveryNotes}
                  columns={['Número', 'Cliente', 'Fecha', 'Transportista', 'Total', 'Estado']}
                  renderRow={(d) => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{d.number || '-'}</TableCell>
                      <TableCell>{d.customer_name}</TableCell>
                      <TableCell>{formatDate(d.date)}</TableCell>
                      <TableCell>{d.carrier || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(d.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[d.status]}>{statusLabels[d.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  emptyMessage="No hay albaranes"
                />
              </TabsContent>

              <TabsContent value="invoices">
                <DocumentTable
                  data={invoices}
                  columns={['Número', 'Cliente', 'Fecha', 'Vencimiento', 'Total', 'Estado']}
                  renderRow={(i) => (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{i.number || '-'}</TableCell>
                      <TableCell>{i.customer_name}</TableCell>
                      <TableCell>{formatDate(i.invoice_date)}</TableCell>
                      <TableCell>{i.due_date ? formatDate(i.due_date) : '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(i.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[i.status]}>{statusLabels[i.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  emptyMessage="No hay facturas"
                />
              </TabsContent>

              <TabsContent value="credits">
                <DocumentTable
                  data={creditNotes}
                  columns={['Número', 'Cliente', 'Fecha', 'Motivo', 'Total', 'Estado']}
                  renderRow={(c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{c.number || '-'}</TableCell>
                      <TableCell>{c.customer_name}</TableCell>
                      <TableCell>{formatDate(c.date)}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{c.reason || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(c.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  emptyMessage="No hay abonos"
                />
              </TabsContent>

              <TabsContent value="receivables">
                <DocumentTable
                  data={receivables}
                  columns={['Cliente', 'Vencimiento', 'Importe', 'Cobrado', 'Pendiente', 'Estado']}
                  renderRow={(r) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>{r.customer_name}</TableCell>
                      <TableCell>{formatDate(r.due_date)}</TableCell>
                      <TableCell>{formatCurrency(r.amount)}</TableCell>
                      <TableCell>{formatCurrency(r.paid_amount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(r.amount - r.paid_amount)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  )}
                  search={search}
                  emptyMessage="No hay vencimientos"
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
  emptyMessage 
}: { 
  data: any[]; 
  columns: string[]; 
  renderRow: (item: any) => React.ReactNode;
  search: string;
  emptyMessage: string;
}) {
  const filtered = data.filter(item => 
    !search || 
    item.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.number?.toLowerCase().includes(search.toLowerCase())
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

export default SalesModule;
