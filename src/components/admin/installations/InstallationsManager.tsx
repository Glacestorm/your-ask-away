import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Server, 
  Globe, 
  Shield, 
  Key, 
  Download, 
  Activity,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Settings,
  Wifi,
  WifiOff,
  Clock,
  MapPin
} from 'lucide-react';
import { useClientInstallations, useInstallationDownloads, ClientInstallation } from '@/hooks/admin/useClientInstallations';
import { useSupportedLanguages } from '@/hooks/cms/useSupportedLanguages';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function InstallationsManager() {
  const { installations, loading, toggleRemoteAccess, generateAccessPin, createInstallation } = useClientInstallations();
  const { downloads, stats } = useInstallationDownloads();
  const { languages } = useSupportedLanguages();
  const [search, setSearch] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<ClientInstallation | null>(null);
  const [newInstallation, setNewInstallation] = useState({
    installation_name: '',
    preferred_locale: 'es'
  });

  const filteredInstallations = installations.filter(i => 
    i.installation_name.toLowerCase().includes(search.toLowerCase()) ||
    i.company?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateInstallation = async () => {
    await createInstallation(newInstallation);
    setShowNewDialog(false);
    setNewInstallation({ installation_name: '', preferred_locale: 'es' });
  };

  const handleGeneratePin = async (id: string) => {
    await generateAccessPin(id, 24);
  };

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      'es': '🇪🇸', 'en': '🇬🇧', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
      'pt': '🇵🇹', 'pt-BR': '🇧🇷', 'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷',
      'ar': '🇸🇦', 'ru': '🇷🇺', 'nl': '🇳🇱', 'pl': '🇵🇱', 'tr': '🇹🇷'
    };
    return flags[locale] || '🌐';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instalaciones Activas</p>
                <p className="text-2xl font-bold">{installations.filter(i => i.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Globe className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Idiomas en Uso</p>
                <p className="text-2xl font-bold">{Object.keys(stats.byLocale).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Download className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descargas Totales</p>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acceso Remoto Activo</p>
                <p className="text-2xl font-bold">{installations.filter(i => i.remote_access_allowed).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Gestión de Instalaciones de Clientes
              </CardTitle>
              <CardDescription>
                Controla todas las instalaciones, idiomas y acceso remoto
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar instalaciones..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Instalación
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="downloads">Descargas</TabsTrigger>
              <TabsTrigger value="remote">Acceso Remoto</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Idioma</TableHead>
                        <TableHead>Versión</TableHead>
                        <TableHead>Última Sincronización</TableHead>
                        <TableHead>Acceso Remoto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstallations.map((installation) => (
                        <TableRow key={installation.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{installation.installation_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {installation.company?.name || installation.user?.full_name || 'Sin asignar'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {getLocaleFlag(installation.preferred_locale)}
                              {installation.preferred_locale.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">v{installation.version}</Badge>
                          </TableCell>
                          <TableCell>
                            {installation.last_sync_at ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                {format(new Date(installation.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nunca</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={installation.remote_access_allowed}
                                onCheckedChange={(checked) => toggleRemoteAccess(installation.id, checked)}
                              />
                              {installation.remote_access_allowed ? (
                                <Wifi className="h-4 w-4 text-green-500" />
                              ) : (
                                <WifiOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={installation.is_active ? 'default' : 'secondary'}>
                              {installation.is_active ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedInstallation(installation);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {installation.remote_access_allowed && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGeneratePin(installation.id)}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="downloads">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Descargas por Idioma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.byLocale).map(([locale, count]) => (
                        <div key={locale} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{getLocaleFlag(locale)}</span>
                            <span className="text-sm">{locale.toUpperCase()}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Descargas por Módulo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.byModule)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([module, count]) => (
                          <div key={module} className="flex items-center justify-between">
                            <span className="text-sm truncate max-w-[200px]">{module}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Historial de Descargas Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Módulo</TableHead>
                          <TableHead>Idioma</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {downloads.slice(0, 20).map((download) => (
                          <TableRow key={download.id}>
                            <TableCell>{download.module?.module_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getLocaleFlag(download.locale_downloaded)} {download.locale_downloaded.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{download.download_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={download.download_status === 'completed' ? 'default' : 'destructive'}
                              >
                                {download.download_status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(download.downloaded_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="remote">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Instalaciones con Acceso Remoto Habilitado
                    </CardTitle>
                    <CardDescription>
                      Estas instalaciones permiten soporte remoto autorizado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {installations
                        .filter(i => i.remote_access_allowed)
                        .map((installation) => (
                          <Card key={installation.id} className="border-green-500/20">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{installation.installation_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {installation.company?.name || 'Sin empresa'}
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  <Wifi className="h-3 w-3 mr-1" />
                                  Activo
                                </Badge>
                              </div>
                              
                              {installation.remote_access_pin && installation.remote_access_pin_expires_at && (
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">PIN Actual:</span>
                                    <code className="font-mono font-bold">{installation.remote_access_pin}</code>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">Expira:</span>
                                    <span className="text-xs">
                                      {format(new Date(installation.remote_access_pin_expires_at), 'dd/MM HH:mm')}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleGeneratePin(installation.id)}
                                >
                                  <Key className="h-3 w-3 mr-1" />
                                  Nuevo PIN
                                </Button>
                                <Button variant="secondary" size="sm" className="flex-1">
                                  <Activity className="h-3 w-3 mr-1" />
                                  Conectar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>

                    {installations.filter(i => i.remote_access_allowed).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay instalaciones con acceso remoto habilitado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Installation Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Instalación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Instalación</Label>
              <Input
                value={newInstallation.installation_name}
                onChange={(e) => setNewInstallation(prev => ({ ...prev, installation_name: e.target.value }))}
                placeholder="Ej: Oficina Madrid"
              />
            </div>
            <div className="space-y-2">
              <Label>Idioma Preferido</Label>
              <Select
                value={newInstallation.preferred_locale}
                onValueChange={(value) => setNewInstallation(prev => ({ ...prev, preferred_locale: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.locale} value={lang.locale}>
                      {getLocaleFlag(lang.locale)} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInstallation}>
              Crear Instalación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Installation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Instalación</DialogTitle>
          </DialogHeader>
          {selectedInstallation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedInstallation.installation_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Clave de Instalación</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{selectedInstallation.installation_key}</code>
                </div>
                <div>
                  <Label className="text-muted-foreground">Idioma Principal</Label>
                  <p>{getLocaleFlag(selectedInstallation.preferred_locale)} {selectedInstallation.preferred_locale.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Versión</Label>
                  <p>v{selectedInstallation.version}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={selectedInstallation.is_active ? 'default' : 'secondary'}>
                    {selectedInstallation.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Acceso Remoto</Label>
                  <Badge variant={selectedInstallation.remote_access_allowed ? 'default' : 'outline'}>
                    {selectedInstallation.remote_access_allowed ? 'Habilitado' : 'Deshabilitado'}
                  </Badge>
                </div>
              </div>

              {selectedInstallation.secondary_locales && selectedInstallation.secondary_locales.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Idiomas Secundarios</Label>
                  <div className="flex gap-2 mt-1">
                    {selectedInstallation.secondary_locales.map((locale) => (
                      <Badge key={locale} variant="outline">
                        {getLocaleFlag(locale)} {locale.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Creada</Label>
                <p className="text-sm">
                  {format(new Date(selectedInstallation.created_at), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
