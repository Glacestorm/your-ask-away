import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Euro, 
  Shield, 
  Target,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  Building2,
  TrendingUp,
  Play
} from 'lucide-react';
import { NBAQueueItem } from '@/hooks/useNextBestAction';
import { cn } from '@/lib/utils';

interface NBAActionCardProps {
  item: NBAQueueItem;
  onExecute: (params: { nbaId: string; executionData?: Record<string, unknown> }) => void;
  onDismiss: (params: { nbaId: string; reason?: string }) => void;
  isExecuting?: boolean;
}

export function NBAActionCard({
  item,
  onExecute,
  onDismiss,
  isExecuting
}: NBAActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'revenue':
        return {
          icon: Euro,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          label: 'Ingressos'
        };
      case 'retention':
        return {
          icon: Target,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Retenció'
        };
      case 'compliance':
        return {
          icon: Shield,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          label: 'Compliance'
        };
      case 'efficiency':
        return {
          icon: Zap,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          label: 'Eficiència'
        };
      default:
        return {
          icon: Zap,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          label: 'General'
        };
    }
  };

  const getEffortBadge = (effort?: string) => {
    switch (effort) {
      case 'low':
        return { color: 'bg-green-500', label: 'Fàcil' };
      case 'medium':
        return { color: 'bg-amber-500', label: 'Mitjà' };
      case 'high':
        return { color: 'bg-red-500', label: 'Complex' };
      default:
        return { color: 'bg-muted', label: effort };
    }
  };

  const getExecutionTypeBadge = (type?: string) => {
    switch (type) {
      case 'automatic':
        return { icon: Zap, label: 'Automàtic' };
      case 'one_click':
        return { icon: Play, label: '1 Clic' };
      case 'wizard':
        return { icon: TrendingUp, label: 'Guiat' };
      default:
        return { icon: Play, label: type };
    }
  };

  const categoryConfig = getCategoryConfig(item.action_type?.action_category);
  const effortConfig = getEffortBadge(item.action_type?.effort_level);
  const executionConfig = getExecutionTypeBadge(item.action_type?.execution_type);
  const CategoryIcon = categoryConfig.icon;

  const handleExecute = () => {
    onExecute({ nbaId: item.id });
  };

  const handleDismiss = () => {
    onDismiss({ nbaId: item.id });
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      categoryConfig.borderColor,
      expanded && "ring-1 ring-primary/20"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", categoryConfig.bgColor)}>
            <CategoryIcon className={cn("h-5 w-5", categoryConfig.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-xs">
                {categoryConfig.label}
              </Badge>
              <Badge 
                className={cn("text-xs text-white", effortConfig.color)}
              >
                {effortConfig.label}
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <executionConfig.icon className="h-3 w-3" />
                {executionConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Prioritat: {item.priority}
              </Badge>
            </div>
            
            <h4 className="font-medium text-sm mb-1">
              {item.action_type?.action_name || 'Acció NBA'}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.action_type?.action_description || item.ai_reasoning}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {item.entity_name || item.entity_type}
              </span>
              {item.estimated_value && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Euro className="h-3 w-3" />
                  {item.estimated_value.toLocaleString()}€
                </span>
              )}
              {item.action_type?.estimated_mrr_impact && (
                <span className="flex items-center gap-1 text-blue-500">
                  <TrendingUp className="h-3 w-3" />
                  +{item.action_type.estimated_mrr_impact}€ MRR
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
            {/* AI Reasoning */}
            {item.ai_reasoning && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Raonament IA
                </p>
                <p className="text-sm">{item.ai_reasoning}</p>
              </div>
            )}

            {/* Context Data */}
            {item.context_data && Object.keys(item.context_data).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Context
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(item.context_data).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="bg-muted/30 rounded px-2 py-1">
                      <span className="text-xs text-muted-foreground">{key}: </span>
                      <span className="text-xs font-medium">{String(value)}</span>
                    </div>
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
            disabled={isExecuting}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Descartar
          </Button>
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={isExecuting}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Executar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
