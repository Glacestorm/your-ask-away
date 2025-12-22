import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, CheckCircle, Sparkles, FileText, Loader2 } from 'lucide-react';
import { InfoTooltip, BUSINESS_PLAN_TOOLTIPS } from '@/components/ui/info-tooltip';
import { useBusinessPlanEvaluation, BusinessPlanSection } from '@/hooks/useStrategicPlanning';
import { useStrategicAI } from '@/hooks/useStrategicAI';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

// Questions for each section
const SECTION_QUESTIONS: Record<number, { id: string; question: string; weight: number }[]> = {
  1: [
    { id: '1.1', question: '¿La idea de negocio está claramente definida y es fácil de entender?', weight: 0.25 },
    { id: '1.2', question: '¿Existe una propuesta de valor diferenciada?', weight: 0.25 },
    { id: '1.3', question: '¿Se identifica claramente el problema que resuelve?', weight: 0.25 },
    { id: '1.4', question: '¿El modelo de negocio es viable y escalable?', weight: 0.25 }
  ],
  2: [
    { id: '2.1', question: '¿El equipo tiene experiencia relevante en el sector?', weight: 0.3 },
    { id: '2.2', question: '¿Los perfiles son complementarios?', weight: 0.25 },
    { id: '2.3', question: '¿Existe compromiso a tiempo completo?', weight: 0.25 },
    { id: '2.4', question: '¿Se identifican las necesidades de talento futuras?', weight: 0.2 }
  ],
  3: [
    { id: '3.1', question: '¿Se cuantifica el tamaño del mercado (TAM/SAM/SOM)?', weight: 0.25 },
    { id: '3.2', question: '¿Se identifica y segmenta el cliente objetivo?', weight: 0.25 },
    { id: '3.3', question: '¿Se analiza la competencia directa e indirecta?', weight: 0.25 },
    { id: '3.4', question: '¿Se identifican barreras de entrada?', weight: 0.25 }
  ],
  4: [
    { id: '4.1', question: '¿El plan de marketing es realista y medible?', weight: 0.25 },
    { id: '4.2', question: '¿La estrategia de pricing está justificada?', weight: 0.25 },
    { id: '4.3', question: '¿Los canales de distribución son adecuados?', weight: 0.25 },
    { id: '4.4', question: '¿Se definen KPIs comerciales claros?', weight: 0.25 }
  ],
  5: [
    { id: '5.1', question: '¿Se describen los procesos clave de producción/servicio?', weight: 0.25 },
    { id: '5.2', question: '¿Se identifican proveedores y dependencias?', weight: 0.25 },
    { id: '5.3', question: '¿La tecnología es apropiada y escalable?', weight: 0.25 },
    { id: '5.4', question: '¿Se consideran aspectos de calidad y control?', weight: 0.25 }
  ],
  6: [
    { id: '6.1', question: '¿La estructura organizativa es clara?', weight: 0.35 },
    { id: '6.2', question: '¿Se definen roles y responsabilidades?', weight: 0.35 },
    { id: '6.3', question: '¿Existe un plan de contratación?', weight: 0.3 }
  ],
  7: [
    { id: '7.1', question: '¿Las proyecciones de ingresos son realistas?', weight: 0.2 },
    { id: '7.2', question: '¿Se detallan todos los costes fijos y variables?', weight: 0.2 },
    { id: '7.3', question: '¿Se incluye plan de tesorería?', weight: 0.2 },
    { id: '7.4', question: '¿Se calculan indicadores clave (VAN, TIR)?', weight: 0.2 },
    { id: '7.5', question: '¿Las hipótesis están justificadas?', weight: 0.2 }
  ],
  8: [
    { id: '8.1', question: '¿Se calcula el punto de equilibrio?', weight: 0.25 },
    { id: '8.2', question: '¿Se analizan diferentes escenarios?', weight: 0.25 },
    { id: '8.3', question: '¿Se identifican riesgos y mitigaciones?', weight: 0.25 },
    { id: '8.4', question: '¿La necesidad de financiación está clara?', weight: 0.25 }
  ],
  9: [
    { id: '9.1', question: '¿Se elige la forma jurídica adecuada?', weight: 0.35 },
    { id: '9.2', question: '¿Se identifican licencias y permisos necesarios?', weight: 0.35 },
    { id: '9.3', question: '¿Se considera la protección de la propiedad intelectual?', weight: 0.3 }
  ],
  10: [
    { id: '10.1', question: '¿El documento está bien estructurado?', weight: 0.35 },
    { id: '10.2', question: '¿La presentación es profesional?', weight: 0.35 },
    { id: '10.3', question: '¿Incluye resumen ejecutivo efectivo?', weight: 0.3 }
  ]
};

const TOOLTIP_KEYS: Record<number, keyof typeof BUSINESS_PLAN_TOOLTIPS> = {
  1: 'ideaNegocio', 2: 'equipoPromotor', 3: 'analisisMercado', 4: 'estrategiaComercial',
  5: 'planOperaciones', 6: 'organizacion', 7: 'planFinanciero', 8: 'viabilidad',
  9: 'aspectosLegales', 10: 'presentacion'
};

