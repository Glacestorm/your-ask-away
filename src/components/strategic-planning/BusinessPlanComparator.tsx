import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitCompare, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Trophy
} from 'lucide-react';
import { useBusinessPlanEvaluation } from '@/hooks/useStrategicPlanning';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface ComparisonPlan {
  id: string;
  project_name: string;
  total_score: number;
  viability_level: string;
  created_at: string;
  sections: {
    section_name: string;
    section_score: number;
    section_max_score: number;
  }[];
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function BusinessPlanComparator() {
  const { evaluations, fetchSections } = useBusinessPlanEvaluation();
  const [selectedPlans, setSelectedPlans] = useState<ComparisonPlan[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (evaluation: typeof evaluations[0]) => {
    if (selectedPlans.some(p => p.id === evaluation.id)) {
      setSelectedPlans(prev => prev.filter(p => p.id !== evaluation.id));
      return;
    }

    if (selectedPlans.length >= 5) {
      return; // Max 5 plans to compare
    }

    setLoadingPlanId(evaluation.id);
    
    // Fetch sections directly from database
    const { data: sectionsData } = await supabase
      .from('business_plan_sections')
      .select('section_name, section_score, section_max_score')
      .eq('evaluation_id', evaluation.id)
      .order('section_number', { ascending: true });
    
    setSelectedPlans(prev => [...prev, {
      id: evaluation.id,
      project_name: evaluation.project_name,
      total_score: evaluation.total_score || 0,
      viability_level: evaluation.viability_level || 'pendiente',
      created_at: evaluation.created_at || '',
      sections: (sectionsData || []).map(s => ({
        section_name: s.section_name,
        section_score: s.section_score || 0,
        section_max_score: s.section_max_score || 10
      }))
    }]);
    setLoadingPlanId(null);
  };

  const removePlan = (planId: string) => {
    setSelectedPlans(prev => prev.filter(p => p.id !== planId));
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (selectedPlans.length === 0) return [];
    
    const allSections = new Set<string>();
    selectedPlans.forEach(plan => {
      plan.sections.forEach(s => allSections.add(s.section_name));
    });

    return Array.from(allSections).map(sectionName => {
      const dataPoint: Record<string, any> = { section: sectionName.substring(0, 15) };
      selectedPlans.forEach((plan, idx) => {
        const section = plan.sections.find(s => s.section_name === sectionName);
        dataPoint[plan.project_name] = section 
          ? (section.section_score / section.section_max_score) * 100 
          : 0;
      });
      return dataPoint;
    });
  };

  // Prepare bar chart data
  const getBarData = () => {
    return selectedPlans.map(plan => ({
      name: plan.project_name.substring(0, 20),
      score: plan.total_score,
      fill: CHART_COLORS[selectedPlans.indexOf(plan) % CHART_COLORS.length]
    }));
  };

  const getViabilityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'alta': return 'text-green-500';
      case 'media': return 'text-yellow-500';
      case 'baja': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getWinner = () => {
    if (selectedPlans.length < 2) return null;
    return selectedPlans.reduce((prev, current) => 
      (prev.total_score > current.total_score) ? prev : current
    );
  };

  const winner = getWinner();

  return (
    <div className="space-y-6">
      {/* Header with plan selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparador de Planes de Negocio
            </CardTitle>
            <Button 
              variant={isSelecting ? "default" : "outline"} 
              onClick={() => setIsSelecting(!isSelecting)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isSelecting ? 'Cerrar Selector' : 'Añadir Plan'}
            </Button>
          </div>
        </CardHeader>

        {isSelecting && (
          <CardContent className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Selecciona hasta 5 planes para comparar ({selectedPlans.length}/5)
            </p>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {evaluations.map(evaluation => {
                  const isSelected = selectedPlans.some(p => p.id === evaluation.id);
                  const isLoading = loadingPlanId === evaluation.id;
                  
                  return (
                    <div 
                      key={evaluation.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      )}
                      onClick={() => handleSelectPlan(evaluation)}
                    >
                      <Checkbox checked={isSelected} disabled={isLoading} />
                      <div className="flex-1">
                        <p className="font-medium">{evaluation.project_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evaluation.created_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {evaluation.total_score || 0}%
                      </Badge>
                      {isLoading && (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Selected Plans Tags */}
      {selectedPlans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPlans.map((plan, idx) => (
            <Badge 
              key={plan.id} 
              variant="secondary"
              className="gap-2 py-1.5 px-3"
              style={{ borderLeftColor: CHART_COLORS[idx], borderLeftWidth: 3 }}
            >
              {plan.project_name}
              <button onClick={() => removePlan(plan.id)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Comparison Content */}
      {selectedPlans.length >= 2 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparación por Secciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="section" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {selectedPlans.map((plan, idx) => (
                    <Radar
                      key={plan.id}
                      name={plan.project_name}
                      dataKey={plan.project_name}
                      stroke={CHART_COLORS[idx]}
                      fill={CHART_COLORS[idx]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Puntuación Total</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getBarData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Winner Card */}
          {winner && (
            <Card className="lg:col-span-2 border-amber-500/50 bg-gradient-to-r from-amber-500/5 to-transparent">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-amber-500/10">
                    <Trophy className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Mejor puntuación</p>
                    <h3 className="text-xl font-bold">{winner.project_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-500">{winner.total_score}%</p>
                    <Badge className={getViabilityColor(winner.viability_level)}>
                      Viabilidad {winner.viability_level}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Comparison Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Comparación Detallada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Métrica</th>
                      {selectedPlans.map((plan, idx) => (
                        <th 
                          key={plan.id} 
                          className="text-center py-2 px-3"
                          style={{ borderTopColor: CHART_COLORS[idx], borderTopWidth: 3 }}
                        >
                          {plan.project_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Puntuación Total</td>
                      {selectedPlans.map(plan => {
                        const isHighest = plan.total_score === Math.max(...selectedPlans.map(p => p.total_score));
                        return (
                          <td key={plan.id} className="text-center py-2 px-3">
                            <span className={cn("font-bold", isHighest && "text-green-500")}>
                              {plan.total_score}%
                            </span>
                            {isHighest && <Trophy className="inline h-3 w-3 ml-1 text-amber-500" />}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Nivel de Viabilidad</td>
                      {selectedPlans.map(plan => (
                        <td key={plan.id} className="text-center py-2 px-3">
                          <Badge variant="outline" className={getViabilityColor(plan.viability_level)}>
                            {plan.viability_level}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    {/* Section rows */}
                    {selectedPlans[0]?.sections.map(section => (
                      <tr key={section.section_name} className="border-b">
                        <td className="py-2 px-3 text-muted-foreground">{section.section_name}</td>
                        {selectedPlans.map(plan => {
                          const planSection = plan.sections.find(s => s.section_name === section.section_name);
                          const score = planSection ? (planSection.section_score / planSection.section_max_score) * 100 : 0;
                          const allScores = selectedPlans.map(p => {
                            const s = p.sections.find(sec => sec.section_name === section.section_name);
                            return s ? (s.section_score / s.section_max_score) * 100 : 0;
                          });
                          const isHighest = score === Math.max(...allScores) && score > 0;
                          const isLowest = score === Math.min(...allScores) && allScores.some(s => s !== score);
                          
                          return (
                            <td key={plan.id} className="text-center py-2 px-3">
                              <span className={cn(
                                isHighest && "text-green-500 font-medium",
                                isLowest && "text-red-500"
                              )}>
                                {score.toFixed(0)}%
                              </span>
                              {isHighest && <TrendingUp className="inline h-3 w-3 ml-1" />}
                              {isLowest && <TrendingDown className="inline h-3 w-3 ml-1" />}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <GitCompare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecciona planes para comparar</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Añade al menos 2 planes de negocio para ver la comparación detallada
            </p>
            <Button onClick={() => setIsSelecting(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
