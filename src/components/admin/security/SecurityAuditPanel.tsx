import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity } from 'lucide-react';

export function SecurityAuditPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Audit
          <Badge variant="outline">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span className="text-sm">Auditoría de seguridad activa</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default SecurityAuditPanel;
