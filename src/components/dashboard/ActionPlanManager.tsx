import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Target, CheckCircle2, Calendar, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ActionPlanStep {
  id: string;
  plan_id: string;
  step_number: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
}

interface ActionPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_metric: string;
  current_value: number | null;
  target_value: number | null;
  gap_percentage: number | null;
  target_date: string | null;
  created_at: string;
  steps: ActionPlanStep[];
}

interface ActionPlanManagerProps {
  metricComparison: Record<string, {
    personal: number;
    office: number;
    team: number;
  }>;
}

export function ActionPlanManager({ metricComparison }: ActionPlanManagerProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPlans();
    }
  }, [user?.id]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data: plansData, error } = await supabase
        .from('action_plans')
        .select('*, steps:action_plan_steps(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlans((plansData || []) as ActionPlan[]);
    } catch (error: any) {
      console.error('Error fetching action plans:', error);
      toast.error(t('gestor.dashboard.goals.actionPlan.errors.loadPlans'));
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      setGenerating(true);

      // Convert metric comparison to analysis format
      const metricAnalyses = Object.keys(metricComparison).map(metric => {
        const data = metricComparison[metric];
        const gapOffice = data.personal - data.office;
        const gapTeam = data.personal - data.team;
        const avgGap = (gapOffice + gapTeam) / 2;
        
        let status: 'excellent' | 'good' | 'needs_improvement' | 'critical' = 'good';
        if (avgGap >= 10) status = 'excellent';
        else if (avgGap >= 0) status = 'good';
        else if (avgGap >= -10) status = 'needs_improvement';
        else status = 'critical';

        return {
          metric,
          personal: data.personal,
          office: data.office,
          team: data.team,
          gap_office: gapOffice,
          gap_team: gapTeam,
          status
        };
      });

      const { data, error } = await supabase.functions.invoke('generate-action-plan', {
        body: { 
          metricAnalyses,
          language: localStorage.getItem('language') || 'es'
        }
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error(t('gestor.dashboard.goals.actionPlan.errors.rateLimit'));
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast.error(t('gestor.dashboard.goals.actionPlan.errors.noCredits'));
        } else {
          throw error;
        }
        return;
      }

      if (data.error) {
        if (data.message === 'All metrics are performing above average') {
          toast.info(t('gestor.dashboard.goals.actionPlan.allGood'));
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success(t('gestor.dashboard.goals.actionPlan.generated'));
      await fetchPlans();
    } catch (error: any) {
      console.error('Error generating action plan:', error);
      toast.error(t('gestor.dashboard.goals.actionPlan.errors.generate'));
    } finally {
      setGenerating(false);
    }
  };

  const toggleStep = async (stepId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('action_plan_steps')
        .update({ 
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', stepId);

      if (error) throw error;

      await fetchPlans();
      toast.success(completed ? t('gestor.dashboard.goals.actionPlan.stepCompleted') : t('gestor.dashboard.goals.actionPlan.stepUncompleted'));
    } catch (error: any) {
      console.error('Error toggling step:', error);
      toast.error(t('gestor.dashboard.goals.actionPlan.errors.updateStep'));
    }
  };

  const getMetricLabel = (metricType: string) => {
    return t(`gestor.dashboard.goals.metrics.${metricType}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">{t('gestor.dashboard.goals.actionPlan.status.active')}</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">{t('gestor.dashboard.goals.actionPlan.status.completed')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20">{t('gestor.dashboard.goals.actionPlan.status.cancelled')}</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('gestor.dashboard.goals.actionPlan.title')}
              </CardTitle>
              <CardDescription className="mt-2">{t('gestor.dashboard.goals.actionPlan.description')}</CardDescription>
            </div>
            <Button
              onClick={generatePlan}
              disabled={generating}
              className="flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('gestor.dashboard.goals.actionPlan.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t('gestor.dashboard.goals.actionPlan.generate')}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Active Plans */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('gestor.dashboard.goals.actionPlan.noPlans')}</p>
              <p className="text-sm mt-2">{t('gestor.dashboard.goals.actionPlan.clickGenerate')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        plans.map((plan) => {
          const completedSteps = plan.steps.filter(s => s.completed).length;
          const totalSteps = plan.steps.length;
          const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <Card key={plan.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      {getStatusBadge(plan.status)}
                    </div>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {getMetricLabel(plan.target_metric)}
                      </span>
                      {plan.target_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(plan.target_date), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{completedSteps}/{totalSteps}</div>
                    <div className="text-xs text-muted-foreground">{t('gestor.dashboard.goals.actionPlan.stepsCompleted')}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('gestor.dashboard.goals.actionPlan.progress')}</span>
                    <span className="font-semibold">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="space-y-3 mt-6">
                  {plan.steps
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          step.completed 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <Checkbox
                          checked={step.completed}
                          onCheckedChange={(checked) => toggleStep(step.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className={`font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {step.step_number}. {step.title}
                            </div>
                            {step.due_date && !step.completed && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(step.due_date), 'dd/MM')}
                              </div>
                            )}
                            {step.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          {step.description && (
                            <p className={`text-sm ${step.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
