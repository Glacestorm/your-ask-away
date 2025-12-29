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
import { Progress } from '@/components/ui/progress';
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
  Globe,
  Search
} from 'lucide-react';
import { useObelixiaCompetitiveAnalysis } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CompetitiveAnalysisPanel() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const [newAnalysisData, setNewAnalysisData] = useState({
    analysis_name: '',
    industry: '',
    market_segment: '',
    competitors: ''
  });

  const {
    analyses,
    isLoading,
    isAnalyzing,
    fetchAnalyses,
    runCompetitiveAnalysis,
    deleteAnalysis,
    exportAnalysis
  } = useObelixiaCompetitiveAnalysis();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleRunAnalysis = async () => {
    if (!newAnalysisData.analysis_name || !newAnalysisData.industry) {
      toast.error('Completa los campos requeridos');
      return;
    }
    const competitors = newAnalysisData.competitors
      .split(',')
      .map(c => c.trim())
      .filter(c => c);
    
    const result = await runCompetitiveAnalysis({
      analysis_name: newAnalysisData.analysis_name,
      industry: newAnalysisData.industry,
      market_segment: newAnalysisData.market_segment,
      competitors_list: competitors
    });
    if (result) {
      setShowNewAnalysis(false);
      setNewAnalysisData({ analysis_name: '', industry: '', market_segment: '', competitors: '' });
    }
  };

  const getPositionColor = (position: string | null) => {
    switch (position) {
      case 'leader': return 'bg-green-500/10 text-green-500';
      case 'challenger': return 'bg-blue-500/10 text-blue-500';
      case 'follower': return 'bg-amber-500/10 text-amber-500';
      case 'nicher': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
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
                <p className="text-sm text-muted-foreground">Análisis Realizados</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posición Líder</p>
                <p className="text-2xl font-bold">
                  {analyses.filter(a => a.market_position === 'leader').length}
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
                <p className="text-sm text-muted-foreground">Competidores Analizados</p>
                <p className="text-2xl font-bold">
                  {analyses.reduce((sum, a) => sum + ((a.competitors_list as string[])?.length || 0), 0)}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuota Media</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? (analyses.reduce((sum, a) => sum + (Number(a.market_share) || 0), 0) / analyses.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-amber-500/60" />
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
              La IA analizará tu posición en el mercado frente a competidores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Análisis *</label>
                <Input
                  placeholder="Ej: Análisis Sector Tech Q1 2025"
                  value={newAnalysisData.analysis_name}
                  onChange={(e) => setNewAnalysisData({ ...newAnalysisData, analysis_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industria *</label>
                <Input
                  placeholder="Ej: Tecnología, Retail, Fintech..."
                  value={newAnalysisData.industry}
                  onChange={(e) => setNewAnalysisData({ ...newAnalysisData, industry: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Segmento de Mercado</label>
              <Input
                placeholder="Ej: SaaS B2B, E-commerce España..."
                value={newAnalysisData.market_segment}
                onChange={(e) => setNewAnalysisData({ ...newAnalysisData, market_segment: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Competidores (separados por coma)</label>
              <Textarea
                placeholder="Ej: Empresa A, Empresa B, Empresa C..."
                value={newAnalysisData.competitors}
                onChange={(e) => setNewAnalysisData({ ...newAnalysisData, competitors: e.target.value })}
                rows={3}
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
            Mis Análisis
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
                          <h4 className="font-semibold">{analysis.analysis_name}</h4>
                          <Badge className={getPositionColor(analysis.market_position)}>
                            {analysis.market_position || 'Sin posición'}
                          </Badge>
                          <Badge variant="outline">{analysis.industry}</Badge>
                        </div>

                        {analysis.market_segment && (
                          <p className="text-sm text-muted-foreground">
                            Segmento: {analysis.market_segment}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {analysis.market_share !== null && (
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-muted-foreground">Cuota</p>
                                <p className="font-semibold">{Number(analysis.market_share).toFixed(1)}%</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-muted-foreground">Competidores</p>
                              <p className="font-semibold">
                                {(analysis.competitors_list as string[])?.length || 0}
                              </p>
                            </div>
                          </div>
                          {(analysis.strengths as string[])?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-muted-foreground">Fortalezas</p>
                                <p className="font-semibold">{(analysis.strengths as string[]).length}</p>
                              </div>
                            </div>
                          )}
                          {(analysis.threats as string[])?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <div>
                                <p className="text-muted-foreground">Amenazas</p>
                                <p className="font-semibold">{(analysis.threats as string[]).length}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* SWOT Summary */}
                        {(analysis.strengths || analysis.weaknesses || analysis.opportunities || analysis.threats) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {(analysis.strengths as string[])?.slice(0, 1).map((s, i) => (
                              <Badge key={i} variant="outline" className="bg-green-500/10 text-green-600 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                {s}
                              </Badge>
                            ))}
                            {(analysis.weaknesses as string[])?.slice(0, 1).map((w, i) => (
                              <Badge key={i} variant="outline" className="bg-red-500/10 text-red-600 text-xs">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {w}
                              </Badge>
                            ))}
                            {(analysis.opportunities as string[])?.slice(0, 1).map((o, i) => (
                              <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-600 text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {o}
                              </Badge>
                            ))}
                            {(analysis.threats as string[])?.slice(0, 1).map((t, i) => (
                              <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-600 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {t}
                              </Badge>
                            ))}
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
                    Crear tu primer análisis
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
                      Descubre nichos desatendidos
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

export default CompetitiveAnalysisPanel;
