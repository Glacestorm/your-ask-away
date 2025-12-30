import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wheat, TrendingUp, Calendar, FileText, 
  CloudRain, Leaf, Tractor, BarChart3,
  Calculator, Coins, Receipt
} from 'lucide-react';

export function VerticalAccountingAgriculture() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            <Wheat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Agrícola</h1>
            <p className="text-muted-foreground">Gestión contable especializada para el sector agrario</p>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-600">Agricultura</Badge>
      </div>

      <Tabs defaultValue="campanas" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
          <TabsTrigger value="pac">PAC/Subvenciones</TabsTrigger>
          <TabsTrigger value="costes">Costes por Parcela</TabsTrigger>
          <TabsTrigger value="iva-agricola">IVA Agrícola</TabsTrigger>
          <TabsTrigger value="amortizaciones">Amortizaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="campanas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Campaña Activa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">2024/2025</p>
                <p className="text-sm text-muted-foreground">Septiembre 2024 - Agosto 2025</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Hectáreas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">245.5 Ha</p>
                <p className="text-sm text-muted-foreground">12 parcelas registradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Coins className="h-5 w-5 text-green-600" />
                  Resultado Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">+€45,230</p>
                <p className="text-sm text-muted-foreground">Proyección campaña</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Campañas Agrícolas</CardTitle>
              <CardDescription>
                Contabilidad por campaña agrícola con seguimiento de cultivos, costes y rendimientos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Calendar className="h-5 w-5" />
                  Nueva Campaña
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  Cierre de Campaña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pac" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Gestión PAC y Subvenciones Agrarias
              </CardTitle>
              <CardDescription>
                Automatización de contabilización de ayudas PAC, eco-esquemas y subvenciones autonómicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Ayudas PAC 2024</p>
                    <p className="text-xl font-bold">€28,450</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Eco-esquemas</p>
                    <p className="text-xl font-bold">€8,200</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Ayudas Autonómicas</p>
                    <p className="text-xl font-bold">€5,600</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tractor className="h-5 w-5" />
                Costes por Parcela y Cultivo
              </CardTitle>
              <CardDescription>
                Analítica de costes desglosada por parcela, cultivo y tipo de gasto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una parcela para ver el desglose de costes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iva-agricola" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Régimen IVA Agrícola Especial
              </CardTitle>
              <CardDescription>
                Gestión del régimen especial de IVA para actividades agrícolas, ganaderas y forestales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">Compensación REAG</p>
                    <p className="text-xl font-bold">12% productos / 10.5% servicios</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Régimen General</p>
                    <p className="text-xl font-bold">IVA deducible estándar</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amortizaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Amortizaciones Agrarias
              </CardTitle>
              <CardDescription>
                Amortización de maquinaria agrícola, instalaciones de riego y activos biológicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tractor John Deere 6130R</p>
                    <p className="text-sm text-muted-foreground">10 años lineal</p>
                  </div>
                  <Badge>€8,500/año</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sistema de Riego por Goteo</p>
                    <p className="text-sm text-muted-foreground">15 años lineal</p>
                  </div>
                  <Badge>€2,400/año</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Plantación de Olivos (200 Ha)</p>
                    <p className="text-sm text-muted-foreground">25 años activo biológico</p>
                  </div>
                  <Badge>€12,000/año</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
