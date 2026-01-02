import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Printer, Loader2, Mail } from 'lucide-react';

interface SalesPDFPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'quote' | 'order' | 'delivery' | 'invoice' | 'credit_note';
  documentId: string;
  companyId: string;
  onSendEmail?: (html: string) => void;
}

const actionMap: Record<string, string> = {
  quote: 'generate_quote',
  order: 'generate_order',
  delivery: 'generate_delivery',
  invoice: 'generate_invoice',
  credit_note: 'generate_credit_note'
};

const titleMap: Record<string, string> = {
  quote: 'Presupuesto',
  order: 'Pedido',
  delivery: 'Albarán',
  invoice: 'Factura',
  credit_note: 'Abono'
};

export function SalesPDFPreview({
  open,
  onOpenChange,
  documentType,
  documentId,
  companyId,
  onSendEmail
}: SalesPDFPreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');

  const generatePDF = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-sales-pdf', {
        body: {
          action: actionMap[documentType],
          documentId,
          companyId
        }
      });

      if (error) throw error;

      if (data?.success && data?.html) {
        setHtml(data.html);
        setDocumentTitle(data.documentTitle || titleMap[documentType]);
      } else {
        throw new Error(data?.error || 'Error generando PDF');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Error generando el documento');
    } finally {
      setIsLoading(false);
    }
  }, [documentType, documentId, companyId]);

  // Generate on open
  useEffect(() => {
    if (open && documentId) {
      generatePDF();
    }
  }, [open, documentId, generatePDF]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Documento descargado');
  };

  const handleSendEmail = () => {
    if (onSendEmail && html) {
      onSendEmail(html);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vista Previa: {documentTitle || titleMap[documentType]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 pb-4 border-b">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!html}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={!html}>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          {onSendEmail && (
            <Button variant="default" size="sm" onClick={handleSendEmail} disabled={!html}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Generando documento...</span>
            </div>
          ) : html ? (
            <iframe
              srcDoc={html}
              className="w-full h-[600px] bg-white rounded-lg shadow-lg border"
              title="PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-30" />
              <p>No se pudo cargar el documento</p>
              <Button variant="outline" className="mt-4" onClick={generatePDF}>
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SalesPDFPreview;
