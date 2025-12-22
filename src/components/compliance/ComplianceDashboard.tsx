import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileText,
  Clock,
  TrendingUp,
  Lock,
  Eye,
  Database,
  CreditCard,
  Users,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

export interface ComplianceFramework {
  id: string;
  name: string;
  code: string;
  description: string;
  overallScore: number;
  controls: ComplianceControl[];
  lastAudit?: string;
  nextAudit?: string;
  status: 'compliant' | 'partial' | 'non-compliant';
}

export interface ComplianceControl {
  id: string;
  code: string;
  name: string;
  category: string;
  status: 'passed' | 'warning' | 'failed' | 'pending';
  evidence?: string;
  lastChecked: string;
  automatedCheck: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  resource: string;
  details: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ComplianceDashboardProps {
  frameworks: ComplianceFramework[];
  auditLogs: AuditLog[];
  onRunAudit?: (frameworkId: string) => void;
  onExportReport?: (frameworkId: string) => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  frameworks,
  auditLogs,
  onRunAudit,
  onExportReport
}) => {
  const [selectedFramework, setSelectedFramework] = useState(frameworks[0]?.id);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'compliant':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'non-compliant':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'compliant':
        return 'bg-green-500';
      case 'warning':
      case 'partial':
        return 'bg-yellow-500';
      case 'failed':
      case 'non-compliant':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const frameworkIcons: Record<string, React.ReactNode> = {
    'GDPR': <Lock className="h-5 w-5" />,
    'PCI-DSS': <CreditCard className="h-5 w-5" />,
    'SOC2': <Shield className="h-5 w-5" />,
    'ISO27001': <Database className="h-5 w-5" />
  };

  const currentFramework = frameworks.find(f => f.id === selectedFramework);

  const totalControls = currentFramework?.controls.length || 0;
  const passedControls = currentFramework?.controls.filter(c => c.status === 'passed').length || 0;
  const warningControls = currentFramework?.controls.filter(c => c.status === 'warning').length || 0;
  const failedControls = currentFramework?.controls.filter(c => c.status === 'failed').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Centro de Compliance</h2>
          <p className="text-muted-foreground">
            Monitoreo continuo de cumplimiento normativo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Reporte
          </Button>
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Ejecutar Auditoría
          </Button>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {frameworks.map(framework => (
          <Card 
            key={framework.id}
            className={`cursor-pointer transition-all ${
              selectedFramework === framework.id 
                ? 'ring-2 ring-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedFramework(framework.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {frameworkIcons[framework.code] || <Shield className="h-5 w-5" />}
                </div>
                {getStatusIcon(framework.status)}
              </div>
              <h3 className="font-semibold">{framework.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{framework.code}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cumplimiento</span>
                  <span className="font-bold">{framework.overallScore}%</span>
                </div>
                <Progress value={framework.overallScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      {currentFramework && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Controles de {currentFramework.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{totalControls}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-500">{passedControls}</p>
                  <p className="text-xs text-muted-foreground">Cumplidos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-500">{warningControls}</p>
                  <p className="text-xs text-muted-foreground">Advertencias</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-500">{failedControls}</p>
                  <p className="text-xs text-muted-foreground">Fallidos</p>
                </div>
              </div>

              {/* Controls List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {currentFramework.controls.map(control => (
                  <div 
                    key={control.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(control.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{control.code}</span>
                          {control.automatedCheck && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{control.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">{control.category}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(control.lastChecked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Audit Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Auditorías
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Última Auditoría</p>
                  <p className="font-semibold">
                    {currentFramework.lastAudit 
                      ? new Date(currentFramework.lastAudit).toLocaleDateString()
                      : 'Sin auditorías'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Próxima Auditoría</p>
                  <p className="font-semibold text-primary">
                    {currentFramework.nextAudit 
                      ? new Date(currentFramework.nextAudit).toLocaleDateString()
                      : 'No programada'}
                  </p>
                </div>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => onRunAudit?.(currentFramework.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Ejecutar Auditoría
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {auditLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        log.riskLevel === 'high' ? 'bg-red-500' :
                        log.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.user} • {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
