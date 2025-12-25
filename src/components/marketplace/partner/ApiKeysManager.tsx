import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield
} from 'lucide-react';
import { usePartnerApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/usePartnerPortal';
import { PERMISSION_SCOPES } from '@/types/marketplace';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ApiKeysManagerProps {
  partnerCompanyId: string;
}

export function ApiKeysManager({ partnerCompanyId }: ApiKeysManagerProps) {
  const { data: apiKeys, isLoading } = usePartnerApiKeys(partnerCompanyId);
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    keyName: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    scopes: [] as string[],
  });

  const toggleScope = (scope: string) => {
    setFormData(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const handleCreate = async () => {
    if (!formData.keyName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({
        partnerCompanyId,
        keyName: formData.keyName,
        environment: formData.environment,
        scopes: formData.scopes,
      });

      setNewKey((result as any).api_key);
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleRevoke = async (keyId: string) => {
    await revokeApiKey.mutateAsync({ keyId });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewKey(null);
    setFormData({ keyName: '', environment: 'sandbox', scopes: [] });
  };

  const activeKeys = apiKeys?.filter(k => k.is_active) || [];
  const revokedKeys = apiKeys?.filter(k => !k.is_active) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Gestiona las claves de acceso a la API
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : activeKeys.length > 0 ? (
          <div className="space-y-4">
            {activeKeys.map((key) => (
              <div key={key.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      key.environment === 'production' ? 'bg-green-500/20' : 'bg-amber-500/20'
                    }`}>
                      <Key className={`h-5 w-5 ${
                        key.environment === 'production' ? 'text-green-500' : 'text-amber-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{key.key_name}</h4>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {key.key_prefix}...
                        </code>
                        <Badge variant={key.environment === 'production' ? 'default' : 'secondary'}>
                          {key.environment}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Revocar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Revocar API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción desactivará la clave inmediatamente. Las aplicaciones que la usen dejarán de funcionar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevoke(key.id)}>
                          Revocar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="flex flex-wrap gap-2">
                  {key.scopes.slice(0, 5).map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs font-mono">
                      {scope}
                    </Badge>
                  ))}
                  {key.scopes.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{key.scopes.length - 5} más
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Creada {formatDistanceToNow(new Date(key.created_at), { locale: es, addSuffix: true })}
                  </span>
                  {key.last_used_at && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Última uso: {format(new Date(key.last_used_at), 'dd/MM HH:mm', { locale: es })}
                    </span>
                  )}
                  <span>
                    {key.total_requests.toLocaleString()} solicitudes
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-semibold mb-2">No hay API Keys activas</h4>
            <p className="text-muted-foreground mb-4">
              Crea una API Key para integrar tus aplicaciones
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera API Key
            </Button>
          </div>
        )}

        {revokedKeys.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Keys revocadas</h4>
            <div className="space-y-2">
              {revokedKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{key.key_name}</span>
                    <code className="text-xs text-muted-foreground">{key.key_prefix}...</code>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Revocada {key.revoked_at && formatDistanceToNow(new Date(key.revoked_at), { locale: es, addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Create API Key Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{newKey ? 'API Key Creada' : 'Nueva API Key'}</DialogTitle>
            <DialogDescription>
              {newKey 
                ? 'Guarda esta clave en un lugar seguro. No se mostrará de nuevo.'
                : 'Configura los permisos de la nueva clave'
              }
            </DialogDescription>
          </DialogHeader>

          {newKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Guarda esta clave ahora</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Esta es la única vez que verás la clave completa. Cópiala y guárdala de forma segura.
                </p>
                <div className="flex items-center gap-2">
                  <Input value={newKey} readOnly className="font-mono" />
                  <Button variant="outline" onClick={() => copyToClipboard(newKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={closeDialog}>Entendido</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la clave</Label>
                  <Input
                    value={formData.keyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, keyName: e.target.value }))}
                    placeholder="Mi App - Producción"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Entorno</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(value: 'sandbox' | 'production') => 
                      setFormData(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          Sandbox (desarrollo)
                        </div>
                      </SelectItem>
                      <SelectItem value="production">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          Production
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permisos (Scopes)</Label>
                  <ScrollArea className="h-[200px] border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(PERMISSION_SCOPES).map(([scope, description]) => (
                        <div
                          key={scope}
                          className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            formData.scopes.includes(scope) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleScope(scope)}
                        >
                          <Switch
                            checked={formData.scopes.includes(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                          />
                          <div>
                            <p className="text-xs font-mono">{scope}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createApiKey.isPending}>
                  {createApiKey.isPending ? 'Creando...' : 'Crear API Key'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ApiKeysManager;
