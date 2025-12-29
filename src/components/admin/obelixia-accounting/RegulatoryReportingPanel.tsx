/**
 * RegulatoryReportingPanel - Fase 13
 * Panel de Reportes Regulatorios y Compliance
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, FileText, Shield, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useObelixiaRegulatory } from '@/hooks/admin/obelixia-accounting/useObelixiaRegulatory';
import { cn } from '@/lib/utils';

export function RegulatoryReportingPanel() {
  const [activeTab, setActiveTab] = useState('standards');
  const { isLoading, standards, deadlines, overallCompliance, fetchStandards, fetchDeadlines } = useObelixiaRegulatory();

  useEffect(() => {
    fetchStandards();
    fetchDeadlines();
  }, [fetchStandards, fetchDeadlines]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Reportes Regulatorios
          </h2>
          <p className="text-muted-foreground">IFRS, GAAP, Normativas Locales</p>
        </div>
        <Button onClick={() => { fetchStandards(); fetchDeadlines(); }} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{overallCompliance}%</div>
              <p className="text-sm text-muted-foreground">Cumplimiento Global</p>
              <Progress value={overallCompliance} className="mt-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{standards.length}</div>
            <p className="text-sm text-muted-foreground">Normativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-orange-500">{deadlines.filter(d => d.status === 'pending').length}</div>
            <p className="text-sm text-muted-foreground">Vencimientos Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-500">{deadlines.filter(d => d.status === 'overdue').length}</div>
            <p className="text-sm text-muted-foreground">Vencidos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="standards">Normativas</TabsTrigger>
          <TabsTrigger value="deadlines">Calendario</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="standards">
          <Card>
            <CardHeader><CardTitle>Normativas Aplicables</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {standards.map((std) => (
                    <div key={std.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{std.code} - {std.name}</p>
                            <p className="text-sm text-muted-foreground">{std.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={std.complianceLevel} className="w-24" />
                          <span className="text-sm font-medium">{std.complianceLevel}%</span>
                          <Badge variant={std.status === 'applicable' ? 'default' : 'secondary'}>{std.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines">
          <Card>
            <CardHeader><CardTitle>Calendario de Vencimientos</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {deadlines.map((dl) => (
                    <div key={dl.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{dl.title}</p>
                          <p className="text-sm text-muted-foreground">{dl.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={dl.status === 'overdue' ? 'destructive' : dl.status === 'completed' ? 'default' : 'secondary'}>
                          {dl.status}
                        </Badge>
                        {dl.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : 
                         dl.status === 'overdue' ? <AlertTriangle className="h-4 w-4 text-red-500" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Generador de reportes regulatorios disponible</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RegulatoryReportingPanel;
