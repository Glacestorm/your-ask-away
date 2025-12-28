/**
 * License Transfers Panel
 * Gestión de transferencias de licencias entre clientes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
  User,
  AlertTriangle,
  Send,
  ThumbsUp,
  ThumbsDown,
  History
} from 'lucide-react';
import { useLicenseTransfer, LicenseTransfer } from '@/hooks/admin/enterprise';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function LicenseTransfersPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    license_id: '',
    from_company_id: '',
    to_company_id: '',
    reason: '',
    transfer_type: 'permanent' as 'permanent' | 'temporary'
  });

  const {
    transfers,
    loading,
    stats,
    fetchTransfers,
    initiateTransfer,
    approveTransfer,
    rejectTransfer,
    cancelTransfer
  } = useLicenseTransfer();

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleInitiateTransfer = async () => {
    if (!formData.license_id || !formData.from_company_id || !formData.to_company_id) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    if (formData.from_company_id === formData.to_company_id) {
      toast.error('La empresa de origen y destino no pueden ser la misma');
      return;
    }

    const success = await initiateTransfer({
      license_id: formData.license_id,
      from_company_id: formData.from_company_id,
      to_company_id: formData.to_company_id,
      reason: formData.reason,
      transfer_type: formData.transfer_type
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        license_id: '',
        from_company_id: '',
        to_company_id: '',
        reason: '',
        transfer_type: 'permanent'
      });
    }
  };

  const handleApprove = async (transferId: string) => {
    await approveTransfer(transferId);
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats?.pending || transfers.filter(t => t.status === 'pending').length}</p>
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
                <p className="text-2xl font-bold">{stats?.completed || transfers.filter(t => t.status === 'completed').length}</p>
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
                <p className="text-2xl font-bold">{stats?.rejected || transfers.filter(t => t.status === 'rejected').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => {
                    const date = new Date(t.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
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
                Gestione transferencias de licencias entre empresas
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
              <Button variant="outline" size="sm" onClick={fetchTransfers}>
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
                    <DialogTitle>Iniciar Transferencia de Licencia</DialogTitle>
                    <DialogDescription>
                      Transfiera una licencia de una empresa a otra
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from">Empresa Origen *</Label>
                        <Input
                          id="from"
                          placeholder="ID empresa origen"
                          value={formData.from_company_id}
                          onChange={e => setFormData({ ...formData, from_company_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="to">Empresa Destino *</Label>
                        <Input
                          id="to"
                          placeholder="ID empresa destino"
                          value={formData.to_company_id}
                          onChange={e => setFormData({ ...formData, to_company_id: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Transferencia</Label>
                      <Select
                        value={formData.transfer_type}
                        onValueChange={v => setFormData({ ...formData, transfer_type: v as 'permanent' | 'temporary' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="permanent">Permanente</SelectItem>
                          <SelectItem value="temporary">Temporal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo</Label>
                      <Textarea
                        id="reason"
                        placeholder="Describa el motivo de la transferencia..."
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        La transferencia requerirá aprobación antes de ser completada. 
                        Todos los dispositivos asociados serán desactivados.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInitiateTransfer}>
                      <Send className="h-4 w-4 mr-2" />
                      Iniciar Transferencia
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay transferencias que mostrar
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
                            <span className="max-w-[80px] truncate">{transfer.from_company_id.slice(0, 6)}...</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[80px] truncate">{transfer.to_company_id.slice(0, 6)}...</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transfer.transfer_type === 'permanent' ? 'Permanente' : 'Temporal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transfer.reason ? (
                          <p className="text-sm max-w-[150px] truncate" title={transfer.reason}>
                            {transfer.reason}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                          <Badge variant="outline" className="text-xs">
                            <History className="h-3 w-3 mr-1" />
                            En proceso
                          </Badge>
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
