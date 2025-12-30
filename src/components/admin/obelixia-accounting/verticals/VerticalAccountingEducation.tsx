import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';
import { 
  GraduationCap, Users, Calendar, FileText, 
  CreditCard, Receipt, BookOpen, Building2,
  PiggyBank, TrendingUp
} from 'lucide-react';

export function VerticalAccountingEducation() {
  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Educativa</h1>
            <p className="text-muted-foreground">Gestión contable para centros educativos y academias</p>
          </div>
        </div>
        <Badge className="bg-blue-500/10 text-blue-600">Educación</Badge>
      </div>

      <Tabs defaultValue="matriculas" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
          <TabsTrigger value="cuotas">Cuotas y Pagos</TabsTrigger>
          <TabsTrigger value="becas">Becas/Subvenciones</TabsTrigger>
          <TabsTrigger value="costes">Costes por Curso</TabsTrigger>
          <TabsTrigger value="actividades">Actividades Extra</TabsTrigger>
        </TabsList>

        <TabsContent value="matriculas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  Alumnos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">1,245</p>
                <p className="text-sm text-muted-foreground">Curso 2024/25</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Matrículas Cobradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">€124,500</p>
                <p className="text-sm text-muted-foreground">Este trimestre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  Pendiente Cobro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">€8,450</p>
                <p className="text-sm text-muted-foreground">15 matrículas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Tasa Cobro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">93.6%</p>
                <p className="text-sm text-muted-foreground">+2.1% vs año anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cuotas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gestión de Cuotas Mensuales
              </CardTitle>
              <CardDescription>
                Domiciliaciones, SEPA, recibos y gestión de impagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-700">Cobradas Diciembre</p>
                    <p className="text-xl font-bold">€89,450</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-700">Pendientes</p>
                    <p className="text-xl font-bold">€4,200</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm text-red-700">Devueltas</p>
                    <p className="text-xl font-bold">€1,850</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="becas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Becas y Subvenciones Educativas
              </CardTitle>
              <CardDescription>
                Control de becas públicas, ayudas autonómicas y descuentos propios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Becas MEC Comedor</p>
                    <p className="text-sm text-muted-foreground">45 beneficiarios</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€32,400</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Ayudas Autonómicas Material</p>
                    <p className="text-sm text-muted-foreground">120 beneficiarios</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600">€18,000</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Descuento Hermanos</p>
                    <p className="text-sm text-muted-foreground">85 familias</p>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600">€12,750</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Costes por Curso y Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analítica de costes por curso, departamento y actividad</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Actividades Extraescolares
              </CardTitle>
              <CardDescription>
                Gestión contable de comedor, transporte, actividades deportivas y culturales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Servicio Comedor</p>
                    <p className="text-xl font-bold">€45,200/mes</p>
                    <p className="text-xs text-muted-foreground">340 usuarios</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Transporte Escolar</p>
                    <p className="text-xl font-bold">€18,500/mes</p>
                    <p className="text-xs text-muted-foreground">4 rutas</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="education" className="mt-6" />
      <VerticalHelpButton verticalType="education" />
    </div>
  );
}
