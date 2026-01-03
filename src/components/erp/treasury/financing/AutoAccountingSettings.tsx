import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings,
  Save,
  RefreshCw,
  FileText,
  Landmark,
  Wallet,
  Check,
  Info
} from 'lucide-react';
import { useERPAutoAccounting, type AccountingTemplate, type AccountingConfig } from '@/hooks/erp/useERPAutoAccounting';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
  financing: { label: 'Financiación', icon: Landmark },
  investment: { label: 'Inversiones', icon: Wallet },
  trade: { label: 'Comercio Exterior', icon: FileText }
};

const operationTypeLabels: Record<string, string> = {
  leasing: 'Leasing',
  loan: 'Préstamo',
  credit_policy: 'Póliza de Crédito',
  term_deposit: 'Depósito a Plazo',
  government_bond: 'Bono del Estado',
  corporate_bond: 'Bono Corporativo',
  stock: 'Acciones',
  mutual_fund: 'Fondo de Inversión'
};

const transactionTypeLabels: Record<string, string> = {
  creation: 'Alta/Apertura',
  payment: 'Pago/Cuota',
  interest: 'Intereses',
  fees: 'Comisiones',
  maturity: 'Vencimiento',
  coupon: 'Cupón',
  dividend: 'Dividendo',
  sell: 'Venta'
};

interface ConfigEditorProps {
  template: AccountingTemplate;
  existingConfig?: AccountingConfig;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

function ConfigEditor({ template, existingConfig, onSave, onClose }: ConfigEditorProps) {
  const [formData, setFormData] = useState({
    debit_account_code: existingConfig?.debit_account_code || template.debit_account_code,
    debit_account_name: existingConfig?.debit_account_name || template.debit_account_name || '',
    credit_account_code: existingConfig?.credit_account_code || template.credit_account_code,
    credit_account_name: existingConfig?.credit_account_name || template.credit_account_name || '',
    tax_account_code: existingConfig?.tax_account_code || template.tax_account_code || '',
    tax_rate: existingConfig?.tax_rate || template.tax_rate || 0,
    description_template: existingConfig?.description_template || template.description_template || '',
    auto_post: existingConfig?.auto_post || false,
    requires_approval: existingConfig?.requires_approval !== false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        operation_category: template.operation_category,
        operation_type: template.operation_type,
        transaction_type: template.transaction_type,
        ...formData
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cuenta Debe</Label>
          <Input
            value={formData.debit_account_code}
            onChange={(e) => setFormData(prev => ({ ...prev, debit_account_code: e.target.value }))}
            placeholder="572"
          />
        </div>
        <div className="space-y-2">
          <Label>Nombre Cuenta Debe</Label>
          <Input
            value={formData.debit_account_name}
            onChange={(e) => setFormData(prev => ({ ...prev, debit_account_name: e.target.value }))}
            placeholder="Bancos"
          />
        </div>
        <div className="space-y-2">
          <Label>Cuenta Haber</Label>
          <Input
            value={formData.credit_account_code}
            onChange={(e) => setFormData(prev => ({ ...prev, credit_account_code: e.target.value }))}
            placeholder="170"
          />
        </div>
        <div className="space-y-2">
          <Label>Nombre Cuenta Haber</Label>
          <Input
            value={formData.credit_account_name}
            onChange={(e) => setFormData(prev => ({ ...prev, credit_account_name: e.target.value }))}
            placeholder="Deudas LP"
          />
        </div>
        <div className="space-y-2">
          <Label>Cuenta IVA (opcional)</Label>
          <Input
            value={formData.tax_account_code}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_account_code: e.target.value }))}
            placeholder="472"
          />
        </div>
        <div className="space-y-2">
          <Label>% IVA</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.tax_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
            placeholder="21"
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Plantilla de Descripción</Label>
          <Input
            value={formData.description_template}
            onChange={(e) => setFormData(prev => ({ ...prev, description_template: e.target.value }))}
            placeholder="Pago préstamo {contract_number}"
          />
          <p className="text-xs text-muted-foreground">
            Variables: {'{contract_number}'}, {'{investment_name}'}, {'{payment_number}'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.auto_post}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_post: checked }))}
            />
            <Label className="text-sm">Contabilizar automáticamente</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.requires_approval}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked }))}
            />
            <Label className="text-sm">Requiere aprobación</Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Guardar
        </Button>
      </DialogFooter>
    </div>
  );
}

export function AutoAccountingSettings() {
  const [activeTab, setActiveTab] = useState('financing');
  const [editingTemplate, setEditingTemplate] = useState<AccountingTemplate | null>(null);

  const {
    templates,
    templatesByCategory,
    config,
    isLoading,
    saveConfig,
    hasConfig
  } = useERPAutoAccounting();

  const handleSaveConfig = async (data: any) => {
    await saveConfig(data);
    toast.success('Configuración guardada');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Contabilidad Automática
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Configura las cuentas contables para cada tipo de operación. 
                   Los asientos se generarán automáticamente según esta configuración.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(categoryLabels).map(([category]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : !templatesByCategory[category]?.length ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>No hay plantillas para esta categoría</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templatesByCategory[category].map((template) => {
                        const isConfigured = hasConfig(
                          template.operation_category,
                          template.operation_type,
                          template.transaction_type
                        );

                        return (
                          <div 
                            key={template.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{template.template_name}</span>
                                {isConfigured && (
                                  <Badge variant="default" className="bg-green-500">
                                    <Check className="h-3 w-3 mr-1" />
                                    Configurado
                                  </Badge>
                                )}
                                {template.is_default && (
                                  <Badge variant="outline">Por defecto</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {operationTypeLabels[template.operation_type] || template.operation_type} → {' '}
                                {transactionTypeLabels[template.transaction_type] || template.transaction_type}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                D: {template.debit_account_code} | H: {template.credit_account_code}
                              </p>
                            </div>
                            <Dialog 
                              open={editingTemplate?.id === template.id}
                              onOpenChange={(open) => !open && setEditingTemplate(null)}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingTemplate(template)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configurar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Configurar: {template.template_name}</DialogTitle>
                                </DialogHeader>
                                {editingTemplate && (
                                  <ConfigEditor
                                    template={editingTemplate}
                                    existingConfig={config.find(c => 
                                      c.operation_category === template.operation_category &&
                                      c.operation_type === template.operation_type &&
                                      c.transaction_type === template.transaction_type
                                    )}
                                    onSave={handleSaveConfig}
                                    onClose={() => setEditingTemplate(null)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AutoAccountingSettings;
