import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Circle, 
  Clock, 
  SkipForward,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertTriangle,
  Zap,
  Users,
  Calendar
} from "lucide-react";
import { useRetentionPlaybooks, PlaybookExecution, PlaybookStep, PlaybookStepExecution } from "@/hooks/useRetentionPlaybooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";

interface PlaybookExecutionCardProps {
  execution: PlaybookExecution;
  onComplete?: () => void;
}

export function PlaybookExecutionCard({ execution, onComplete }: PlaybookExecutionCardProps) {
  const { 
    fetchPlaybookSteps, 
    completeStep, 
    skipStep, 
    toggleExecution, 
    cancelExecution 
  } = useRetentionPlaybooks();
  
  const [steps, setSteps] = useState<PlaybookStep[]>([]);
  const [stepExecutions, setStepExecutions] = useState<PlaybookStepExecution[]>([]);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSteps();
  }, [execution.id]);

  const loadSteps = async () => {
    setIsLoading(true);
    try {
      const stepsData = await fetchPlaybookSteps(execution.playbook_id);
      setSteps(stepsData || []);
      
      // Parse step executions from execution data
      if (execution.step_executions) {
        setStepExecutions(execution.step_executions as unknown as PlaybookStepExecution[]);
      }
    } catch (error) {
      console.error('Error loading steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (stepId: string): 'completed' | 'skipped' | 'in_progress' | 'pending' => {
    const stepExec = stepExecutions.find(se => se.step_id === stepId);
    if (!stepExec) return 'pending';
    return stepExec.status as 'completed' | 'skipped' | 'in_progress' | 'pending';
  };

  const getCurrentStepIndex = () => {
    const completedOrSkipped = stepExecutions.filter(
      se => se.status === 'completed' || se.status === 'skipped'
    ).length;
    return completedOrSkipped;
  };

  const progress = steps.length > 0 
    ? (stepExecutions.filter(se => se.status === 'completed' || se.status === 'skipped').length / steps.length) * 100
    : 0;

  const handleCompleteStep = async (stepId: string) => {
    try {
      await completeStep(execution.id, stepId, stepNotes[stepId]);
      toast.success("Step completed");
      loadSteps();
      
      if (getCurrentStepIndex() + 1 >= steps.length) {
        onComplete?.();
      }
    } catch (error) {
      toast.error("Failed to complete step");
    }
  };

  const handleSkipStep = async (stepId: string) => {
    try {
      await skipStep(execution.id, stepId, stepNotes[stepId] || 'Skipped');
      toast.success("Step skipped");
      loadSteps();
    } catch (error) {
      toast.error("Failed to skip step");
    }
  };

  const handleTogglePause = async () => {
    try {
      await toggleExecution(execution.id);
      toast.success(execution.status === 'paused' ? 'Playbook resumed' : 'Playbook paused');
    } catch (error) {
      toast.error("Failed to toggle playbook");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelExecution(execution.id);
      toast.success("Playbook cancelled");
    } catch (error) {
      toast.error("Failed to cancel playbook");
    }
  };

  const getStepIcon = (step: PlaybookStep, status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'skipped') return <SkipForward className="h-5 w-5 text-muted-foreground" />;
    if (status === 'in_progress') return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'email': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Users className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'task': return <CheckCircle2 className="h-4 w-4" />;
      case 'automation': return <Zap className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  // Calculate SLA status
  const slaHoursRemaining = execution.expected_completion 
    ? differenceInHours(new Date(execution.expected_completion), new Date())
    : null;

  return (
    <Card className={cn(
      "transition-all",
      execution.status === 'paused' && "opacity-75",
      execution.sla_status === 'breached' && "border-l-4 border-l-red-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              execution.status === 'active' ? 'bg-green-100' :
              execution.status === 'paused' ? 'bg-yellow-100' :
              execution.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
            )}>
              {execution.status === 'active' ? <Play className="h-5 w-5 text-green-600" /> :
               execution.status === 'paused' ? <Pause className="h-5 w-5 text-yellow-600" /> :
               <CheckCircle2 className="h-5 w-5 text-blue-600" />}
            </div>
            <div>
              <CardTitle className="text-base">{execution.playbook_name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {execution.company_name}
                {execution.sla_status === 'at_risk' && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    SLA at risk
                  </Badge>
                )}
                {execution.sla_status === 'breached' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    SLA breached
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(execution.status)}>
              {execution.status}
            </Badge>
            {execution.status !== 'completed' && execution.status !== 'cancelled' && (
              <>
                <Button variant="ghost" size="icon" onClick={handleTogglePause}>
                  {execution.status === 'paused' ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* SLA Timer */}
        {slaHoursRemaining !== null && execution.status === 'active' && (
          <div className={cn(
            "mt-3 p-2 rounded-lg flex items-center justify-between text-sm",
            slaHoursRemaining <= 0 ? 'bg-red-50 text-red-700' :
            slaHoursRemaining <= 24 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
          )}>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              SLA Deadline
            </span>
            <span className="font-medium">
              {slaHoursRemaining <= 0 ? 'Overdue' : `${slaHoursRemaining}h remaining`}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isCurrentStep = index === getCurrentStepIndex() && execution.status === 'active';
              const isExpanded = expandedStep === step.id;

              return (
                <div 
                  key={step.id}
                  className={cn(
                    "border rounded-lg transition-all",
                    isCurrentStep && "ring-2 ring-primary ring-offset-2",
                    status === 'completed' && "bg-green-50/50",
                    status === 'skipped' && "bg-muted/50"
                  )}
                >
                  <div 
                    className="p-3 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className="flex items-center gap-3">
                      {getStepIcon(step, status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium",
                            status === 'skipped' && "line-through text-muted-foreground"
                          )}>
                            {step.step_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getActionTypeIcon(step.action_type)}
                            <span className="ml-1">{step.action_type}</span>
                          </Badge>
                        </div>
                        {step.delay_hours > 0 && status === 'pending' && (
                          <p className="text-xs text-muted-foreground">
                            Wait {step.delay_hours}h after previous step
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.is_required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t">
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-3 mb-3">
                          {step.description}
                        </p>
                      )}

                      {step.action_template && (
                        <div className="bg-muted/50 p-3 rounded-lg text-sm mb-3">
                          <p className="font-medium mb-1">Template:</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {step.action_template}
                          </p>
                        </div>
                      )}

                      {isCurrentStep && (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Add notes about this step..."
                            value={stepNotes[step.id] || ''}
                            onChange={(e) => setStepNotes({ ...stepNotes, [step.id]: e.target.value })}
                            className="min-h-[80px]"
                          />
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => handleCompleteStep(step.id)}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Complete Step
                            </Button>
                            {!step.is_required && (
                              <Button 
                                variant="outline"
                                onClick={() => handleSkipStep(step.id)}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {status === 'completed' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Completed {stepExecutions.find(se => se.step_id === step.id)?.completed_at 
                            ? format(new Date(stepExecutions.find(se => se.step_id === step.id)!.completed_at!), 'MMM d, h:mm a')
                            : ''
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
