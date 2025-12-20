import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, Folder, CheckCircle, BarChart, Plus, Play, Pause } from 'lucide-react';

export const LegalTimesheetModule: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);

  const todayEntries = [
    { id: '1', case: 'EXP-2024-001', client: 'Empresa ABC', task: 'Revisión contrato', hours: 2.5, status: 'approved' },
    { id: '2', case: 'EXP-2024-002', client: 'García Hermanos', task: 'Llamada cliente', hours: 0.5, status: 'pending' },
    { id: '3', case: 'EXP-2024-001', client: 'Empresa ABC', task: 'Redacción demanda', hours: 3.0, status: 'pending' },
  ];

  const totalHours = todayEntries.reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Control de Tiempos</h2>
          <p className="text-muted-foreground">Registro de horas por proyecto</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isTracking ? 'destructive' : 'default'}
            onClick={() => setIsTracking(!isTracking)}
          >
            {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isTracking ? 'Detener' : 'Iniciar'}
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Entrada Manual
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: 'Timesheet', color: 'text-violet-500' },
          { icon: Folder, label: 'Por Proyecto', color: 'text-blue-500' },
          { icon: CheckCircle, label: 'Aprobación', color: 'text-emerald-500' },
          { icon: BarChart, label: 'Reportes', color: 'text-amber-500' },
        ].map((feature, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="font-medium text-sm">{feature.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-violet-500/10 border-violet-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Horas Hoy</p>
              <p className="text-3xl font-bold">{totalHours}h</p>
            </div>
            {isTracking && (
              <div className="flex items-center gap-2 text-violet-500">
                <div className="h-3 w-3 rounded-full bg-violet-500 animate-pulse" />
                <span className="font-mono text-lg">00:45:23</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{entry.task}</p>
                  <p className="text-sm text-muted-foreground">{entry.case} · {entry.client}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{entry.hours}h</span>
                  <Badge variant={entry.status === 'approved' ? 'default' : 'outline'}>
                    {entry.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
