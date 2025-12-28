/**
 * Tax Declarations Component
 * Gestión de declaraciones fiscales: IVA, IRPF, IS
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Receipt,
  Calculator,
  Calendar,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Send,
  Download,
  Eye,
  RefreshCw,
  Euro,
  Percent,
  Building2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useObelixiaFiscal, TaxDeclaration, VATSummary } from '@/hooks/admin/obelixia-accounting/useObelixiaFiscal';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function TaxDeclarations() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [showVATDialog, setShowVATDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submissionRef, setSubmissionRef] = useState('');

  const {
    isLoading,
    declarations,
    currentDeclaration,
    vatSummary,
    taxCalendar,
    fetchDeclarations,
    calculateVAT,
    calculateIRPF,
    calculateCorporateTax,
    submitDeclaration,
    getTaxCalendar,
    setCurrentDeclaration
  } = useObelixiaFiscal();

  useEffect(() => {
    fetchDeclarations(selectedYear);
    getTaxCalendar(selectedYear);
  }, [selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Borrador</Badge>;
      case 'calculated':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Calculator className="h-3 w-3 mr-1" />Calculado</Badge>;
      case 'reviewed':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><Eye className="h-3 w-3 mr-1" />Revisado</Badge>;
      case 'submitted':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"><Send className="h-3 w-3 mr-1" />Presentado</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Pagado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCalendarStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800';
      case 'pending': return 'bg-amber-100 border-amber-300 dark:bg-amber-950 dark:border-amber-800';
      case 'overdue': return 'bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800';
      case 'upcoming': return 'bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800';
      default: return 'bg-muted';
    }
  };

  const getDeclarationTypeName = (type: string) => {
    const names: Record<string, string> = {
      'vat_303': 'Modelo 303 - IVA Trimestral',
      'vat_390': 'Modelo 390 - Resumen Anual IVA',
      'irpf_111': 'Modelo 111 - IRPF Retenciones',
      'irpf_190': 'Modelo 190 - Resumen IRPF',
      'is_200': 'Modelo 200 - Impuesto Sociedades',
      'modelo_347': 'Modelo 347 - Operaciones con Terceros',
      'modelo_349': 'Modelo 349 - Operaciones Intracomunitarias'
    };
    return names[type] || type;
  };

  const handleCalculateVAT = async () => {
    await calculateVAT(selectedPeriod, selectedYear);
    setShowVATDialog(true);
  };

  const handleCalculateIRPF = async () => {
    await calculateIRPF(selectedPeriod, selectedYear);
  };

  const handleSubmit = async () => {
    if (currentDeclaration) {
      await submitDeclaration(currentDeclaration.id, submissionRef);
      setShowSubmitDialog(false);
      setSubmissionRef('');
    }
  };

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const periods = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

  // Upcoming declarations from calendar
  const upcomingDeclarations = taxCalendar
    .filter(c => c.status !== 'completed')
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Declaraciones Fiscales
          </h2>
          <p className="text-sm text-muted-foreground">
            IVA, IRPF e Impuesto de Sociedades
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDeclarations(selectedYear)}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleCalculateVAT}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Euro className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">Calcular IVA</p>
              <p className="text-xs text-muted-foreground">Modelo 303</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleCalculateIRPF}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">Calcular IRPF</p>
              <p className="text-xs text-muted-foreground">Modelo 111</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => calculateCorporateTax(selectedYear - 1)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Imp. Sociedades</p>
              <p className="text-xs text-muted-foreground">Modelo 200</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium">Mod. 347</p>
              <p className="text-xs text-muted-foreground">Terceros +3.005€</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="declarations" className="flex items-center gap-1">
            <FileCheck className="h-4 w-4" />
            Declaraciones
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Resumen IVA
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Upcoming */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Próximos Vencimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeclarations.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        getCalendarStatusColor(item.status)
                      )}
                    >
                      <div className="flex items-center gap-3">
                                <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {format(new Date(item.due_date), 'd')}
                          </p>
                          <p className="text-xs uppercase text-muted-foreground">
                            {format(new Date(item.due_date), 'MMM', { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {getDeclarationTypeName(item.declaration_type)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.days_remaining <= 0 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Vencido
                          </Badge>
                        ) : item.days_remaining <= 7 ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            {item.days_remaining} días
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {item.days_remaining} días
                          </Badge>
                        )}
                        {item.estimated_amount !== undefined && (
                          <p className="text-sm font-mono mt-1">
                            {formatCurrency(item.estimated_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {upcomingDeclarations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                      <p>No hay declaraciones pendientes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quarter Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Trimestre Actual</span>
                  <Badge variant="outline">T{currentQuarter}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>IVA Devengado</span>
                    <span className="font-mono">{formatCurrency(vatSummary?.total_cuotas_devengadas || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA Soportado</span>
                    <span className="font-mono">{formatCurrency(vatSummary?.iva_soportado_deducible || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2 font-medium">
                    <span>Resultado IVA</span>
                    <span className={cn(
                      "font-mono",
                      (vatSummary?.resultado || 0) > 0 ? "text-red-600" : "text-emerald-600"
                    )}>
                      {formatCurrency(vatSummary?.resultado || 0)}
                    </span>
                  </div>
                </div>

                <Button className="w-full" onClick={handleCalculateVAT} disabled={isLoading}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalcular IVA
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Declarations List */}
        <TabsContent value="declarations">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Histórico de Declaraciones</CardTitle>
                <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declarations.map((decl) => (
                    <TableRow key={decl.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getDeclarationTypeName(decl.declaration_type)}</p>
                          <p className="text-xs text-muted-foreground">{decl.fiscal_year}</p>
                        </div>
                      </TableCell>
                      <TableCell>{decl.period}</TableCell>
                      <TableCell>
                        {format(new Date(decl.due_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        decl.net_amount > 0 ? "text-red-600" : "text-emerald-600"
                      )}>
                        {formatCurrency(decl.net_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(decl.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentDeclaration(decl)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {decl.status === 'calculated' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setCurrentDeclaration(decl);
                                setShowSubmitDialog(true);
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {declarations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay declaraciones para el año {selectedYear}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VAT Summary */}
        <TabsContent value="summary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">IVA Repercutido (Ventas)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Base Imponible</TableHead>
                      <TableHead className="text-right">Cuota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>IVA 21%</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.base_imponible_21 || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.cuota_21 || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IVA 10%</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.base_imponible_10 || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.cuota_10 || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IVA 4%</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.base_imponible_4 || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.cuota_4 || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>Total Devengado</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(vatSummary?.total_cuotas_devengadas || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">IVA Soportado (Compras)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">IVA Soportado Deducible</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(vatSummary?.iva_soportado_deducible || 0)}
                    </span>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Resultado</span>
                      <span className={cn(
                        "font-mono font-bold",
                        (vatSummary?.resultado || 0) > 0 ? "text-red-600" : "text-emerald-600"
                      )}>
                        {formatCurrency(vatSummary?.resultado || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compensación Anterior</span>
                      <span className="font-mono">
                        {formatCurrency(vatSummary?.compensacion_periodos_anteriores || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>A Ingresar / Compensar</span>
                      <span className={cn(
                        "font-mono text-lg",
                        (vatSummary?.resultado_liquidacion || 0) > 0 ? "text-red-600" : "text-emerald-600"
                      )}>
                        {formatCurrency(vatSummary?.resultado_liquidacion || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* VAT Detail Dialog */}
      <Dialog open={showVATDialog} onOpenChange={setShowVATDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modelo 303 - IVA Trimestral</DialogTitle>
            <DialogDescription>
              Período: {selectedPeriod} {selectedYear}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* VAT Summary Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Imponible 21%</Label>
                <div className="font-mono text-lg">{formatCurrency(vatSummary?.base_imponible_21 || 0)}</div>
              </div>
              <div className="space-y-2">
                <Label>Cuota 21%</Label>
                <div className="font-mono text-lg">{formatCurrency(vatSummary?.cuota_21 || 0)}</div>
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Resultado de la Liquidación</span>
                <span className={cn(
                  "text-2xl font-bold font-mono",
                  (vatSummary?.resultado_liquidacion || 0) > 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  {formatCurrency(vatSummary?.resultado_liquidacion || 0)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVATDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setShowVATDialog(false);
              setShowSubmitDialog(true);
            }}>
              <Send className="h-4 w-4 mr-2" />
              Marcar Presentado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Presentación</DialogTitle>
            <DialogDescription>
              Introduce el número de referencia de la presentación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Referencia de Presentación</Label>
              <Input
                id="ref"
                placeholder="Ej: 123456789..."
                value={submissionRef}
                onChange={(e) => setSubmissionRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaxDeclarations;
