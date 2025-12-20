import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, User, Wrench, FileText, Plus, MapPin } from 'lucide-react';

export const LogisticsFleetModule: React.FC = () => {
  const vehicles = [
    { id: '1', plate: 'B-1234-ABC', type: 'Furgoneta', driver: 'Carlos Martínez', status: 'active', km: 45230, nextService: '2024-02-15' },
    { id: '2', plate: 'B-5678-DEF', type: 'Camión 3.5T', driver: 'Ana Pérez', status: 'active', km: 128450, nextService: '2024-01-25' },
    { id: '3', plate: 'B-9012-GHI', type: 'Furgoneta', driver: 'Pedro López', status: 'maintenance', km: 87600, nextService: 'En taller' },
    { id: '4', plate: 'B-3456-JKL', type: 'Camión 3.5T', driver: 'María Ruiz', status: 'active', km: 56800, nextService: '2024-03-10' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500">Activo</Badge>;
      case 'maintenance': return <Badge className="bg-amber-500">Mantenimiento</Badge>;
      case 'inactive': return <Badge variant="outline">Inactivo</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Flotas</h2>
          <p className="text-muted-foreground">Vehículos y conductores</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Truck, label: 'Registro Vehículos', color: 'text-blue-500' },
          { icon: User, label: 'Conductores', color: 'text-emerald-500' },
          { icon: Wrench, label: 'Mantenimiento', color: 'text-amber-500' },
          { icon: FileText, label: 'Documentación', color: 'text-violet-500' },
        ].map((feature, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="font-medium text-sm">{feature.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-mono font-medium">{vehicle.plate}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                  </div>
                </div>
                {getStatusBadge(vehicle.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{vehicle.driver}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{vehicle.km.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span>Próxima revisión: {vehicle.nextService}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