interface BusinessPlanWizardProps {
  evaluation: any;
  sections: BusinessPlanSection[];
  onUpdateSection: (sectionId: string, data: Partial<BusinessPlanSection>, evaluationId: string) => Promise<void>;
  onBack: () => void;
}

export function BusinessPlanWizard({ evaluation, sections, onUpdateSection, onBack }: BusinessPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { score: number; notes: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { getBusinessPlanCoaching, isLoading: isCoaching } = useStrategicAI();
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  const currentSection = sections[currentStep];
  const questions = SECTION_QUESTIONS[currentSection?.section_number] || [];
  const tooltipData = BUSINESS_PLAN_TOOLTIPS[TOOLTIP_KEYS[currentSection?.section_number]];

  const getSectionScore = (sectionNumber: number) => {
    const sectionQuestions = SECTION_QUESTIONS[sectionNumber] || [];
    let totalScore = 0;
    let totalWeight = 0;

    sectionQuestions.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        totalScore += (answer.score / 10) * 100 * q.weight;
        totalWeight += q.weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], score, notes: prev[questionId]?.notes || '' }
    }));
  };

  const handleNotesChange = (questionId: string, notes: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], notes, score: prev[questionId]?.score || 5 }
    }));
  };

  const handleSaveSection = async () => {
    if (!currentSection) return;
    setIsSaving(true);

    try {
      const sectionScore = getSectionScore(currentSection.section_number);
      const questionsData = questions.map(q => ({
        id: q.id,
        question: q.question,
        weight: q.weight,
        score: answers[q.id]?.score || 0,
        notes: answers[q.id]?.notes || ''
      }));

      await onUpdateSection(currentSection.id, {
        section_score: sectionScore,
        questions: questionsData as any
      }, evaluation.id);

      if (currentStep < sections.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetAICoaching = async () => {
    const sectionsData = sections.map(s => ({
      section_number: s.section_number,
      section_name: s.section_name,
      section_score: getSectionScore(s.section_number),
      questions: SECTION_QUESTIONS[s.section_number]?.map(q => ({
        id: q.id,
        question: q.question,
        score: answers[q.id]?.score || 0,
        notes: answers[q.id]?.notes || ''
      })) || []
    }));

    const coaching = await getBusinessPlanCoaching(evaluation.id, sectionsData);
    setAiRecommendations(coaching);
  };

  const radarData = sections.map(s => ({
    section: s.section_name.split(' ')[0],
    score: getSectionScore(s.section_number),
    fullMark: 100
  }));

  const totalProgress = (currentStep / sections.length) * 100;
  const overallScore = sections.reduce((acc, s) => acc + getSectionScore(s.section_number) * s.section_weight, 0);

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h2 className="text-xl font-semibold">{evaluation.project_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <Progress value={totalProgress} className="w-48" />
            <span className="text-sm text-muted-foreground">
              Sección {currentStep + 1} de {sections.length}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{overallScore.toFixed(0)}%</div>
          <p className="text-sm text-muted-foreground">Puntuación global</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main wizard */}
        <div className="lg:col-span-2 space-y-4">
          {currentSection && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {currentSection.section_number}. {currentSection.section_name}
                    </CardTitle>
                    <InfoTooltip {...tooltipData} />
                  </div>
                  <Badge variant="outline">{(currentSection.section_weight * 100).toFixed(0)}% peso</Badge>
                </div>
                <CardDescription>
                  Puntúa cada aspecto de 1 a 10 según la calidad del plan de negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {answers[q.id]?.score || 5}/10
                          </Badge>
                        </div>
                        <Slider
                          value={[answers[q.id]?.score || 5]}
                          onValueChange={([v]) => handleScoreChange(q.id, v)}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Muy deficiente</span>
                          <span>Excelente</span>
                        </div>
                        <Textarea
                          placeholder="Notas o comentarios (opcional)..."
                          value={answers[q.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(q.id, e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      Puntuación sección: {getSectionScore(currentSection.section_number).toFixed(0)}%
                    </span>
                    <Button onClick={handleSaveSection} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : currentStep === sections.length - 1 ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      {currentStep === sections.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar with radar chart and AI coaching */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Radar de Viabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="section" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Puntuación"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> AI Coach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGetAICoaching}
                disabled={isCoaching}
                className="w-full gap-2"
                variant="outline"
              >
                {isCoaching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Obtener recomendaciones IA
              </Button>

              {aiRecommendations && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium">Evaluación general:</p>
                  <p className="text-xs text-muted-foreground">{aiRecommendations.overall_assessment}</p>
                  
                  {aiRecommendations.improvement_areas?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-destructive">Áreas de mejora:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {aiRecommendations.improvement_areas.slice(0, 3).map((area: string, i: number) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiRecommendations.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-600">Puntos fuertes:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {aiRecommendations.strengths.slice(0, 3).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick navigation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Navegación rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((s, idx) => (
                <Button
                  key={s.id}
                  variant={idx === currentStep ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-between text-xs h-8"
                  onClick={() => setCurrentStep(idx)}
                >
                  <span className="truncate">{s.section_number}. {s.section_name}</span>
                  <span className={getSectionScore(s.section_number) >= 70 ? 'text-green-500' : getSectionScore(s.section_number) >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                    {getSectionScore(s.section_number).toFixed(0)}%
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
