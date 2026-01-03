/**
 * Panel principal de Créditos Documentarios
 * Gestión de Cartas de Crédito Import/Export
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Building2,
  Ship,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useERPDocumentaryCredits, DocumentaryCredit } from '@/hooks/erp/useERPDocumentaryCredits';
import { NewCreditForm } from './NewCreditForm';
import { CreditDetailView } from './CreditDetailView';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCurrency = (amount: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  requested: { label: 'Solicitado', variant: 'outline' },
  issued: { label: 'Emitido', variant: 'default' },
  advised: { label: 'Avisado', variant: 'default' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  amended: { label: 'Enmendado', variant: 'outline' },
  utilized: { label: 'Utilizado', variant: 'default' },
  expired: { label: 'Vencido', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const operationTypeLabels: Record<string, string> = {
  irrevocable: 'Irrevocable',
  revocable: 'Revocable',
  confirmed: 'Confirmada',
  unconfirmed: 'Sin confirmar',
  transferable: 'Transferible',
  back_to_back: 'Back-to-Back',
  standby: 'Standby',
};

export function DocumentaryCreditPanel() {
  const [activeTab, setActiveTab] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<DocumentaryCredit | null>(null);

  const {
    credits,
    isLoading,
    fetchCredits,
    isCreditExpired,
    getAvailableAmount
  } = useERPDocumentaryCredits();

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const filteredCredits = credits.filter(credit => {
    if (activeTab === 'import') return credit.credit_type === 'import';
    if (activeTab === 'export') return credit.credit_type === 'export';
    if (activeTab === 'active') return ['issued', 'advised', 'confirmed'].includes(credit.status);
    if (activeTab === 'pending') return ['draft', 'requested'].includes(credit.status);
    return true;
  });

  const stats = {
    total: credits.length,
    import: credits.filter(c => c.credit_type === 'import').length,
    export: credits.filter(c => c.credit_type === 'export').length,
    active: credits.filter(c => ['issued', 'advised', 'confirmed'].includes(c.status)).length,
    totalAmount: credits
      .filter(c => !['cancelled', 'expired'].includes(c.status))
      .reduce((sum, c) => sum + c.amount, 0),
  };

  const getDaysToExpiry = (credit: DocumentaryCredit) => {
    return differenceInDays(new Date(credit.expiry_date), new Date());
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Import</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.import}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Export</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.export}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Activos</span>
            </div>
            <p className="text-xl font-bold mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Importe</span>
            </div>
            <p className="text-lg font-bold mt-1">{formatCurrency(stats.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Créditos Documentarios
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchCredits()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva L/C
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nueva Carta de Crédito</DialogTitle>
                  </DialogHeader>
                  <NewCreditForm onSuccess={() => {
                    setShowNewDialog(false);
                    fetchCredits();
                  }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="import">Importación</TabsTrigger>
              <TabsTrigger value="export">Exportación</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCredits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay créditos documentarios
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCredits.map(credit => {
                      const daysToExpiry = getDaysToExpiry(credit);
                      const isExpired = isCreditExpired(credit);
                      const isExpiringSoon = daysToExpiry <= 30 && daysToExpiry > 0;

                      return (
                        <div
                          key={credit.id}
                          onClick={() => setSelectedCredit(credit)}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${credit.credit_type === 'import' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {credit.credit_type === 'import' ? (
                                  <ArrowDownLeft className="h-4 w-4" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{credit.credit_number}</span>
                                  <Badge variant={statusConfig[credit.status]?.variant || 'secondary'}>
                                    {statusConfig[credit.status]?.label || credit.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {operationTypeLabels[credit.operation_type] || credit.operation_type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {credit.swift_reference || 'Sin ref. SWIFT'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Ship className="h-3 w-3" />
                                    {credit.incoterm || 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Vence: {format(new Date(credit.expiry_date), 'dd/MM/yyyy', { locale: es })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(credit.amount, credit.currency)}</p>
                              <p className="text-xs text-muted-foreground">
                                Disponible: {formatCurrency(getAvailableAmount(credit), credit.currency)}
                              </p>
                              {isExpired ? (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Vencido
                                </Badge>
                              ) : isExpiringSoon ? (
                                <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {daysToExpiry} días
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Credit Detail Dialog */}
      <Dialog open={!!selectedCredit} onOpenChange={() => setSelectedCredit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Crédito Documentario</DialogTitle>
          </DialogHeader>
          {selectedCredit && (
            <CreditDetailView 
              credit={selectedCredit} 
              onUpdate={() => {
                fetchCredits();
                setSelectedCredit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentaryCreditPanel;
