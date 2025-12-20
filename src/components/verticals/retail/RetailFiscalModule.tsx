import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  FileCheck, FileText, QrCode, Shield, 
  CheckCircle, AlertTriangle, Settings, RefreshCw
} from 'lucide-react';

export const RetailFiscalModule: React.FC = () => {
  const [ticketbaiEnabled, setTicketbaiEnabled] = useState(true);
  const [verifactuEnabled, setVerifactuEnabled] = useState(false);

  const recentInvoices = [
    { id: 'TB-2024-001234', date: '2024-01-15 14:32', amount: 45.50, status: 'validated', type: 'ticketbai' },
    { id: 'TB-2024-001233', date: '2024-01-15 14:15', amount: 23.80, status: 'validated', type: 'ticketbai' },
    { id: 'TB-2024-001232', date: '2024-01-15 13:45', amount: 156.00, status: 'pending', type: 'ticketbai' },
    { id: 'TB-2024-001231', date: '2024-01-15 12:30', amount: 89.90, status: 'error', type: 'ticketbai' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated': return <Badge className="bg-emerald-500 gap-1"><CheckCircle className="h-3 w-3" /> Validado</Badge>;
      case 'pending': return <Badge variant="outline" className="gap-1"><RefreshCw className="h-3 w-3" /> Pendiente</Badge>;
      case 'error': return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Adaptación Fiscal</h2>
          <p className="text-muted-foreground">TicketBAI y VeriFactu</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Button>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border-2 ${ticketbaiEnabled ? 'border-emerald-500/50' : 'border-muted'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-500" />
                TicketBAI
              </CardTitle>
              <Switch
                checked={ticketbaiEnabled}
                onCheckedChange={setTicketbaiEnabled}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sistema de facturación obligatorio para el País Vasco
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Estado</span>
                <Badge className="bg-emerald-500">Activo</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificado</span>
                <span className="text-emerald-500">✓ Válido hasta 2025</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Hacienda Foral</span>
                <span>Bizkaia</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Facturas hoy</span>
                <span className="font-medium">47</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${verifactuEnabled ? 'border-blue-500/50' : 'border-muted'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                VeriFactu
              </CardTitle>
              <Switch
                checked={verifactuEnabled}
                onCheckedChange={setVerifactuEnabled}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sistema de facturación electrónica de la AEAT (España)
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Estado</span>
                <Badge variant="outline">Desactivado</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Certificado</span>
                <span className="text-muted-foreground">No configurado</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Obligatorio desde</span>
                <span>Julio 2025</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Facturas Recientes</TabsTrigger>
          <TabsTrigger value="qr">Códigos QR</TabsTrigger>
          <TabsTrigger value="validation">Validación AEAT</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">ID Factura</th>
                    <th className="text-left p-3 font-medium">Fecha/Hora</th>
                    <th className="text-left p-3 font-medium">Importe</th>
                    <th className="text-left p-3 font-medium">Sistema</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{invoice.id}</td>
                      <td className="p-3 text-sm">{invoice.date}</td>
                      <td className="p-3 font-medium">{invoice.amount.toFixed(2)} €</td>
                      <td className="p-3">
                        <Badge variant="outline" className="uppercase text-xs">
                          {invoice.type}
                        </Badge>
                      </td>
                      <td className="p-3">{getStatusBadge(invoice.status)}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center">
              <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Generación de Códigos QR</h3>
              <p className="text-muted-foreground mb-4">
                Los códigos QR se generan automáticamente para cada factura según la normativa TicketBAI
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">QR Generados Hoy</p>
                  <p className="text-2xl font-bold text-primary">47</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">Validados</p>
                  <p className="text-2xl font-bold text-emerald-500">45</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Validación AEAT</h3>
                  <p className="text-muted-foreground">Estado de la conexión con la Agencia Tributaria</p>
                </div>
                <Badge className="bg-emerald-500 ml-auto">Conectado</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-500">98.5%</p>
                    <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">1,247</p>
                    <p className="text-sm text-muted-foreground">Facturas Este Mes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-500">3</p>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
