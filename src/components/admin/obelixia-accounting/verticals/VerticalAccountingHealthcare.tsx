import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, Stethoscope, Calendar, FileText, 
  Users, Receipt, Shield, Building2,
  CreditCard, TrendingUp
} from 'lucide-react';

export function VerticalAccountingHealthcare() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Sanitaria</h1>
            <p className="text-muted-foreground">Gestión contable para clínicas y centros sanitarios</p>
          </div>
        </div>
        <Badge className="bg-red-500/10 text-red-600">Salud</Badge>
      </div>

      <Tabs defaultValue="facturacion" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="aseguradoras">Aseguradoras</TabsTrigger>
          <TabsTrigger value="costes">Costes Médicos</TabsTrigger>
          <TabsTrigger value="inventario">Farmacia/Material</TabsTrigger>
          <TabsTrigger value="profesionales">Profesionales</TabsTrigger>
        </TabsList>

        <TabsContent value="facturacion" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-red-600" />
                  Consultas Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">2,845</p>
                <p className="text-sm text-muted-foreground">+12% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Facturado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€285,400</p>
                <p className="text-sm text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  Pendiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">€45,200</p>
                <p className="text-sm text-muted-foreground">En gestión de cobro</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Ticket Medio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€100.30</p>
                <p className="text-sm text-muted-foreground">Por consulta</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aseguradoras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Facturación a Aseguradoras
              </CardTitle>
              <CardDescription>
                Gestión de conciertos, tarifas acordadas y reclamaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">AS</div>
                    <div>
                      <p className="font-medium">Adeslas</p>
                      <p className="text-sm text-muted-foreground">1,245 actos médicos</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€89,450</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 font-bold">SN</div>
                    <div>
                      <p className="font-medium">Sanitas</p>
                      <p className="text-sm text-muted-foreground">856 actos médicos</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€67,200</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold">MF</div>
                    <div>
                      <p className="font-medium">MUFACE/ISFAS</p>
                      <p className="text-sm text-muted-foreground">324 actos médicos</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€28,750</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Costes por Servicio/Especialidad
              </CardTitle>
              <CardDescription>
                Analítica de costes por consulta, prueba diagnóstica e intervención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Consultas Generales</p>
                    <p className="text-xl font-bold">€35/consulta</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Pruebas Imagen</p>
                    <p className="text-xl font-bold">€120/prueba</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Intervenciones</p>
                    <p className="text-xl font-bold">€850/interv.</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestión Farmacia y Material Sanitario
              </CardTitle>
              <CardDescription>
                Control de stock, valoración y trazabilidad de productos sanitarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Stock Farmacia</p>
                    <p className="text-xl font-bold">€45,200</p>
                    <p className="text-xs text-muted-foreground">1,245 referencias</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-purple-700">Material Fungible</p>
                    <p className="text-xl font-bold">€18,500</p>
                    <p className="text-xs text-muted-foreground">450 referencias</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profesionales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nóminas y Retribuciones Profesionales
              </CardTitle>
              <CardDescription>
                Gestión de nóminas, guardias, productividad y colaboradores externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Personal Plantilla</p>
                    <p className="text-sm text-muted-foreground">45 profesionales</p>
                  </div>
                  <Badge>€185,000/mes</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Colaboradores Externos</p>
                    <p className="text-sm text-muted-foreground">12 especialistas</p>
                  </div>
                  <Badge>€28,500/mes</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Guardias y Productividad</p>
                    <p className="text-sm text-muted-foreground">Variable mensual</p>
                  </div>
                  <Badge>€15,200/mes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
