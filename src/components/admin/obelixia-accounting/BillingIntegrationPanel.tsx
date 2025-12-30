/**
 * BillingIntegrationPanel
 * Panel de integración ciclo de facturación con contabilidad
 * Fase 16 - Enterprise SaaS 2025-2026
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calculator,
  Settings,
  BookOpen,
  CreditCard,
  Building,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Link2,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { useObelixiaBillingIntegration, BillingInvoice } from '@/hooks/admin/obelixia-accounting/useObelixiaBillingIntegration';
import { ObelixiaAccountingHelpButton } from './ObelixiaAccountingHelpButton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function BillingIntegrationPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<BillingInvoice | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const {
    isLoading,
    invoices,
    config,
    summary,
    fetchInvoices,
    accountInvoice,
    batchAccountInvoices,
    registerPayment,
    saveConfig
  } = useObelixiaBillingIntegration();

  // Stats calculations
  const unaccountedInvoices = invoices.filter(i => !i.is_accounted);
  const salesInvoices = invoices.filter(i => i.invoice_type === 'sales');
  const purchaseInvoices = invoices.filter(i => i.invoice_type === 'purchase');
  const overdueInvoices = invoices.filter(i => 
    i.status === 'overdue' || 
    (new Date(i.due_date) < new Date() && i.status !== 'paid' && i.status !== 'cancelled')
  );

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleBatchAccount = async () => {
    if (selectedInvoices.length === 0) return;
    await batchAccountInvoices(selectedInvoices);
    setSelectedInvoices([]);
  };

  const handlePayment = async (amount: number) => {
    if (!selectedInvoiceForPayment) return;
    await registerPayment({
      invoice_id: selectedInvoiceForPayment.id,
      amount,
      payment_method: 'bank_transfer'
    });
    setShowPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      issued: { variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
      sent: { variant: 'secondary', icon: <ArrowUpRight className="h-3 w-3" /> },
      partial: { variant: 'default', icon: <TrendingUp className="h-3 w-3" /> },
      paid: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      overdue: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      cancelled: { variant: 'outline', icon: <XCircle className="h-3 w-3" /> }
    };

    const config = variants[status] || variants.draft;
    
    return (
      <Badge variant={config.variant} className="gap-1 text-xs">
        {config.icon}
        {status === 'draft' && 'Borrador'}
        {status === 'issued' && 'Emitida'}
        {status === 'sent' && 'Enviada'}
        {status === 'partial' && 'Parcial'}
        {status === 'paid' && 'Pagada'}
        {status === 'overdue' && 'Vencida'}
        {status === 'cancelled' && 'Anulada'}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Integración Facturación-Contabilidad
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión completa del ciclo de facturación con contabilización automática
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ObelixiaAccountingHelpButton />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchInvoices()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowConfigDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Factura</DialogTitle>
                <DialogDescription>
                  Crear una nueva factura y contabilizarla automáticamente
                </DialogDescription>
              </DialogHeader>
              <Tabs value={invoiceType} onValueChange={(v) => setInvoiceType(v as 'sales' | 'purchase')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sales" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Factura Venta
                  </TabsTrigger>
                  <TabsTrigger value="purchase" className="gap-2">
                    <ArrowDownLeft className="h-4 w-4" />
                    Factura Compra
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Input placeholder="Nombre del cliente" />
                    </div>
                    <div className="space-y-2">
                      <Label>NIF/CIF</Label>
                      <Input placeholder="B12345678" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Emisión</Label>
                      <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Vencimiento</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Contabilizar automáticamente</Label>
                      <Switch defaultChecked={config?.auto_post_invoices} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Genera el asiento contable automáticamente al crear la factura
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="purchase" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proveedor</Label>
                      <Input placeholder="Nombre del proveedor" />
                    </div>
                    <div className="space-y-2">
                      <Label>NIF/CIF</Label>
                      <Input placeholder="A87654321" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nº Factura Proveedor</Label>
                      <Input placeholder="FAC-2024-001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Factura</Label>
                      <Input type="date" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewInvoice(false)}>
                  Cancelar
                </Button>
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Crear y Contabilizar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ventas (Mes)</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary?.total_sales || 0)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {salesInvoices.length} facturas emitidas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Compras (Mes)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary?.total_purchases || 0)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/10">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {purchaseInvoices.length} facturas recibidas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(summary?.pending_receivables || 0)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            {(summary?.overdue_receivables || 0) > 0 && (
              <p className="text-xs text-destructive mt-2">
                {formatCurrency(summary?.overdue_receivables || 0)} vencido
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sin Contabilizar</p>
                <p className="text-2xl font-bold text-purple-600">
                  {unaccountedInvoices.length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-500/10">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            {unaccountedInvoices.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-xs text-purple-600 mt-2"
                onClick={() => setActiveTab('pending')}
              >
                Contabilizar todas
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Todas las Facturas
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Calculator className="h-4 w-4" />
            Pendientes Contabilizar
            {unaccountedInvoices.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unaccountedInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Vencidas
            {overdueInvoices.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Facturas Recientes</CardTitle>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] h-8">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="sales">Ventas</SelectItem>
                      <SelectItem value="purchase">Compras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          invoice.invoice_type === 'sales' 
                            ? "bg-emerald-500/10" 
                            : "bg-blue-500/10"
                        )}>
                          {invoice.invoice_type === 'sales' 
                            ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            : <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            {getStatusBadge(invoice.status)}
                            {invoice.is_accounted && (
                              <Badge variant="outline" className="gap-1 text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                <Link2 className="h-3 w-3" />
                                Contabilizada
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.partner_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {new Date(invoice.due_date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!invoice.is_accounted && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => accountInvoice(invoice.id)}
                              disabled={isLoading}
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedInvoiceForPayment(invoice);
                                setShowPaymentDialog(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Facturas Pendientes de Contabilizar</CardTitle>
                  <CardDescription>
                    Selecciona las facturas para contabilizarlas en lote
                  </CardDescription>
                </div>
                {selectedInvoices.length > 0 && (
                  <Button 
                    onClick={handleBatchAccount}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Contabilizar ({selectedInvoices.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {unaccountedInvoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedInvoices.includes(invoice.id)
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card hover:bg-muted/50"
                      )}
                      onClick={() => handleSelectInvoice(invoice.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          selectedInvoices.includes(invoice.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedInvoices.includes(invoice.id) && (
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className={cn(
                          "p-2 rounded-lg",
                          invoice.invoice_type === 'sales' 
                            ? "bg-emerald-500/10" 
                            : "bg-blue-500/10"
                        )}>
                          {invoice.invoice_type === 'sales' 
                            ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            : <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.partner_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {unaccountedInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-3 rounded-full bg-green-500/10 mb-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="font-medium">Todas las facturas contabilizadas</p>
                      <p className="text-sm text-muted-foreground">
                        No hay facturas pendientes de contabilizar
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Facturas Vencidas
              </CardTitle>
              <CardDescription>
                Facturas que han superado su fecha de vencimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {overdueInvoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <Badge variant="destructive" className="text-xs">
                              Vencida hace {formatDistanceToNow(new Date(invoice.due_date), { locale: es })}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.partner_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-destructive">{formatCurrency(invoice.total - invoice.amount_paid)}</p>
                          <p className="text-xs text-muted-foreground">
                            de {formatCurrency(invoice.total)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enviar Recordatorio
                        </Button>
                      </div>
                    </div>
                  ))}
                  {overdueInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-3 rounded-full bg-green-500/10 mb-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="font-medium">Sin facturas vencidas</p>
                      <p className="text-sm text-muted-foreground">
                        Todas las facturas están al día
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Factura: {selectedInvoiceForPayment?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoiceForPayment && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span>Total factura:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoiceForPayment.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ya pagado:</span>
                  <span>{formatCurrency(selectedInvoiceForPayment.amount_paid)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-medium">
                  <span>Pendiente:</span>
                  <span>{formatCurrency(selectedInvoiceForPayment.total - selectedInvoiceForPayment.amount_paid)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Importe del pago</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  defaultValue={selectedInvoiceForPayment.total - selectedInvoiceForPayment.amount_paid}
                  id="payment-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select defaultValue="bank_transfer">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha del pago</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch defaultChecked={config?.auto_post_payments} />
                  <Label className="text-sm">Contabilizar automáticamente</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                const amount = parseFloat((document.getElementById('payment-amount') as HTMLInputElement)?.value || '0');
                handlePayment(amount);
              }}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Configuración de Integración</DialogTitle>
            <DialogDescription>
              Configura las cuentas contables y opciones de automatización
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Automatización</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Contabilizar facturas automáticamente</Label>
                  <p className="text-xs text-muted-foreground">Genera asientos al crear facturas</p>
                </div>
                <Switch defaultChecked={config?.auto_post_invoices} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Contabilizar pagos automáticamente</Label>
                  <p className="text-xs text-muted-foreground">Genera asientos al registrar pagos</p>
                </div>
                <Switch defaultChecked={config?.auto_post_payments} />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Cuentas Contables</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ventas</Label>
                  <Input defaultValue={config?.sales_account || '700'} />
                </div>
                <div className="space-y-2">
                  <Label>Compras</Label>
                  <Input defaultValue={config?.purchases_account || '600'} />
                </div>
                <div className="space-y-2">
                  <Label>Clientes</Label>
                  <Input defaultValue={config?.receivables_account || '430'} />
                </div>
                <div className="space-y-2">
                  <Label>Proveedores</Label>
                  <Input defaultValue={config?.payables_account || '400'} />
                </div>
                <div className="space-y-2">
                  <Label>IVA Repercutido</Label>
                  <Input defaultValue={config?.vat_output_account || '477'} />
                </div>
                <div className="space-y-2">
                  <Label>IVA Soportado</Label>
                  <Input defaultValue={config?.vat_input_account || '472'} />
                </div>
                <div className="space-y-2">
                  <Label>Bancos</Label>
                  <Input defaultValue={config?.bank_account || '572'} />
                </div>
                <div className="space-y-2">
                  <Label>Retenciones</Label>
                  <Input defaultValue={config?.retention_account || '4751'} />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Valores por Defecto</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plazo pago (días)</Label>
                  <Input type="number" defaultValue={config?.default_payment_terms || 30} />
                </div>
                <div className="space-y-2">
                  <Label>IVA (%)</Label>
                  <Input type="number" defaultValue={config?.default_tax_rate || 21} />
                </div>
                <div className="space-y-2">
                  <Label>Retención (%)</Label>
                  <Input type="number" defaultValue={config?.default_retention_rate || 0} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowConfigDialog(false);
            }}>
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BillingIntegrationPanel;
