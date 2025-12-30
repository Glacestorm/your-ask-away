import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Hotel, Utensils, Calendar, Receipt, 
  Users, TrendingUp, Percent, CreditCard,
  Wine, Coffee
} from 'lucide-react';

export function VerticalAccountingHospitality() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Hostelería</h1>
            <p className="text-muted-foreground">Gestión contable para hoteles, restaurantes y ocio</p>
          </div>
        </div>
        <Badge className="bg-purple-500/10 text-purple-600">Hostelería</Badge>
      </div>

      <Tabs defaultValue="ingresos" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="ingresos">Ingresos Diarios</TabsTrigger>
          <TabsTrigger value="costes">Costes F&B</TabsTrigger>
          <TabsTrigger value="ocupacion">RevPAR/Ocupación</TabsTrigger>
          <TabsTrigger value="propinas">Propinas/Extras</TabsTrigger>
          <TabsTrigger value="iva-reducido">IVA Reducido</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hotel className="h-5 w-5 text-purple-600" />
                  Habitaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€45,200</p>
                <p className="text-sm text-muted-foreground">Hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  Restaurante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€12,450</p>
                <p className="text-sm text-muted-foreground">Hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wine className="h-5 w-5 text-red-600" />
                  Bar/Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€3,850</p>
                <p className="text-sm text-muted-foreground">Hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Coffee className="h-5 w-5 text-amber-600" />
                  Otros Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€1,250</p>
                <p className="text-sm text-muted-foreground">Spa, Minibar, etc.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Control Costes Food & Beverage
              </CardTitle>
              <CardDescription>
                Ratio de coste de alimentos y bebidas sobre ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">Food Cost</p>
                    <p className="text-xl font-bold">28.5%</p>
                    <p className="text-xs text-muted-foreground">Objetivo: 30%</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">Beverage Cost</p>
                    <p className="text-xl font-bold">22.3%</p>
                    <p className="text-xs text-muted-foreground">Objetivo: 20%</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">F&B Total</p>
                    <p className="text-xl font-bold">26.1%</p>
                    <p className="text-xs text-muted-foreground">Combinado</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocupacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                KPIs Hoteleros
              </CardTitle>
              <CardDescription>
                RevPAR, ADR, ocupación y otros indicadores clave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Ocupación</p>
                    <p className="text-xl font-bold">78.5%</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">ADR</p>
                    <p className="text-xl font-bold">€145</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">RevPAR</p>
                    <p className="text-xl font-bold">€113.83</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">GOPPAR</p>
                    <p className="text-xl font-bold">€68.50</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="propinas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Propinas y Extras
              </CardTitle>
              <CardDescription>
                Gestión contable de propinas con tarjeta y distribución entre personal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">Propinas Mes</p>
                    <p className="text-xl font-bold">€4,850</p>
                    <p className="text-xs text-muted-foreground">Para distribución</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Extras No Incluidos</p>
                    <p className="text-xl font-bold">€2,340</p>
                    <p className="text-xs text-muted-foreground">Servicios adicionales</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iva-reducido" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Gestión IVA Hostelería
              </CardTitle>
              <CardDescription>
                Tipos reducidos para alojamiento, restauración y servicios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Alojamiento Hotelero</p>
                    <p className="text-sm text-muted-foreground">IVA 10% reducido</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€45,200</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Restauración</p>
                    <p className="text-sm text-muted-foreground">IVA 10% reducido</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€12,450</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Bebidas Alcohólicas</p>
                    <p className="text-sm text-muted-foreground">IVA 21% general</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600">€3,850</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
