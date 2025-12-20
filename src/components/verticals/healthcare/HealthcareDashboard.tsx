import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, Calendar, FileText, Receipt, 
  PenTool, Eye, Users, Clock, CheckCircle, AlertCircle
} from 'lucide-react';

export const HealthcareDashboard: React.FC = () => {
  const todayAppointments = [
    { time: '09:00', patient: 'María García López', type: 'Consulta General', status: 'completed' },
    { time: '09:30', patient: 'Juan Pérez Martín', type: 'Revisión', status: 'completed' },
    { time: '10:00', patient: 'Ana Rodríguez Sanz', type: 'Primera Visita', status: 'in_progress' },
    { time: '10:30', patient: 'Pedro Fernández Gil', type: 'Seguimiento', status: 'waiting' },
    { time: '11:00', patient: 'Laura Martínez Ruiz', type: 'Consulta General', status: 'scheduled' },
    { time: '11:30', patient: 'Carlos López Díaz', type: 'Urgencia', status: 'scheduled' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500">Completada</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500">En Curso</Badge>;
      case 'waiting': return <Badge className="bg-amber-500">En Espera</Badge>;
      case 'scheduled': return <Badge variant="outline">Programada</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            Salud
          </h1>
          <p className="text-muted-foreground">Gestión sanitaria integral</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citas Hoy</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pacientes Atendidos</p>
                <p className="text-2xl font-bold">{todayAppointments.filter(a => a.status === 'completed').length}</p>
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
                <p className="text-sm text-muted-foreground">En Espera</p>
                <p className="text-2xl font-bold">{todayAppointments.filter(a => a.status === 'waiting').length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{todayAppointments.filter(a => a.status === 'scheduled').length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Calendar, label: 'Citas', color: 'text-red-500' },
          { icon: FileText, label: 'Expedientes', color: 'text-blue-500' },
          { icon: Receipt, label: 'Facturación', color: 'text-emerald-500' },
          { icon: PenTool, label: 'Consentimientos', color: 'text-violet-500' },
          { icon: Eye, label: 'Trazabilidad', color: 'text-amber-500' },
        ].map((action, i) => (
          <Button key={i} variant="outline" className="h-20 flex-col gap-2">
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.map((apt, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-mono font-medium w-14">{apt.time}</span>
                  <div>
                    <p className="font-medium">{apt.patient}</p>
                    <p className="text-sm text-muted-foreground">{apt.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(apt.status)}
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
