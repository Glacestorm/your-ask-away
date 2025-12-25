import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Radar } from 'lucide-react';

export function ThreatDetectionPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Threat Detection
          <Badge variant="outline">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Radar className="h-4 w-4" />
          <span className="text-sm">Detección de amenazas con MITRE ATT&CK</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThreatDetectionPanel;
