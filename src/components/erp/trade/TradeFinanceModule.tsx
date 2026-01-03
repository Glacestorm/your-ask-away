/**
 * TradeFinanceModule - Dashboard principal de Comercio Nacional/Internacional
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Globe,
  Building2,
  FileText,
  Link2,
  TrendingUp,
  ArrowRightLeft,
  FileCheck,
  Shield,
  Banknote,
  CreditCard,
  Receipt,
  RefreshCw,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Landmark,
} from 'lucide-react';
import { useERPTradeFinance, type TradeOperation, type FinancialEntity } from '@/hooks/erp/useERPTradeFinance';
import { FinancialEntitiesManager } from './FinancialEntitiesManager';
import { APIConnectionWizard } from './APIConnectionWizard';
import { CommercialDiscountPanel } from './discount';
import { DocumentaryCreditPanel } from './documentary-credits';
import { GuaranteesPanel } from './guarantees';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ========== OPERATION TYPE CONFIG ==========

const OPERATION_TYPES = {
  commercial_discount: {
    label: 'Descuento Comercial',
    icon: Banknote,
    color: 'bg-blue-500',
    description: 'Anticipo de efectos comerciales',
  },
  documentary_credit: {
    label: 'Crédito Documentario',
    icon: FileCheck,
    color: 'bg-green-500',
    description: 'Cartas de crédito import/export',
  },
  factoring: {
    label: 'Factoring',
    icon: Receipt,
    color: 'bg-purple-500',
    description: 'Cesión de facturas',
  },
  confirming: {
    label: 'Confirming',
    icon: CreditCard,
    color: 'bg-orange-500',
    description: 'Pago a proveedores',
  },
  bank_guarantee: {
    label: 'Garantías Bancarias',
    icon: Shield,
    color: 'bg-red-500',
    description: 'Avales y garantías',
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500', icon: Clock },
  pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
  in_progress: { label: 'En Proceso', color: 'bg-blue-500', icon: RefreshCw },
  approved: { label: 'Aprobado', color: 'bg-green-500', icon: CheckCircle2 },
  executed: { label: 'Ejecutado', color: 'bg-green-600', icon: CheckCircle2 },
  completed: { label: 'Completado', color: 'bg-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: AlertCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-600', icon: AlertCircle },
};

// ========== COMPONENTS ==========

function StatsCards({ stats }: { stats: ReturnType<typeof useERPTradeFinance>['stats'] }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Operaciones Totales',
      value: stats.totalOperations,
      icon: ArrowRightLeft,
      color: 'text-blue-500',
    },
    {
      title: 'Operaciones Activas',
      value: stats.activeOperations,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Volumen Total',
      value: new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR',
        notation: 'compact',
        maximumFractionDigits: 1 
      }).format(stats.totalVolume),
      icon: Banknote,
      color: 'text-purple-500',
    },
    {
      title: 'Bancos Conectados',
      value: stats.connectedBanks,
      icon: Link2,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <Icon className={cn("h-8 w-8", card.color)} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OperationTypesGrid({ 
  stats, 
  onSelect 
}: { 
  stats: ReturnType<typeof useERPTradeFinance>['stats'];
  onSelect: (type: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Object.entries(OPERATION_TYPES).map(([key, config]) => {
        const Icon = config.icon;
        const count = stats?.byType[key] || 0;
        
        return (
          <Card 
            key={key}
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={() => onSelect(key)}
          >
            <CardContent className="p-4 text-center">
              <div className={cn("w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center", config.color)}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-sm">{config.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              <Badge variant="secondary" className="mt-2">
                {count} operaciones
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RecentOperations({ operations }: { operations: TradeOperation[] }) {
  if (operations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay operaciones registradas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea tu primera operación de comercio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Operaciones Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {operations.slice(0, 10).map((op) => {
              const typeConfig = OPERATION_TYPES[op.operation_type as keyof typeof OPERATION_TYPES];
              const statusConfig = STATUS_CONFIG[op.status] || STATUS_CONFIG.draft;
              const TypeIcon = typeConfig?.icon || FileText;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", typeConfig?.color || 'bg-gray-500')}>
                      <TypeIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{op.operation_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeConfig?.label || op.operation_type} • {op.counterparty_name || 'Sin contraparte'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: op.currency }).format(op.amount)}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs mt-1", statusConfig.color.replace('bg-', 'text-'))}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ConnectedBanks({ entities, connections }: { 
  entities: FinancialEntity[]; 
  connections: ReturnType<typeof useERPTradeFinance>['connections'];
}) {
  const connectedEntityIds = new Set(
    connections.filter(c => c.status === 'active').map(c => c.entity_id)
  );

  const connectedEntities = entities.filter(e => connectedEntityIds.has(e.id));

  if (connectedEntities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay bancos conectados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configura conexiones API con entidades financieras
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Entidades Conectadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {connectedEntities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">{entity.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entity.swift_bic} • {entity.country}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== MAIN COMPONENT ==========

export function TradeFinanceModule() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);
  const [selectedOperationType, setSelectedOperationType] = useState<string | null>(null);

  const {
    entities,
    connections,
    templates,
    operations,
    stats,
    isLoading,
    error,
    loadAll,
    createOperation,
  } = useERPTradeFinance();

  const handleCreateOperation = async (type: string) => {
    setSelectedOperationType(type);
    await createOperation({
      operation_type: type,
      scope: 'national',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando módulo de comercio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">Error al cargar módulo</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={loadAll} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Comercio Nacional/Internacional
          </h2>
          <p className="text-muted-foreground">
            Gestión de operaciones de Trade Finance, créditos documentarios y conexiones bancarias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowConnectionWizard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Conexión
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="discount" className="gap-2">
            <Banknote className="h-4 w-4" />
            Descuento
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Créditos L/C
          </TabsTrigger>
          <TabsTrigger value="guarantees" className="gap-2">
            <Shield className="h-4 w-4" />
            Avales
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Operaciones
          </TabsTrigger>
          <TabsTrigger value="entities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Entidades
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <Link2 className="h-4 w-4" />
            Conexiones
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Tipos de Operaciones</CardTitle>
                  <CardDescription>Selecciona un tipo para crear una nueva operación</CardDescription>
                </CardHeader>
                <CardContent>
                  <OperationTypesGrid stats={stats} onSelect={handleCreateOperation} />
                </CardContent>
              </Card>
              <RecentOperations operations={operations} />
            </div>
            <div>
              <ConnectedBanks entities={entities} connections={connections} />
            </div>
          </div>
        </TabsContent>

        {/* Discount Tab */}
        <TabsContent value="discount">
          <CommercialDiscountPanel />
        </TabsContent>

        {/* Documentary Credits Tab */}
        <TabsContent value="credits">
          <DocumentaryCreditPanel />
        </TabsContent>

        {/* Bank Guarantees Tab */}
        <TabsContent value="guarantees">
          <GuaranteesPanel />
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Operaciones de Comercio</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Operación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="py-12 text-center">
                  <ArrowRightLeft className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-medium text-muted-foreground">Sin operaciones</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primera operación de comercio nacional o internacional
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {operations.map((op) => {
                      const typeConfig = OPERATION_TYPES[op.operation_type as keyof typeof OPERATION_TYPES];
                      const statusConfig = STATUS_CONFIG[op.status] || STATUS_CONFIG.draft;
                      const TypeIcon = typeConfig?.icon || FileText;

                      return (
                        <div
                          key={op.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", typeConfig?.color || 'bg-gray-500')}>
                                <TypeIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{op.operation_number}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {op.scope === 'international' ? 'Internacional' : 'Nacional'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {typeConfig?.label || op.operation_type}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {op.counterparty_name || 'Sin contraparte'} 
                                  {op.counterparty_country && ` • ${op.counterparty_country}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {new Intl.NumberFormat('es-ES', { 
                                  style: 'currency', 
                                  currency: op.currency 
                                }).format(op.amount)}
                              </p>
                              <Badge className={cn("mt-1", statusConfig.color)}>
                                {statusConfig.label}
                              </Badge>
                              {op.created_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDistanceToNow(new Date(op.created_at), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities">
          <FinancialEntitiesManager entities={entities} />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plantillas de Documentos</CardTitle>
                  <CardDescription>Formularios y documentos de entidades financieras</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Subir Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-medium text-muted-foreground">Sin plantillas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Añade plantillas de formularios bancarios para autocompletar
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{template.document_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.document_type} • {template.template_format.toUpperCase()}
                            </p>
                            {template.entity && (
                              <Badge variant="outline" className="text-xs mt-2">
                                {(template.entity as FinancialEntity).name}
                              </Badge>
                            )}
                          </div>
                          {template.is_official && (
                            <Badge className="bg-green-600 text-xs">Oficial</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections">
          <APIConnectionWizard 
            entities={entities}
            connections={connections}
            isOpen={showConnectionWizard}
            onClose={() => setShowConnectionWizard(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TradeFinanceModule;
