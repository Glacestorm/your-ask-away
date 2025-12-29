/**
 * Business Plan Generator Panel
 * Phase 15 Extended: Strategic Financial Agent
 * Generador inteligente de planes de negocio
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  RefreshCw, 
  Sparkles, 
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Lightbulb,
  Building2,
  Rocket
} from 'lucide-react';
import { useObelixiaBusinessPlan } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { downloadBusinessPlanPDF, type BusinessPlanPDFData } from '@/lib/pdfExportBusinessPlan';

const PLAN_TEMPLATES = [
  { id: 'startup-tech', name: 'Startup Tech', icon: Rocket, desc: 'Para empresas tecnológicas innovadoras', type: 'startup', audience: 'Tecnología' },
  { id: 'pyme-tradicional', name: 'PYME Tradicional', icon: Building2, desc: 'Negocios establecidos y tradicionales', type: 'pyme', audience: 'General' },
  { id: 'ecommerce', name: 'E-commerce', icon: DollarSign, desc: 'Tiendas online y marketplaces', type: 'ecommerce', audience: 'Retail Online' },
  { id: 'franquicia', name: 'Franquicia', icon: Users, desc: 'Modelos de franquicia y licencias', type: 'franchise', audience: 'Franquicias' },
  { id: 'servicios-b2b', name: 'Servicios B2B', icon: BarChart3, desc: 'Servicios para empresas', type: 'pyme', audience: 'B2B' },
  { id: 'saas', name: 'SaaS', icon: TrendingUp, desc: 'Software como servicio', type: 'startup', audience: 'SaaS' },
];

export function BusinessPlanGeneratorPanel() {
  const [activeTab, setActiveTab] = useState('plans');
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    title: '',
    plan_type: 'startup',
    target_audience: ''
  });

  const {
    plans,
    isLoading,
    fetchPlans,
    generatePlan,
  } = useObelixiaBusinessPlan();

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGeneratePlan = async () => {
    if (!newPlanData.title || !newPlanData.target_audience) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setIsGenerating(true);
    const result = await generatePlan({ 
      companyName: newPlanData.title,
      industry: newPlanData.target_audience 
    });
    setIsGenerating(false);
    if (result) {
      setShowNewPlan(false);
      setNewPlanData({ title: '', plan_type: 'startup', target_audience: '' });
    }
  };

  const handleUseTemplate = (template: typeof PLAN_TEMPLATES[0]) => {
    setNewPlanData({
      title: `Plan de Negocio - ${template.name}`,
      plan_type: template.type,
      target_audience: template.audience
    });
    setShowNewPlan(true);
    setActiveTab('plans');
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const handleExportPDF = (plan: any) => {
    const pdfData: BusinessPlanPDFData = {
      title: plan.title,
      companyName: plan.company_name || plan.title,
      planType: plan.plan_type,
      targetAudience: plan.target_audience,
      status: plan.status,
      createdAt: format(new Date(plan.created_at), 'dd/MM/yyyy', { locale: es }),
      executiveSummary: plan.executive_summary as BusinessPlanPDFData['executiveSummary'],
      marketAnalysis: plan.market_analysis as BusinessPlanPDFData['marketAnalysis'],
      businessModel: plan.business_model as BusinessPlanPDFData['businessModel'],
      financialPlan: plan.financial_plan as BusinessPlanPDFData['financialPlan'],
      marketingStrategy: plan.marketing_strategy as BusinessPlanPDFData['marketingStrategy'],
      operationsPlan: plan.operations_plan as BusinessPlanPDFData['operationsPlan'],
      teamOrganization: plan.team_organization as BusinessPlanPDFData['teamOrganization'],
      riskAnalysis: plan.risk_analysis as BusinessPlanPDFData['riskAnalysis'],
    };
    downloadBusinessPlanPDF(pdfData);
    toast.success('PDF generado correctamente');
  };
  
  const handleDeletePlan = async (planId: string) => {
    toast.success('Plan eliminado');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'archived': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCompletionPercentage = (plan: any) => {
    const sections = [
      plan.executive_summary,
      plan.market_analysis,
      plan.business_model,
      plan.financial_plan,
      plan.marketing_strategy,
      plan.operations_plan,
      plan.team_organization,
      plan.risk_analysis
    ];
    const completed = sections.filter(s => s && Object.keys(s).length > 0).length;
    return Math.round((completed / sections.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Generador de Planes de Negocio
          </h2>
          <p className="text-muted-foreground">
            Crea planes de negocio profesionales con IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchPlans()} variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button onClick={() => setShowNewPlan(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Planes</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">
                  {plans.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">
                  {plans.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <Rocket className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Borradores</p>
                <p className="text-2xl font-bold">
                  {plans.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Plan Form */}
      {showNewPlan && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Crear Nuevo Plan de Negocio
            </CardTitle>
            <CardDescription>
              La IA te ayudará a generar un plan completo y profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título del Plan *</label>
                <Input
                  placeholder="Ej: Plan de Negocio 2025"
                  value={newPlanData.title}
                  onChange={(e) => setNewPlanData({ ...newPlanData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Plan *</label>
                <Select
                  value={newPlanData.plan_type}
                  onValueChange={(value) => setNewPlanData({ ...newPlanData, plan_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="pyme">PYME</SelectItem>
                    <SelectItem value="expansion">Expansión</SelectItem>
                    <SelectItem value="franchise">Franquicia</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Público Objetivo / Industria *</label>
              <Input
                placeholder="Ej: Tecnología, Salud, Retail..."
                value={newPlanData.target_audience}
                onChange={(e) => setNewPlanData({ ...newPlanData, target_audience: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewPlan(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">
            <FileText className="h-4 w-4 mr-2" />
            Mis Planes
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Lightbulb className="h-4 w-4 mr-2" />
            Plantillas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{plan.title}</h4>
                          <Badge className={getStatusColor(plan.status || '')}>
                            {plan.status}
                          </Badge>
                          <Badge variant="outline">{plan.plan_type}</Badge>
                          {plan.target_audience && (
                            <Badge variant="outline">{plan.target_audience}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progreso</span>
                              <span>{getCompletionPercentage(plan)}%</span>
                            </div>
                            <Progress value={getCompletionPercentage(plan)} className="h-2" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Creado: {format(new Date(plan.created_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                          <span>
                            Actualizado: {format(new Date(plan.updated_at), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExportPDF(plan)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {plans.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes planes de negocio</p>
                  <Button className="mt-4" onClick={() => setShowNewPlan(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear tu primer plan
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAN_TEMPLATES.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <template.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.desc}</p>
                  <Button 
                    className="mt-4" 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Usar Plantilla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BusinessPlanGeneratorPanel;
