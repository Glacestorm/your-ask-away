import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Building2, 
  CreditCard, 
  Car, 
  Landmark,
  Calendar,
  TrendingUp,
  RefreshCw,
  FileText,
  Euro
} from 'lucide-react';
import { useERPFinancingOperations } from '@/hooks/erp/useERPFinancingOperations';
import { useERPContext } from '@/hooks/erp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const operationTypeConfig = {
  leasing: { label: 'Leasing', icon: Car, color: 'bg-blue-500' },
  renting: { label: 'Renting', icon: Car, color: 'bg-cyan-500' },
  loan: { label: 'Préstamo', icon: Landmark, color: 'bg-green-500' },
  credit_line: { label: 'Línea de Crédito', icon: CreditCard, color: 'bg-purple-500' },
  credit_policy: { label: 'Póliza de Crédito', icon: FileText, color: 'bg-orange-500' },
  mortgage: { label: 'Hipoteca', icon: Building2, color: 'bg-red-500' },
};

const statusConfig = {
  active: { label: 'Activa', variant: 'default' as const },
  pending: { label: 'Pendiente', variant: 'secondary' as const },
  completed: { label: 'Completada', variant: 'outline' as const },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const },
};

export function FinancingOperationsPanel() {
  const { currentCompany } = useERPContext();
  const { 
    operations, 
    isLoading,
    stats,
    createOperation,
    refetch
  } = useERPFinancingOperations();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    operation_type: 'loan' as const,
    contract_number: '',
    financial_entity_name: '',
    principal_amount: '',
    interest_rate: '',
    interest_type: 'fixed' as const,
    start_date: '',
    end_date: '',
    term_months: '',
    payment_frequency: 'monthly' as const,
    description: '',
  });

  const handleCreate = async () => {
    if (!formData.contract_number || !formData.principal_amount || !formData.financial_entity_name) return;
    
    await createOperation({
      operation_type: formData.operation_type,
      contract_number: formData.contract_number,
      financial_entity_name: formData.financial_entity_name,
      principal_amount: parseFloat(formData.principal_amount),
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : 0,
      interest_type: formData.interest_type,
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      end_date: formData.end_date || new Date().toISOString().split('T')[0],
      term_months: formData.term_months ? parseInt(formData.term_months) : 12,
      payment_frequency: formData.payment_frequency,
      description: formData.description || undefined,
    });
    
    setIsCreateOpen(false);
    setFormData({
      operation_type: 'loan',
      contract_number: '',
      financial_entity_name: '',
      principal_amount: '',
      interest_rate: '',
      interest_type: 'fixed',
      start_date: '',
      end_date: '',
      term_months: '',
      payment_frequency: 'monthly',
      description: '',
    });
  };

  const filteredOperations = activeTab === 'all' 
    ? operations 
    : operations.filter(op => op.operation_type === activeTab);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Operaciones Activas</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeOperations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Principal Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.totalOutstanding.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Saldo Pendiente</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.totalOutstanding.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Próx. Vencimiento</span>
            </div>
            <p className="text-2xl font-bold mt-1">-</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Operaciones de Financiación
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Operación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Operación de Financiación</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de Operación</Label>
                    <Select 
                      value={formData.operation_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, operation_type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(operationTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Contrato</Label>
                    <Input 
                      value={formData.contract_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, contract_number: e.target.value }))}
                      placeholder="CONTRATO-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Entidad Financiera</Label>
                    <Input 
                      value={formData.financial_entity_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial_entity_name: e.target.value }))}
                      placeholder="Banco Santander"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Importe Principal (€)</Label>
                    <Input 
                      type="number"
                      value={formData.principal_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, principal_amount: e.target.value }))}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Interés (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
                      placeholder="3.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo Interés</Label>
                    <Select 
                      value={formData.interest_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, interest_type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fijo</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                        <SelectItem value="mixed">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <Input 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plazo (meses)</Label>
                    <Input 
                      type="number"
                      value={formData.term_months}
                      onChange={(e) => setFormData(prev => ({ ...prev, term_months: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia de Pago</Label>
                    <Select 
                      value={formData.payment_frequency} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, payment_frequency: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semi_annual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Descripción</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción de la operación..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate}>
                    Crear Operación
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="loan">Préstamos</TabsTrigger>
              <TabsTrigger value="leasing">Leasing</TabsTrigger>
              <TabsTrigger value="credit_line">Líneas Crédito</TabsTrigger>
              <TabsTrigger value="credit_policy">Pólizas</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredOperations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Landmark className="h-8 w-8 mb-2" />
                    <p>No hay operaciones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOperations.map((operation) => {
                      const typeConfig = operationTypeConfig[operation.operation_type as keyof typeof operationTypeConfig];
                      const opStatus = operation.status || 'active';
                      const status = statusConfig[opStatus as keyof typeof statusConfig];
                      const Icon = typeConfig?.icon || Landmark;
                      
                      return (
                        <div 
                          key={operation.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${typeConfig?.color || 'bg-gray-500'}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{operation.contract_number}</span>
                                <Badge variant={status?.variant}>{status?.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {operation.financial_entity_name || 'Sin entidad'} • {typeConfig?.label}
                              </p>
                              {operation.start_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(operation.start_date), 'dd MMM yyyy', { locale: es })}
                                  {operation.end_date && ` - ${format(new Date(operation.end_date), 'dd MMM yyyy', { locale: es })}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {(operation.principal_amount || 0).toLocaleString('es-ES', { style: 'currency', currency: operation.currency || 'EUR' })}
                            </p>
                            {operation.interest_rate && (
                              <p className="text-sm text-muted-foreground">
                                {operation.interest_rate}% {operation.interest_type === 'fixed' ? 'Fijo' : 'Variable'}
                              </p>
                            )}
                            {operation.outstanding_balance !== null && operation.outstanding_balance !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Pendiente: {operation.outstanding_balance.toLocaleString('es-ES', { style: 'currency', currency: operation.currency || 'EUR' })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancingOperationsPanel;
