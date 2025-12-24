import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CSMetricDefinition, MetricTrend, RiskLevel, BenchmarkPosition } from '@/types/cs-metrics';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: CSMetricDefinition;
  value?: number;
  previousValue?: number;
  trend?: MetricTrend;
  trendPercentage?: number;
  benchmarkPosition?: BenchmarkPosition;
  riskLevel?: RiskLevel;
  sparklineData?: number[];
  onCalculate?: () => void;
  className?: string;
}

export function MetricCard({
  metric,
  value,
  previousValue,
  trend = 'stable',
  trendPercentage,
  benchmarkPosition = 'average',
  riskLevel = 'low',
  sparklineData = [],
  onCalculate,
  className
}: MetricCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatValue = (val: number | undefined): string => {
    if (val === undefined) return '—';
    switch (metric.unit) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `€${val.toLocaleString()}`;
      case 'ratio':
        return val.toFixed(2);
      case 'score':
        return val.toFixed(0);
      case 'days':
        return `${val.toFixed(0)}d`;
      case 'months':
        return `${val.toFixed(1)}m`;
      default:
        return val.toString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={cn("h-4 w-4", metric.higherIsBetter ? "text-green-500" : "text-red-500")} />;
      case 'down':
        return <TrendingDown className={cn("h-4 w-4", metric.higherIsBetter ? "text-red-500" : "text-green-500")} />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getBenchmarkBadge = () => {
    const colors: Record<BenchmarkPosition, string> = {
      below: 'bg-red-500/10 text-red-500 border-red-500/20',
      average: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      above: 'bg-green-500/10 text-green-500 border-green-500/20',
      top_quartile: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    const labels: Record<BenchmarkPosition, string> = {
      below: 'Por debajo',
      average: 'Promedio',
      above: 'Por encima',
      top_quartile: 'Top 25%'
    };
    return (
      <Badge variant="outline" className={cn("text-xs", colors[benchmarkPosition])}>
        {labels[benchmarkPosition]}
      </Badge>
    );
  };

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      perception: 'from-blue-500/20 to-blue-600/10',
      retention: 'from-green-500/20 to-green-600/10',
      value: 'from-amber-500/20 to-amber-600/10',
      engagement: 'from-purple-500/20 to-purple-600/10',
      growth: 'from-pink-500/20 to-pink-600/10',
      health: 'from-cyan-500/20 to-cyan-600/10'
    };
    return colors[metric.category] || 'from-muted/20 to-muted/10';
  };

  // Simple sparkline SVG
  const renderSparkline = () => {
    if (sparklineData.length < 2) return null;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
        />
      </svg>
    );
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      "border-border/50 hover:border-primary/30",
      className
    )}>
      {/* Gradient background based on category */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        getCategoryColor()
      )} />

      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs font-medium">
                {metric.shortName}
              </Badge>
              {metric.isAdvanced2025 && (
                <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  2025
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {metric.priority}
              </Badge>
            </div>
            <CardTitle className="text-sm font-semibold line-clamp-1">
              {metric.name}
            </CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">{metric.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* Main value */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {formatValue(value)}
            </p>
            {previousValue !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon()}
                <span className={cn(
                  "text-xs",
                  trend === 'up' && metric.higherIsBetter && "text-green-500",
                  trend === 'up' && !metric.higherIsBetter && "text-red-500",
                  trend === 'down' && metric.higherIsBetter && "text-red-500",
                  trend === 'down' && !metric.higherIsBetter && "text-green-500",
                  trend === 'stable' && "text-muted-foreground"
                )}>
                  {trendPercentage ? `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%` : 'vs anterior'}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {renderSparkline()}
            <div className="flex items-center gap-2">
              {getRiskIcon()}
              {getBenchmarkBadge()}
            </div>
          </div>
        </div>

        {/* Details section */}
        {showDetails && (
          <div className="pt-3 border-t border-border/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-muted/30 rounded-lg p-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Fórmula:</p>
              <code className="text-xs bg-background/50 px-2 py-1 rounded block">
                {metric.formula}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.formulaExplanation}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {metric.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Calculate button */}
        {onCalculate && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={onCalculate}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
