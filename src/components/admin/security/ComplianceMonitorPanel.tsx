import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, CheckCircle } from 'lucide-react';

export function ComplianceMonitorPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Compliance Monitor
          <Badge variant="outline">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">SOC2, ISO27001, GDPR, HIPAA</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ComplianceMonitorPanel;
