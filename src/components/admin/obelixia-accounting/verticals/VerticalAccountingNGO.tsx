import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, Users, FileText, Globe,
  BarChart3, TrendingUp, Calculator, Receipt,
  Wallet, Target, HandHeart, Building2,
  ArrowUpRight, ArrowDownRight, Sparkles, Brain,
  CheckCircle, AlertTriangle, PiggyBank, Gift,
  Shield, Calendar, Landmark, Award
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

export function VerticalAccountingNGO() {
  const kpis = [
    { label: 'Fondos Captados', value: '€345,600', change: '+15.2%', positive: true, icon: Heart },
    { label: 'Program Ratio', value: '82.4%', change: '+2.1%', positive: true, icon: Target },
    { label: 'Donantes Activos', value: '4,562', change: '+8.7%', positive: true, icon: Users },
    { label: 'Admin Ratio', value: '8.2%', change: '-1.2%', positive: true, icon: Building2 },
  ];

  const funds = [
    { name: 'Educación Rural', type: 'Restringido', budget: 150000, spent: 98000, available: 52000, deadline: '2025-12-31' },
    { name: 'Emergencias Humanitarias', type: 'Temporal', budget: 80000, spent: 75000, available: 5000, deadline: '2025-03-31' },
    { name: 'Operaciones Generales', type: 'Sin Restricción', budget: 200000, spent: 125000, available: 75000, deadline: null },
    { name: 'Dotación Patrimonial', type: 'Permanente', budget: 500000, spent: 0, available: 500000, deadline: null },
  ];

  const grants = [
    { funder: 'Comisión Europea', project: 'HORIZON-2025-EDU', amount: 250000, reported: 180000, status: 'active' },
    { funder: 'Fundación BBVA', project: 'Inclusión Digital', amount: 75000, reported: 75000, status: 'completed' },
    { funder: 'AECID', project: 'Cooperación Sahel', amount: 180000, reported: 45000, status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad ONG/Fundaciones</h1>
            <p className="text-muted-foreground">Fund Accounting, Grant Management & Donor Reporting</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-rose-500/10 text-rose-600">Non-Profit</Badge>
          <Badge variant="outline" className="animate-pulse">
            <Shield className="h-3 w-3 mr-1" />
            GAAP/IFRS NPO
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-rose-600" />
                <Badge variant={kpi.positive ? "default" : "destructive"} className="text-xs">
                  {kpi.positive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {kpi.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="funds" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="funds">Fund Accounting</TabsTrigger>
          <TabsTrigger value="grants">Subvenciones</TabsTrigger>
          <TabsTrigger value="donors">Donantes</TabsTrigger>
          <TabsTrigger value="programs">Programas</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
          <TabsTrigger value="impact">Impacto Social</TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-rose-600" />
                Contabilidad por Fondos (Fund Accounting)
              </CardTitle>
              <CardDescription>
                Gestión de fondos restringidos, temporales, sin restricción y permanentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {funds.map((fund, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      fund.type === 'Restringido' ? 'bg-amber-500/5 border-amber-500/20' :
                      fund.type === 'Temporal' ? 'bg-blue-500/5 border-blue-500/20' :
                      fund.type === 'Sin Restricción' ? 'bg-green-500/5 border-green-500/20' :
                      'bg-purple-500/5 border-purple-500/20'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-bold">{fund.name}</p>
                          <p className="text-sm text-muted-foreground">{fund.type}</p>
                        </div>
                        <div className="text-right">
                          {fund.deadline && (
                            <Badge variant="outline" className="mb-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {fund.deadline}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Presupuesto</p>
                          <p className="font-medium">€{fund.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gastado</p>
                          <p className="font-medium text-rose-600">€{fund.spent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Disponible</p>
                          <p className="font-medium text-green-600">€{fund.available.toLocaleString()}</p>
                        </div>
                      </div>
                      <Progress value={(fund.spent / fund.budget) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grants" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-rose-600" />
                  Gestión de Subvenciones
                </CardTitle>
                <CardDescription>
                  Tracking de grants públicos y privados con justificación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grants.map((grant, idx) => (
                    <div key={idx} className="p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-bold">{grant.project}</p>
                          <p className="text-sm text-muted-foreground">{grant.funder}</p>
                        </div>
                        <Badge variant={grant.status === 'active' ? 'secondary' : 'default'}>
                          {grant.status === 'active' ? 'Activo' : <><CheckCircle className="h-3 w-3 mr-1" />Completado</>}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-muted-foreground">Importe</p>
                          <p className="font-medium">€{grant.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Justificado</p>
                          <p className="font-medium">€{grant.reported.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">% Ejecución</p>
                          <p className="font-medium">{Math.round((grant.reported / grant.amount) * 100)}%</p>
                        </div>
                      </div>
                      <Progress value={(grant.reported / grant.amount) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-rose-600" />
                  Justificación & Reporting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-muted-foreground">Justificados</p>
                      <p className="text-xl font-bold">8</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="pt-4 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-xl font-bold">3</p>
                    </CardContent>
                  </Card>
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Memoria Justificativa
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="donors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-600" />
                Gestión de Donantes (Donor Management)
              </CardTitle>
              <CardDescription>
                CRM de donantes con análisis de retención y lifetime value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10">
                  <CardContent className="pt-4 text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-rose-600" />
                    <p className="text-sm text-muted-foreground">Donantes Individuales</p>
                    <p className="text-xl font-bold">3,842</p>
                    <p className="text-xs text-green-600">+12% YoY</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                  <CardContent className="pt-4 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Empresas Patrocinadoras</p>
                    <p className="text-xl font-bold">45</p>
                    <p className="text-xs text-green-600">+8 nuevas</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10">
                  <CardContent className="pt-4 text-center">
                    <PiggyBank className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-muted-foreground">Socios Recurrentes</p>
                    <p className="text-xl font-bold">675</p>
                    <p className="text-xs">€18.5/mes promedio</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Tasa Retención</p>
                    <p className="text-xl font-bold">78.5%</p>
                    <p className="text-xs text-green-600">+5% vs sector</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Gift className="h-5 w-5" />
                  <span className="text-xs">Campañas Captación</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Receipt className="h-5 w-5" />
                  <span className="text-xs">Certificados Fiscales</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-rose-600" />
                Contabilidad por Programas
              </CardTitle>
              <CardDescription>
                Cost allocation y functional expense reporting por programa/proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Program Services</span>
                      <Badge className="bg-green-500">82.4%</Badge>
                    </div>
                    <p className="text-2xl font-bold">€284,520</p>
                    <p className="text-xs text-muted-foreground">Actividades misionales</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Fundraising</span>
                      <Badge variant="secondary">9.4%</Badge>
                    </div>
                    <p className="text-2xl font-bold">€32,450</p>
                    <p className="text-xs text-muted-foreground">Captación de fondos</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Management</span>
                      <Badge variant="outline">8.2%</Badge>
                    </div>
                    <p className="text-2xl font-bold">€28,330</p>
                    <p className="text-xs text-muted-foreground">Administración general</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-gradient-to-r from-rose-500/5 to-pink-500/5 rounded-lg border border-rose-500/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Total Gastos Funcionales</p>
                    <p className="text-sm text-muted-foreground">Program Ratio superior al 80% - Excelente</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-rose-600">€345,300</p>
                    <Badge className="bg-green-500 mt-1">
                      <Award className="h-3 w-3 mr-1" />
                      Certificación A+
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-rose-600" />
                Cumplimiento Normativo ONG
              </CardTitle>
              <CardDescription>
                Ley de Fundaciones, Mecenazgo, Protectorado y normativa autonómica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Cuentas Anuales</p>
                    <Badge className="mt-1">Depositadas</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Modelo 182</p>
                    <Badge className="mt-1">Presentado</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                    <p className="text-sm font-medium">Plan Actuación</p>
                    <Badge variant="secondary" className="mt-1">En proceso</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Auditoría</p>
                    <Badge className="mt-1">Sin salvedades</Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Memoria Anual</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Landmark className="h-5 w-5" />
                  <span className="text-xs">Informe Protectorado</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-rose-600" />
                Medición de Impacto Social
              </CardTitle>
              <CardDescription>
                KPIs de impacto, SROI y reporting ESG para stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Beneficiarios Directos</p>
                    <p className="text-2xl font-bold">12,450</p>
                    <p className="text-xs text-green-600">+24% YoY</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                  <CardContent className="pt-4 text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Países Impactados</p>
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-xs">3 continentes</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-sm text-muted-foreground">SROI</p>
                    <p className="text-2xl font-bold">4.2x</p>
                    <p className="text-xs">Por cada € invertido</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10">
                  <CardContent className="pt-4 text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-muted-foreground">ODS Contribuidos</p>
                    <p className="text-2xl font-bold">6</p>
                    <p className="text-xs">Objetivos activos</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Informe Impacto</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Brain className="h-5 w-5" />
                  <span className="text-xs">Calcular SROI IA</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="ngo" className="mt-6" />
      <VerticalHelpButton verticalType="ngo" />
    </div>
  );
}
