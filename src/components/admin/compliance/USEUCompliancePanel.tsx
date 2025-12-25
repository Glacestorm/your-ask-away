import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Play,
  Download,
  Brain
} from 'lucide-react';
import { useUSEUCompliance } from '@/hooks/admin/compliance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const complianceFrameworks = {
  us: [
    { id: 'soc2', name: 'SOC 2 Type II', icon: Shield, color: 'blue' },
    { id: 'hipaa', name: 'HIPAA', icon: Shield, color: 'green' },
    { id: 'sox', name: 'SOX', icon: FileText, color: 'purple' },
    { id: 'statetax', name: 'State Tax', icon: FileText, color: 'orange' },
  ],
  eu: [
    { id: 'gdpr', name: 'GDPR', icon: Shield, color: 'blue' },
    { id: 'dora', name: 'DORA', icon: Shield, color: 'red' },
    { id: 'psd3', name: 'PSD3', icon: FileText, color: 'green' },
    { id: 'aiact', name: 'AI Act', icon: Brain, color: 'purple' },
    { id: 'sepa', name: 'SEPA Instant', icon: Clock, color: 'orange' },
  ],
};

export function USEUCompliancePanel() {
  const [activeRegion, setActiveRegion] = useState<'us' | 'eu'>('us');
  const [selectedFramework, setSelectedFramework] = useState('soc2');
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const {
    isLoading,
    config,
    error,
    checks,
    fetchConfig,
    updateConfig,
    runComplianceChecks,
    processDSAR,
    generateComplianceReport,
    performAIActAssessment,
  } = useUSEUCompliance();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleRunCheck = async () => {
    setIsRunningCheck(true);
    const result = await runComplianceChecks([selectedFramework]);
    setIsRunningCheck(false);
    if (result) {
      toast.success(`Verificación ${selectedFramework.toUpperCase()} completada`);
    }
  };

  const handleGenerateReport = async () => {
    const result = await generateComplianceReport([selectedFramework], 'pdf');
    if (result) {
      toast.success('Reporte generado');
    }
  };

  const handleAIActAssessment = async () => {
    const result = await performAIActAssessment(
      'Internal AI Model for customer analytics with limited risk classification'
    );
    if (result) {
      toast.success('AI Act assessment completado');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      compliant: { color: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Cumple' },
      partial: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Parcial' },
      'non-compliant': { color: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'No Cumple' },
      pending: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', label: 'Pendiente' },
    };
    const v = variants[status] || variants.pending;
    return <Badge variant="outline" className={v.color}>{v.label}</Badge>;
  };

  const renderUSCompliance = () => (
    <div className="space-y-4">
      {/* SOC 2 */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium">SOC 2 Type II</span>
          </div>
          {getStatusBadge('compliant')}
        </div>
        <Progress value={94} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>94% controles pasados</span>
          <span className="text-right">Última auditoría: hace 30 días</span>
        </div>
        <div className="flex gap-2">
          <Switch defaultChecked />
          <span className="text-sm">Monitoreo continuo</span>
        </div>
      </div>

      {/* HIPAA */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium">HIPAA</span>
          </div>
          {getStatusBadge('partial')}
        </div>
        <Progress value={78} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>78% requisitos cumplidos</span>
          <span className="text-right">BAA: Activo</span>
        </div>
        <div className="flex gap-2">
          <Switch />
          <span className="text-sm">Módulo Healthcare activo</span>
        </div>
      </div>

      {/* SOX */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span className="font-medium">SOX Compliance</span>
          </div>
          {getStatusBadge('compliant')}
        </div>
        <Progress value={91} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>91% controles financieros</span>
          <span className="text-right">Próx. revisión: 45 días</span>
        </div>
      </div>

      {/* State Tax Engine */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <span className="font-medium">State Tax Engine</span>
          </div>
          <Badge variant="outline">50 Estados</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          Cálculo automático de impuestos por estado
        </div>
        <div className="flex gap-2">
          <Switch defaultChecked />
          <span className="text-sm">Auto-actualización de tasas</span>
        </div>
      </div>
    </div>
  );

  const renderEUCompliance = () => (
    <div className="space-y-4">
      {/* GDPR */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-medium">GDPR</span>
          </div>
          {getStatusBadge('compliant')}
        </div>
        <Progress value={96} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>96% cumplimiento</span>
          <span className="text-right">DPO: Asignado</span>
        </div>
        <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => processDSAR('access', 'test-user')}>
                  Procesar DSAR
                </Button>
                <Badge variant="secondary">Consentimientos: OK</Badge>
                <Badge variant="secondary">Art. 30: OK</Badge>
              </div>
            </div>

            {/* DORA */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="font-medium">DORA</span>
          </div>
          {getStatusBadge('partial')}
        </div>
        <Progress value={72} className="h-2" />
        <div className="text-xs text-muted-foreground">
          Digital Operational Resilience Act - Resiliencia operativa digital
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">ICT Risk</Badge>
          <Badge variant="outline" className="text-xs">Third Party</Badge>
          <Badge variant="outline" className="text-xs">Testing</Badge>
        </div>
      </div>

      {/* PSD3 */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            <span className="font-medium">PSD3 Ready</span>
          </div>
          {getStatusBadge('pending')}
        </div>
        <div className="text-xs text-muted-foreground">
          Nueva directiva de servicios de pago (preparación)
        </div>
        <div className="flex gap-2">
          <Switch />
          <span className="text-sm">Open Banking APIs</span>
        </div>
      </div>

      {/* AI Act */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="font-medium">AI Act Compliance</span>
          </div>
          {getStatusBadge('compliant')}
        </div>
        <Progress value={88} className="h-2" />
        <div className="text-xs text-muted-foreground">
          Documentación de modelos IA y evaluación de riesgos
        </div>
        <Button size="sm" variant="outline" onClick={handleAIActAssessment}>
          <Brain className="h-3 w-3 mr-1" />
          Ejecutar Assessment
        </Button>
      </div>

      {/* SEPA Instant */}
      <div className="p-4 rounded-lg border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="font-medium">SEPA Instant</span>
          </div>
          {getStatusBadge('compliant')}
        </div>
        <div className="text-xs text-muted-foreground">
          Pagos instantáneos en la zona Euro
        </div>
        <div className="flex gap-2">
          <Switch defaultChecked />
          <span className="text-sm">Pagos &lt; 10 segundos</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">US/EU RegTech Pack</CardTitle>
              <p className="text-xs text-muted-foreground">
                SOC2, HIPAA, GDPR, DORA, AI Act
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchConfig()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeRegion} onValueChange={(v) => setActiveRegion(v as 'us' | 'eu')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="us" className="text-sm">
              🇺🇸 Estados Unidos
            </TabsTrigger>
            <TabsTrigger value="eu" className="text-sm">
              🇪🇺 Unión Europea
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[420px] pr-4">
            <TabsContent value="us" className="mt-0">
              {renderUSCompliance()}
            </TabsContent>
            <TabsContent value="eu" className="mt-0">
              {renderEUCompliance()}
            </TabsContent>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleRunCheck}
              disabled={isRunningCheck}
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunningCheck ? 'Verificando...' : 'Ejecutar Verificación'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleGenerateReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Reporte
            </Button>
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

export default USEUCompliancePanel;
