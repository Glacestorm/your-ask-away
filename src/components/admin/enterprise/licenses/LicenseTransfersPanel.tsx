/**
 * License Transfers Panel
 * Gestión de transferencias de licencias entre organizaciones
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Key,
  Building,
  AlertTriangle,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useLicenseTransfer } from '@/hooks/admin/enterprise/useLicenseTransfer';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function LicenseTransfersPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    license_id: '',
    to_organization_id: '',
    to_email: ''
  });

  const {
    transfers,
    loading,
    fetchTransfers,
    initiateTransfer,
    approveTransfer,
    completeTransfer,
    rejectTransfer,
    cancelTransfer
  } = useLicenseTransfer();

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleInitiateTransfer = async () => {
    if (!formData.license_id || !formData.to_organization_id || !formData.to_email) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const success = await initiateTransfer({
      license_id: formData.license_id,
      to_organization_id: formData.to_organization_id,
      to_email: formData.to_email
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        license_id: '',
        to_organization_id: '',
        to_email: ''
      });
    }
  };

  const handleApprove = async (transferId: string) => {
    await approveTransfer(transferId);
  };

  const handleComplete = async (transferId: string) => {
    await completeTransfer(transferId);
  };

  const handleReject = async (transferId: string) => {
    const reason = prompt('Ingrese el motivo del rechazo:');
    if (reason) {
      await rejectTransfer(transferId, reason);
    }
  };

  const handleCancel = async (transferId: string) => {
    if (confirm('¿Está seguro de cancelar esta transferencia?')) {
      await cancelTransfer(transferId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Completada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTransfers = statusFilter === 'all' 
    ? transfers 
    : transfers.filter(t => t.status === statusFilter);

  const pendingCount = transfers.filter(t => t.status === 'pending').length;
  const completedCount = transfers.filter(t => t.status === 'completed').length;
  const rejectedCount = transfers.filter(t => t.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{transfers.length}</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Transferencias de Licencias
              </CardTitle>
              <CardDescription>
                Gestione transferencias entre organizaciones
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => fetchTransfers()}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Transferencia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Iniciar Transferencia</DialogTitle>
                    <DialogDescription>
                      Transfiera una licencia a otra organización
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="license">ID de Licencia *</Label>
                      <Input
                        id="license"
                        placeholder="Ingrese el ID de la licencia"
                        value={formData.license_id}
                        onChange={e => setFormData({ ...formData, license_id: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="to_org">ID Organización Destino *</Label>
                      <Input
                        id="to_org"
                        placeholder="ID organización destino"
                        value={formData.to_organization_id}
                        onChange={e => setFormData({ ...formData, to_organization_id: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="to_email">Email Destino *</Label>
                      <Input
                        id="to_email"
                        type="email"
                        placeholder="email@destino.com"
                        value={formData.to_email}
                        onChange={e => setFormData({ ...formData, to_email: e.target.value })}
                      />
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        La transferencia requerirá aprobación.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInitiateTransfer}>
                      <Send className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Transferencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay transferencias
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map(transfer => (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Key className="h-4 w-4 text-primary" />
                          </div>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {transfer.license_id.slice(0, 8)}...
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[80px] truncate">{transfer.from_organization_id.slice(0, 6)}...</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[80px] truncate">{transfer.to_organization_id.slice(0, 6)}...</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(transfer.created_at), 'dd/MM/yy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transfer.created_at), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {transfer.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500"
                              onClick={() => handleApprove(transfer.id)}
                              title="Aprobar"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleReject(transfer.id)}
                              title="Rechazar"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() => handleCancel(transfer.id)}
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {transfer.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(transfer.id)}
                          >
                            Completar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default LicenseTransfersPanel;
