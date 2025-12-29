/**
 * Viability Study Panel
 * Phase 15 Extended: Strategic Financial Agent
 * Estudios de viabilidad económica con IA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  RefreshCw, 
  Sparkles, 
  Plus,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useObelixiaViabilityStudy } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ViabilityStudyPanel() {
  const [activeTab, setActiveTab] = useState('studies');
  const [showNewStudy, setShowNewStudy] = useState(false);
  const [newStudyData, setNewStudyData] = useState({
    study_name: '',
    project_description: '',
    initial_investment: '',
    projected_revenue: ''
  });

  const {
    viabilityStudies,
    isLoading,
    isAnalyzing,
    fetchViabilityStudies,
    runViabilityAnalysis,
    deleteStudy,
    exportStudy
  } = useObelixiaViabilityStudy();

  useEffect(() => {
    fetchViabilityStudies();
  }, []);

  const handleRunAnalysis = async () => {
    if (!newStudyData.study_name || !newStudyData.initial_investment) {
      toast.error('Completa los campos requeridos');
      return;
    }
    const result = await runViabilityAnalysis({
      ...newStudyData,
      initial_investment: parseFloat(newStudyData.initial_investment),
      projected_revenue: parseFloat(newStudyData.projected_revenue) || 0
    });
    if (result) {
      setShowNewStudy(false);
      setNewStudyData({ study_name: '', project_description: '', initial_investment: '', projected_revenue: '' });
    }
  };

  const getViabilityColor = (result: string | null) => {
    switch (result) {
      case 'viable': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'conditionally_viable': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'not_viable': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getViabilityIcon = (result: string | null) => {
    switch (result) {
      case 'viable': return <CheckCircle className="h-4 w-4" />;
      case 'conditionally_viable': return <AlertTriangle className="h-4 w-4" />;
      case 'not_viable': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const viableStudies = viabilityStudies.filter(s => s.viability_result === 'viable');
  const conditionalStudies = viabilityStudies.filter(s => s.viability_result === 'conditionally_viable');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Estudios de Viabilidad
          </h2>
          <p className="text-muted-foreground">
            Análisis de viabilidad económica con IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchViabilityStudies()} variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button onClick={() => setShowNewStudy(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estudio
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Estudios</p>
                <p className="text-2xl font-bold">{viabilityStudies.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viables</p>
                <p className="text-2xl font-bold">{viableStudies.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Condicionales</p>
                <p className="text-2xl font-bold">{conditionalStudies.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inversión Total</p>
                <p className="text-2xl font-bold">
                  {viabilityStudies.reduce((sum, s) => sum + (Number(s.initial_investment) || 0), 0).toLocaleString('es-ES')}€
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Study Form */}
      {showNewStudy && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nuevo Estudio de Viabilidad
            </CardTitle>
            <CardDescription>
              La IA analizará la viabilidad económica de tu proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Estudio *</label>
                <Input
                  placeholder="Ej: Expansión Madrid 2025"
                  value={newStudyData.study_name}
                  onChange={(e) => setNewStudyData({ ...newStudyData, study_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Inversión Inicial (€) *</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={newStudyData.initial_investment}
                  onChange={(e) => setNewStudyData({ ...newStudyData, initial_investment: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ingresos Proyectados Anuales (€)</label>
              <Input
                type="number"
                placeholder="120000"
                value={newStudyData.projected_revenue}
                onChange={(e) => setNewStudyData({ ...newStudyData, projected_revenue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción del Proyecto</label>
              <Textarea
                placeholder="Describe el proyecto a analizar..."
                value={newStudyData.project_description}
                onChange={(e) => setNewStudyData({ ...newStudyData, project_description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewStudy(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analizar Viabilidad
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Studies List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="studies">
            <Calculator className="h-4 w-4 mr-2" />
            Mis Estudios
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="studies">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {viabilityStudies.map((study) => (
                <Card key={study.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{study.study_name}</h4>
                          <Badge className={getViabilityColor(study.viability_result)}>
                            {getViabilityIcon(study.viability_result)}
                            <span className="ml-1">
                              {study.viability_result === 'viable' && 'Viable'}
                              {study.viability_result === 'conditionally_viable' && 'Condicional'}
                              {study.viability_result === 'not_viable' && 'No Viable'}
                              {!study.viability_result && 'Pendiente'}
                            </span>
                          </Badge>
                        </div>
                        
                        {study.project_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {study.project_description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Inversión</p>
                              <p className="font-semibold">
                                {Number(study.initial_investment).toLocaleString('es-ES')}€
                              </p>
                            </div>
                          </div>
                          {study.npv !== null && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-muted-foreground">VAN</p>
                                <p className="font-semibold">
                                  {Number(study.npv).toLocaleString('es-ES')}€
                                </p>
                              </div>
                            </div>
                          )}
                          {study.irr !== null && (
                            <div className="flex items-center gap-2">
                              <PieChart className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-muted-foreground">TIR</p>
                                <p className="font-semibold">{Number(study.irr).toFixed(1)}%</p>
                              </div>
                            </div>
                          )}
                          {study.payback_months !== null && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <div>
                                <p className="text-muted-foreground">Payback</p>
                                <p className="font-semibold">{study.payback_months} meses</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {study.viability_score !== null && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Score de Viabilidad</span>
                              <span className="font-semibold">{study.viability_score}/100</span>
                            </div>
                            <Progress 
                              value={study.viability_score} 
                              className={cn(
                                "h-2",
                                study.viability_score >= 70 && "[&>div]:bg-green-500",
                                study.viability_score >= 40 && study.viability_score < 70 && "[&>div]:bg-amber-500",
                                study.viability_score < 40 && "[&>div]:bg-destructive"
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => exportStudy(study.id, 'pdf')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {viabilityStudies.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes estudios de viabilidad</p>
                  <Button className="mt-4" onClick={() => setShowNewStudy(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear tu primer estudio
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Métricas Financieras
              </CardTitle>
              <CardDescription>
                Indicadores clave de los estudios realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">VAN Promedio</p>
                    <p className="text-2xl font-bold text-green-500">
                      {viabilityStudies.length > 0 
                        ? (viabilityStudies.reduce((sum, s) => sum + (Number(s.npv) || 0), 0) / viabilityStudies.length).toLocaleString('es-ES', { maximumFractionDigits: 0 })
                        : 0}€
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">TIR Promedio</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {viabilityStudies.length > 0 
                        ? (viabilityStudies.reduce((sum, s) => sum + (Number(s.irr) || 0), 0) / viabilityStudies.length).toFixed(1)
                        : 0}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Payback Promedio</p>
                    <p className="text-2xl font-bold text-amber-500">
                      {viabilityStudies.length > 0 
                        ? Math.round(viabilityStudies.reduce((sum, s) => sum + (s.payback_months || 0), 0) / viabilityStudies.length)
                        : 0} meses
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ViabilityStudyPanel;
