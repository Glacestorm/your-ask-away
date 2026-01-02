import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Send, Loader2, Clock } from 'lucide-react';

interface SalesEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'quote' | 'order' | 'delivery' | 'invoice' | 'credit_note';
  documentId: string;
  companyId: string;
  customerEmail?: string;
  customerName?: string;
  documentNumber?: string;
  attachHtml?: string;
}

const typeLabels: Record<string, string> = {
  quote: 'Presupuesto',
  order: 'Pedido',
  delivery: 'Albarán',
  invoice: 'Factura',
  credit_note: 'Abono'
};

export function SalesEmailDialog({
  open,
  onOpenChange,
  documentType,
  documentId,
  companyId,
  customerEmail = '',
  customerName = '',
  documentNumber = '',
  attachHtml
}: SalesEmailDialogProps) {
  const [email, setEmail] = useState(customerEmail);
  const [name, setName] = useState(customerName);
  const [subject, setSubject] = useState(`${typeLabels[documentType]} ${documentNumber}`);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (queue: boolean = false) => {
    if (!email) {
      toast.error('El email es obligatorio');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-sales-email', {
        body: {
          action: queue ? 'queue_email' : 'send_document',
          documentType,
          documentId,
          companyId,
          recipientEmail: email,
          recipientName: name,
          subject: subject || undefined,
          body: body || undefined,
          attachHtml
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(queue ? 'Email añadido a la cola' : 'Email enviado correctamente');
        onOpenChange(false);
      } else {
        throw new Error(data?.error || 'Error enviando email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      toast.error('Error enviando el email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar {typeLabels[documentType]} por Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del destinatario"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensaje (opcional)</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Mensaje personalizado para el cliente..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Si lo dejas vacío, se usará un mensaje predeterminado.
            </p>
          </div>

          {attachHtml && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              📎 Se adjuntará el documento en el email
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleSend(true)}
            disabled={isSending || !email}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            Encolar
          </Button>
          <Button
            onClick={() => handleSend(false)}
            disabled={isSending || !email}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SalesEmailDialog;
