import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Users } from 'lucide-react';

export function AccessControlPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Access Control
          <Badge variant="outline">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">RBAC, ABAC, políticas y sesiones</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccessControlPanel;
