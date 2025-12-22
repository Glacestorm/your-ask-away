import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Activity,
  Users,
  HeadphonesIcon,
  DollarSign,
  Heart,
  MessageCircle,
  ChevronRight,
  Zap
} from "lucide-react";
import { CustomerHealthScore, HealthScoreDimension, RecommendedAction } from "@/hooks/useCustomerHealthScore";
import { cn } from "@/lib/utils";

interface CustomerHealthScoreCardProps {
  healthScore: CustomerHealthScore;
  onActionClick?: (action: RecommendedAction) => void;
  compact?: boolean;
}

const dimensionIcons: Record<string, React.ReactNode> = {
  'Engagement': <Activity className="h-4 w-4" />,
  'Adoption': <Zap className="h-4 w-4" />,
  'Support': <HeadphonesIcon className="h-4 w-4" />,
  'Financial': <DollarSign className="h-4 w-4" />,
  'Relationship': <Users className="h-4 w-4" />,
  'Sentiment': <Heart className="h-4 w-4" />
};

export function CustomerHealthScoreCard({ healthScore, onActionClick, compact = false }: CustomerHealthScoreCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRiskBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (riskLevel) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'critical': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("text-3xl font-bold", getScoreColor(healthScore.overallScore))}>
                {healthScore.overallScore}
              </div>
              <div>
                <p className="font-medium">{healthScore.companyName}</p>
                <div className="flex items-center gap-2">
                  {getTrendIcon(healthScore.trend)}
                  <Badge variant={getRiskBadgeVariant(healthScore.riskLevel)}>
                    {healthScore.riskLevel} risk
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Churn Risk</p>
              <p className={cn("text-lg font-semibold", 
                healthScore.predictedChurnProbability > 50 ? 'text-red-500' : 
                healthScore.predictedChurnProbability > 30 ? 'text-yellow-500' : 'text-green-500'
              )}>
                {healthScore.predictedChurnProbability}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{healthScore.companyName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(healthScore.lastUpdated).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getRiskBadgeVariant(healthScore.riskLevel)} className="text-sm">
            {healthScore.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${healthScore.overallScore * 2.51} 251`}
                className={getScoreColor(healthScore.overallScore)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold", getScoreColor(healthScore.overallScore))}>
                {healthScore.overallScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon(healthScore.trend)}
              <span className="text-sm">
                {healthScore.trend === 'improving' ? 'Improving' : 
                 healthScore.trend === 'declining' ? 'Declining' : 'Stable'} 
                {' '}from {healthScore.previousScore}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Churn Probability</p>
                <p className={cn("font-semibold", 
                  healthScore.predictedChurnProbability > 50 ? 'text-red-500' : 
                  healthScore.predictedChurnProbability > 30 ? 'text-yellow-500' : 'text-green-500'
                )}>
                  {healthScore.predictedChurnProbability}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Dimensions</p>
                <p className="font-semibold">{healthScore.dimensions.length} tracked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Health Dimensions</h4>
          <div className="grid gap-2">
            {healthScore.dimensions.map((dimension) => (
              <TooltipProvider key={dimension.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 w-28">
                        {dimensionIcons[dimension.name]}
                        <span className="text-sm font-medium">{dimension.name}</span>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all", getProgressColor(dimension.score))}
                            style={{ width: `${dimension.score}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-16 justify-end">
                        <span className={cn("text-sm font-semibold", getScoreColor(dimension.score))}>
                          {dimension.score}
                        </span>
                        {getTrendIcon(dimension.trend)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-semibold">{dimension.name} Indicators</p>
                      {dimension.indicators.map((indicator, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {getStatusIcon(indicator.status)}
                          <span>{indicator.name}: {indicator.value}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        {healthScore.nextBestActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {healthScore.nextBestActions.slice(0, 3).map((action) => (
                <div 
                  key={action.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {action.priority}
                      </Badge>
                      {action.automatable && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">{action.action}</p>
                    <p className="text-xs text-muted-foreground">{action.impact}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onActionClick?.(action)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
