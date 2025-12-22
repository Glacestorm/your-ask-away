import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Calculator, TrendingUp, TrendingDown, Minus, ChevronLeft } from 'lucide-react';
import { InfoTooltip, FINANCIAL_TOOLTIPS } from '@/components/ui/info-tooltip';
import { FinancialViabilityPlan, FinancialPlanAccount, FinancialPlanRatio } from '@/hooks/useStrategicPlanning';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

// Account structure for balance sheet and P&L
const ACCOUNT_STRUCTURE = {
  balance_asset: [
    { code: 'A.I', name: 'Activo No Corriente', isHeader: true },
    { code: '20', name: 'Inmovilizado Intangible', isHeader: false },
    { code: '21', name: 'Inmovilizado Material', isHeader: false },
    { code: '22', name: 'Inversiones Inmobiliarias', isHeader: false },
    { code: '23', name: 'Inversiones Financieras LP', isHeader: false },
    { code: 'A.II', name: 'Activo Corriente', isHeader: true },
    { code: '30', name: 'Existencias', isHeader: false },
    { code: '40', name: 'Deudores Comerciales', isHeader: false },
    { code: '57', name: 'Tesorería', isHeader: false },
  ],
  balance_liability: [
    { code: 'P.I', name: 'Patrimonio Neto', isHeader: true },
    { code: '10E', name: 'Capital', isHeader: false },
    { code: '11', name: 'Reservas', isHeader: false },
    { code: '12', name: 'Resultado del Ejercicio', isHeader: false },
    { code: 'P.II', name: 'Pasivo No Corriente', isHeader: true },
    { code: '17', name: 'Deudas LP con Entidades Crédito', isHeader: false },
    { code: 'P.III', name: 'Pasivo Corriente', isHeader: true },
    { code: '40P', name: 'Acreedores Comerciales', isHeader: false },
    { code: '52', name: 'Deudas CP con Entidades Crédito', isHeader: false },
  ],
  income: [
    { code: '70', name: 'Importe Neto Cifra Negocios', isHeader: false },
    { code: '71', name: 'Variación de Existencias', isHeader: false },
    { code: '73', name: 'Trabajos para Inmovilizado', isHeader: false },
    { code: '75', name: 'Otros Ingresos de Explotación', isHeader: false },
  ],
  expense: [
    { code: '60', name: 'Aprovisionamientos', isHeader: false },
    { code: '62', name: 'Servicios Exteriores', isHeader: false },
    { code: '64', name: 'Gastos de Personal', isHeader: false },
    { code: '68', name: 'Amortización', isHeader: false },
    { code: '65', name: 'Otros Gastos de Explotación', isHeader: false },
    { code: '66', name: 'Gastos Financieros', isHeader: false },
    { code: '63', name: 'Impuesto sobre Beneficios', isHeader: false },
  ]
};

interface FinancialDataEntryProps {
  plan: FinancialViabilityPlan;
  accounts: FinancialPlanAccount[];
  ratios: FinancialPlanRatio[];
  onSaveAccount: (planId: string, account: Partial<FinancialPlanAccount>) => Promise<void>;
  onBack: () => void;
}

export function FinancialDataEntry({ plan, accounts, ratios, onSaveAccount, onBack }: FinancialDataEntryProps) {
  const [activeTab, setActiveTab] = useState('balance');
  const [editedAmounts, setEditedAmounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const years = Array.from({ length: plan.projection_years }, (_, i) => plan.start_year + i);
  const [selectedYear, setSelectedYear] = useState(years[0]);

  // Get amount for account code and year
  const getAmount = (code: string, year: number) => {
    const key = `${code}-${year}`;
    if (editedAmounts[key] !== undefined) return editedAmounts[key];
    const account = accounts.find(a => a.account_code === code && a.year === year);
    return account?.amount || 0;
  };

  // Handle amount change
  const handleAmountChange = (code: string, year: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedAmounts(prev => ({ ...prev, [`${code}-${year}`]: numValue }));
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const entries = Object.entries(editedAmounts);
      for (const [key, amount] of entries) {
        const [code, yearStr] = key.split('-');
        const year = parseInt(yearStr);
        
        // Find account type
        let accountType = 'balance_asset';
        let accountName = '';
        
        for (const [type, accts] of Object.entries(ACCOUNT_STRUCTURE)) {
          const found = accts.find(a => a.code === code);
          if (found) {
            accountType = type;
            accountName = found.name;
            break;
          }
        }

        await onSaveAccount(plan.id, {
          account_code: code,
          account_name: accountName,
          account_type: accountType,
          year,
          amount,
          source: 'manual'
        });
      }
      setEditedAmounts({});
      toast.success('Datos guardados correctamente');
    } catch (err) {
      toast.error('Error al guardar los datos');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals
  const calculateTotals = useMemo(() => {
    const result: Record<number, { nonCurrentAssets: number; currentAssets: number; totalAssets: number; equity: number; nonCurrentLiabilities: number; currentLiabilities: number; totalLiabilities: number; income: number; expenses: number; netIncome: number }> = {};
    
    years.forEach(year => {
      // Assets
      const nonCurrentAssets = ['20', '21', '22', '23'].reduce((sum, code) => sum + getAmount(code, year), 0);
      const currentAssets = ['30', '40', '57'].reduce((sum, code) => sum + getAmount(code, year), 0);
      const totalAssets = nonCurrentAssets + currentAssets;

      // Liabilities
      const equity = ['10E', '11', '12'].reduce((sum, code) => sum + getAmount(code, year), 0);
      const nonCurrentLiabilities = getAmount('17', year);
      const currentLiabilities = ['40P', '52'].reduce((sum, code) => sum + getAmount(code, year), 0);
      const totalLiabilities = equity + nonCurrentLiabilities + currentLiabilities;

      // P&L
      const income = ['70', '71', '73', '75'].reduce((sum, code) => sum + getAmount(code, year), 0);
      const expenses = ['60', '62', '64', '68', '65', '66', '63'].reduce((sum, code) => sum + getAmount(code, year), 0);
      const netIncome = income - expenses;

      result[year] = { nonCurrentAssets, currentAssets, totalAssets, equity, nonCurrentLiabilities, currentLiabilities, totalLiabilities, income, expenses, netIncome };
    });

    return result;
  }, [years, accounts, editedAmounts]);

  // Prepare chart data
  const chartData = years.map(year => ({
    year,
    Ingresos: calculateTotals[year]?.income || 0,
    Gastos: calculateTotals[year]?.expenses || 0,
    Resultado: calculateTotals[year]?.netIncome || 0
  }));

  const getRatioStatus = (value: number | null, benchmark: number | null, key: string) => {
    if (!value || !benchmark) return { color: 'text-muted-foreground', icon: Minus };
    const isGood = key.includes('debt') ? value < benchmark : value > benchmark;
    return {
      color: isGood ? 'text-green-500' : 'text-red-500',
      icon: isGood ? TrendingUp : TrendingDown
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h2 className="text-xl font-semibold">{plan.plan_name}</h2>
          <p className="text-sm text-muted-foreground">
            Proyección {plan.start_year} - {plan.start_year + plan.projection_years - 1}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Year selector */}
          <div className="flex gap-1">
            {years.map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
          <Button onClick={handleSaveAll} disabled={isSaving || Object.keys(editedAmounts).length === 0}>
            <Save className="h-4 w-4 mr-1" />
            Guardar {Object.keys(editedAmounts).length > 0 && `(${Object.keys(editedAmounts).length})`}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="balance">Balance de Situación</TabsTrigger>
          <TabsTrigger value="pyl">Cuenta de Resultados</TabsTrigger>
          <TabsTrigger value="ratios">Ratios Financieros</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Assets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  ACTIVO
                  <Badge variant="outline">{calculateTotals[selectedYear]?.totalAssets?.toLocaleString()} €</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Cod.</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right w-[120px]">Importe (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ACCOUNT_STRUCTURE.balance_asset.map(acc => (
                      <TableRow key={acc.code} className={acc.isHeader ? 'bg-muted/50 font-medium' : ''}>
                        <TableCell className="text-xs">{acc.code}</TableCell>
                        <TableCell className="text-sm">{acc.name}</TableCell>
                        <TableCell className="text-right">
                          {acc.isHeader ? null : (
                            <Input
                              type="number"
                              value={getAmount(acc.code, selectedYear)}
                              onChange={(e) => handleAmountChange(acc.code, selectedYear, e.target.value)}
                              className="h-8 text-right text-sm"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Liabilities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  PASIVO + PATRIMONIO NETO
                  <Badge variant="outline">{calculateTotals[selectedYear]?.totalLiabilities?.toLocaleString()} €</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Cod.</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right w-[120px]">Importe (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ACCOUNT_STRUCTURE.balance_liability.map(acc => (
                      <TableRow key={acc.code} className={acc.isHeader ? 'bg-muted/50 font-medium' : ''}>
                        <TableCell className="text-xs">{acc.code}</TableCell>
                        <TableCell className="text-sm">{acc.name}</TableCell>
                        <TableCell className="text-right">
                          {acc.isHeader ? null : (
                            <Input
                              type="number"
                              value={getAmount(acc.code, selectedYear)}
                              onChange={(e) => handleAmountChange(acc.code, selectedYear, e.target.value)}
                              className="h-8 text-right text-sm"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pyl" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  INGRESOS
                  <Badge variant="secondary">{calculateTotals[selectedYear]?.income?.toLocaleString()} €</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {ACCOUNT_STRUCTURE.income.map(acc => (
                      <TableRow key={acc.code}>
                        <TableCell className="text-xs w-[50px]">{acc.code}</TableCell>
                        <TableCell className="text-sm">{acc.name}</TableCell>
                        <TableCell className="text-right w-[120px]">
                          <Input
                            type="number"
                            value={getAmount(acc.code, selectedYear)}
                            onChange={(e) => handleAmountChange(acc.code, selectedYear, e.target.value)}
                            className="h-8 text-right text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  GASTOS
                  <Badge variant="destructive">{calculateTotals[selectedYear]?.expenses?.toLocaleString()} €</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {ACCOUNT_STRUCTURE.expense.map(acc => (
                      <TableRow key={acc.code}>
                        <TableCell className="text-xs w-[50px]">{acc.code}</TableCell>
                        <TableCell className="text-sm">{acc.name}</TableCell>
                        <TableCell className="text-right w-[120px]">
                          <Input
                            type="number"
                            value={getAmount(acc.code, selectedYear)}
                            onChange={(e) => handleAmountChange(acc.code, selectedYear, e.target.value)}
                            className="h-8 text-right text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Result summary */}
          <Card className={calculateTotals[selectedYear]?.netIncome >= 0 ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">RESULTADO DEL EJERCICIO</span>
                <span className={`text-xl font-bold ${calculateTotals[selectedYear]?.netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateTotals[selectedYear]?.netIncome?.toLocaleString()} €
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { key: 'currentRatio', title: FINANCIAL_TOOLTIPS.currentRatio.title, description: FINANCIAL_TOOLTIPS.currentRatio.description, formula: FINANCIAL_TOOLTIPS.currentRatio.formula, tip: FINANCIAL_TOOLTIPS.currentRatio.tip, value: ratios.find(r => r.ratio_key === 'current_ratio' && r.year === selectedYear)?.ratio_value, benchmarkNum: 1.5 },
            { key: 'debtRatio', title: FINANCIAL_TOOLTIPS.debtRatio.title, description: FINANCIAL_TOOLTIPS.debtRatio.description, formula: FINANCIAL_TOOLTIPS.debtRatio.formula, tip: FINANCIAL_TOOLTIPS.debtRatio.tip, value: ratios.find(r => r.ratio_key === 'debt_ratio' && r.year === selectedYear)?.ratio_value, benchmarkNum: 0.6 },
            { key: 'roa', title: FINANCIAL_TOOLTIPS.roa.title, description: FINANCIAL_TOOLTIPS.roa.description, formula: FINANCIAL_TOOLTIPS.roa.formula, tip: FINANCIAL_TOOLTIPS.roa.tip, value: ratios.find(r => r.ratio_key === 'roa' && r.year === selectedYear)?.ratio_value, benchmarkNum: 5 },
            { key: 'roe', title: FINANCIAL_TOOLTIPS.roe.title, description: FINANCIAL_TOOLTIPS.roe.description, formula: FINANCIAL_TOOLTIPS.roe.formula, tip: FINANCIAL_TOOLTIPS.roe.tip, value: ratios.find(r => r.ratio_key === 'roe' && r.year === selectedYear)?.ratio_value, benchmarkNum: 10 },
            { key: 'operatingMargin', title: FINANCIAL_TOOLTIPS.operatingMargin.title, description: FINANCIAL_TOOLTIPS.operatingMargin.description, formula: FINANCIAL_TOOLTIPS.operatingMargin.formula, tip: FINANCIAL_TOOLTIPS.operatingMargin.tip, value: ratios.find(r => r.ratio_key === 'operating_margin' && r.year === selectedYear)?.ratio_value, benchmarkNum: 8 },
          ].map(ratio => {
            const status = getRatioStatus(ratio.value ?? null, ratio.benchmarkNum, ratio.key);
            const StatusIcon = status.icon;
            return (
              <Card key={ratio.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{ratio.title}</span>
                      <InfoTooltip title={ratio.title} description={ratio.description} formula={ratio.formula} tip={ratio.tip} benchmark={String(ratio.benchmarkNum)} />
                    </div>
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <div className="text-2xl font-bold">
                    {ratio.value?.toFixed(2) || 'N/A'}
                    {ratio.key.includes('Ratio') ? '' : '%'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Benchmark: {ratio.benchmarkNum}{ratio.key.includes('Ratio') ? '' : '%'}
                  </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolución Ingresos vs Gastos vs Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} €`} />
                    <Legend />
                    <Bar dataKey="Ingresos" fill="hsl(var(--primary))" />
                    <Bar dataKey="Gastos" fill="hsl(var(--destructive))" />
                    <Bar dataKey="Resultado" fill="hsl(142, 76%, 36%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tendencia del Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} €`} />
                    <Line type="monotone" dataKey="Resultado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
