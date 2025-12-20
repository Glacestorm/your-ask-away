import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HardHat, FileCheck, Users, Calculator, 
  Calendar, TrendingUp, AlertTriangle, Euro
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'active' | 'paused' | 'completed';
  certifications: number;
  pendingCertification: number;
}

export const ConstructionDashboard: React.FC = () => {
  const projects: Project[] = [
    { id: '1', name: 'Edificio Residencial Aurora', client: 'Inmobiliaria Norte S.A.', budget: 2500000, spent: 1875000, progress: 75, status: 'active', certifications: 8, pendingCertification: 156000 },
    { id: '2', name: 'Centro Comercial Plaza Mayor', client: 'Centros Comerciales SL', budget: 8000000, spent: 2400000, progress: 30, status: 'active', certifications: 3, pendingCertification: 320000 },
    { id: '3', name: 'Nave Industrial P-47', client: 'Logística Express', budget: 1200000, spent: 1140000, progress: 95, status: 'active', certifications: 10, pendingCertification: 60000 },
    { id: '4', name: 'Reforma Hotel Marina', client: 'Hoteles Costa SA', budget: 450000, spent: 450000, progress: 100, status: 'completed', certifications: 5, pendingCertification: 0 },
  ];

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const pendingCertifications = projects.reduce((s, p) => s + p.pendingCertification, 0);

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500">En Curso</Badge>;
      case 'paused': return <Badge variant="outline">Pausado</Badge>;
      case 'completed': return <Badge className="bg-blue-500">Completado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <HardHat className="h-8 w-8 text-orange-500" />
            Construcción
          </h1>
          <p className="text-muted-foreground">Gestión integral de obras y proyectos</p>
        </div>
        <Button>
          <HardHat className="h-4 w-4 mr-2" />
          Nueva Obra
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Obras Activas</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <HardHat className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                <p className="text-2xl font-bold">{(totalBudget / 1000000).toFixed(1)}M €</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Euro className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ejecutado</p>
                <p className="text-2xl font-bold">{((totalSpent / totalBudget) * 100).toFixed(0)}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cert. Pendientes</p>
                <p className="text-2xl font-bold">{(pendingCertifications / 1000).toFixed(0)}k €</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { icon: HardHat, label: 'Obras', color: 'text-orange-500' },
          { icon: Users, label: 'Subcontratas', color: 'text-blue-500' },
          { icon: FileCheck, label: 'Certificaciones', color: 'text-emerald-500' },
          { icon: Calendar, label: 'Planificación', color: 'text-violet-500' },
          { icon: Calculator, label: 'Costes', color: 'text-amber-500' },
          { icon: AlertTriangle, label: 'Incidencias', color: 'text-destructive' },
        ].map((action, i) => (
          <Button key={i} variant="outline" className="h-20 flex-col gap-2">
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Obras en Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:border-orange-500/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Presupuesto</p>
                      <p className="font-medium">{(project.budget / 1000).toFixed(0)}k €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ejecutado</p>
                      <p className="font-medium">{(project.spent / 1000).toFixed(0)}k €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Certificaciones</p>
                      <p className="font-medium">{project.certifications}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pte. Certificar</p>
                      <p className="font-medium text-amber-500">{(project.pendingCertification / 1000).toFixed(0)}k €</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Avance</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
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
