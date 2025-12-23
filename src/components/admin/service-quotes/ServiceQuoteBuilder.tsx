/**
 * Service Quote Builder Component
 * Allows creating and editing service quotes with line items
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Plus, Trash2, Calculator, Send, Save, Clock, 
  Euro, Percent, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { 
  useServiceQuotes, 
  ServiceType, 
  getServiceTypeLabel,
  CreateQuoteParams 
} from '@/hooks/admin/useServiceQuotes';
import { toast } from 'sonner';

interface ServiceQuoteBuilderProps {
  installationId: string;
  installationName?: string;
  onQuoteCreated?: (quoteId: string) => void;
  onCancel?: () => void;
}

interface EstimatedAction {
  action: string;
  estimatedMinutes: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const SERVICE_TYPES: { value: ServiceType; label: string; defaultRate: number }[] = [
  { value: 'remote_support', label: 'Soporte Remoto', defaultRate: 75 },
  { value: 'installation', label: 'Instalación', defaultRate: 90 },
  { value: 'configuration', label: 'Configuración', defaultRate: 80 },
  { value: 'training', label: 'Formación', defaultRate: 85 },
  { value: 'maintenance', label: 'Mantenimiento', defaultRate: 70 },
  { value: 'upgrade', label: 'Actualización', defaultRate: 85 },
  { value: 'migration', label: 'Migración', defaultRate: 100 },
  { value: 'custom', label: 'Personalizado', defaultRate: 80 },
];

const DEFAULT_TERMS = `
1. Este presupuesto tiene una validez de 30 días desde la fecha de emisión.
2. Los trabajos se realizarán en horario laboral (9:00-18:00), salvo acuerdo previo.
3. El precio incluye IVA al tipo vigente.
4. El pago se realizará a la finalización del servicio o según condiciones acordadas.
5. Cualquier trabajo adicional no contemplado en este presupuesto será facturado aparte.
6. La aceptación de este presupuesto implica la conformidad con estos términos.
`.trim();

export function ServiceQuoteBuilder({
  installationId,
  installationName,
  onQuoteCreated,
  onCancel,
}: ServiceQuoteBuilderProps) {
  const { createQuote, loading } = useServiceQuotes();
  
  // Form state
  const [serviceType, setServiceType] = useState<ServiceType>('remote_support');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [estimatedActions, setEstimatedActions] = useState<EstimatedAction[]>([
    { action: '', estimatedMinutes: 30, riskLevel: 'low' }
  ]);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [useFixedPrice, setUseFixedPrice] = useState(false);
  const [fixedPrice, setFixedPrice] = useState<number | undefined>();
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxRate, setTaxRate] = useState(21);
  const [validDays, setValidDays] = useState(30);
  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
  const [paymentTerms, setPaymentTerms] = useState('Pago a la finalización del servicio');

  // Update hourly rate when service type changes
  useEffect(() => {
    const serviceConfig = SERVICE_TYPES.find(s => s.value === serviceType);
    if (serviceConfig) {
      setHourlyRate(serviceConfig.defaultRate);
    }
  }, [serviceType]);

  // Calculate totals
  const totalMinutes = estimatedActions.reduce((sum, a) => sum + a.estimatedMinutes, 0);
  const subtotalBeforeDiscount = useFixedPrice && fixedPrice 
    ? fixedPrice 
    : (hourlyRate * totalMinutes / 60);
  const discountAmount = subtotalBeforeDiscount * (discountPercentage / 100);
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Add new action
  const addAction = () => {
    setEstimatedActions([
      ...estimatedActions,
      { action: '', estimatedMinutes: 30, riskLevel: 'low' }
    ]);
  };

  // Update action
  const updateAction = (index: number, field: keyof EstimatedAction, value: string | number) => {
    const updated = [...estimatedActions];
    updated[index] = { ...updated[index], [field]: value };
    setEstimatedActions(updated);
  };

  // Remove action
  const removeAction = (index: number) => {
    if (estimatedActions.length > 1) {
      setEstimatedActions(estimatedActions.filter((_, i) => i !== index));
    }
  };

  // Handle form submission
  const handleSubmit = async (sendImmediately: boolean = false) => {
    if (!serviceTitle.trim()) {
      toast.error('Por favor, introduce un título para el servicio');
      return;
    }

    const validActions = estimatedActions.filter(a => a.action.trim());
    if (validActions.length === 0) {
      toast.error('Por favor, añade al menos una acción estimada');
      return;
    }

    const params: CreateQuoteParams = {
      installationId,
      serviceType,
      serviceTitle,
      serviceDescription,
      estimatedDurationMinutes: totalMinutes,
      estimatedActions: validActions,
      hourlyRate: useFixedPrice ? undefined : hourlyRate,
      fixedPrice: useFixedPrice ? fixedPrice : undefined,
      discountPercentage,
      taxRate,
      validDays,
      termsAndConditions,
      paymentTerms,
    };

    const quote = await createQuote(params);
    if (quote) {
      onQuoteCreated?.(quote.id);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-700';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700';
      case 'high': return 'bg-orange-500/20 text-orange-700';
      case 'critical': return 'bg-red-500/20 text-red-700';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Nuevo Presupuesto</CardTitle>
                <CardDescription>
                  {installationName || 'Instalación'} - Crear presupuesto de servicio
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalles del Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Servicio</Label>
              <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título del Servicio *</Label>
              <Input
                placeholder="Ej: Configuración módulo de facturación"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Describe el trabajo a realizar..."
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estimated Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Acciones Estimadas</CardTitle>
            <Button variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>
          <CardDescription>
            Detalla las acciones que se realizarán durante el servicio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {estimatedActions.map((action, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <Input
                  placeholder="Descripción de la acción..."
                  value={action.action}
                  onChange={(e) => updateAction(index, 'action', e.target.value)}
                />
              </div>
              <div className="w-24">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={action.estimatedMinutes}
                    onChange={(e) => updateAction(index, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                </div>
              </div>
              <Select 
                value={action.riskLevel} 
                onValueChange={(v) => updateAction(index, 'riskLevel', v)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bajo</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAction(index)}
                disabled={estimatedActions.length === 1}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Tiempo total estimado:</span>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Precios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={!useFixedPrice ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseFixedPrice(false)}
            >
              Precio por hora
            </Button>
            <Button
              variant={useFixedPrice ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseFixedPrice(true)}
            >
              Precio fijo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!useFixedPrice ? (
              <div className="space-y-2">
                <Label>Tarifa por hora (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    className="pl-9"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Precio fijo (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={fixedPrice || ''}
                    onChange={(e) => setFixedPrice(parseFloat(e.target.value) || undefined)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Descuento (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>IVA (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          {/* Totals Summary */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{subtotalBeforeDiscount.toFixed(2)} €</span>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento ({discountPercentage}%):</span>
                <span>-{discountAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Base imponible:</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA ({taxRate}%):</span>
              <span>{taxAmount.toFixed(2)} €</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-primary">{total.toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Términos y Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Validez del presupuesto (días)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-2">
              <Label>Condiciones de pago</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Ej: Pago a 30 días"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Términos y condiciones</Label>
            <Textarea
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar borrador
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={loading}
            >
              <Send className="h-4 w-4 mr-2" />
              Crear y enviar
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
