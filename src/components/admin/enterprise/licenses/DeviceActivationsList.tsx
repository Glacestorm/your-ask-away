/**
 * DeviceActivationsList - Gestión de dispositivos activados
 * Fase 3 del Sistema de Licencias Enterprise
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Laptop, 
  Smartphone, 
  Globe,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Monitor
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DeviceActivation {
  id: string;
  license_id: string;
  device_fingerprint_hash: string;
  device_name: string | null;
  device_type: string | null;
  hardware_info: Record<string, unknown> | null;
  first_activated_at: string;
  last_seen_at: string;
  is_active: boolean;
  license?: {
    licensee_email: string;
    licensee_name: string;
  };
}

const deviceTypeIcons: Record<string, React.ElementType> = {
  desktop: Monitor,
  web: Globe,
  mobile: Smartphone,
  laptop: Laptop,
};

export function DeviceActivationsList() {
  const [devices, setDevices] = useState<DeviceActivation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; device: DeviceActivation | null }>({
    open: false,
    device: null
  });
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('device_activations')
        .select(`
          *,
          license:licenses(licensee_email, licensee_name)
        `)
        .order('last_seen_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setDevices((data || []).map(d => ({
        ...d,
        hardware_info: d.hardware_info as Record<string, unknown> | null,
        license: Array.isArray(d.license) ? d.license[0] : d.license
      })));
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Error al cargar dispositivos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDeactivate = async () => {
    if (!deactivateDialog.device) return;
    
    setIsDeactivating(true);
    try {
      const { error } = await supabase
        .from('device_activations')
        .update({ is_active: false })
        .eq('id', deactivateDialog.device.id);

      if (error) throw error;

      toast.success('Dispositivo desactivado');
      setDeactivateDialog({ open: false, device: null });
      fetchDevices();
    } catch (error) {
      console.error('Error deactivating device:', error);
      toast.error('Error al desactivar dispositivo');
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredDevices = devices.filter(device => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      device.device_name?.toLowerCase().includes(searchLower) ||
      device.device_fingerprint_hash?.includes(searchLower) ||
      device.license?.licensee_email?.toLowerCase().includes(searchLower)
    );
  });

  const activeCount = devices.filter(d => d.is_active).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-primary" />
                Dispositivos Activados
              </CardTitle>
              <CardDescription>
                {activeCount} dispositivos activos de {devices.length} totales
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDevices} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, fingerprint o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Licenciatario</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Activado</TableHead>
                  <TableHead>Última Conexión</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron dispositivos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => {
                    const DeviceIcon = deviceTypeIcons[device.device_type || 'desktop'] || Monitor;
                    
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-muted">
                              <DeviceIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{device.device_name || 'Dispositivo'}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {device.device_type || 'desktop'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{device.license?.licensee_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">
                              {device.license?.licensee_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {device.device_fingerprint_hash?.substring(0, 16)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "gap-1",
                            device.is_active 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-gray-500/10 text-gray-600 border-gray-500/30"
                          )}>
                            {device.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(new Date(device.first_activated_at), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(device.last_seen_at), { 
                              locale: es, 
                              addSuffix: true 
                            })}
                          </p>
                        </TableCell>
                        <TableCell>
                          {device.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeactivateDialog({ open: true, device })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Deactivate Dialog */}
      <AlertDialog 
        open={deactivateDialog.open} 
        onOpenChange={(open) => setDeactivateDialog({ open, device: deactivateDialog.device })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Desactivar Dispositivo
            </AlertDialogTitle>
            <AlertDialogDescription>
              El dispositivo <strong>{deactivateDialog.device?.device_name || 'seleccionado'}</strong> será 
              desactivado y ya no podrá usar la licencia. El usuario podrá activar otro dispositivo en su lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desactivando...
                </>
              ) : (
                'Desactivar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DeviceActivationsList;
