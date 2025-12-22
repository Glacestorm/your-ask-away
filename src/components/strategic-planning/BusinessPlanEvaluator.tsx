import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import { useBusinessPlanEvaluation } from '@/hooks/useStrategicPlanning';

export function BusinessPlanEvaluator() {
  const { evaluations, currentEvaluation, setCurrentEvaluation, sections, createEvaluation, fetchSections, isLoading } = useBusinessPlanEvaluation();

  const handleCreate = async () => {
    const evaluation = await createEvaluation({ project_name: 'Nueva Evaluación Business Plan' });
    setCurrentEvaluation(evaluation);
    await fetchSections(evaluation.id);
  };

  const handleSelect = async (evaluation: typeof evaluations[0]) => {
    setCurrentEvaluation(evaluation);
    await fetchSections(evaluation.id);
  };

  const getViabilityColor = (level: string | null) => {
    switch (level) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'acceptable': return 'bg-yellow-500';
      case 'weak': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!currentEvaluation) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Evaluador de Business Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Evalúa la viabilidad de planes de negocio en 10 dimensiones clave.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evaluations.map(ev => (
              <Card key={ev.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelect(ev)}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{ev.project_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={ev.total_score} className="flex-1" />
                    <span className="text-sm font-medium">{ev.total_score.toFixed(0)}%</span>
                  </div>
                  <Badge className={`mt-2 ${getViabilityColor(ev.viability_level)}`}>{ev.viability_level || 'Sin evaluar'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={handleCreate} className="gap-2"><Plus className="h-4 w-4" /> Nueva Evaluación</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{currentEvaluation.project_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <Progress value={currentEvaluation.total_score} className="w-48" />
            <span className="font-medium">{currentEvaluation.total_score.toFixed(0)}%</span>
            <Badge className={getViabilityColor(currentEvaluation.viability_level)}>{currentEvaluation.viability_level || 'En progreso'}</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => setCurrentEvaluation(null)}>Cambiar</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(section => (
          <Card key={section.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{section.section_number}. {section.section_name}</h3>
                <Badge variant="outline">{(section.section_weight * 100).toFixed(0)}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(section.section_score / section.section_max_score) * 100} className="flex-1" />
                <span className="text-sm">{section.section_score}/{section.section_max_score}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
