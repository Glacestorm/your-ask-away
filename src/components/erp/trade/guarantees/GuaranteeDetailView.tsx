/**
 * Bank Guarantee Detail View
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Shield,
  Building2,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Play,
  XCircle,
} from 'lucide-react';
import { BankGuarantee, useERPBankGuarantees } from '@/hooks/erp/useERPBankGuarantees';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GuaranteeDetailViewProps {
  guarantee: BankGuarantee;
  onBack: () => void;
}

const GUARANTEE_TYPES: Record<string, string> = {
  bid_bond: 'Aval de Licitación',
  performance_bond: 'Aval de Cumplimiento',
  advance_payment: 'Aval de Anticipo',
  warranty: 'Aval de Garantía',
  customs: 'Aval Aduanero',
  rental: 'Aval de Alquiler',
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

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; icon: React.ElementType }[]> = {
  draft: [
    { label: 'Solicitar', next: 'requested', icon: Play },
    { label: 'Cancelar', next: 'cancelled', icon: XCircle },
  ],
  requested: [
    { label: 'Marcar Emitido', next: 'issued', icon: CheckCircle },
    { label: 'Cancelar', next: 'cancelled', icon: XCircle },
  ],
  issued: [
    { label: 'Activar', next: 'active', icon: Shield },
    { label: 'Cancelar', next: 'cancelled', icon: XCircle },
  ],
  active: [
    { label: 'Liberar', next: 'released', icon: CheckCircle },
    { label: 'Cancelar', next: 'cancelled', icon: XCircle },
  ],
  claimed: [
    { label: 'Liberar', next: 'released', icon: CheckCircle },
  ],
};

export function GuaranteeDetailView({ guarantee, onBack }: GuaranteeDetailViewProps) {
  const { updateGuaranteeStatus, claims, fetchClaims } = useERPBankGuarantees();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClaims(guarantee.id);
  }, [guarantee.id, fetchClaims]);

  const statusConfig = STATUS_CONFIG[guarantee.status];
  const StatusIcon = statusConfig.icon;
  const transitions = STATUS_TRANSITIONS[guarantee.status] || [];

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateGuaranteeStatus(guarantee.id, newStatus as BankGuarantee['status']);
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(guarantee.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">{guarantee.guarantee_number}</CardTitle>
                <Badge variant={statusConfig.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {GUARANTEE_TYPES[guarantee.guarantee_type]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {transitions.map((transition) => {
              const TransitionIcon = transition.icon;
              return (
                <Button
                  key={transition.next}
                  variant={transition.next === 'cancelled' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(transition.next)}
                  disabled={loading}
                >
                  <TransitionIcon className="h-4 w-4 mr-1" />
                  {transition.label}
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Importe</p>
              <p className="text-2xl font-bold">
                {formatCurrency(guarantee.amount, guarantee.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha Emisión</p>
              <p className="font-medium">
                {format(new Date(guarantee.issue_date), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencimiento</p>
              <p className="font-medium">
                {format(new Date(guarantee.expiry_date), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Días Restantes</p>
              <Badge variant={daysUntilExpiry <= 30 ? 'destructive' : daysUntilExpiry <= 60 ? 'outline' : 'secondary'}>
                {daysUntilExpiry > 0 ? `${daysUntilExpiry} días` : 'Vencido'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Tabs */}
      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="parties">Partes</TabsTrigger>
              <TabsTrigger value="costs">Costes</TabsTrigger>
              <TabsTrigger value="claims">Reclamaciones ({claims.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contrato Subyacente</p>
                  <p className="font-medium">{guarantee.underlying_contract || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objeto del Aval</p>
                  <p className="font-medium">{guarantee.purpose || '-'}</p>
                </div>
              </div>

              {guarantee.auto_renewal && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Renovación Automática Activa</span>
                  </div>
                  {guarantee.renewal_period_months && (
                    <p className="text-sm text-muted-foreground ml-6">
                      Período: {guarantee.renewal_period_months} meses
                    </p>
                  )}
                </div>
              )}

              {guarantee.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm whitespace-pre-wrap mt-1">{guarantee.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="parties" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Banco Emisor</p>
                    </div>
                    <p className="font-medium">{guarantee.issuing_bank?.name || '-'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Ordenante</p>
                    </div>
                    <p className="font-medium">{guarantee.applicant?.name || '-'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Beneficiario</p>
                    </div>
                    <p className="font-medium">{guarantee.beneficiary?.name || '-'}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de Comisión</p>
                  <p className="text-xl font-bold">
                    {guarantee.commission_rate ? `${(guarantee.commission_rate * 100).toFixed(2)}%` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Importe Comisión</p>
                  <p className="text-xl font-bold">
                    {guarantee.commission_amount 
                      ? formatCurrency(guarantee.commission_amount, guarantee.currency) 
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gastos de Emisión</p>
                  <p className="text-xl font-bold">
                    {guarantee.issuance_fee 
                      ? formatCurrency(guarantee.issuance_fee, guarantee.currency) 
                      : '-'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="claims" className="mt-4">
              {claims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No hay reclamaciones registradas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {claims.map((claim) => (
                    <Card key={claim.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{claim.claim_number}</p>
                            <p className="text-sm text-muted-foreground">{claim.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono">{formatCurrency(claim.claim_amount, guarantee.currency)}</p>
                            <Badge variant="outline">{claim.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Línea Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Emisión: {format(new Date(guarantee.issue_date), 'dd/MM/yyyy', { locale: es })}</span>
            </div>
            {guarantee.effective_date && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Efectivo: {format(new Date(guarantee.effective_date), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Vencimiento: {format(new Date(guarantee.expiry_date), 'dd/MM/yyyy', { locale: es })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GuaranteeDetailView;
