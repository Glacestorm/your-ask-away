/**
 * Acciones para documentos de ventas ERP
 * Conversiones, PDF, Email
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  ArrowRightCircle, 
  FileText, 
  Mail, 
  Printer,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useERPSales } from '@/hooks/erp/useERPSales';
import { toast } from 'sonner';

interface SalesDocumentActionsProps {
  documentType: 'quote' | 'order' | 'delivery' | 'invoice' | 'credit';
  documentId: string;
  documentStatus: string;
  onAction?: () => void;
}

export function SalesDocumentActions({ 
  documentType, 
  documentId, 
  documentStatus,
  onAction 
}: SalesDocumentActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; title: string; description: string } | null>(null);
  
  const { 
    convertQuoteToOrder, 
    convertOrderToDeliveryNote, 
    invoiceDeliveryNotes,
    confirmOrder,
    confirmInvoice
  } = useERPSales();

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'quote_to_order':
          const order = await convertQuoteToOrder(documentId);
          if (order) {
            toast.success('Pedido creado desde presupuesto');
            onAction?.();
          }
          break;

        case 'order_to_delivery':
          const delivery = await convertOrderToDeliveryNote(documentId);
          if (delivery) {
            toast.success('Albarán creado desde pedido');
            onAction?.();
          }
          break;

        case 'delivery_to_invoice':
          const invoice = await invoiceDeliveryNotes([documentId]);
          if (invoice) {
            toast.success('Factura creada desde albarán');
            onAction?.();
          }
          break;

        case 'confirm_order':
          const confirmed = await confirmOrder(documentId);
          if (confirmed) {
            toast.success('Pedido confirmado');
            onAction?.();
          }
          break;

        case 'confirm_invoice':
          const invoiceConfirmed = await confirmInvoice(documentId);
          if (invoiceConfirmed) {
            toast.success('Factura confirmada y vencimiento generado');
            onAction?.();
          }
          break;

        case 'generate_pdf':
          toast.info('Generación de PDF próximamente');
          break;

        case 'send_email':
          toast.info('Envío de email próximamente');
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('[SalesDocumentActions] Error:', error);
      toast.error('Error al ejecutar acción');
    } finally {
      setIsLoading(false);
      setConfirmDialog(null);
    }
  };

  const getAvailableActions = () => {
    const actions: Array<{ key: string; label: string; icon: React.ReactNode; confirm?: boolean }> = [];

    if (documentType === 'quote' && ['draft', 'sent', 'accepted'].includes(documentStatus)) {
      actions.push({ 
        key: 'quote_to_order', 
        label: 'Convertir a Pedido', 
        icon: <ArrowRightCircle className="h-4 w-4" />,
        confirm: true
      });
    }

    if (documentType === 'order') {
      if (documentStatus === 'draft') {
        actions.push({ 
          key: 'confirm_order', 
          label: 'Confirmar Pedido', 
          icon: <CheckCircle className="h-4 w-4" />,
          confirm: true
        });
      }
      if (['confirmed', 'partial'].includes(documentStatus)) {
        actions.push({ 
          key: 'order_to_delivery', 
          label: 'Crear Albarán', 
          icon: <ArrowRightCircle className="h-4 w-4" />,
          confirm: true
        });
      }
    }

    if (documentType === 'delivery' && ['ready', 'shipped', 'delivered'].includes(documentStatus)) {
      actions.push({ 
        key: 'delivery_to_invoice', 
        label: 'Facturar Albarán', 
        icon: <ArrowRightCircle className="h-4 w-4" />,
        confirm: true
      });
    }

    if (documentType === 'invoice' && documentStatus === 'draft') {
      actions.push({ 
        key: 'confirm_invoice', 
        label: 'Confirmar y Generar Vencimiento', 
        icon: <CheckCircle className="h-4 w-4" />,
        confirm: true
      });
    }

    // Common actions
    if (!['cancelled'].includes(documentStatus)) {
      actions.push(
        { key: 'generate_pdf', label: 'Generar PDF', icon: <FileText className="h-4 w-4" /> },
        { key: 'send_email', label: 'Enviar por Email', icon: <Mail className="h-4 w-4" /> }
      );
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, idx) => (
            <div key={action.key}>
              {idx > 0 && action.key === 'generate_pdf' && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => {
                  if (action.confirm) {
                    setConfirmDialog({
                      open: true,
                      action: action.key,
                      title: action.label,
                      description: `¿Estás seguro de que quieres ${action.label.toLowerCase()}?`
                    });
                  } else {
                    handleAction(action.key);
                  }
                }}
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={() => confirmDialog && handleAction(confirmDialog.action)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SalesDocumentActions;
