import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, Folder, Clock, Receipt, FileText, 
  RefreshCw, Calendar, Euro, AlertTriangle
} from 'lucide-react';

export const LegalDashboard: React.FC = () => {
  const cases = [
    { id: 'EXP-2024-001', client: 'Empresa ABC S.L.', type: 'Mercantil', status: 'active', hours: 45.5, pendingBilling: 4550 },
    { id: 'EXP-2024-002', client: 'García Hermanos', type: 'Laboral', status: 'active', hours: 23.0, pendingBilling: 2300 },
    { id: 'EXP-2024-003', client: 'Constructora Norte', type: 'Civil', status: 'pending_docs', hours: 12.5, pendingBilling: 1250 },
    { id: 'EXP-2024-004', client: 'Inversiones Sur', type: 'Fiscal', status: 'closed', hours: 68.0, pendingBilling: 0 },
  ];

  const totalHours = cases.reduce((s, c) => s + c.hours, 0);
  const totalPending = cases.reduce((s, c) => s + c.pendingBilling, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500">Activo</Badge>;
      case 'pending_docs': return <Badge className="bg-amber-500">Pte. Docs</Badge>;
      case 'closed': return <Badge variant="outline">Cerrado</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Scale className="h-8 w-8 text-violet-500" />
            Servicios Profesionales / Legal
          </h1>
          <p className="text-muted-foreground">Gestión de expedientes y facturación</p>
        </div>
        <Button>
          <Folder className="h-4 w-4 mr-2" />
          Nuevo Expediente
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expedientes Activos</p>
                <p className="text-2xl font-bold">{cases.filter(c => c.status === 'active').length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Folder className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Este Mes</p>
                <p className="text-2xl font-bold">{totalHours}h</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pte. Facturar</p>
                <p className="text-2xl font-bold">{totalPending.toLocaleString()} €</p>
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
                <p className="text-sm text-muted-foreground">Vencimientos Próximos</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Folder, label: 'Expedientes', color: 'text-violet-500' },
          { icon: Clock, label: 'Timesheet', color: 'text-blue-500' },
          { icon: Receipt, label: 'Facturación', color: 'text-emerald-500' },
          { icon: FileText, label: 'Documentos', color: 'text-amber-500' },
          { icon: RefreshCw, label: 'Renovaciones', color: 'text-red-500' },
        ].map((action, i) => (
          <Button key={i} variant="outline" className="h-20 flex-col gap-2">
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Active Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Expedientes Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cases.map((caseItem) => (
              <div 
                key={caseItem.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Folder className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium">{caseItem.client}</p>
                    <p className="text-sm text-muted-foreground">{caseItem.id} · {caseItem.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{caseItem.hours}h</p>
                    <p className="text-xs text-muted-foreground">{caseItem.pendingBilling.toLocaleString()} €</p>
                  </div>
                  {getStatusBadge(caseItem.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
