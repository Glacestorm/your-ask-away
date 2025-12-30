import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';
import { 
  Building2, Home, Key, FileText, 
  Receipt, TrendingUp, Percent, Users,
  Calendar, Coins
} from 'lucide-react';

export function VerticalAccountingRealEstate() {
  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Inmobiliaria</h1>
            <p className="text-muted-foreground">Gestión contable para sector inmobiliario</p>
          </div>
        </div>
        <Badge className="bg-cyan-500/10 text-cyan-600">Inmobiliaria</Badge>
      </div>

      <Tabs defaultValue="alquileres" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="alquileres">Alquileres</TabsTrigger>
          <TabsTrigger value="ventas">Compraventas</TabsTrigger>
          <TabsTrigger value="comunidades">Comunidades</TabsTrigger>
          <TabsTrigger value="activos">Activos Inmob.</TabsTrigger>
          <TabsTrigger value="irpf">IRPF/IS Inmuebles</TabsTrigger>
        </TabsList>

        <TabsContent value="alquileres" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="h-5 w-5 text-cyan-600" />
                  Inmuebles Alquilados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Contratos activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Rentas Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€38,450</p>
                <p className="text-sm text-muted-foreground">Diciembre 2024</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="h-5 w-5 text-amber-600" />
                  Morosidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">3.2%</p>
                <p className="text-sm text-muted-foreground">€1,230 pendiente</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">5.8%</p>
                <p className="text-sm text-muted-foreground">Yield bruto</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ventas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Compraventas y Promociones
              </CardTitle>
              <CardDescription>
                Contabilización de compraventas, promociones y entregas a cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">Ventas 2024</p>
                    <p className="text-xl font-bold">€2,450,000</p>
                    <p className="text-xs text-muted-foreground">8 operaciones</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-700">Entregas a Cuenta</p>
                    <p className="text-xl font-bold">€185,000</p>
                    <p className="text-xs text-muted-foreground">Promoción en curso</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-purple-700">Plusvalías</p>
                    <p className="text-xl font-bold">€324,500</p>
                    <p className="text-xs text-muted-foreground">Resultados ventas</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comunidades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administración de Comunidades
              </CardTitle>
              <CardDescription>
                Contabilidad de comunidades de propietarios y fincas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Comunidad Residencial Parque Norte</p>
                    <p className="text-sm text-muted-foreground">48 propietarios</p>
                  </div>
                  <Badge>€8,450/mes</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Edificio Comercial Centro</p>
                    <p className="text-sm text-muted-foreground">12 locales</p>
                  </div>
                  <Badge>€4,200/mes</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Urbanización Las Palmeras</p>
                    <p className="text-sm text-muted-foreground">85 viviendas</p>
                  </div>
                  <Badge>€12,500/mes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cartera de Activos Inmobiliarios
              </CardTitle>
              <CardDescription>
                Valoración, amortización y deterioro de activos inmobiliarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-cyan-500/10 border-cyan-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-cyan-700">Inversiones Inmobiliarias</p>
                    <p className="text-xl font-bold">€4,850,000</p>
                    <p className="text-xs text-muted-foreground">Valor contable neto</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">Existencias (Promociones)</p>
                    <p className="text-xl font-bold">€1,250,000</p>
                    <p className="text-xs text-muted-foreground">Obra en curso</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="irpf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Fiscalidad Inmobiliaria
              </CardTitle>
              <CardDescription>
                IRPF rendimientos inmobiliarios, IS e imputación de rentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Rendimientos Capital Inmobiliario</p>
                    <p className="text-sm text-muted-foreground">Ingresos - Gastos deducibles</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€285,400</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Amortización Deducible (3%)</p>
                    <p className="text-sm text-muted-foreground">Sobre valor construcción</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600">€42,800</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Imputación Rentas Inmobiliarias</p>
                    <p className="text-sm text-muted-foreground">Inmuebles no alquilados (1.1%)</p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600">€8,250</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="real_estate" className="mt-6" />
      <VerticalHelpButton verticalType="real_estate" />
    </div>
  );
}
