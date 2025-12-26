/**
 * Sustainability Reports Panel
 * Generador de informes CSRD, GRI, TCFD, SASB, CDP
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Globe,
  Building2,
  Leaf,
  Clock,
  Eye,
  Send
} from 'lucide-react';
import { useESGCompliance } from '@/hooks/admin/esg';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SustainabilityReportsPanelProps {
  className?: string;
}

const reportStandards = [
  { 
    id: 'CSRD', 
    name: 'CSRD', 
    fullName: 'Corporate Sustainability Reporting Directive',
    description: 'Directiva europea de información de sostenibilidad corporativa',
    region: 'EU',
    mandatory: true
  },
  { 
    id: 'GRI', 
    name: 'GRI', 
    fullName: 'Global Reporting Initiative',
    description: 'Estándares globales de reporting de sostenibilidad',
    region: 'Global',
    mandatory: false
  },
  { 
    id: 'TCFD', 
    name: 'TCFD', 
    fullName: 'Task Force on Climate-related Financial Disclosures',
    description: 'Divulgación de riesgos financieros climáticos',
    region: 'Global',
    mandatory: false
  },
  { 
    id: 'SASB', 
    name: 'SASB', 
    fullName: 'Sustainability Accounting Standards Board',
    description: 'Estándares de contabilidad de sostenibilidad por sector',
    region: 'USA',
    mandatory: false
  },
  { 
    id: 'CDP', 
    name: 'CDP', 
    fullName: 'Carbon Disclosure Project',
    description: 'Divulgación de impacto ambiental empresarial',
    region: 'Global',
    mandatory: false
  }
];

export function SustainabilityReportsPanel({ className }: SustainabilityReportsPanelProps) {
  const [selectedStandard, setSelectedStandard] = useState<'CSRD' | 'GRI' | 'TCFD' | 'SASB' | 'CDP'>('CSRD');
  const [reportPeriod, setReportPeriod] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState('generate');
  
  // Datos adicionales para el informe
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    description: '',
    sector: '',
    employees: '',
    revenue: ''
  });

  const {
    isLoading,
    report,
    carbonFootprint,
    esgScore,
    generateReport
  } = useESGCompliance();

  const handleGenerate = async () => {
    if (!carbonFootprint && !esgScore) {
      toast.error('Primero calcula la huella de carbono y evalúa el ESG');
      return;
    }
    
    await generateReport(selectedStandard, {
      period: reportPeriod,
      companyData: companyInfo,
      emissions: carbonFootprint || undefined,
      esgScore: esgScore || undefined
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Cumple</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'non_compliant':
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />No cumple</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const selectedStandardInfo = reportStandards.find(s => s.id === selectedStandard);

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generar Informe
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vista Previa
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Cumplimiento
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selección de estándar */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seleccionar Estándar de Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportStandards.map((standard) => (
                      <Card 
                        key={standard.id}
                        className={cn(
                          "cursor-pointer transition-all hover:border-primary/50",
                          selectedStandard === standard.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => setSelectedStandard(standard.id as typeof selectedStandard)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-lg font-bold">{standard.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {standard.region}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {standard.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {standard.description}
                          </p>
                          {standard.mandatory && (
                            <Badge className="mt-2 bg-orange-500/20 text-orange-400 text-xs">
                              Obligatorio EU
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Información de la empresa */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre de la empresa</Label>
                      <Input
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Mi Empresa S.L."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Input
                        value={companyInfo.sector}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, sector: e.target.value }))}
                        placeholder="Tecnología"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción de actividad</Label>
                    <Textarea
                      value={companyInfo.description}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descripción de la actividad principal..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número de empleados</Label>
                      <Input
                        type="number"
                        value={companyInfo.employees}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, employees: e.target.value }))}
                        placeholder="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ingresos anuales (€)</Label>
                      <Input
                        type="number"
                        value={companyInfo.revenue}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, revenue: e.target.value }))}
                        placeholder="5000000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel de configuración y generación */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Informe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Período del informe</Label>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">{selectedStandardInfo?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedStandardInfo?.description}
                    </p>
                  </div>

                  {/* Requisitos previos */}
                  <div className="space-y-2">
                    <Label>Datos requeridos</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Huella de carbono</span>
                        {carbonFootprint ? (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Calculada
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Pendiente</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Evaluación ESG</span>
                        {esgScore ? (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completada
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Pendiente</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={isLoading} 
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
                    ) : (
                      <><FileText className="h-4 w-4 mr-2" /> Generar Informe {selectedStandard}</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Formatos de exportación */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Formatos de Exportación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" disabled={!report}>
                    <FileText className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled={!report}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Descargar XBRL
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled={!report}>
                    <Globe className="h-4 w-4 mr-2" />
                    Publicar HTML
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {report ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{report.report_title}</CardTitle>
                    <CardDescription>Período: {reportPeriod}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para revisión
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {/* Resumen Ejecutivo */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h3 className="font-semibold mb-2">Resumen Ejecutivo</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.executive_summary}
                      </p>
                    </div>

                    {/* Secciones */}
                    {report.sections.map((section, idx) => (
                      <div key={idx} className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{section.section_id}</Badge>
                          <h3 className="font-semibold">{section.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {section.content}
                        </p>
                        
                        {section.metrics.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Métricas</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {section.metrics.map((metric, i) => (
                                <div key={i} className="p-2 rounded bg-muted/50 text-center">
                                  <p className="text-xs text-muted-foreground">{metric.name}</p>
                                  <p className="font-semibold">{metric.value} {metric.unit}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.targets.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Objetivos</h4>
                            {section.targets.map((target, i) => (
                              <div key={i} className="flex items-center gap-4 mb-2">
                                <span className="text-sm flex-1">{target.name}</span>
                                <span className="text-sm text-muted-foreground">{target.target}</span>
                                <div className="w-24">
                                  <Progress value={target.progress} className="h-2" />
                                </div>
                                <span className="text-sm font-medium">{target.progress}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Genera un informe para ver la vista previa
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          {report?.compliance_checklist ? (
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Cumplimiento - {selectedStandard}</CardTitle>
                <CardDescription>
                  Verificación de requisitos del estándar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.compliance_checklist.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        item.status === 'compliant' && "bg-green-500/5 border-green-500/20",
                        item.status === 'partial' && "bg-yellow-500/5 border-yellow-500/20",
                        item.status === 'non_compliant' && "bg-red-500/5 border-red-500/20"
                      )}
                    >
                      <span className="text-sm">{item.requirement}</span>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Resumen de cumplimiento</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-500">
                        {report.compliance_checklist.filter(i => i.status === 'compliant').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Cumple</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-500">
                        {report.compliance_checklist.filter(i => i.status === 'partial').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Parcial</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-500">
                        {report.compliance_checklist.filter(i => i.status === 'non_compliant').length}
                      </p>
                      <p className="text-xs text-muted-foreground">No cumple</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Genera un informe para ver el checklist de cumplimiento
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Informes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock history */}
                {[
                  { id: 1, type: 'CSRD', period: '2023', status: 'published', date: '2024-03-15' },
                  { id: 2, type: 'GRI', period: '2023', status: 'draft', date: '2024-03-10' },
                  { id: 3, type: 'CSRD', period: '2022', status: 'published', date: '2023-03-20' }
                ].map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Informe {item.type} - {item.period}</p>
                        <p className="text-sm text-muted-foreground">
                          Generado el {new Date(item.date).toLocaleDateString('es')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                        {item.status === 'published' ? 'Publicado' : 'Borrador'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SustainabilityReportsPanel;
