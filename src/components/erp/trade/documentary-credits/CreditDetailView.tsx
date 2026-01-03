/**
 * Vista detallada de un Crédito Documentario
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Calendar,
  DollarSign,
  Ship,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Edit,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { DocumentaryCredit, useERPDocumentaryCredits } from '@/hooks/erp/useERPDocumentaryCredits';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CreditDetailViewProps {
  credit: DocumentaryCredit;
  onUpdate: () => void;
}

const formatCurrency = (amount: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-muted' },
  requested: { label: 'Solicitado', color: 'bg-blue-100 text-blue-700' },
  issued: { label: 'Emitido', color: 'bg-green-100 text-green-700' },
  advised: { label: 'Avisado', color: 'bg-emerald-100 text-emerald-700' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700' },
  amended: { label: 'Enmendado', color: 'bg-amber-100 text-amber-700' },
  utilized: { label: 'Utilizado', color: 'bg-purple-100 text-purple-700' },
  expired: { label: 'Vencido', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export function CreditDetailView({ credit, onUpdate }: CreditDetailViewProps) {
  const [activeTab, setActiveTab] = useState('info');
  const {
    amendments,
    presentations,
    fetchAmendments,
    fetchPresentations,
    getAvailableAmount,
  } = useERPDocumentaryCredits();

  useEffect(() => {
    fetchAmendments(credit.id);
    fetchPresentations(credit.id);
  }, [credit.id, fetchAmendments, fetchPresentations]);

  const utilizationPercentage = credit.amount > 0 
    ? ((credit.utilized_amount || 0) / credit.amount) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${credit.credit_type === 'import' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {credit.credit_type === 'import' ? (
              <ArrowDownLeft className="h-6 w-6" />
            ) : (
              <ArrowUpRight className="h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{credit.credit_number}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusConfig[credit.status]?.color}>
                {statusConfig[credit.status]?.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {credit.credit_type === 'import' ? 'Importación' : 'Exportación'}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>

      {/* Amount Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Importe Total</p>
              <p className="text-2xl font-bold">{formatCurrency(credit.amount, credit.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilizado</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(credit.utilized_amount || 0, credit.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponible</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(getAvailableAmount(credit), credit.currency)}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Utilización</span>
              <span>{utilizationPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={utilizationPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="amendments">
            Enmiendas ({amendments.length})
          </TabsTrigger>
          <TabsTrigger value="presentations">
            Presentaciones ({presentations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          {/* Dates */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Emisión</p>
                <p className="font-medium">{format(new Date(credit.issue_date), 'dd/MM/yyyy', { locale: es })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="font-medium">{format(new Date(credit.expiry_date), 'dd/MM/yyyy', { locale: es })}</p>
              </div>
              {credit.latest_shipment_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Última Fecha Embarque</p>
                  <p className="font-medium">{format(new Date(credit.latest_shipment_date), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Terms */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Términos de Embarque
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Incoterm</p>
                <p className="font-medium">{credit.incoterm || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Período Presentación</p>
                <p className="font-medium">{credit.presentation_period_days} días</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Puerto Carga</p>
                <p className="font-medium">{credit.port_of_loading || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Puerto Descarga</p>
                <p className="font-medium">{credit.port_of_discharge || 'No especificado'}</p>
              </div>
              <div className="flex gap-4">
                <Badge variant={credit.partial_shipments_allowed ? 'default' : 'secondary'}>
                  {credit.partial_shipments_allowed ? '✓' : '✗'} Embarques parciales
                </Badge>
                <Badge variant={credit.transshipment_allowed ? 'default' : 'secondary'}>
                  {credit.transshipment_allowed ? '✓' : '✗'} Transbordo
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Banks */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Entidades Bancarias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {credit.swift_reference && (
                <div className="mb-3 p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Referencia SWIFT</p>
                  <p className="font-mono font-medium">{credit.swift_reference}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Banco Emisor</p>
                  <p className="font-medium">{credit.issuing_bank_id || 'No asignado'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Banco Avisador</p>
                  <p className="font-medium">{credit.advising_bank_id || 'No asignado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Conditions */}
          {credit.special_conditions && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Condiciones Especiales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{credit.special_conditions}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Requeridos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(credit.required_documents) && credit.required_documents.length > 0 ? (
                <ul className="space-y-2">
                  {credit.required_documents.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2 p-2 rounded border">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{String(doc)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No hay documentos especificados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amendments" className="mt-4">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Historial de Enmiendas</CardTitle>
              <Button size="sm" variant="outline">
                Nueva Enmienda
              </Button>
            </CardHeader>
            <CardContent>
              {amendments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay enmiendas registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {amendments.map(amendment => (
                    <div key={amendment.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Enmienda #{amendment.amendment_number}</span>
                        <Badge variant={
                          amendment.status === 'accepted' ? 'default' :
                          amendment.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {amendment.status === 'pending' ? 'Pendiente' :
                           amendment.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(amendment.amendment_date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                      {amendment.reason && (
                        <p className="text-sm mt-2">{amendment.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presentations" className="mt-4">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Presentaciones de Documentos</CardTitle>
              <Button size="sm" variant="outline">
                Nueva Presentación
              </Button>
            </CardHeader>
            <CardContent>
              {presentations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay presentaciones registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {presentations.map(pres => (
                    <div key={pres.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Presentación #{pres.presentation_number}</span>
                        <div className="flex gap-2">
                          <Badge variant={
                            pres.review_status === 'compliant' ? 'default' :
                            pres.review_status === 'discrepant' ? 'destructive' : 'secondary'
                          }>
                            {pres.review_status === 'pending' ? 'Pendiente' :
                             pres.review_status === 'compliant' ? 'Conforme' :
                             pres.review_status === 'discrepant' ? 'Con discrepancias' : 'Rechazada'}
                          </Badge>
                          {pres.payment_status && (
                            <Badge variant={pres.payment_status === 'paid' ? 'default' : 'outline'}>
                              {pres.payment_status === 'paid' ? 'Pagado' : pres.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(pres.presentation_date), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <p className="font-medium">{formatCurrency(pres.amount_claimed, credit.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CreditDetailView;
