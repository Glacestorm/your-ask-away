import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, PieChart, Maximize2, Minimize2 } from 'lucide-react';
import { useDataVisualization } from '@/hooks/admin/analytics';
import { cn } from '@/lib/utils';

interface DataVisualizationPanelProps {
  dataSource?: string;
  className?: string;
}

export function DataVisualizationPanel({ dataSource, className }: DataVisualizationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, charts, visualizationData, error, generateChart, getRecommendedVisualization } = useDataVisualization();

  if (!dataSource) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <PieChart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Visualización inactiva</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Data Visualization</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => generateChart(dataSource, 'bar')} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-200px)]" : "h-[300px]"}>
          {error ? (
            <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">{error}</div>
          ) : (
            <div className="space-y-3">
              {charts.map((chart) => (
                <div key={chart.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{chart.title}</span>
                    <Badge variant="outline">{chart.chart_type}</Badge>
                  </div>
                </div>
              ))}
              {visualizationData && (
                <div className="p-3 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Datasets: {visualizationData.datasets.length}</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default DataVisualizationPanel;
