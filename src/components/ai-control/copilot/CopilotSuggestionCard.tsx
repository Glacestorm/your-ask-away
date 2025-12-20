import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  Euro,
  Building2,
  User
} from 'lucide-react';
import { CopilotSuggestion } from '@/hooks/useRoleCopilot';
import { cn } from '@/lib/utils';

interface CopilotSuggestionCardProps {
  suggestion: CopilotSuggestion;
  onExecute: (suggestion: CopilotSuggestion, actionId: string) => Promise<void>;
  onDismiss: (suggestion: CopilotSuggestion, reason?: string) => Promise<void>;
  isExecuting?: boolean;
}

export function CopilotSuggestionCard({
  suggestion,
  onExecute,
  onDismiss,
  isExecuting
}: CopilotSuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'action':
        return {
          icon: Zap,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          label: 'Acció'
        };
      case 'insight':
        return {
          icon: TrendingUp,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Insight'
        };
      case 'alert':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Alerta'
        };
      case 'recommendation':
        return {
          icon: Lightbulb,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          label: 'Recomanació'
        };
      default:
        return {
          icon: Lightbulb,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          label: 'Suggeriment'
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { color: 'bg-red-500', label: 'Crític' };
      case 'high':
        return { color: 'bg-orange-500', label: 'Alt' };
      case 'medium':
        return { color: 'bg-yellow-500', label: 'Mitjà' };
      case 'low':
        return { color: 'bg-green-500', label: 'Baix' };
      default:
        return { color: 'bg-muted', label: priority };
    }
  };

  const typeConfig = getTypeConfig(suggestion.type);
  const priorityConfig = getPriorityConfig(suggestion.priority);
  const TypeIcon = typeConfig.icon;

  const handleExecute = async () => {
    if (suggestion.actions && suggestion.actions.length > 0) {
      await onExecute(suggestion, suggestion.actions[0].id);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    await onDismiss(suggestion);
    setDismissing(false);
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      typeConfig.borderColor,
      expanded && "ring-1 ring-primary/20"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", typeConfig.bgColor)}>
            <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-xs">
                {typeConfig.label}
              </Badge>
              <Badge 
                className={cn("text-xs text-white", priorityConfig.color)}
              >
                {priorityConfig.label}
              </Badge>
              {suggestion.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}% confiança
                </Badge>
              )}
            </div>
            
            <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {suggestion.description}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {suggestion.entityType && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {suggestion.entityType}
                </span>
              )}
              {suggestion.estimatedValue && (
                <span className="flex items-center gap-1 text-green-600">
                  <Euro className="h-3 w-3" />
                  {suggestion.estimatedValue.toLocaleString()}€
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Reasoning */}
            {suggestion.reasoning && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Raonament IA
                </p>
                <p className="text-sm">{suggestion.reasoning}</p>
              </div>
            )}

            {/* Actions */}
            {suggestion.actions && suggestion.actions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Accions disponibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestion.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.type === 'primary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onExecute(suggestion, action.id)}
                      disabled={isExecuting}
                      className="gap-2"
                    >
                      <Check className="h-3 w-3" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Footer */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={dismissing || isExecuting}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
          {suggestion.actions && suggestion.actions.length > 0 && (
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Executar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
