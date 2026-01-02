import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Building2, 
  FileText,
  TrendingUp,
  Clock,
  CreditCard
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { PayablesManager } from './PayablesManager';
import { ReceivablesManager } from './ReceivablesManager';
import { BankReconciliation } from './BankReconciliation';
import { SEPARemittanceManager } from './SEPARemittanceManager';
import { SEPAMandatesManager } from './SEPAMandatesManager';
import { CashFlowForecast } from './CashFlowForecast';
import { AgingReport } from './AgingReport';

export function TreasuryDashboard() {
  const { currentCompany } = useERPContext();
  const [activeTab, setActiveTab] = useState('overview');

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Selecciona una empresa para acceder a Tesorería</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Tesorería
          </h2>
          <p className="text-muted-foreground">Gestión de cobros, pagos y conciliación bancaria</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {currentCompany.currency}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ArrowDownCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Por cobrar</p>
                <p className="text-lg font-bold">€ --</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ArrowUpCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Por pagar</p>
                <p className="text-lg font-bold">€ --</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo bancos</p>
                <p className="text-lg font-bold">€ --</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencidos</p>
                <p className="text-lg font-bold">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Previsión
          </TabsTrigger>
          <TabsTrigger value="receivables" className="gap-1.5">
            <ArrowDownCircle className="h-4 w-4" />
            Cobros
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-1.5">
            <ArrowUpCircle className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="aging" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Antigüedad
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Conciliación
          </TabsTrigger>
          <TabsTrigger value="sepa" className="gap-1.5">
            <FileText className="h-4 w-4" />
            SEPA
          </TabsTrigger>
          <TabsTrigger value="mandates" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            Mandatos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <CashFlowForecast companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="receivables" className="mt-4">
          <ReceivablesManager companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="payables" className="mt-4">
          <PayablesManager companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="aging" className="mt-4">
          <AgingReport companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-4">
          <BankReconciliation companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="sepa" className="mt-4">
          <SEPARemittanceManager companyId={currentCompany.id} />
        </TabsContent>

        <TabsContent value="mandates" className="mt-4">
          <SEPAMandatesManager companyId={currentCompany.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TreasuryDashboard;
