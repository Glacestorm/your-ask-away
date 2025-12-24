import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
  Eye
} from 'lucide-react';
import { useAuditorPortal } from '@/hooks/useAuditorPortal';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function AuditorPortalManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    viewReports: true,
    viewEvidence: true,
    download: true,
    validDays: 30
  });

  const { 
    tokens, 
    loading, 
    createAccessToken, 
    revokeToken, 
    extendToken,
    fetchTokens 
  } = useAuditorPortal();

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateToken = async () => {
    const result = await createAccessToken(
      formData.email,
      formData.name,
      {
        view_reports: formData.viewReports,
        view_evidence: formData.viewEvidence,
        download: formData.download
      },
      formData.validDays
    );

    if (result && 'plainToken' in result) {
      setNewToken(result.plainToken);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const generatePortalUrl = (token: string) => {
    return `${window.location.origin}/auditor-portal?token=${token}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Portal de Auditores
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setNewToken(null); setIsCreateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Acceso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Token de Acceso para Auditor</DialogTitle>
                </DialogHeader>
                
                {newToken ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        ¡Token creado! Comparte este enlace con el auditor:
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          value={generatePortalUrl(newToken)} 
                          readOnly 
                          className="text-xs"
                        />
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => copyToClipboard(generatePortalUrl(newToken))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Este token solo se muestra una vez
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email del Auditor</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="auditor@empresa.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validDays">Días de Validez</Label>
                      <Input
                        id="validDays"
                        type="number"
                        value={formData.validDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, validDays: parseInt(e.target.value) }))}
                        min={1}
                        max={365}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Permisos</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="viewReports"
                            checked={formData.viewReports}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, viewReports: checked as boolean }))
                            }
                          />
                          <label htmlFor="viewReports" className="text-sm">Ver informes</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="viewEvidence"
                            checked={formData.viewEvidence}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, viewEvidence: checked as boolean }))
                            }
                          />
                          <label htmlFor="viewEvidence" className="text-sm">Ver evidencias</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="download"
                            checked={formData.download}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, download: checked as boolean }))
                            }
                          />
                          <label htmlFor="download" className="text-sm">Descargar documentos</label>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleCreateToken}
                      disabled={!formData.email}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Generar Token Seguro
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay tokens de acceso creados</p>
              <p className="text-sm">Crea un token para que los auditores externos puedan acceder</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Accesos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{token.auditor_name || 'Sin nombre'}</p>
                          <p className="text-sm text-muted-foreground">{token.auditor_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {token.permissions.view_reports && (
                            <Badge variant="outline" className="text-xs">Informes</Badge>
                          )}
                          {token.permissions.view_evidence && (
                            <Badge variant="outline" className="text-xs">Evidencias</Badge>
                          )}
                          {token.permissions.download && (
                            <Badge variant="outline" className="text-xs">Descarga</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(token.expires_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span>{token.access_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={token.is_active ? 'default' : 'secondary'}>
                          {token.is_active ? 'Activo' : 'Revocado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => extendToken(token.id, 30)}
                            disabled={!token.is_active}
                            title="Extender 30 días"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => revokeToken(token.id)}
                            disabled={!token.is_active}
                            title="Revocar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Información del Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">Acceso Seguro</h4>
              <p className="text-muted-foreground">
                Los auditores acceden mediante tokens únicos sin necesidad de credenciales internas
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">Trazabilidad</h4>
              <p className="text-muted-foreground">
                Registro completo de todos los accesos y descargas realizadas
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">Control Total</h4>
              <p className="text-muted-foreground">
                Revoca accesos en cualquier momento y gestiona permisos granulares
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
