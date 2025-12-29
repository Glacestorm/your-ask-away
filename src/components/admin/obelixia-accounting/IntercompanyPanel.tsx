/**
 * IntercompanyPanel - Phase 11D
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Building, GitMerge, FileStack, Calculator } from 'lucide-react';
import { useObelixiaIntercompany } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';

export function IntercompanyPanel() {
  const [activeTab, setActiveTab] = useState('entities');
  const { isLoading, entities, transactions, consolidationReports, fetchData, matchTransactions, runConsolidation } = useObelixiaIntercompany();

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operaciones Intercompañía</h2>
          <p className="text-muted-foreground">Consolidación, eliminaciones y precios de transferencia</p>
        </div>
        <Button onClick={() => fetchData()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entities"><Building className="h-4 w-4 mr-2" />Entidades</TabsTrigger>
          <TabsTrigger value="transactions"><GitMerge className="h-4 w-4 mr-2" />Transacciones</TabsTrigger>
          <TabsTrigger value="consolidation"><FileStack className="h-4 w-4 mr-2" />Consolidación</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => (
              <Card key={entity.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  <Badge variant="outline">{entity.type}</Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>País: {entity.country} | Moneda: {entity.currency}</p>
                  <p>Participación: {entity.ownershipPercent}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={() => matchTransactions({ groupId: 'default', fiscalYear: 2024 })}>
              <GitMerge className="h-4 w-4 mr-2" /> Emparejar Transacciones
            </Button>
          </div>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{tx.fromEntityName}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{tx.toEntityName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{tx.amount.toLocaleString()} {tx.currency}</span>
                    <Badge>{tx.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consolidation" className="mt-4">
          <Button onClick={() => runConsolidation({ groupId: 'default', fiscalYear: 2024 })} className="mb-4">
            <Calculator className="h-4 w-4 mr-2" /> Ejecutar Consolidación
          </Button>
          <div className="space-y-2">
            {consolidationReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <span>Período: {report.period}</span>
                  <Badge>{report.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default IntercompanyPanel;
