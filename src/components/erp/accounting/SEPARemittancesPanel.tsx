/**
 * SEPARemittancesPanel - Gestión de Remesas SEPA
 * Crear, validar, generar XML y enviar remesas SEPA
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CreditCard, 
  Send, 
  FileCode, 
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Building,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type RemittanceStatus = 'draft' | 'validated' | 'generated' | 'sent' | 'processed' | 'rejected';
type RemittanceType = 'collection' | 'payment';

interface SEPARemittance {
  id: string;
  reference: string;
  type: RemittanceType;
  status: RemittanceStatus;
  createdAt: Date;
  executionDate: Date;
  itemCount: number;
  totalAmount: number;
  bankAccount: string;
  xmlFile?: string;
}

interface RemittanceItem {
  id: string;
  selected: boolean;
  documentNumber: string;
  entity: string;
  iban: string;
  amount: number;
  dueDate: Date;
  concept: string;
}

// Mock data
const mockRemittances: SEPARemittance[] = [
  { id: '1', reference: 'REM-2024-001', type: 'collection', status: 'sent', createdAt: addDays(new Date(), -5), executionDate: addDays(new Date(), 2), itemCount: 15, totalAmount: 45000, bankAccount: 'ES91 2100 0418 4502 0005 1332' },
  { id: '2', reference: 'REM-2024-002', type: 'payment', status: 'generated', createdAt: addDays(new Date(), -2), executionDate: addDays(new Date(), 5), itemCount: 8, totalAmount: 23500, bankAccount: 'ES91 2100 0418 4502 0005 1332' },
  { id: '3', reference: 'REM-2024-003', type: 'collection', status: 'validated', createdAt: addDays(new Date(), -1), executionDate: addDays(new Date(), 7), itemCount: 22, totalAmount: 67800, bankAccount: 'ES91 2100 0418 4502 0005 1332' },
  { id: '4', reference: 'REM-2024-004', type: 'collection', status: 'draft', createdAt: new Date(), executionDate: addDays(new Date(), 10), itemCount: 5, totalAmount: 12300, bankAccount: 'ES91 2100 0418 4502 0005 1332' },
];

const mockPendingItems: RemittanceItem[] = [
  { id: '1', selected: false, documentNumber: 'FV-2024-0150', entity: 'Cliente Alpha', iban: 'ES12 3456 7890 1234 5678 9012', amount: 2500, dueDate: addDays(new Date(), 5), concept: 'Factura Enero' },
  { id: '2', selected: false, documentNumber: 'FV-2024-0151', entity: 'Cliente Beta', iban: 'ES23 4567 8901 2345 6789 0123', amount: 3800, dueDate: addDays(new Date(), 7), concept: 'Factura Enero' },
  { id: '3', selected: false, documentNumber: 'FV-2024-0152', entity: 'Cliente Gamma', iban: 'ES34 5678 9012 3456 7890 1234', amount: 1200, dueDate: addDays(new Date(), 10), concept: 'Factura Enero' },
  { id: '4', selected: false, documentNumber: 'FV-2024-0153', entity: 'Cliente Delta', iban: 'ES45 6789 0123 4567 8901 2345', amount: 5600, dueDate: addDays(new Date(), 12), concept: 'Factura Febrero' },
  { id: '5', selected: false, documentNumber: 'FV-2024-0154', entity: 'Cliente Epsilon', iban: 'ES56 7890 1234 5678 9012 3456', amount: 980, dueDate: addDays(new Date(), 15), concept: 'Factura Febrero' },
];

export function SEPARemittancesPanel() {
  const { selectedCompany } = useERPContext();
  const [activeTab, setActiveTab] = useState('remittances');
  const [remittanceType, setRemittanceType] = useState<RemittanceType>('collection');
  const [pendingItems, setPendingItems] = useState(mockPendingItems);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedItems = useMemo(() => {
    return pendingItems.filter(item => item.selected);
  }, [pendingItems]);

  const totalSelected = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.amount, 0);
  }, [selectedItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const toggleItemSelection = (id: string) => {
    setPendingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAllSelection = (selected: boolean) => {
    setPendingItems(items => items.map(item => ({ ...item, selected })));
  };

  const getStatusBadge = (status: RemittanceStatus) => {
    const config = {
      draft: { label: 'Borrador', variant: 'secondary' as const, icon: Clock },
      validated: { label: 'Validada', variant: 'outline' as const, icon: CheckCircle2 },
      generated: { label: 'XML Generado', variant: 'outline' as const, icon: FileCode },
      sent: { label: 'Enviada', variant: 'default' as const, icon: Send },
      processed: { label: 'Procesada', variant: 'default' as const, icon: CheckCircle2 },
      rejected: { label: 'Rechazada', variant: 'destructive' as const, icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleCreateRemittance = async () => {
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos un documento');
      return;
    }
    setIsProcessing(true);
    // Simular creación
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Remesa creada con ${selectedItems.length} documentos`);
    setPendingItems(items => items.map(item => ({ ...item, selected: false })));
    setIsProcessing(false);
    setActiveTab('remittances');
  };

  const handleValidateRemittance = async (id: string) => {
    toast.success('Remesa validada correctamente');
  };

  const handleGenerateXML = async (id: string) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Fichero SEPA XML generado');
    setIsProcessing(false);
  };

  const handleSendRemittance = async (id: string) => {
    toast.success('Remesa enviada al banco');
  };

  if (!selectedCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para gestionar remesas SEPA
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Remesas SEPA</h3>
            <p className="text-sm text-muted-foreground">Gestión de cobros y pagos SEPA</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="remittances">Remesas</TabsTrigger>
          <TabsTrigger value="new">Nueva Remesa</TabsTrigger>
        </TabsList>

        {/* Lista de Remesas */}
        <TabsContent value="remittances" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Remesas Activas</CardTitle>
                <Button size="sm" onClick={() => setActiveTab('new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Remesa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Ejecución</TableHead>
                      <TableHead className="text-center">Docs</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRemittances.map((rem) => (
                      <TableRow key={rem.id}>
                        <TableCell className="font-mono font-medium">{rem.reference}</TableCell>
                        <TableCell>
                          <Badge variant={rem.type === 'collection' ? 'default' : 'secondary'}>
                            {rem.type === 'collection' ? 'Cobro' : 'Pago'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(rem.status)}</TableCell>
                        <TableCell>{format(rem.executionDate, 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-center">{rem.itemCount}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(rem.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {rem.status === 'draft' && (
                              <Button size="sm" variant="outline" onClick={() => handleValidateRemittance(rem.id)}>
                                Validar
                              </Button>
                            )}
                            {rem.status === 'validated' && (
                              <Button size="sm" variant="outline" onClick={() => handleGenerateXML(rem.id)}>
                                <FileCode className="h-4 w-4 mr-1" />
                                XML
                              </Button>
                            )}
                            {rem.status === 'generated' && (
                              <>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={() => handleSendRemittance(rem.id)}>
                                  <Send className="h-4 w-4 mr-1" />
                                  Enviar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nueva Remesa */}
        <TabsContent value="new" className="space-y-4">
          {/* Tipo de remesa */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={cn(
                "cursor-pointer transition-all",
                remittanceType === 'collection' && "ring-2 ring-primary"
              )}
              onClick={() => setRemittanceType('collection')}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <ArrowRight className="h-6 w-6 text-green-500 rotate-180" />
                </div>
                <div>
                  <p className="font-semibold">Remesa de Cobro</p>
                  <p className="text-sm text-muted-foreground">SEPA Direct Debit (SDD)</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={cn(
                "cursor-pointer transition-all",
                remittanceType === 'payment' && "ring-2 ring-primary"
              )}
              onClick={() => setRemittanceType('payment')}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <ArrowRight className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">Remesa de Pago</p>
                  <p className="text-sm text-muted-foreground">SEPA Credit Transfer (SCT)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentos pendientes */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Documentos Pendientes</CardTitle>
                  <CardDescription>Selecciona los documentos a incluir en la remesa</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} seleccionados
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(totalSelected)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={selectedItems.length === pendingItems.length}
                          onCheckedChange={(checked) => toggleAllSelection(!!checked)}
                        />
                      </TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>IBAN</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingItems.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer" onClick={() => toggleItemSelection(item.id)}>
                        <TableCell>
                          <Checkbox checked={item.selected} />
                        </TableCell>
                        <TableCell className="font-mono">{item.documentNumber}</TableCell>
                        <TableCell>{item.entity}</TableCell>
                        <TableCell className="font-mono text-xs">{item.iban}</TableCell>
                        <TableCell>{format(item.dueDate, 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab('remittances')}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateRemittance} 
                  disabled={selectedItems.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Remesa
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SEPARemittancesPanel;
