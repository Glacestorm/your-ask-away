import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Scale, FileText, Clock, Users,
  BarChart3, TrendingUp, Calculator, Receipt,
  Briefcase, Timer, CircleDollarSign, Gavel,
  ArrowUpRight, ArrowDownRight, Sparkles, Brain,
  CheckCircle, AlertTriangle, Building2, Wallet
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

export function VerticalAccountingLegal() {
  const kpis = [
    { label: 'Facturación Mes', value: '€145,600', change: '+8.4%', positive: true, icon: CircleDollarSign },
    { label: 'Horas Facturables', value: '1,245', change: '+12.1%', positive: true, icon: Timer },
    { label: 'Utilization Rate', value: '78.5%', change: '+3.2%', positive: true, icon: TrendingUp },
    { label: 'WIP Pendiente', value: '€89,400', change: '-5.6%', positive: true, icon: Clock },
  ];

  const matters = [
    { id: 'EXP-2025-0045', client: 'Tech Solutions SL', type: 'M&A', budget: 50000, billed: 32500, wip: 8400, status: 'active' },
    { id: 'EXP-2025-0078', client: 'Inversiones Globales', type: 'Litigio', budget: 120000, billed: 95000, wip: 15600, status: 'active' },
    { id: 'EXP-2025-0092', client: 'Startup Innovation', type: 'Mercantil', budget: 25000, billed: 24800, wip: 200, status: 'closing' },
  ];

  const timekeepers = [
    { name: 'María García', role: 'Socia', rate: 350, hoursMonth: 145, utilization: 82, billed: 50750 },
    { name: 'Carlos López', role: 'Asociado Senior', rate: 220, hoursMonth: 168, utilization: 78, billed: 36960 },
    { name: 'Ana Martínez', role: 'Asociado', rate: 150, hoursMonth: 172, utilization: 85, billed: 25800 },
    { name: 'Luis Rodríguez', role: 'Junior', rate: 95, hoursMonth: 176, utilization: 91, billed: 16720 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Legal</h1>
            <p className="text-muted-foreground">Practice Management & Legal Billing con IA</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-slate-500/10 text-slate-700">Legal Tech</Badge>
          <Badge variant="outline" className="animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            Time Tracking AI
          </Badge>
        </div>
      </div>

      {/* KPIs en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-slate-600" />
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

      <Tabs defaultValue="billing" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="matters">Expedientes</TabsTrigger>
          <TabsTrigger value="timekeeping">Time Tracking</TabsTrigger>
          <TabsTrigger value="trust">Cuentas Clientes</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
          <TabsTrigger value="ai">IA Legal Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-600" />
                  Modalidades de Facturación
                </CardTitle>
                <CardDescription>
                  Honorarios por hora, forfait, éxito y mixto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Por Horas
                      </span>
                      <span className="font-bold">€89,500</span>
                    </div>
                    <Progress value={62} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">62% del total</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Forfait/Iguala
                      </span>
                      <span className="font-bold">€42,000</span>
                    </div>
                    <Progress value={29} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">29% del total</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Cuota Litis/Éxito
                      </span>
                      <span className="font-bold">€14,100</span>
                    </div>
                    <Progress value={9} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">9% del total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-600" />
                  Antigüedad WIP & Facturas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">0-30 días</p>
                      <p className="text-xl font-bold text-green-600">€45,200</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">31-60 días</p>
                      <p className="text-xl font-bold text-amber-600">€28,400</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10 border-orange-500/20">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">61-90 días</p>
                      <p className="text-xl font-bold text-orange-600">€12,300</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">+90 días</p>
                      <p className="text-xl font-bold text-red-600">€3,500</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-600" />
                Gestión de Expedientes - Financial Tracking
              </CardTitle>
              <CardDescription>
                Seguimiento financiero por expediente con presupuestos y desviaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {matters.map((matter, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      matter.status === 'active' ? 'bg-blue-500/5 border-blue-500/20' :
                      'bg-green-500/5 border-green-500/20'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-bold">{matter.id}</p>
                          <p className="text-sm text-muted-foreground">{matter.client} - {matter.type}</p>
                        </div>
                        <Badge variant={matter.status === 'active' ? 'secondary' : 'default'}>
                          {matter.status === 'active' ? 'Activo' : 'Cierre'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Presupuesto</p>
                          <p className="font-medium">€{matter.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Facturado</p>
                          <p className="font-medium text-green-600">€{matter.billed.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">WIP</p>
                          <p className="font-medium text-amber-600">€{matter.wip.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Consumido</p>
                          <p className="font-medium">{Math.round(((matter.billed + matter.wip) / matter.budget) * 100)}%</p>
                        </div>
                      </div>
                      <Progress value={((matter.billed + matter.wip) / matter.budget) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timekeeping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-slate-600" />
                Time Tracking por Profesional
              </CardTitle>
              <CardDescription>
                Productividad y horas facturables por timekeeper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timekeepers.map((tk, idx) => (
                  <div key={idx} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold">
                          {tk.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{tk.name}</p>
                          <p className="text-sm text-muted-foreground">{tk.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline">€{tk.rate}/h</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Horas/Mes</p>
                        <p className="font-medium">{tk.hoursMonth}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Utilization</p>
                        <div className="flex items-center gap-2">
                          <Progress value={tk.utilization} className="h-2 flex-1" />
                          <span className="font-medium text-xs">{tk.utilization}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Facturado</p>
                        <p className="font-medium text-green-600">€{tk.billed.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Objetivo</p>
                        <Badge variant={tk.utilization >= 80 ? 'default' : 'secondary'}>
                          {tk.utilization >= 80 ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                          {tk.utilization >= 80 ? 'Cumple' : 'Por debajo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-slate-600" />
                Cuentas de Clientes (Trust Accounts)
              </CardTitle>
              <CardDescription>
                Gestión de provisiones de fondos y cuentas de terceros según normativa colegial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Provisiones Recibidas</p>
                    <p className="text-2xl font-bold">€245,600</p>
                    <p className="text-xs text-muted-foreground">23 clientes activos</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Aplicadas a Facturas</p>
                    <p className="text-2xl font-bold">€189,400</p>
                    <p className="text-xs text-muted-foreground">Este trimestre</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Pendientes Devolver</p>
                    <p className="text-2xl font-bold">€12,400</p>
                    <p className="text-xs text-amber-600">5 expedientes cerrados</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Receipt className="h-5 w-5" />
                  <span className="text-xs">Nueva Provisión</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <Calculator className="h-5 w-5" />
                  <span className="text-xs">Conciliar Trust</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-600" />
                Análisis de Rentabilidad
              </CardTitle>
              <CardDescription>
                Rentabilidad por cliente, área de práctica y profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="pt-4 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-muted-foreground">Margen por Cliente</p>
                    <p className="text-2xl font-bold text-green-600">42.5%</p>
                    <p className="text-xs">Promedio top 10</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="pt-4 text-center">
                    <Scale className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Área más Rentable</p>
                    <p className="text-2xl font-bold">M&A</p>
                    <p className="text-xs text-green-600">58% margen</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <CardContent className="pt-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm text-muted-foreground">Revenue/Partner</p>
                    <p className="text-2xl font-bold">€420K</p>
                    <p className="text-xs text-green-600">+8% YoY</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-slate-600" />
                IA para Legal Billing
              </CardTitle>
              <CardDescription>
                Automatización de time entries, narrativas y revisión de facturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Timer className="h-5 w-5" />
                  <span className="text-xs">Auto Time Entry</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Narrativas IA</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Gavel className="h-5 w-5" />
                  <span className="text-xs">LEDES/UTBMS</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs">Bill Review AI</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VerticalAIAgentPanel verticalType="legal" className="mt-6" />
      <VerticalHelpButton verticalType="legal" />
    </div>
  );
}
