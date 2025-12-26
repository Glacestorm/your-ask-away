import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, RefreshCw } from 'lucide-react';
import { useBusinessRules } from '@/hooks/admin/automation';
import { useEffect } from 'react';

export default function BusinessRulesPanel() {
  const { rules, isLoading, fetchRules } = useBusinessRules();

  useEffect(() => { fetchRules(); }, [fetchRules]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Reglas de Negocio
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => fetchRules()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.slice(0, 5).map((rule) => (
          <div key={rule.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{rule.name}</p>
              <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-xs">
                {rule.category}
              </Badge>
            </div>
            <Badge variant="outline">P{rule.priority}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
