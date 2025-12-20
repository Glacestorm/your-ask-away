import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, Flag, Users, History, Plus, Clock, Euro } from 'lucide-react';

export const LegalCasesModule: React.FC = () => {
  const cases = [
    { id: 'EXP-2024-001', client: 'Empresa ABC S.L.', type: 'Mercantil', team: ['Ana G.', 'Pedro M.'], openDate: '2024-01-05', hours: 45.5, status: 'active' },
    { id: 'EXP-2024-002', client: 'García Hermanos', type: 'Laboral', team: ['María L.'], openDate: '2024-01-10', hours: 23.0, status: 'active' },
    { id: 'EXP-2024-003', client: 'Constructora Norte', type: 'Civil', team: ['Ana G.', 'Juan R.'], openDate: '2024-01-12', hours: 12.5, status: 'pending' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expedientes</h2>
          <p className="text-muted-foreground">Gestión de casos legales</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Expediente
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Folder, label: 'Registro Casos', color: 'text-violet-500' },
          { icon: Flag, label: 'Estados', color: 'text-emerald-500' },
          { icon: Users, label: 'Equipo Asignado', color: 'text-blue-500' },
          { icon: History, label: 'Historial', color: 'text-amber-500' },
        ].map((feature, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="font-medium text-sm">{feature.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:border-violet-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Folder className="h-6 w-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium">{caseItem.client}</p>
                    <p className="text-sm text-muted-foreground">{caseItem.id}</p>
                  </div>
                </div>
                <Badge className={caseItem.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}>
                  {caseItem.status === 'active' ? 'Activo' : 'Pendiente'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{caseItem.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Equipo</p>
                  <p className="font-medium">{caseItem.team.join(', ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Apertura</p>
                  <p className="font-medium">{caseItem.openDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Horas</p>
                  <p className="font-medium">{caseItem.hours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
