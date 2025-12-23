import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useDualApproval, ApprovalRequest, ApprovalRequestType } from '@/hooks/admin/useDualApproval';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DualApprovalWorkflowProps {
  sessionId: string;
  onApprovalComplete?: (requestId: string, approved: boolean) => void;
}

const REQUEST_TYPE_CONFIG: Record<ApprovalRequestType, { label: string; icon: React.ReactNode; color: string }> = {
  high_risk_action: { 
    label: 'Acción de Alto Riesgo', 
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-orange-500'
  },
  session_end: { 
    label: 'Finalizar Sesión', 
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-blue-500'
  },
  data_export: { 
    label: 'Exportar Datos', 
    icon: <Shield className="h-4 w-4" />,
    color: 'text-purple-500'
  },
  config_change: { 
    label: 'Cambio de Configuración', 
    icon: <Shield className="h-4 w-4" />,
    color: 'text-yellow-500'
  }
};

export function DualApprovalWorkflow({ sessionId, onApprovalComplete }: DualApprovalWorkflowProps) {
  const { 
    pendingRequests, 
    allRequests, 
    loading, 
    isSubmitting,
    approveRequest,
    rejectRequest 
  } = useDualApproval(sessionId);

  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async (request: ApprovalRequest) => {
    const success = await approveRequest(request.id);
    if (success) {
      onApprovalComplete?.(request.id, true);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    const success = await rejectRequest(selectedRequest.id, rejectionReason);
    if (success) {
      onApprovalComplete?.(selectedRequest.id, false);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
    }
  };

  const openRejectDialog = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    
    if (expires <= now) return 'Expirado';
    
    return formatDistanceToNow(expires, { locale: es, addSuffix: true });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Aprobaciones Pendientes
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sistema de aprobación dual para acciones de alto riesgo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay solicitudes pendientes</p>
              <p className="text-sm">Las acciones de alto riesgo requerirán aprobación</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {pendingRequests.map((request) => {
                  const config = REQUEST_TYPE_CONFIG[request.request_type];
                  
                  return (
                    <div 
                      key={request.id}
                      className="p-4 border rounded-lg bg-muted/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          <span className="font-medium">{config.label}</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      {request.metadata && Object.keys(request.metadata).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {request.metadata.description && (
                            <p>{request.metadata.description}</p>
                          )}
                          {request.metadata.actionType && (
                            <p>Acción: {request.metadata.actionType}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Solicitado: {format(new Date(request.requested_at), 'HH:mm:ss', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expira {getTimeRemaining(request.expires_at)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(request)}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => openRejectDialog(request)}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Recent history */}
          {allRequests.filter(r => r.status !== 'pending').length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Historial Reciente</h4>
              <div className="space-y-2">
                {allRequests
                  .filter(r => r.status !== 'pending')
                  .slice(0, 5)
                  .map((request) => {
                    const config = REQUEST_TYPE_CONFIG[request.request_type];
                    
                    return (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          <span>{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(request.updated_at), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Rechazar Solicitud
            </DialogTitle>
            <DialogDescription>
              Proporciona un motivo para rechazar esta solicitud de aprobación.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo del Rechazo</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explica por qué se rechaza esta solicitud..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirmar Rechazo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
