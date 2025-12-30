import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, Sun, Wind, Battery, 
  TrendingUp, Receipt, Leaf, BarChart3,
  Factory, Gauge
} from 'lucide-react';

export function VerticalAccountingEnergy() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Energética</h1>
            <p className="text-muted-foreground">Gestión contable para sector energético y renovables</p>
          </div>
        </div>
        <Badge className="bg-yellow-500/10 text-yellow-600">Energía</Badge>
      </div>

      <Tabs defaultValue="produccion" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="primas">Primas/Subvenciones</TabsTrigger>
          <TabsTrigger value="mercados">Mercados</TabsTrigger>
          <TabsTrigger value="carbono">Huella Carbono</TabsTrigger>
          <TabsTrigger value="activos">Activos Energéticos</TabsTrigger>
        </TabsList>

        <TabsContent value="produccion" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sun className="h-5 w-5 text-yellow-600" />
                  Solar Fotovoltaica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">2.4 MW</p>
                <p className="text-sm text-muted-foreground">Potencia instalada</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wind className="h-5 w-5 text-blue-600" />
                  Eólica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">5.0 MW</p>
                <p className="text-sm text-muted-foreground">3 aerogeneradores</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gauge className="h-5 w-5 text-green-600" />
                  Producción Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">1,245 MWh</p>
                <p className="text-sm text-muted-foreground">+15% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">€89,450</p>
                <p className="text-sm text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="primas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Primas y Subvenciones Energéticas
              </CardTitle>
              <CardDescription>
                Gestión de primas RECORE, certificados verdes y ayudas a la inversión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">Prima RECORE</p>
                    <p className="text-xl font-bold">€42,800/mes</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Certificados GdO</p>
                    <p className="text-xl font-bold">€8,500/mes</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-purple-700">Ayudas Inversión</p>
                    <p className="text-xl font-bold">€125,000</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mercados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contabilización Mercados Eléctricos
              </CardTitle>
              <CardDescription>
                Pool diario, mercado intradiario, PPAs y contratos bilaterales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Integración con OMIE para contabilización automática</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carbono" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Contabilidad de Huella de Carbono
              </CardTitle>
              <CardDescription>
                Emisiones evitadas, créditos de carbono y reporting ESG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">CO₂ Evitado (2024)</p>
                    <p className="text-xl font-bold">4,520 tCO₂</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Valor Créditos</p>
                    <p className="text-xl font-bold">€135,600</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Activos Energéticos
              </CardTitle>
              <CardDescription>
                Amortización de paneles, aerogeneradores y sistemas de almacenamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Parque Solar "Los Olivos"</p>
                    <p className="text-sm text-muted-foreground">25 años - €2.4M inversión</p>
                  </div>
                  <Badge>€96,000/año</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Parque Eólico "Sierra Norte"</p>
                    <p className="text-sm text-muted-foreground">20 años - €8.5M inversión</p>
                  </div>
                  <Badge>€425,000/año</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sistema Baterías BESS</p>
                    <p className="text-sm text-muted-foreground">15 años - €450K inversión</p>
                  </div>
                  <Badge>€30,000/año</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
