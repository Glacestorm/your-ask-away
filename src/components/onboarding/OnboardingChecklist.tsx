import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Video, 
  HelpCircle, 
  Zap, 
  Trophy,
  Flame,
  Star,
  ChevronRight,
  Clock,
  Gift,
  Sparkles
} from 'lucide-react';
import { useOnboarding, OnboardingStep } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  companyId: string;
  segmentType?: string;
  productKeys?: string[];
}

const stepIcons = {
  task: CheckCircle2,
  video: Video,
  quiz: HelpCircle,
  integration: Zap,
  demo: Play,
};

export function OnboardingChecklist({ companyId, segmentType, productKeys }: OnboardingChecklistProps) {
  const {
    templates,
    progress,
    loadingTemplates,
    loadingProgress,
    startOnboarding,
    isStarting,
    completeStep,
    isCompletingStep,
    skipStep,
    getRecommendedTemplate,
    getNextStep,
    calculateStreak,
  } = useOnboarding(companyId);

  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const recommendedTemplate = getRecommendedTemplate(segmentType || 'default', productKeys);
  const nextStep = getNextStep();
  const streak = calculateStreak();

  const currentTemplate = progress?.onboarding_templates || recommendedTemplate;
  const steps = currentTemplate?.steps || [];

  const completedSteps = progress?.completed_steps || {};
  const skippedSteps = progress?.skipped_steps || [];

  const handleStartOnboarding = () => {
    if (recommendedTemplate) {
      startOnboarding({ companyId, templateId: recommendedTemplate.id });
    }
  };

  const handleCompleteStep = (step: OnboardingStep) => {
    if (!progress) return;
    completeStep({
      progressId: progress.id,
      stepId: step.id,
      pointsEarned: step.points,
      badgeEarned: step.badge_reward,
      celebrationType: step.celebration_type,
    });
  };

  if (loadingTemplates || loadingProgress) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No progress yet - show start screen
  if (!progress && recommendedTemplate) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">¡Bienvenido a tu viaje de activación!</h2>
              <p className="text-muted-foreground">
                {recommendedTemplate.description || 'Completa estos pasos para desbloquear todo el potencial'}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{recommendedTemplate.estimated_total_minutes || 60} min</p>
                <p className="text-xs text-muted-foreground">Tiempo estimado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">{recommendedTemplate.gamification_config?.total_points || 500} pts</p>
                <p className="text-xs text-muted-foreground">Puntos disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">{recommendedTemplate.gamification_config?.badges?.length || 3} badges</p>
                <p className="text-xs text-muted-foreground">Por desbloquear</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleStartOnboarding} 
            disabled={isStarting}
            className="w-full"
            size="lg"
          >
            {isStarting ? 'Iniciando...' : 'Comenzar Onboarding'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Progress exists - show checklist
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Progreso de Activación
              {streak > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak} días
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {progress?.progress_percentage || 0}% completado
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {progress?.total_points_earned || 0}
            </p>
            <p className="text-xs text-muted-foreground">puntos</p>
          </div>
        </div>
        <Progress value={progress?.progress_percentage || 0} className="mt-4" />
      </CardHeader>
      <CardContent>
        {/* Badges earned */}
        {progress?.badges_earned && progress.badges_earned.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {progress.badges_earned.map((badge, idx) => (
              <Badge key={idx} variant="outline" className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-amber-500" />
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Next step highlight */}
        {nextStep && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Siguiente paso recomendado</span>
            </div>
            <p className="font-medium">{nextStep.title}</p>
            <p className="text-sm text-muted-foreground">{nextStep.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <Button
                size="sm"
                onClick={() => handleCompleteStep(nextStep)}
                disabled={isCompletingStep}
              >
                Completar (+{nextStep.points} pts)
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {nextStep.estimated_minutes} min
              </span>
            </div>
          </motion.div>
        )}

        {/* Steps list */}
        <div className="space-y-2">
          <AnimatePresence>
            {steps.map((step, index) => {
              const isCompleted = !!completedSteps[step.id];
              const isSkipped = skippedSteps.includes(step.id);
              const isExpanded = expandedStep === step.id;
              const StepIcon = stepIcons[step.action_type] || Circle;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'border rounded-lg overflow-hidden transition-colors',
                    isCompleted && 'bg-green-500/5 border-green-500/20',
                    isSkipped && 'bg-muted/50 border-muted',
                    !isCompleted && !isSkipped && 'hover:border-primary/50'
                  )}
                >
                  <button
                    className="w-full p-3 flex items-center gap-3 text-left"
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      isCompleted ? 'bg-green-500/20' : 'bg-muted'
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <StepIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isCompleted && 'line-through text-muted-foreground',
                        isSkipped && 'text-muted-foreground'
                      )}>
                        {step.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{step.estimated_minutes} min</span>
                        <span>•</span>
                        <span>{step.points} pts</span>
                        {step.badge_reward && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-amber-500" />
                              {step.badge_reward}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && !isCompleted && !isSkipped && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                      >
                        <div className="p-3 bg-muted/30">
                          <p className="text-sm text-muted-foreground mb-3">
                            {step.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteStep(step)}
                              disabled={isCompletingStep}
                            >
                              Marcar completado
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (progress) {
                                  skipStep({ progressId: progress.id, stepId: step.id });
                                }
                              }}
                            >
                              Omitir
                            </Button>
                            {step.action_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a href={step.action_url} target="_blank" rel="noopener noreferrer">
                                  Ir al recurso
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
