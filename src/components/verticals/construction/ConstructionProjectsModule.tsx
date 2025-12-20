import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HardHat, Flag, FileText, ClipboardList, AlertTriangle, 
  Plus, Calendar, Users, MapPin
} from 'lucide-react';

export const ConstructionProjectsModule: React.FC = () => {
  const projects = [
    { 
      id: '1', 
      name: 'Edificio Residencial Aurora', 
      client: 'Inmobiliaria Norte S.A.',
      location: 'Bilbao, Bizkaia',
      startDate: '2023-06-15',
      endDate: '2024-12-31',
      progress: 75,
      phase: 'Estructura',
      workers: 45,
      subcontractors: 8,
      incidents: 2
    },
    { 
      id: '2', 
      name: 'Centro Comercial Plaza Mayor', 
      client: 'Centros Comerciales SL',
      location: 'Vitoria, Álava',
      startDate: '2024-01-10',
      endDate: '2025-06-30',
      progress: 30,
      phase: 'Cimentación',
      workers: 78,
      subcontractors: 12,
      incidents: 1
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Obras</h2>
          <p className="text-muted-foreground">Control integral de proyectos de construcción</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Obra
        </Button>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:border-orange-500/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-orange-500" />
                    {project.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
                </div>
                <Badge className="bg-emerald-500">{project.phase}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{project.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{project.startDate} - {project.endDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{project.workers} trabajadores</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">{project.incidents} incidencias</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Avance de obra</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  Hitos
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentación
                </Button>
                <Button variant="outline" size="sm">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Partes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
