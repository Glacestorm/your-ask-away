import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  BarChart3,
  FileText,
  Download,
  Maximize2,
  Minimize2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAdvancedReporting } from '@/hooks/admin/useAdvancedReporting';
import { cn } from '@/lib/utils';

interface AdvancedReportingPanelProps {
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

export function AdvancedReportingPanel({ className }: AdvancedReportingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, report, templates, generateReport } = useAdvancedReporting();

  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleGenerate = useCallback(async (type: string) => {
    const templateId = templates[0]?.id || 'default';
    await generateReport(templateId, { start: lastMonth, end: today });
  }, [generateReport, templates, lastMonth, today]);

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Advanced Reporting IA</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['Diario', 'Semanal', 'Mensual', 'Custom'].map((type) => (
              <Button key={type} variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => handleGenerate(type)} disabled={isLoading}>
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xs">Reporte {type}</span>
              </Button>
            ))}
          </div>
          {report && (
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{report.title}</span>
                <Badge variant="outline">{report.format}</Badge>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AdvancedReportingPanel;
