import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, Ruler, CheckCircle, History, 
  Plus, Download, Send, Clock
} from 'lucide-react';

interface Certification {
  id: string;
  project: string;
  month: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'paid';
  submittedDate?: string;
  approvedDate?: string;
}

export const ConstructionCertificationsModule: React.FC = () => {
  const certifications: Certification[] = [
    { id: 'CERT-2024-001', project: 'Edificio Aurora', month: 'Enero 2024', amount: 156000, status: 'paid', submittedDate: '2024-01-31', approvedDate: '2024-02-05' },
    { id: 'CERT-2024-002', project: 'Centro Comercial Plaza Mayor', month: 'Enero 2024', amount: 320000, status: 'approved', submittedDate: '2024-01-31', approvedDate: '2024-02-08' },
    { id: 'CERT-2024-003', project: 'Nave Industrial P-47', month: 'Enero 2024', amount: 60000, status: 'pending', submittedDate: '2024-01-31' },
    { id: 'CERT-2024-004', project: 'Edificio Aurora', month: 'Febrero 2024', amount: 142000, status: 'draft' },
  ];

  const getStatusBadge = (status: Certification['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Borrador</Badge>;
      case 'pending': return <Badge className="bg-amber-500 gap-1"><Send className="h-3 w-3" /> Pendiente DF</Badge>;
      case 'approved': return <Badge className="bg-emerald-500 gap-1"><CheckCircle className="h-3 w-3" /> Aprobada</Badge>;
      case 'paid': return <Badge className="bg-blue-500 gap-1"><CheckCircle className="h-3 w-3" /> Pagada</Badge>;
    }
  };

  const totalPending = certifications
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Certificaciones</h2>
          <p className="text-muted-foreground">Certificaciones mensuales de obra ejecutada</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Certificaciones</p>
                <p className="text-2xl font-bold">{certifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes Cobro</p>
                <p className="text-2xl font-bold">{(totalPending / 1000).toFixed(0)}k €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold">{certifications.filter(c => c.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <History className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobradas</p>
                <p className="text-2xl font-bold">{certifications.filter(c => c.status === 'paid').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Nº Certificación</th>
                <th className="text-left p-3 font-medium">Obra</th>
                <th className="text-left p-3 font-medium">Período</th>
                <th className="text-left p-3 font-medium">Importe</th>
                <th className="text-left p-3 font-medium">Estado</th>
                <th className="text-left p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-mono text-sm">{cert.id}</td>
                  <td className="p-3">{cert.project}</td>
                  <td className="p-3 text-sm">{cert.month}</td>
                  <td className="p-3 font-medium">{cert.amount.toLocaleString()} €</td>
                  <td className="p-3">{getStatusBadge(cert.status)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Ruler className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {cert.status === 'draft' && (
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
