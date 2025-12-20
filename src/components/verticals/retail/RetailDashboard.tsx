import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, TrendingUp, Euro, Users, 
  Package, Receipt, ArrowUp, ArrowDown, Calendar
} from 'lucide-react';
import { RetailPOSModule } from './RetailPOSModule';
import { RetailInventoryModule } from './RetailInventoryModule';
import { RetailPurchasesModule } from './RetailPurchasesModule';
import { RetailFiscalModule } from './RetailFiscalModule';

export const RetailDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState('overview');

  const kpis = {
    salesToday: 2456.80,
    salesChange: 12.5,
    transactions: 47,
    avgTicket: 52.27,
    topProduct: 'Café con Leche',
    lowStockItems: 3,
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'pos': return <RetailPOSModule />;
      case 'inventory': return <RetailInventoryModule />;
      case 'purchases': return <RetailPurchasesModule />;
      case 'fiscal': return <RetailFiscalModule />;
      default: return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-2xl font-bold">{kpis.salesToday.toFixed(2)} €</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+{kpis.salesChange}%</span>
                  <span className="text-xs text-muted-foreground">vs ayer</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Euro className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-2xl font-bold">{kpis.transactions}</p>
                <p className="text-xs text-muted-foreground mt-1">Hoy</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Medio</p>
                <p className="text-2xl font-bold">{kpis.avgTicket.toFixed(2)} €</p>
                <p className="text-xs text-muted-foreground mt-1">Media del día</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={kpis.lowStockItems > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold">{kpis.lowStockItems}</p>
                <p className="text-xs text-destructive mt-1">Productos en alerta</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => setActiveModule('pos')}
        >
          <ShoppingCart className="h-8 w-8 text-amber-500" />
          <span>Punto de Venta</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => setActiveModule('inventory')}
        >
          <Package className="h-8 w-8 text-blue-500" />
          <span>Inventario</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => setActiveModule('purchases')}
        >
          <Users className="h-8 w-8 text-emerald-500" />
          <span>Compras</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => setActiveModule('fiscal')}
        >
          <Receipt className="h-8 w-8 text-violet-500" />
          <span>Fiscal</span>
        </Button>
      </div>

      {/* Recent Activity & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '14:32', items: 3, total: 12.50 },
                { time: '14:15', items: 1, total: 4.80 },
                { time: '13:58', items: 5, total: 28.00 },
                { time: '13:45', items: 2, total: 8.50 },
                { time: '13:30', items: 4, total: 15.20 },
              ].map((sale, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{sale.time}</span>
                    <Badge variant="outline">{sale.items} items</Badge>
                  </div>
                  <span className="font-medium">{sale.total.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Café con Leche', qty: 85, revenue: 153.00 },
                { name: 'Tostada Tomate', qty: 42, revenue: 105.00 },
                { name: 'Croissant', qty: 38, revenue: 72.20 },
                { name: 'Zumo Naranja', qty: 31, revenue: 93.00 },
                { name: 'Bocadillo Jamón', qty: 25, revenue: 112.50 },
              ].map((product, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.qty} unidades</p>
                  </div>
                  <span className="font-medium text-emerald-500">{product.revenue.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-amber-500" />
            Retail / Hostelería
          </h1>
          <p className="text-muted-foreground">Pack vertical completo para comercio minorista</p>
        </div>
        {activeModule !== 'overview' && (
          <Button variant="outline" onClick={() => setActiveModule('overview')}>
            ← Volver al Dashboard
          </Button>
        )}
      </div>

      {activeModule === 'overview' && (
        <Tabs defaultValue="dashboard" className="mb-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {renderModule()}
    </div>
  );
};
