import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, Clock, Globe, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export const HealthcareAppointmentsModule: React.FC = () => {
  const appointments = [
    { time: '09:00', patient: 'María García', type: 'Consulta General', duration: 30 },
    { time: '09:30', patient: 'Juan Pérez', type: 'Revisión', duration: 20 },
    { time: '10:00', patient: 'Ana Rodríguez', type: 'Primera Visita', duration: 45 },
    { time: '11:00', patient: 'Pedro Fernández', type: 'Seguimiento', duration: 30 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Citas</h2>
          <p className="text-muted-foreground">Agenda y recordatorios</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Agenda Inteligente', desc: 'Optimización automática' },
          { icon: Bell, label: 'Recordatorios', desc: 'SMS y Email' },
          { icon: Clock, label: 'Lista Espera', desc: 'Gestión automática' },
          { icon: Globe, label: 'Citas Online', desc: 'Portal pacientes' },
        ].map((feature, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Lunes, 15 de Enero 2024</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">Hoy</Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {appointments.map((apt, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 p-3 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg"
              >
                <div className="w-16 text-center">
                  <p className="font-mono font-medium">{apt.time}</p>
                  <p className="text-xs text-muted-foreground">{apt.duration} min</p>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{apt.patient}</p>
                  <p className="text-sm text-muted-foreground">{apt.type}</p>
                </div>
                <Badge variant="outline">Confirmada</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
