import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, ShoppingCart, PackageCheck, Scale, 
  Plus, FileText, Clock, CheckCircle, XCircle
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  products: number;
  rating: number;
  lastOrder: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  items: number;
  total: number;
  status: 'pending' | 'sent' | 'received' | 'cancelled';
}

export const RetailPurchasesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');

  const suppliers: Supplier[] = [
    { id: '1', name: 'Café Premium S.L.', contact: 'Juan García', email: 'juan@cafepremium.es', products: 15, rating: 4.8, lastOrder: '2024-01-10' },
    { id: '2', name: 'Lácteos del Norte', contact: 'María López', email: 'maria@lacteosn.es', products: 8, rating: 4.5, lastOrder: '2024-01-12' },
    { id: '3', name: 'Distribuciones Martín', contact: 'Pedro Martín', email: 'pedro@dismarin.es', products: 25, rating: 4.2, lastOrder: '2024-01-08' },
  ];

  const orders: PurchaseOrder[] = [
    { id: 'PO-2024-001', supplier: 'Café Premium S.L.', date: '2024-01-15', items: 5, total: 450.00, status: 'pending' },
    { id: 'PO-2024-002', supplier: 'Lácteos del Norte', date: '2024-01-14', items: 3, total: 180.50, status: 'sent' },
    { id: 'PO-2024-003', supplier: 'Distribuciones Martín', date: '2024-01-12', items: 8, total: 320.00, status: 'received' },
    { id: 'PO-2024-004', supplier: 'Café Premium S.L.', date: '2024-01-10', items: 4, total: 380.00, status: 'received' },
  ];

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'sent': return <Badge className="bg-blue-500 gap-1"><ShoppingCart className="h-3 w-3" /> Enviado</Badge>;
      case 'received': return <Badge className="bg-emerald-500 gap-1"><CheckCircle className="h-3 w-3" /> Recibido</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Compras</h2>
          <p className="text-muted-foreground">Gestión de proveedores y pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Scale className="h-4 w-4 mr-2" />
            Comparar Precios
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proveedores</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Mes</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <PackageCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Compras</p>
                <p className="text-2xl font-bold">{orders.reduce((s, o) => s + o.total, 0).toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="auto">Pedidos Automáticos</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Nº Pedido</th>
                    <th className="text-left p-3 font-medium">Proveedor</th>
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-left p-3 font-medium">Items</th>
                    <th className="text-left p-3 font-medium">Total</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{order.id}</td>
                      <td className="p-3">{order.supplier}</td>
                      <td className="p-3 text-sm">{order.date}</td>
                      <td className="p-3">{order.items}</td>
                      <td className="p-3 font-medium">{order.total.toFixed(2)} €</td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contacto:</span>
                    <span>{supplier.contact}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-primary">{supplier.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Productos:</span>
                    <Badge variant="outline">{supplier.products}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valoración:</span>
                    <span className="font-medium text-amber-500">★ {supplier.rating}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Hacer Pedido
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Pedidos Automáticos</h3>
              <p className="text-muted-foreground mb-4">
                Configura reglas para generar pedidos automáticamente cuando el stock llegue al mínimo
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Configurar Regla
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
