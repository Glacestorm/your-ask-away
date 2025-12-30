import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';
import { 
  HardHat, Building, Calendar, FileText, 
  Users, Receipt, TrendingUp, BarChart3,
  Wrench, Percent
} from 'lucide-react';

export function VerticalAccountingConstruction() {
  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
            <HardHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Construcción</h1>
            <p className="text-muted-foreground">Gestión contable para empresas constructoras</p>
          </div>
        </div>
        <Badge className="bg-orange-500/10 text-orange-600">Construcción</Badge>
      </div>

      <Tabs defaultValue="obras" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="obras">Obras en Curso</TabsTrigger>
          <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
          <TabsTrigger value="subcontratas">Subcontratas</TabsTrigger>
          <TabsTrigger value="retenciones">Retenciones</TabsTrigger>
          <TabsTrigger value="iva-caja">IVA Criterio Caja</TabsTrigger>
        </TabsList>

        <TabsContent value="obras" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-orange-600" />
                  Obras Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">En ejecución</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Cartera Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€4.2M</p>
                <p className="text-sm text-muted-foreground">Pendiente ejecución</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  % Avance Medio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">62%</p>
                <p className="text-sm text-muted-foreground">Cartera actual</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Margen Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">8.5%</p>
                <p className="text-sm text-muted-foreground">Margen bruto cartera</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Obras en Curso - Contabilización PGC</CardTitle>
              <CardDescription>
                Existencias de producción en curso según NRV 10ª del PGC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Viviendas Parque Norte - Fase 1</p>
                    <p className="text-sm text-muted-foreground">75% ejecutado - Entrega Mar 2025</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€1,245,000</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Centro Comercial Plaza Sur</p>
                    <p className="text-sm text-muted-foreground">45% ejecutado - Entrega Sep 2025</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600">€2,150,000</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Certificaciones de Obra
              </CardTitle>
              <CardDescription>
                Gestión de certificaciones mensuales y reconocimiento de ingresos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">Certificado Diciembre</p>
                    <p className="text-xl font-bold">€485,200</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">Pendiente Aprobar</p>
                    <p className="text-xl font-bold">€125,000</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Acumulado 2024</p>
                    <p className="text-xl font-bold">€2,845,000</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcontratas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Subcontratas
              </CardTitle>
              <CardDescription>
                Control de subcontratistas, facturación y retenciones de garantía
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Instalaciones Eléctricas Norte SL</p>
                      <p className="text-sm text-muted-foreground">Instalaciones eléctricas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge>€125,400</Badge>
                    <p className="text-xs text-muted-foreground mt-1">5% retención: €6,270</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Estructuras Metálicas Ibéricas</p>
                      <p className="text-sm text-muted-foreground">Estructura metálica</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge>€245,800</Badge>
                    <p className="text-xs text-muted-foreground mt-1">5% retención: €12,290</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retenciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Retenciones de Garantía
              </CardTitle>
              <CardDescription>
                Control de retenciones a clientes y a subcontratistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Retenciones de Clientes</p>
                    <p className="text-xl font-bold">€185,400</p>
                    <p className="text-xs text-muted-foreground">Pendiente cobro en garantía</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">Retenciones a Subcontratas</p>
                    <p className="text-xl font-bold">€42,800</p>
                    <p className="text-xs text-muted-foreground">Pendiente pago tras garantía</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iva-caja" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                IVA Criterio de Caja (RECC)
              </CardTitle>
              <CardDescription>
                Gestión del régimen especial de criterio de caja para construcción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">IVA Devengado Cobrado</p>
                    <p className="text-xl font-bold">€89,450</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">IVA Devengado Pendiente</p>
                    <p className="text-xl font-bold">€45,200</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">IVA Deducible Pagado</p>
                    <p className="text-xl font-bold">€52,800</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="construction" className="mt-6" />
      <VerticalHelpButton verticalType="construction" />
    </div>
  );
}
