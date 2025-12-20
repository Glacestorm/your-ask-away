import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, Route, FileCheck, Grid, MapPin, 
  Clock, Package, AlertTriangle, CheckCircle
} from 'lucide-react';

export const LogisticsDashboard: React.FC = () => {
  const deliveries = [
    { id: 'DEL-001', driver: 'Carlos M.', vehicle: 'B-1234-ABC', stops: 12, completed: 8, status: 'in_route' },
    { id: 'DEL-002', driver: 'Ana P.', vehicle: 'B-5678-DEF', stops: 15, completed: 15, status: 'completed' },
    { id: 'DEL-003', driver: 'Pedro L.', vehicle: 'B-9012-GHI', stops: 10, completed: 3, status: 'in_route' },
    { id: 'DEL-004', driver: 'María R.', vehicle: 'B-3456-JKL', stops: 8, completed: 0, status: 'pending' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500">Completada</Badge>;
      case 'in_route': return <Badge className="bg-blue-500">En Ruta</Badge>;
      case 'pending': return <Badge variant="outline">Pendiente</Badge>;
      default: return null;
    }
  };

  const totalStops = deliveries.reduce((s, d) => s + d.stops, 0);
  const completedStops = deliveries.reduce((s, d) => s + d.completed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-500" />
            Logística / Transporte
          </h1>
          <p className="text-muted-foreground">Gestión de flotas y entregas</p>
        </div>
        <Button>
          <Route className="h-4 w-4 mr-2" />
          Nueva Ruta
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vehículos Activos</p>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.status === 'in_route').length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregas Hoy</p>
                <p className="text-2xl font-bold">{totalStops}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{completedStops}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% Avance</p>
                <p className="text-2xl font-bold">{Math.round((completedStops / totalStops) * 100)}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Truck, label: 'Flotas', color: 'text-blue-500' },
          { icon: Route, label: 'Rutas', color: 'text-emerald-500' },
          { icon: FileCheck, label: 'SLAs', color: 'text-amber-500' },
          { icon: Grid, label: 'Almacén', color: 'text-violet-500' },
          { icon: MapPin, label: 'Última Milla', color: 'text-red-500' },
        ].map((action, i) => (
          <Button key={i} variant="outline" className="h-20 flex-col gap-2">
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className="hover:border-blue-500/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{delivery.driver}</p>
                        <p className="text-sm text-muted-foreground">{delivery.vehicle}</p>
                      </div>
                    </div>
                    {getStatusBadge(delivery.status)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Entregas: {delivery.completed} / {delivery.stops}</span>
                      <span>{Math.round((delivery.completed / delivery.stops) * 100)}%</span>
                    </div>
                    <Progress value={(delivery.completed / delivery.stops) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
