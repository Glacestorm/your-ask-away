import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Globe,
  Building2,
  Receipt,
  Settings2
} from 'lucide-react';
import { useLatamCompliance } from '@/hooks/admin/compliance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const countryFlags: Record<string, string> = {
  mexico: '🇲🇽',
  brasil: '🇧🇷',
  argentina: '🇦🇷',
  chile: '🇨🇱',
  colombia: '🇨🇴',
};

const countryNames: Record<string, string> = {
  mexico: 'México',
  brasil: 'Brasil',
  argentina: 'Argentina',
  chile: 'Chile',
  colombia: 'Colombia',
};

export function LatamCompliancePanel() {
  const [activeCountry, setActiveCountry] = useState('mexico');
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    isLoading,
    config,
    error,
    fetchConfig,
    updateConfig,
    generateInvoice,
    validateTaxId,
    getPacStatus,
  } = useLatamCompliance();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    const result = await generateInvoice({
      country: activeCountry as any,
      type: 'standard',
      data: { amount: 1000, description: 'Test invoice' }
    });
    setIsGenerating(false);
    if (result) {
      toast.success(`Factura generada: ${result.invoiceId}`);
    }
  };

  const handleValidateTaxId = async (taxId: string) => {
    const isValid = await validateTaxId(activeCountry, taxId);
    toast[isValid ? 'success' : 'error'](
      isValid ? 'ID fiscal válido' : 'ID fiscal inválido'
    );
  };

  const renderMexicoConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Versión CFDI</Label>
          <Select defaultValue="4.0">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4.0">CFDI 4.0</SelectItem>
              <SelectItem value="3.3">CFDI 3.3 (Legacy)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Proveedor PAC</Label>
          <Select defaultValue="finkok">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finkok">Finkok</SelectItem>
              <SelectItem value="diverza">Diverza</SelectItem>
              <SelectItem value="facturapi">FacturAPI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>RFC Emisor</Label>
        <Input placeholder="XAXX010101000" />
      </div>
      <div className="space-y-2">
        <Label>Régimen Fiscal</Label>
        <Select defaultValue="601">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="601">General de Ley PM</SelectItem>
            <SelectItem value="612">Personas Físicas con Actividad Empresarial</SelectItem>
            <SelectItem value="626">Régimen Simplificado de Confianza</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Carta Porte</p>
          <p className="text-xs text-muted-foreground">Complemento para traslado de mercancías</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Addendas</p>
          <p className="text-xs text-muted-foreground">SAP, Walmart, Liverpool</p>
        </div>
        <Switch />
      </div>
    </div>
  );

  const renderBrasilConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CNPJ</Label>
        <Input placeholder="00.000.000/0001-00" />
      </div>
      <div className="space-y-2">
        <Label>Inscrição Estadual</Label>
        <Input placeholder="000.000.000.000" />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">NF-e</p>
          <p className="text-xs text-muted-foreground">Nota Fiscal Eletrônica</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">NFS-e</p>
          <p className="text-xs text-muted-foreground">Nota Fiscal de Serviços</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">SPED</p>
          <p className="text-xs text-muted-foreground">Sistema Público de Escrituração Digital</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">PIX</p>
          <p className="text-xs text-muted-foreground">Pagamentos instantâneos</p>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  );

  const renderArgentinaConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CUIT</Label>
        <Input placeholder="20-12345678-9" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Punto de Venta</Label>
          <Input placeholder="0001" />
        </div>
        <div className="space-y-2">
          <Label>Tipo Comprobante</Label>
          <Select defaultValue="1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Factura A</SelectItem>
              <SelectItem value="6">Factura B</SelectItem>
              <SelectItem value="11">Factura C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">AFIP Factura Electrónica</p>
          <p className="text-xs text-muted-foreground">Web Service WSFEV1</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Percepciones/Retenciones</p>
          <p className="text-xs text-muted-foreground">Cálculo automático</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Mercado Pago</p>
          <p className="text-xs text-muted-foreground">Integración de pagos</p>
        </div>
        <Switch />
      </div>
    </div>
  );

  const renderChileConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>RUT Emisor</Label>
        <Input placeholder="12.345.678-9" />
      </div>
      <div className="space-y-2">
        <Label>N° Resolución SII</Label>
        <Input placeholder="80" />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">SII Factura Electrónica</p>
          <p className="text-xs text-muted-foreground">DTE con timbre electrónico</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Boleta Electrónica</p>
          <p className="text-xs text-muted-foreground">Para ventas B2C</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Previred</p>
          <p className="text-xs text-muted-foreground">Gestión de nóminas</p>
        </div>
        <Switch />
      </div>
    </div>
  );

  const renderColombiaConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>NIT</Label>
        <Input placeholder="900.123.456-7" />
      </div>
      <div className="space-y-2">
        <Label>Resolución Facturación DIAN</Label>
        <Input placeholder="18760000001" />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">DIAN Factura Electrónica</p>
          <p className="text-xs text-muted-foreground">Factura electrónica de venta</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">Nómina Electrónica</p>
          <p className="text-xs text-muted-foreground">Documento soporte de nómina</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">PSE</p>
          <p className="text-xs text-muted-foreground">Pagos Seguros en Línea</p>
        </div>
        <Switch />
      </div>
    </div>
  );

  const renderCountryConfig = () => {
    switch (activeCountry) {
      case 'mexico': return renderMexicoConfig();
      case 'brasil': return renderBrasilConfig();
      case 'argentina': return renderArgentinaConfig();
      case 'chile': return renderChileConfig();
      case 'colombia': return renderColombiaConfig();
      default: return null;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">LATAM Compliance Pack</CardTitle>
              <p className="text-xs text-muted-foreground">
                Facturación electrónica y cumplimiento fiscal
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchConfig()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeCountry} onValueChange={setActiveCountry}>
          <TabsList className="grid grid-cols-5 mb-4">
            {Object.entries(countryFlags).map(([key, flag]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                <span className="mr-1">{flag}</span>
                <span className="hidden sm:inline">{countryNames[key]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-4">
            {/* Status Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
                <span className="text-sm font-medium">
                  {countryFlags[activeCountry]} {countryNames[activeCountry]}
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={handleGenerateInvoice} disabled={isGenerating}>
                <Receipt className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'Test Factura'}
              </Button>
            </div>

            {/* Country Config */}
            <ScrollArea className="h-[400px] pr-4">
              {renderCountryConfig()}
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1" onClick={() => updateConfig(activeCountry, {})}>
                <Settings2 className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </div>
        </Tabs>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LatamCompliancePanel;
