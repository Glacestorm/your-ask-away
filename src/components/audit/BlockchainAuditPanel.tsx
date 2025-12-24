import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Link2, 
  Shield, 
  CheckCircle, 
  XCircle,
  Hash,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useBlockchainAuditTrail } from '@/hooks/useBlockchainAuditTrail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function BlockchainAuditPanel() {
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; brokenAt?: number } | null>(null);
  const [verifying, setVerifying] = useState(false);
  
  const { entries, loading, verifyChain, fetchEntries } = useBlockchainAuditTrail();

  const handleVerifyChain = async () => {
    setVerifying(true);
    const result = await verifyChain();
    setVerificationResult(result);
    setVerifying(false);
    
    if (result.valid) {
      toast.success('Cadena de auditoría verificada correctamente');
    } else {
      toast.error(`Integridad comprometida en bloque ${result.brokenAt}`);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500';
      case 'update': return 'bg-blue-500';
      case 'delete': return 'bg-red-500';
      case 'sign': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Creación';
      case 'update': return 'Modificación';
      case 'delete': return 'Eliminación';
      case 'sign': return 'Firma';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{entries.length}</p>
                <p className="text-sm text-muted-foreground">Entradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {entries.filter(e => e.is_verified).length}
                </p>
                <p className="text-sm text-muted-foreground">Verificadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Hash className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {entries[0]?.block_number || 0}
                </p>
                <p className="text-sm text-muted-foreground">Último Bloque</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                verificationResult === null 
                  ? 'bg-muted' 
                  : verificationResult.valid 
                    ? 'bg-green-500/10' 
                    : 'bg-red-500/10'
              }`}>
                {verificationResult === null ? (
                  <Shield className="h-5 w-5 text-muted-foreground" />
                ) : verificationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {verificationResult === null 
                    ? 'Sin verificar'
                    : verificationResult.valid 
                      ? 'Integridad OK' 
                      : 'Comprometida'}
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto"
                  onClick={handleVerifyChain}
                  disabled={verifying}
                >
                  {verifying ? 'Verificando...' : 'Verificar cadena'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Blockchain Audit Trail
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => fetchEntries()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay entradas en el audit trail</p>
              <p className="text-sm">Las acciones sobre evidencias y reportes se registrarán aquí</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bloque</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline">#{entry.block_number || '?'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{entry.entity_type}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {entry.entity_id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(entry.action)}>
                          {getActionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[150px]">
                          {entry.actor_email || 'Sistema'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {entry.data_hash.substring(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(entry.timestamp), 'dd/MM/yy HH:mm', { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.is_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Registro Inmutable</p>
              <p className="text-muted-foreground">
                Cada entrada está criptográficamente vinculada a la anterior mediante hash SHA-256,
                garantizando que cualquier modificación sea detectable. Este sistema cumple con
                requisitos de auditoría para normativas como SOX, GDPR y regulaciones financieras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
