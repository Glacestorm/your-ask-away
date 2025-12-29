/**
 * Competitive Analysis Panel
 * Phase 15 Extended: Strategic Financial Agent
 * Análisis competitivo con IA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  RefreshCw, 
  Sparkles, 
  Plus,
  Download,
  Eye,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  AlertTriangle,
  Zap,
  Building2,
  Globe
} from 'lucide-react';
import { useObelixiaCompetitiveAnalysis } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CompetitiveAnalysisPanel() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newAnalysisData, setNewAnalysisData] = useState({
    competitor_name: '',
    competitor_type: '',
    website_url: ''
  });

  const {
    analyses,
    isLoading,
    fetchAnalyses,
    generateAnalysis,
    exportAnalysis
  } = useObelixiaCompetitiveAnalysis();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleRunAnalysis = async () => {
    if (!newAnalysisData.competitor_name) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setIsAnalyzing(true);
    const result = await generateAnalysis({
      analysisName: newAnalysisData.competitor_name,
      industry: newAnalysisData.competitor_type,
      ourCompanyProfile: {}
    });
    setIsAnalyzing(false);
    if (result) {
      setShowNewAnalysis(false);
      setNewAnalysisData({ competitor_name: '', competitor_type: '', website_url: '' });
    }
  };

  const getThreatColor = (threatLevel: number | null) => {
    if (!threatLevel) return 'bg-muted text-muted-foreground';
    if (threatLevel >= 8) return 'bg-red-500/10 text-red-500';
    if (threatLevel >= 5) return 'bg-amber-500/10 text-amber-500';
    return 'bg-green-500/10 text-green-500';
  };

  const getThreatLabel = (threatLevel: number | null) => {
    if (!threatLevel) return 'Sin evaluar';
    if (threatLevel >= 8) return 'Amenaza Alta';
    if (threatLevel >= 5) return 'Amenaza Media';
    return 'Amenaza Baja';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Análisis Competitivo
          </h2>
          <p className="text-muted-foreground">
            Inteligencia competitiva potenciada por IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchAnalyses()} variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button onClick={() => setShowNewAnalysis(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Análisis
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Competidores Analizados</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Amenazas Altas</p>
                <p className="text-2xl font-bold">
                  {analyses.filter(a => (a.threat_level || 0) >= 8).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuota Media Estimada</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + (a.market_share_estimate || 0), 0) / analyses.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Similitud Promedio</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + (a.similarity_score || 0), 0) / analyses.length).toFixed(0)
                    : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Analysis Form */}
      {showNewAnalysis && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nuevo Análisis Competitivo
            </CardTitle>
            <CardDescription>
              La IA investigará y analizará a tu competidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Competidor *</label>
                <Input
                  placeholder="Ej: Empresa Competidora S.L."
                  value={newAnalysisData.competitor_name}
                  onChange={(e) => setNewAnalysisData({ ...newAnalysisData, competitor_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Competidor</label>
                <Input
                  placeholder="Ej: Directo, Indirecto, Potencial..."
                  value={newAnalysisData.competitor_type}
                  onChange={(e) => setNewAnalysisData({ ...newAnalysisData, competitor_type: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sitio Web</label>
              <Input
                placeholder="https://www.competidor.com"
                value={newAnalysisData.website_url}
                onChange={(e) => setNewAnalysisData({ ...newAnalysisData, website_url: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewAnalysis(false)}>
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
                    Ejecutar Análisis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="analysis">
            <Users className="h-4 w-4 mr-2" />
            Competidores
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{analysis.competitor_name}</h4>
                          <Badge className={getThreatColor(analysis.threat_level)}>
                            {getThreatLabel(analysis.threat_level)}
                          </Badge>
                          {analysis.competitor_type && (
                            <Badge variant="outline">{analysis.competitor_type}</Badge>
                          )}
                        </div>

                        {analysis.positioning_statement && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {analysis.positioning_statement}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {analysis.market_share_estimate !== null && (
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-muted-foreground">Cuota</p>
                                <p className="font-semibold">{analysis.market_share_estimate}%</p>
                              </div>
                            </div>
                          )}
                          {analysis.similarity_score !== null && (
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-muted-foreground">Similitud</p>
                                <p className="font-semibold">{analysis.similarity_score}%</p>
                              </div>
                            </div>
                          )}
                          {analysis.employee_count && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-muted-foreground">Empleados</p>
                                <p className="font-semibold">{analysis.employee_count}</p>
                              </div>
                            </div>
                          )}
                          {analysis.founding_year && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-amber-500" />
                              <div>
                                <p className="text-muted-foreground">Fundación</p>
                                <p className="font-semibold">{analysis.founding_year}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* SWOT Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {(analysis.strengths as string[] | null)?.slice(0, 1).map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-green-500/10 text-green-600 text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              {s}
                            </Badge>
                          ))}
                          {(analysis.weaknesses as string[] | null)?.slice(0, 1).map((w, i) => (
                            <Badge key={i} variant="outline" className="bg-red-500/10 text-red-600 text-xs">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {w}
                            </Badge>
                          ))}
                          {(analysis.opportunities as string[] | null)?.slice(0, 1).map((o, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-600 text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {o}
                            </Badge>
                          ))}
                          {(analysis.threats as string[] | null)?.slice(0, 1).map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-600 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => exportAnalysis(analysis.id, 'pdf')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {analyses.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes análisis competitivos</p>
                  <Button className="mt-4" onClick={() => setShowNewAnalysis(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Analizar tu primer competidor
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="insights">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Insights Competitivos con IA
              </CardTitle>
              <CardDescription>
                Análisis profundo de tu posición competitiva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-semibold">Ventajas Competitivas</p>
                    <p className="text-sm text-muted-foreground">
                      Identifica tus fortalezas únicas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-semibold">Tendencias de Mercado</p>
                    <p className="text-sm text-muted-foreground">
                      Anticipa cambios en tu industria
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="font-semibold">Oportunidades</p>
                    <p className="text-sm text-muted-foreground">
                      Detecta gaps en el mercado
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button className="w-full mt-4" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Informe Competitivo Global
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CompetitiveAnalysisPanel;
