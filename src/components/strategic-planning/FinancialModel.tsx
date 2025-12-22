import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, RefreshCw, Edit, FileDown, FileSpreadsheet } from 'lucide-react';
import { useFinancialPlan } from '@/hooks/useStrategicPlanning';
import { useAccountingSync } from '@/hooks/useAccountingSync';
import { FinancialDataEntry } from './FinancialDataEntry';
import { InfoTooltip, FINANCIAL_TOOLTIPS } from '@/components/ui/info-tooltip';
import { generateFinancialStatementsPDF, downloadPDF, printPDF } from './PDFGenerator';
import { exportFinancialStatementsToExcel } from '@/lib/excelExport';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function FinancialModel() {
  const { plans, currentPlan, setCurrentPlan, accounts, ratios, createPlan, fetchPlanDetails, upsertAccount, isLoading } = useFinancialPlan();
  const { syncStatus, syncToFinancialPlan } = useAccountingSync();
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const handleCreate = async () => {
    const plan = await createPlan({ plan_name: 'Nuevo Plan Financiero', start_year: new Date().getFullYear() });
    setCurrentPlan(plan);
    await fetchPlanDetails(plan.id);
  };

  const handleSelect = async (plan: typeof plans[0]) => {
    setCurrentPlan(plan);
    await fetchPlanDetails(plan.id);
  };

  const handleSync = async () => {
    if (!currentPlan) return;
    await syncToFinancialPlan(currentPlan.id, currentPlan.start_year);
  };

  const handleBack = () => {
    setIsEditingDetails(false);
  };

  const handleBackToList = () => {
    setCurrentPlan(null);
    setIsEditingDetails(false);
  };

  // Show detailed entry when editing
  if (currentPlan && isEditingDetails) {
    return (
      <FinancialDataEntry
        plan={currentPlan}
        accounts={accounts}
        ratios={ratios}
        onSaveAccount={upsertAccount}
        onBack={handleBack}
      />
    );
  }

  if (!currentPlan) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Modelo Financiero</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Crea proyecciones financieras a 5 años con Balance, P&L, Cash Flow y +25 ratios.</p>
          
          {syncStatus.accounting_module_installed && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-700">✓ Módulo de Contabilidad detectado. Podrás sincronizar datos reales.</p>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => (
              <Card key={plan.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelect(plan)}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{plan.plan_name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.start_year} - {plan.start_year + plan.projection_years - 1}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{plan.status}</Badge>
                    {plan.synced_with_accounting && <Badge variant="secondary">Sincronizado</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={handleCreate} className="gap-2"><Plus className="h-4 w-4" /> Nuevo Plan Financiero</Button>
        </CardContent>
      </Card>
    );
  }

  const years = Array.from({ length: currentPlan.projection_years }, (_, i) => currentPlan.start_year + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{currentPlan.plan_name}</h2>
          <p className="text-sm text-muted-foreground">Proyección {currentPlan.start_year} - {currentPlan.start_year + currentPlan.projection_years - 1}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackToList}>Cambiar</Button>
          <Button variant="outline" onClick={() => setIsEditingDetails(true)} className="gap-2">
            <Edit className="h-4 w-4" /> Editar Datos
          </Button>
          {syncStatus.accounting_module_installed && (
            <Button variant="outline" onClick={handleSync} className="gap-2"><RefreshCw className="h-4 w-4" /> Sincronizar</Button>
          )}
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const doc = generateFinancialStatementsPDF(currentPlan.plan_name, years, accounts, ratios);
                downloadPDF(doc, `${currentPlan.plan_name}_Estados_Financieros.pdf`);
                toast.success('PDF descargado');
              }}>
                <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const doc = generateFinancialStatementsPDF(currentPlan.plan_name, years, accounts, ratios);
                printPDF(doc);
              }}>
                <FileDown className="h-4 w-4 mr-2" /> Imprimir PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                exportFinancialStatementsToExcel(currentPlan.plan_name, accounts, ratios, years);
                toast.success('Excel descargado');
              }}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Balance de Situación</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {accounts.filter(a => a.account_type.startsWith('balance')).length} cuentas configuradas
            </div>
            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setIsEditingDetails(true)}>
              Ver detalle →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Cuenta de Resultados</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {accounts.filter(a => ['income', 'expense'].includes(a.account_type)).length} partidas
            </div>
            <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setIsEditingDetails(true)}>
              Ver detalle →
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Ratios Financieros</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {ratios.slice(0, 6).map(ratio => {
                const tooltipKey = ratio.ratio_key === 'current_ratio' ? 'currentRatio' 
                  : ratio.ratio_key === 'debt_ratio' ? 'debtRatio'
                  : ratio.ratio_key === 'roa' ? 'roa'
                  : ratio.ratio_key === 'roe' ? 'roe'
                  : null;
                
                return (
                  <div key={ratio.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{ratio.ratio_name}</span>
                      {tooltipKey && FINANCIAL_TOOLTIPS[tooltipKey] && (
                        <InfoTooltip {...FINANCIAL_TOOLTIPS[tooltipKey]} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold">{ratio.ratio_value?.toFixed(2) || 'N/A'}</span>
                      <Badge variant={ratio.status === 'excellent' || ratio.status === 'good' ? 'default' : 'destructive'}>
                        {ratio.status || 'Sin calcular'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
