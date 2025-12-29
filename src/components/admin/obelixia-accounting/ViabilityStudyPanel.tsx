/**
 * Viability Study Panel
 * Phase 15 Extended: Strategic Financial Agent
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, RefreshCw, Sparkles, Plus, Download, Eye,
  TrendingUp, AlertTriangle, CheckCircle, DollarSign, BarChart3, PieChart
} from 'lucide-react';
import { useObelixiaViabilityStudy } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { downloadViabilityStudyPDF, type ViabilityStudyPDFData } from '@/lib/pdfExportViabilityStudy';

export function ViabilityStudyPanel() {
  const [showNewStudy, setShowNewStudy] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newStudyData, setNewStudyData] = useState({
    project_name: '',
    description: '',
    initial_investment: ''
  });

  const { studies, isLoading, fetchStudies, generateStudy } = useObelixiaViabilityStudy();

  useEffect(() => { fetchStudies(); }, []);

  const handleRunAnalysis = async () => {
    if (!newStudyData.project_name || !newStudyData.initial_investment) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setIsAnalyzing(true);
    const result = await generateStudy({
      projectName: newStudyData.project_name,
      projectType: 'general',
      initialInvestment: parseFloat(newStudyData.initial_investment)
    });
    setIsAnalyzing(false);
    if (result) {
      setShowNewStudy(false);
      setNewStudyData({ project_name: '', description: '', initial_investment: '' });
    }
  };

  const handleExportPDF = (study: any) => {
    const pdfData: ViabilityStudyPDFData = {
      projectName: study.project_name || `Estudio ${study.id.slice(0, 8)}`,
      projectType: study.project_type,
      description: study.description,
      status: study.status,
      createdAt: new Date(study.created_at).toLocaleDateString('es-ES'),
      initialInvestment: study.initial_investment,
      projectionYears: study.projection_years,
      financialScore: study.financial_score,
      technicalScore: study.technical_score,
      commercialScore: study.commercial_score,
      overallViability: study.commercial_score,
      npv: study.npv,
      irr: study.irr,
      paybackPeriod: study.payback_months,
      roi: study.roi,
      breakEvenPoint: study.break_even_point,
      strengths: study.swot_analysis?.strengths,
      weaknesses: study.swot_analysis?.weaknesses,
      opportunities: study.swot_analysis?.opportunities,
      threats: study.swot_analysis?.threats,
      risks: study.risk_assessment?.risks,
      recommendations: study.ai_recommendations,
      conclusion: study.conclusion,
    };
    downloadViabilityStudyPDF(pdfData);
    toast.success('PDF generado correctamente');
  };

  const getViabilityColor = (score: number | null) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 70) return 'bg-green-500/10 text-green-500';
    if (score >= 40) return 'bg-amber-500/10 text-amber-500';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Estudios de Viabilidad
          </h2>
          <p className="text-muted-foreground">Análisis de viabilidad económica con IA</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchStudies()} variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button onClick={() => setShowNewStudy(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estudio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Estudios</p>
                <p className="text-2xl font-bold">{studies.length}</p>
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
                <p className="text-2xl font-bold">{studies.filter(s => (s.commercial_score || 0) >= 70).length}</p>
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
                <p className="text-2xl font-bold">{studies.filter(s => (s.commercial_score || 0) >= 40 && (s.commercial_score || 0) < 70).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Financiero</p>
                <p className="text-2xl font-bold">{studies.length > 0 ? Math.round(studies.reduce((sum, s) => sum + (s.financial_score || 0), 0) / studies.length) : 0}/100</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {showNewStudy && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nuevo Estudio de Viabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Nombre del proyecto *" value={newStudyData.project_name} onChange={(e) => setNewStudyData({ ...newStudyData, project_name: e.target.value })} />
              <Input type="number" placeholder="Inversión inicial (€) *" value={newStudyData.initial_investment} onChange={(e) => setNewStudyData({ ...newStudyData, initial_investment: e.target.value })} />
            </div>
            <Textarea placeholder="Descripción del proyecto..." value={newStudyData.description} onChange={(e) => setNewStudyData({ ...newStudyData, description: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewStudy(false)}>Cancelar</Button>
              <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Analizando...</> : <><Sparkles className="h-4 w-4 mr-2" />Analizar</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {studies.map((study) => (
            <Card key={study.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">Estudio {study.id.slice(0, 8)}</h4>
                      <Badge className={getViabilityColor(study.commercial_score)}>
                        {study.commercial_score ? `${study.commercial_score}/100` : 'Pendiente'}
                      </Badge>
                      <Badge variant="outline">{study.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span><TrendingUp className="h-4 w-4 inline text-green-500" /> Financiero: {study.financial_score || 0}/100</span>
                      <span><BarChart3 className="h-4 w-4 inline text-blue-500" /> Técnico: {study.technical_score || 0}/100</span>
                      <span><PieChart className="h-4 w-4 inline text-purple-500" /> Comercial: {study.commercial_score || 0}/100</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleExportPDF(study)}><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {studies.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes estudios de viabilidad</p>
              <Button className="mt-4" onClick={() => setShowNewStudy(true)}><Plus className="h-4 w-4 mr-2" />Crear estudio</Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ViabilityStudyPanel;
