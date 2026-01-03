/**
 * ExpirationAlertsWidget - Widget de alertas de vencimientos próximos
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Shield,
  FileCheck,
  Banknote,
  Clock,
} from 'lucide-react';
import { useERPDocumentaryCredits } from '@/hooks/erp/useERPDocumentaryCredits';
import { useERPBankGuarantees } from '@/hooks/erp/useERPBankGuarantees';
import { useERPDiscountOperations } from '@/hooks/erp/useERPDiscountOperations';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpirationItem {
  id: string;
  type: 'credit' | 'guarantee' | 'discount';
  reference: string;
  description: string;
  expiryDate: string;
  daysRemaining: number;
  amount: number;
  currency: string;
  status: string;
}

function getSeverity(days: number): 'critical' | 'warning' | 'info' {
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'info';
}

function SeverityBadge({ days }: { days: number }) {
  const severity = getSeverity(days);
  
  const config = {
    critical: { label: 'Urgente', className: 'bg-destructive text-destructive-foreground' },
    warning: { label: 'Próximo', className: 'bg-yellow-500 text-white' },
    info: { label: 'Normal', className: 'bg-blue-500 text-white' },
  };
  
  return (
    <Badge className={config[severity].className}>
      {days <= 0 ? 'Vencido' : `${days} días`}
    </Badge>
  );
}

function TypeIcon({ type }: { type: ExpirationItem['type'] }) {
  const icons = {
    credit: FileCheck,
    guarantee: Shield,
    discount: Banknote,
  };
  const Icon = icons[type];
  return <Icon className="h-4 w-4" />;
}

function ExpirationCard({ item, onView }: { item: ExpirationItem; onView?: () => void }) {
  const severity = getSeverity(item.daysRemaining);
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer",
        severity === 'critical' && "border-destructive/50 bg-destructive/5",
        severity === 'warning' && "border-yellow-500/50 bg-yellow-500/5",
        severity === 'info' && "border-border bg-card"
      )}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            item.type === 'credit' && "bg-green-500/10 text-green-600",
            item.type === 'guarantee' && "bg-red-500/10 text-red-600",
            item.type === 'discount' && "bg-blue-500/10 text-blue-600",
          )}>
            <TypeIcon type={item.type} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.reference}</p>
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(parseISO(item.expiryDate), 'dd MMM yyyy', { locale: es })}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm">
            {new Intl.NumberFormat('es-ES', { 
              style: 'currency', 
              currency: item.currency 
            }).format(item.amount)}
          </p>
          <div className="mt-1">
            <SeverityBadge days={item.daysRemaining} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpirationAlertsWidget() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning'>('all');
  
  const { credits } = useERPDocumentaryCredits();
  const { guarantees } = useERPBankGuarantees();
  const { discounts } = useERPDiscountOperations();

  const expirationItems = useMemo(() => {
    const now = new Date();
    const items: ExpirationItem[] = [];

    // Créditos documentarios - filtrar estados activos
    credits
      .filter(c => c.status !== 'cancelled' && c.status !== 'expired' && c.expiry_date)
      .forEach(credit => {
        const expiryDate = parseISO(credit.expiry_date);
        const daysRemaining = differenceInDays(expiryDate, now);
        if (daysRemaining <= 90) {
          items.push({
            id: credit.id,
            type: 'credit',
            reference: credit.credit_number,
            description: `L/C ${credit.credit_type} - ${credit.applicant_id || 'Sin solicitante'}`,
            expiryDate: credit.expiry_date,
            daysRemaining,
            amount: credit.amount,
            currency: credit.currency,
            status: credit.status,
          });
        }
      });

    // Garantías bancarias
    guarantees
      .filter(g => g.status !== 'released' && g.status !== 'cancelled' && g.status !== 'expired' && g.expiry_date)
      .forEach(guarantee => {
        const expiryDate = parseISO(guarantee.expiry_date);
        const daysRemaining = differenceInDays(expiryDate, now);
        if (daysRemaining <= 90) {
          items.push({
            id: guarantee.id,
            type: 'guarantee',
            reference: guarantee.guarantee_number,
            description: `Aval ${guarantee.guarantee_type} - ${guarantee.beneficiary?.name || 'Sin beneficiario'}`,
            expiryDate: guarantee.expiry_date,
            daysRemaining,
            amount: guarantee.amount,
            currency: guarantee.currency,
            status: guarantee.status,
          });
        }
      });

    // Descuentos con fecha de vencimiento
    discounts
      .filter(d => d.status !== 'cancelled' && d.status !== 'paid' && d.value_date)
      .forEach(discount => {
        const expiryDate = parseISO(discount.value_date!);
        const daysRemaining = differenceInDays(expiryDate, now);
        if (daysRemaining <= 90) {
          items.push({
            id: discount.id,
            type: 'discount',
            reference: discount.discount_number,
            description: `Descuento ${discount.operation_type} - ${discount.entity?.entity_name || 'Sin entidad'}`,
            expiryDate: discount.value_date!,
            daysRemaining,
            amount: discount.total_nominal,
            currency: discount.currency,
            status: discount.status,
          });
        }
      });

    // Ordenar por días restantes (más urgente primero)
    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [credits, guarantees, discounts]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return expirationItems;
    if (activeFilter === 'critical') return expirationItems.filter(i => i.daysRemaining <= 7);
    if (activeFilter === 'warning') return expirationItems.filter(i => i.daysRemaining <= 30 && i.daysRemaining > 7);
    return expirationItems;
  }, [expirationItems, activeFilter]);

  const stats = useMemo(() => ({
    critical: expirationItems.filter(i => i.daysRemaining <= 7).length,
    warning: expirationItems.filter(i => i.daysRemaining <= 30 && i.daysRemaining > 7).length,
    total: expirationItems.length,
  }), [expirationItems]);

  if (expirationItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Sin alertas de vencimiento</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay operaciones próximas a vencer en los próximos 90 días
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Alertas de Vencimiento
            </CardTitle>
            <CardDescription>
              {stats.total} operaciones próximas a vencer
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stats.critical > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                {stats.critical} urgentes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
          <TabsList className="mb-3">
            <TabsTrigger value="all" className="gap-1">
              Todas
              <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="critical" className="gap-1">
              Urgentes
              {stats.critical > 0 && (
                <Badge variant="destructive" className="ml-1">{stats.critical}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warning" className="gap-1">
              Próximas
              {stats.warning > 0 && (
                <Badge className="ml-1 bg-yellow-500">{stats.warning}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <ExpirationCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ExpirationAlertsWidget;
