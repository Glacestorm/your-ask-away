import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, FileText, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutomaticFinancialAnalysisProps {
  companyId: string;
  companyName: string;
  fiscalYear: number;
}

interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
  keyRatios: { name: string; value: string; status: 'good' | 'warning' | 'danger' }[];
}

const AutomaticFinancialAnalysis = ({ companyId, companyName, fiscalYear }: AutomaticFinancialAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Fetch financial data
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select(`
          *,
          balance_sheets(*),
          income_statements(*)
        `)
        .eq('company_id', companyId)
        .eq('fiscal_year', fiscalYear)
        .single();

      if (!statements) {
        toast.error('No hay datos financieros para este ejercicio');
        setIsAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('financial-rag-chat', {
        body: {
          query: `Genera un análisis financiero completo y estructurado de la empresa ${companyName} para el ejercicio ${fiscalYear}. 
          
          Incluye:
          1. RESUMEN EJECUTIVO (2-3 párrafos)
          2. FORTALEZAS (lista de 3-5 puntos)
          3. DEBILIDADES (lista de 3-5 puntos)
          4. OPORTUNIDADES (lista de 2-3 puntos)
          5. RIESGOS (lista de 2-3 puntos)
          6. RECOMENDACIONES (lista de 3-5 acciones concretas)
          7. RATIOS CLAVE con valoración (bueno/advertencia/peligro)
          
          Formatea la respuesta como JSON con esta estructura:
          {
            "summary": "resumen ejecutivo",
            "strengths": ["fortaleza1", "fortaleza2"],
            "weaknesses": ["debilidad1", "debilidad2"],
            "opportunities": ["oportunidad1"],
            "risks": ["riesgo1"],
            "recommendations": ["recomendación1"],
            "keyRatios": [{"name": "Liquidez", "value": "1.5", "status": "good"}]
          }`,
          companyId,
          fiscalYear
        }
      });

      if (error) throw error;

      try {
        // Try to parse JSON from response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAnalysis(parsed);
        } else {
          // Fallback: create structured analysis from text
          setAnalysis({
            summary: data.response,
            strengths: ['Análisis generado correctamente'],
            weaknesses: [],
            opportunities: [],
            risks: [],
            recommendations: ['Revisar datos financieros detallados'],
            keyRatios: []
          });
        }
      } catch {
        setAnalysis({
          summary: data.response,
          strengths: [],
          weaknesses: [],
          opportunities: [],
          risks: [],
          recommendations: [],
          keyRatios: []
        });
      }

      toast.success('Análisis generado correctamente');
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast.error('Error al generar el análisis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'danger') => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Anàlisi Automàtic amb IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Genera un anàlisi financer complet de {companyName} per a l'exercici {fiscalYear}
              </p>
              <Button onClick={generateAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analitzant...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Anàlisi
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Button variant="outline" onClick={generateAnalysis} disabled={isAnalyzing} className="mb-4">
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Regenerar Anàlisi
              </Button>

              {/* Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resum Executiu
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
              </div>

              {/* Key Ratios */}
              {analysis.keyRatios && analysis.keyRatios.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ràtios Clau
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {analysis.keyRatios.map((ratio, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{ratio.name}</span>
                          {getStatusIcon(ratio.status)}
                        </div>
                        <p className="text-lg font-bold">{ratio.value}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* SWOT Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <Card className="border-green-200 dark:border-green-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600 dark:text-green-400">Fortaleses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <Card className="border-red-200 dark:border-red-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-600 dark:text-red-400">Debilitats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.opportunities && analysis.opportunities.length > 0 && (
                  <Card className="border-blue-200 dark:border-blue-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-600 dark:text-blue-400">Oportunitats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysis.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.risks && analysis.risks.length > 0 && (
                  <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-orange-600 dark:text-orange-400">Riscos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysis.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recomanacions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomaticFinancialAnalysis;
