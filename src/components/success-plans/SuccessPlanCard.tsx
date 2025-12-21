import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  Calendar, 
  User, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit2
} from 'lucide-react';
import { SuccessPlan, SuccessPlanGoal } from '@/hooks/useSuccessPlans';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SuccessPlanCardProps {
  plan: SuccessPlan;
  goals?: SuccessPlanGoal[];
  onUpdateGoalProgress?: (goalId: string, currentValue: number) => void;
  onEditPlan?: (planId: string) => void;
}

const statusColors = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  at_risk: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paused: 'bg-muted text-muted-foreground',
};

const goalStatusColors = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/10 text-blue-500',
  achieved: 'bg-green-500/10 text-green-500',
  at_risk: 'bg-red-500/10 text-red-500',
};

export function SuccessPlanCard({ plan, goals = [], onUpdateGoalProgress, onEditPlan }: SuccessPlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const planGoals = goals.filter(g => g.plan_id === plan.id);
  const achievedGoals = planGoals.filter(g => g.status === 'achieved').length;
  const totalGoals = planGoals.length;
  const overallProgress = totalGoals > 0 
    ? planGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / totalGoals 
    : 0;

  const handleSaveGoalProgress = (goalId: string) => {
    const value = parseFloat(editValue);
    if (!isNaN(value) && onUpdateGoalProgress) {
      onUpdateGoalProgress(goalId, value);
    }
    setEditingGoalId(null);
    setEditValue('');
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      plan.ai_generated && 'border-primary/30'
    )}>
      {plan.ai_generated && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-1 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs text-primary font-medium">Generado con IA</span>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {plan.plan_name}
            </CardTitle>
            {plan.plan_type && (
              <Badge variant="outline" className="text-xs">
                {plan.plan_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('border', statusColors[plan.status as keyof typeof statusColors] || statusColors.active)}>
              {plan.status}
            </Badge>
            {onEditPlan && (
              <Button variant="ghost" size="icon" onClick={() => onEditPlan(plan.id)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Health Score */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Health Score</span>
              <span className="font-medium">{plan.current_health_score || 0} / {plan.target_health_score || 100}</span>
            </div>
            <Progress 
              value={((plan.current_health_score || 0) / (plan.target_health_score || 100)) * 100} 
              className="h-2"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">{achievedGoals}/{totalGoals}</div>
            <div className="text-xs text-muted-foreground">Objetivos</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">{Math.round(overallProgress)}%</div>
            <div className="text-xs text-muted-foreground">Progreso</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-semibold">
              {plan.next_review_date 
                ? format(new Date(plan.next_review_date), 'dd MMM', { locale: es })
                : '—'}
            </div>
            <div className="text-xs text-muted-foreground">Próx. Review</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Risk Factors Summary */}
        {plan.risk_factors && plan.risk_factors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">
                {plan.risk_factors.length} Factor{plan.risk_factors.length > 1 ? 'es' : ''} de Riesgo
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {plan.risk_factors[0].factor}
            </p>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Ocultar objetivos
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver {totalGoals} objetivo{totalGoals !== 1 ? 's' : ''}
            </>
          )}
        </Button>

        {/* Goals List */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3"
          >
            {planGoals.map((goal) => (
              <div
                key={goal.id}
                className={cn(
                  'p-3 rounded-lg border',
                  goalStatusColors[goal.status as keyof typeof goalStatusColors] || goalStatusColors.pending
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {goal.status === 'achieved' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : goal.status === 'at_risk' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Target className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{goal.goal_title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {goal.goal_type}
                  </Badge>
                </div>

                {goal.goal_description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {goal.goal_description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {goal.current_value || 0} / {goal.target_value || 100}
                      {goal.target_metric && ` ${goal.target_metric}`}
                    </span>
                    <span className="font-medium">{goal.progress_percentage || 0}%</span>
                  </div>
                  <Progress value={goal.progress_percentage || 0} className="h-1.5" />
                </div>

                {/* Due Date & Actions */}
                <div className="flex items-center justify-between mt-2">
                  {goal.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(goal.due_date), 'dd MMM yyyy', { locale: es })}
                    </div>
                  )}
                  
                  {editingGoalId === goal.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 h-7 text-xs"
                        placeholder="Valor"
                      />
                      <Button
                        size="sm"
                        className="h-7"
                        onClick={() => handleSaveGoalProgress(goal.id)}
                      >
                        Guardar
                      </Button>
                    </div>
                  ) : (
                    goal.status !== 'achieved' && onUpdateGoalProgress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingGoalId(goal.id);
                          setEditValue(String(goal.current_value || 0));
                        }}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Actualizar
                      </Button>
                    )
                  )}
                </div>

                {/* Milestones */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed">
                    <p className="text-xs font-medium mb-1">Hitos:</p>
                    <div className="flex flex-wrap gap-1">
                      {goal.milestones.map((milestone, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={cn(
                            'text-xs',
                            milestone.completed && 'bg-green-500/10 border-green-500/30'
                          )}
                        >
                          {milestone.completed && <CheckCircle2 className="h-2 w-2 mr-1" />}
                          {milestone.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* AI Recommendations */}
        {plan.ai_generation_context?.recommendations && plan.ai_generation_context.recommendations.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Recomendaciones IA</span>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              {plan.ai_generation_context.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
