import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, Play, RefreshCw } from 'lucide-react';
import { useWorkflowEngine } from '@/hooks/admin/automation';
import { useEffect } from 'react';

export default function WorkflowEnginePanel() {
  const { workflows, isLoading, fetchWorkflows, executeWorkflow } = useWorkflowEngine();

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Motor de Workflows
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => fetchWorkflows()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {workflows.slice(0, 5).map((wf) => (
          <div key={wf.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{wf.name}</p>
              <Badge variant={wf.is_active ? 'default' : 'secondary'} className="text-xs">
                {wf.trigger_type}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => executeWorkflow(wf.id)}>
              <Play className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
