import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Route, Zap, AlertCircle, MapPin, Plus, Clock, Package } from 'lucide-react';

export const LogisticsRoutesModule: React.FC = () => {
  const routes = [
    { id: 'R-001', name: 'Zona Norte', stops: 12, completed: 8, eta: '14:30', distance: 45, status: 'active' },
    { id: 'R-002', name: 'Centro Ciudad', stops: 15, completed: 15, eta: 'Completada', distance: 32, status: 'completed' },
    { id: 'R-003', name: 'Polígono Industrial', stops: 8, completed: 2, eta: '16:45', distance: 28, status: 'active' },
    { id: 'R-004', name: 'Zona Sur', stops: 10, completed: 0, eta: '18:00', distance: 52, status: 'pending' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500">Completada</Badge>;
      case 'active': return <Badge className="bg-blue-500">En Curso</Badge>;
      case 'pending': return <Badge variant="outline">Pendiente</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Planificación de Rutas</h2>
          <p className="text-muted-foreground">Optimización con IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Optimizar IA
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ruta
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Route, label: 'Planificador', color: 'text-blue-500' },
          { icon: Zap, label: 'Optimización IA', color: 'text-amber-500' },
          { icon: AlertCircle, label: 'Tráfico Real', color: 'text-red-500' },
          { icon: MapPin, label: 'Multi-parada', color: 'text-emerald-500' },
        ].map((feature, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="font-medium text-sm">{feature.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {routes.map((route) => (
          <Card key={route.id} className="hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Route className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{route.name}</p>
                    <p className="text-sm text-muted-foreground">{route.id}</p>
                  </div>
                </div>
                {getStatusBadge(route.status)}
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{route.stops} paradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{route.completed} completadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ETA: {route.eta}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{route.distance} km</span>
                </div>
              </div>

              {route.status !== 'pending' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span>{Math.round((route.completed / route.stops) * 100)}%</span>
                  </div>
                  <Progress value={(route.completed / route.stops) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
