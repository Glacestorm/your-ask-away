/**
 * Bank Guarantees Panel - Main component for managing bank guarantees
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
  Shield,
  Plus,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Eye,
} from 'lucide-react';
import { useERPBankGuarantees, BankGuarantee } from '@/hooks/erp/useERPBankGuarantees';
import { NewGuaranteeForm } from './NewGuaranteeForm';
import { GuaranteeDetailView } from './GuaranteeDetailView';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const GUARANTEE_TYPES: Record<string, string> = {
  bid_bond: 'Licitación',
  performance_bond: 'Cumplimiento',
  advance_payment: 'Anticipo',
  warranty: 'Garantía',
  customs: 'Aduanas',
  rental: 'Alquiler',
  other: 'Otro',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  draft: { label: 'Borrador', variant: 'secondary', icon: FileText },
  requested: { label: 'Solicitado', variant: 'outline', icon: Clock },
  issued: { label: 'Emitido', variant: 'default', icon: CheckCircle },
  active: { label: 'Activo', variant: 'default', icon: Shield },
  claimed: { label: 'Reclamado', variant: 'destructive', icon: AlertTriangle },
  released: { label: 'Liberado', variant: 'secondary', icon: CheckCircle },
  expired: { label: 'Vencido', variant: 'outline', icon: Clock },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: Ban },
};

export function GuaranteesPanel() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuarantee | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const {
    guarantees,
    loading,
    fetchGuarantees,
    getStatistics,
  } = useERPBankGuarantees();

  useEffect(() => {
    fetchGuarantees();
  }, [fetchGuarantees]);

  const stats = getStatistics();

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleViewGuarantee = (guarantee: BankGuarantee) => {
    setSelectedGuarantee(guarantee);
    setActiveTab('detail');
  };

  const handleNewSuccess = () => {
    setShowNewForm(false);
    setActiveTab('list');
  };

  if (showNewForm) {
    return (
      <NewGuaranteeForm
        onSuccess={handleNewSuccess}
        onCancel={() => setShowNewForm(false)}
      />
    );
  }

  if (selectedGuarantee && activeTab === 'detail') {
    return (
      <GuaranteeDetailView
        guarantee={selectedGuarantee}
        onBack={() => {
          setSelectedGuarantee(null);
          setActiveTab('list');
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Avales Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">Importe Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">Próximos a Vencer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Avales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Avales Bancarios
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGuarantees()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Button size="sm" onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Aval
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">Listado</TabsTrigger>
              <TabsTrigger value="by-type">Por Tipo</TabsTrigger>
              <TabsTrigger value="expiring">Por Vencer</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Aval</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Beneficiario</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guarantees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No hay avales registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      guarantees.map((guarantee) => {
                        const statusConfig = STATUS_CONFIG[guarantee.status];
                        const StatusIcon = statusConfig.icon;
                        return (
                          <TableRow key={guarantee.id}>
                            <TableCell className="font-medium">
                              {guarantee.guarantee_number}
                            </TableCell>
                            <TableCell>
                              {GUARANTEE_TYPES[guarantee.guarantee_type]}
                            </TableCell>
                            <TableCell>
                              {guarantee.beneficiary?.name || '-'}
                            </TableCell>
                            <TableCell>
                              {guarantee.issuing_bank?.name || '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(guarantee.amount, guarantee.currency)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(guarantee.expiry_date), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewGuarantee(guarantee)}
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

            <TabsContent value="by-type">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(GUARANTEE_TYPES).map(([key, label]) => (
                  <Card key={key} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{stats.byType[key as keyof typeof stats.byType] || 0}</p>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="expiring">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {guarantees
                    .filter(g => {
                      if (g.status !== 'active' && g.status !== 'issued') return false;
                      const expiry = new Date(g.expiry_date);
                      const now = new Date();
                      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
                    })
                    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                    .map(guarantee => {
                      const expiry = new Date(guarantee.expiry_date);
                      const now = new Date();
                      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <Card
                          key={guarantee.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors",
                            daysUntilExpiry <= 15 && "border-destructive",
                            daysUntilExpiry <= 30 && daysUntilExpiry > 15 && "border-amber-500"
                          )}
                          onClick={() => handleViewGuarantee(guarantee)}
                        >
                          <CardContent className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{guarantee.guarantee_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {guarantee.beneficiary?.name} - {GUARANTEE_TYPES[guarantee.guarantee_type]}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono">{formatCurrency(guarantee.amount, guarantee.currency)}</p>
                              <Badge
                                variant={daysUntilExpiry <= 15 ? 'destructive' : daysUntilExpiry <= 30 ? 'outline' : 'secondary'}
                              >
                                {daysUntilExpiry} días
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  {guarantees.filter(g => {
                    if (g.status !== 'active' && g.status !== 'issued') return false;
                    const expiry = new Date(g.expiry_date);
                    const now = new Date();
                    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
                  }).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay avales próximos a vencer en los próximos 90 días
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default GuaranteesPanel;
