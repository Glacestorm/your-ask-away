/**
 * APIConnectionWizard - Asistente para conectar APIs bancarias
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Link2,
  Building2,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  Play,
  Plus,
  ExternalLink,
  Info,
} from 'lucide-react';
import { type FinancialEntity, type TradeAPIConnection, useERPTradeFinance } from '@/hooks/erp/useERPTradeFinance';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface APIConnectionWizardProps {
  entities: FinancialEntity[];
  connections: TradeAPIConnection[];
  isOpen: boolean;
  onClose: () => void;
}

const API_TYPES = [
  { value: 'psd2', label: 'PSD2 Open Banking', description: 'API estándar europea' },
  { value: 'swift', label: 'SWIFT API', description: 'Red interbancaria global' },
  { value: 'rest', label: 'REST API', description: 'API REST propietaria' },
  { value: 'soap', label: 'SOAP', description: 'Servicios web SOAP' },
  { value: 'sftp', label: 'SFTP', description: 'Transferencia de archivos' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'bg-gray-500', icon: AlertCircle },
  testing: { label: 'Probando', color: 'bg-yellow-500', icon: Loader2 },
  active: { label: 'Activo', color: 'bg-green-500', icon: CheckCircle2 },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertCircle },
  suspended: { label: 'Suspendido', color: 'bg-orange-500', icon: AlertCircle },
};

export function APIConnectionWizard({ entities, connections, isOpen, onClose }: APIConnectionWizardProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [connectionName, setConnectionName] = useState('');
  const [apiType, setApiType] = useState('psd2');
  const [environment, setEnvironment] = useState('sandbox');
  const [isCreating, setIsCreating] = useState(false);

  const { createConnection, testConnection } = useERPTradeFinance();

  const handleCreateConnection = async () => {
    if (!selectedEntity || !connectionName) return;

    setIsCreating(true);
    try {
      await createConnection({
        entity_id: selectedEntity,
        connection_name: connectionName,
        api_type: apiType,
        environment,
      });
      setActiveTab('list');
      setSelectedEntity('');
      setConnectionName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    await testConnection(connectionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Conexiones API Bancarias
              </CardTitle>
              <CardDescription>
                Configura y gestiona conexiones con entidades financieras
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setActiveTab('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Conexión
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Settings className="h-4 w-4" />
            Conexiones ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Conexión
          </TabsTrigger>
        </TabsList>

        {/* Connections List */}
        <TabsContent value="list" className="mt-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Link2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-muted-foreground">
                  Sin conexiones configuradas
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea una nueva conexión para sincronizar con entidades financieras
                </p>
                <Button className="mt-4" onClick={() => setActiveTab('new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Conexión
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {connections.map((conn) => {
                const statusConfig = STATUS_CONFIG[conn.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const entity = conn.entity as FinancialEntity | undefined;

                return (
                  <Card key={conn.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{conn.connection_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {entity?.name || 'Entidad desconocida'}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn("gap-1", statusConfig.color)}>
                          <StatusIcon className={cn(
                            "h-3 w-3",
                            conn.status === 'testing' && "animate-spin"
                          )} />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Tipo API</p>
                          <p className="font-medium">{conn.api_type.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Entorno</p>
                          <Badge variant="outline" className="text-xs">
                            {conn.environment === 'production' ? 'Producción' : 'Sandbox'}
                          </Badge>
                        </div>
                      </div>

                      {conn.last_error && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {conn.last_error}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {conn.last_test_at 
                            ? `Último test: ${formatDistanceToNow(new Date(conn.last_test_at), { addSuffix: true, locale: es })}`
                            : 'Sin probar'}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTestConnection(conn.id)}
                            disabled={conn.status === 'testing'}
                          >
                            {conn.status === 'testing' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* New Connection Form */}
        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nueva Conexión API</CardTitle>
              <CardDescription>
                Configura los parámetros de conexión con una entidad financiera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Entity Selection */}
              <div className="space-y-2">
                <Label>Entidad Financiera *</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una entidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {entity.name}
                          <span className="text-muted-foreground">
                            ({entity.swift_bic || entity.country})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Connection Name */}
              <div className="space-y-2">
                <Label>Nombre de Conexión *</Label>
                <Input
                  placeholder="Ej: Conexión Principal Santander"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </div>

              {/* API Type */}
              <div className="space-y-2">
                <Label>Tipo de API</Label>
                <Select value={apiType} onValueChange={setApiType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p>{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Environment */}
              <div className="space-y-2">
                <Label>Entorno</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-500" />
                        Sandbox (Pruebas)
                      </div>
                    </SelectItem>
                    <SelectItem value="production">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Producción
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Después de crear la conexión, deberás configurar las credenciales API 
                  (Client ID, Client Secret, certificados) proporcionadas por la entidad financiera.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setActiveTab('list')}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateConnection}
                  disabled={!selectedEntity || !connectionName || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Conexión
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default APIConnectionWizard;
