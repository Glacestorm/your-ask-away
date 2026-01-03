/**
 * Panel principal de Descuento Comercial
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  FileText, 
  Calculator,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useERPDiscountOperations, CommercialDiscount } from '@/hooks/erp/useERPDiscountOperations';
import { DiscountEffectsTable } from './DiscountEffectsTable';
import { DiscountCalculator } from './DiscountCalculator';
import { NewDiscountForm } from './NewDiscountForm';
import { RemittanceManager } from './RemittanceManager';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', variant: 'outline', icon: <FileText className="h-3 w-3" /> },
  pending: { label: 'Pendiente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  sent: { label: 'Enviado', variant: 'default', icon: <Send className="h-3 w-3" /> },
  discounted: { label: 'Descontado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  partial_paid: { label: 'Cobro parcial', variant: 'secondary', icon: <TrendingUp className="h-3 w-3" /> },
  paid: { label: 'Cobrado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  returned: { label: 'Devuelto', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelado', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> }
};

export function CommercialDiscountPanel() {
  const [activeTab, setActiveTab] = useState('discounts');
  const [showNewDiscount, setShowNewDiscount] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<CommercialDiscount | null>(null);

  const {
    discounts,
    loading,
    stats,
    fetchDiscounts,
    fetchEffects
  } = useERPDiscountOperations();

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const formatCurrency = (amount: number | null | undefined, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount || 0);
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.totalPending}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.pendingAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Descontados</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalDiscounted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.discountedAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Devueltos</p>
                <p className="text-2xl font-bold text-destructive">{stats.totalReturned}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Líquido Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.discountedAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descuento Comercial
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(true)}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Calculadora
              </Button>
              <Button
                size="sm"
                onClick={() => setShowNewDiscount(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuevo Descuento
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchDiscounts()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="discounts">Operaciones</TabsTrigger>
              <TabsTrigger value="effects">Efectos</TabsTrigger>
              <TabsTrigger value="remittances">Remesas</TabsTrigger>
            </TabsList>

            <TabsContent value="discounts">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Descuento</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay operaciones de descuento registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      discounts.map((discount) => {
                        const status = statusConfig[discount.status] || statusConfig.draft;
                        return (
                          <TableRow key={discount.id}>
                            <TableCell className="font-medium">
                              {discount.discount_number}
                            </TableCell>
                            <TableCell>
                              {discount.entity?.entity_name || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {discount.operation_type === 'national' ? 'Nacional' : 'Internacional'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(discount.total_nominal, discount.currency)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600">
                              {formatCurrency(discount.net_amount, discount.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {discount.discount_date 
                                ? formatDistanceToNow(new Date(discount.discount_date), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedDiscount(discount);
                                  fetchEffects(discount.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="effects">
              <DiscountEffectsTable />
            </TabsContent>

            <TabsContent value="remittances">
              <RemittanceManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Discount Dialog */}
      <Dialog open={showNewDiscount} onOpenChange={setShowNewDiscount}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Operación de Descuento</DialogTitle>
          </DialogHeader>
          <NewDiscountForm 
            onSuccess={() => {
              setShowNewDiscount(false);
              fetchDiscounts();
            }}
            onCancel={() => setShowNewDiscount(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Calculator Dialog */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Calculadora de Descuento</DialogTitle>
          </DialogHeader>
          <DiscountCalculator />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommercialDiscountPanel;
