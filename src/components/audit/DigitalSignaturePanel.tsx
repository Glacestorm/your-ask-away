import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/dialog';
import { 
  PenTool, 
  CheckCircle, 
  XCircle,
  Shield,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { useDigitalSignatures, DigitalSignature } from '@/hooks/useDigitalSignatures';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface DigitalSignaturePanelProps {
  documentId?: string;
  documentType?: string;
  documentContent?: string;
  onSign?: (signature: DigitalSignature) => void;
}

export function DigitalSignaturePanel({
  documentId,
  documentType = 'audit_report',
  documentContent,
  onSign
}: DigitalSignaturePanelProps) {
  const [selectedSignature, setSelectedSignature] = useState<DigitalSignature | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  
  const { 
    signatures, 
    loading, 
    signDocument, 
    verifySignature, 
    fetchSignatures 
  } = useDigitalSignatures();

  const handleSign = async () => {
    if (!documentId || !documentContent) {
      toast.error('No hay documento para firmar');
      return;
    }

    const signature = await signDocument(
      documentId,
      documentType,
      documentContent,
      'QES'
    );

    if (signature) {
      onSign?.(signature);
    }
  };

  const handleVerify = async (signature: DigitalSignature) => {
    if (!documentContent) {
      toast.error('No hay contenido para verificar');
      return;
    }

    const result = await verifySignature(signature.id, documentContent);
    setVerificationResult(result);
    setSelectedSignature(signature);
  };

  const getEidasBadge = (level: string) => {
    switch (level) {
      case 'QES':
        return <Badge className="bg-green-500">eIDAS Cualificada</Badge>;
      case 'AdES':
        return <Badge className="bg-blue-500">eIDAS Avanzada</Badge>;
      default:
        return <Badge variant="outline">Simple</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sign Section */}
      {documentId && documentContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Firma Digital eIDAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Documento pendiente de firma</p>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {documentType} | ID: {documentId.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <Button onClick={handleSign} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PenTool className="h-4 w-4 mr-2" />
                )}
                Firmar con eIDAS QES
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-primary mb-1" />
                <p className="font-medium">Firma Cualificada</p>
                <p className="text-muted-foreground text-xs">
                  Nivel más alto según Reglamento eIDAS
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                <p className="font-medium">Validez Legal</p>
                <p className="text-muted-foreground text-xs">
                  Equivalente a firma manuscrita en la UE
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <FileText className="h-4 w-4 text-blue-500 mb-1" />
                <p className="font-medium">Sellado de Tiempo</p>
                <p className="text-muted-foreground text-xs">
                  Timestamp Authority RFC3161
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signatures List */}
      <Card>
        <CardHeader>
          <CardTitle>Firmas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : signatures.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <PenTool className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay firmas registradas</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Firmante</TableHead>
                    <TableHead>Nivel eIDAS</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatures.map((sig) => (
                    <TableRow key={sig.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sig.document_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {sig.document_id.substring(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{sig.signer_name}</p>
                          <p className="text-xs text-muted-foreground">{sig.signer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEidasBadge(sig.eidas_level)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(sig.signed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </TableCell>
                      <TableCell>
                        {sig.verification_status === 'valid' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Válida</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Inválida</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(sig)}
                          disabled={!documentContent}
                        >
                          Verificar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={!!selectedSignature} onOpenChange={() => setSelectedSignature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado de Verificación</DialogTitle>
          </DialogHeader>
          {verificationResult && (
            <div className={`p-4 rounded-lg ${
              verificationResult.valid 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center gap-3">
                {verificationResult.valid ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className="font-medium">
                    {verificationResult.valid ? 'Firma Válida' : 'Firma Inválida'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {verificationResult.message}
                  </p>
                </div>
              </div>
              
              {selectedSignature && (
                <div className="mt-4 space-y-2 text-sm">
                  <p><strong>Firmante:</strong> {selectedSignature.signer_name}</p>
                  <p><strong>Email:</strong> {selectedSignature.signer_email}</p>
                  <p><strong>Emisor:</strong> {selectedSignature.certificate_issuer}</p>
                  <p><strong>TSA:</strong> {selectedSignature.timestamp_authority}</p>
                  <p><strong>Hash:</strong> <code className="text-xs">{selectedSignature.document_hash.substring(0, 24)}...</code></p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
