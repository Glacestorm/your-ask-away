/**
 * LicensesList - Lista y gestión de licencias existentes
 * Fase 3 del Sistema de Licencias Enterprise
 */

import { useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Search, 
  RefreshCw, 
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
  Filter
} from 'lucide-react';
import { useLicenseManager, type License, type LicensePlan } from '@/hooks/admin/enterprise/useLicenseManager';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LicensesListProps {
  licenses: License[];
  plans: LicensePlan[];
  isLoading: boolean;
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  active: { label: 'Activa', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  suspended: { label: 'Suspendida', icon: AlertTriangle, className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  expired: { label: 'Expirada', icon: Clock, className: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
  revoked: { label: 'Revocada', icon: XCircle, className: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

export function LicensesList({ licenses, plans, isLoading, onRefresh }: LicensesListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [revokeDialog, setRevokeDialog] = useState<{ open: boolean; license: License | null }>({
    open: false,
    license: null
  });
  const [revokeReason, setRevokeReason] = useState('');
  
  const { revokeLicense, isLoading: isRevoking } = useLicenseManager();

  const getPlanName = (planId: string | null) => {
    if (!planId) return 'Sin plan';
    const plan = plans.find(p => p.id === planId);
    return plan?.name || 'Plan desconocido';
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = search === '' || 
      license.licensee_email?.toLowerCase().includes(search.toLowerCase()) ||
      license.licensee_name?.toLowerCase().includes(search.toLowerCase()) ||
      license.license_key?.includes(search);
    
    const matchesStatus = !statusFilter || license.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleRevoke = async () => {
    if (!revokeDialog.license || !revokeReason) {
      toast.error('Debes proporcionar una razón para revocar');
      return;
    }

    const success = await revokeLicense(revokeDialog.license.id, revokeReason);
    
    if (success) {
      toast.success('Licencia revocada correctamente');
      setRevokeDialog({ open: false, license: null });
      setRevokeReason('');
      onRefresh();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Licencias Emitidas</CardTitle>
              <CardDescription>
                {licenses.length} licencias en total • {filteredLicenses.length} mostradas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nombre o clave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter ? statusConfig[statusFilter]?.label : 'Estado'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                    <config.icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licenciatario</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Expiración</TableHead>
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
                ) : filteredLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron licencias
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLicenses.map((license) => {
                    const status = statusConfig[license.status || 'active'];
                    const StatusIcon = status?.icon || CheckCircle;
                    
                    return (
                      <TableRow key={license.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{license.licensee_name || 'Sin nombre'}</p>
                            <p className="text-sm text-muted-foreground">{license.licensee_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getPlanName(license.plan_id)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{license.license_type}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", status?.className)}>
                            <StatusIcon className="h-3 w-3" />
                            {status?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(license as any).current_users || 0}/{license.max_users}
                        </TableCell>
                        <TableCell>
                          {license.expires_at ? (
                            <div>
                              <p className="text-sm">
                                {format(new Date(license.expires_at), 'dd/MM/yyyy', { locale: es })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(license.expires_at), { 
                                  locale: es, 
                                  addSuffix: true 
                                })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Perpetua</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {license.status === 'active' && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => setRevokeDialog({ open: true, license })}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Revocar Licencia
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Revoke Dialog */}
      <AlertDialog open={revokeDialog.open} onOpenChange={(open) => setRevokeDialog({ open, license: revokeDialog.license })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Revocar Licencia
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. La licencia de{' '}
              <strong>{revokeDialog.license?.licensee_email}</strong> será invalidada inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Razón de revocación *</label>
            <Input
              placeholder="Ej: Violación de términos de uso"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRevokeDialog({ open: false, license: null });
              setRevokeReason('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={!revokeReason || isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revocando...
                </>
              ) : (
                'Revocar Licencia'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default LicensesList;
