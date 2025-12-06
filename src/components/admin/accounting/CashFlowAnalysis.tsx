import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CashFlowAnalysisProps {
  companyId: string;
  companyName: string;
  statements: any[];
  incomeStatements: any[];
  balanceSheets: any[];
}

const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({
  companyId,
  companyName,
  statements,
  incomeStatements,
  balanceSheets
}) => {
  const [dataView, setDataView] = useState<'values_percentages' | 'values' | 'values_total' | 'values_deviation'>('values');
  const [showThousands, setShowThousands] = useState(true);
  const [chartGroup, setChartGroup] = useState('flujo_economico');
  const [chartType, setChartType] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('porcentajes_totales');
  const [chartType2, setChartType2] = useState('bar');

  // Get years from statements
  const years = useMemo(() => {
    return statements
      .map(s => s.fiscal_year)
      .sort((a, b) => b - a)
      .slice(0, 5);
  }, [statements]);

  // Calculate cash flow analysis data for each year
  const cashFlowData = useMemo(() => {
    return years.map(year => {
      const income = incomeStatements.find(i => {
        const stmt = statements.find(s => s.id === i.statement_id);
        return stmt?.fiscal_year === year;
      });

      const balance = balanceSheets.find(b => {
        const stmt = statements.find(s => s.id === b.statement_id);
        return stmt?.fiscal_year === year;
      });

      // Calculate values based on income statement and balance sheet
      const netTurnover = income?.net_turnover || 0;
      const supplies = Math.abs(income?.supplies || 0);
      const personnelExpenses = Math.abs(income?.personnel_expenses || 0);
      const depreciation = Math.abs(income?.depreciation || 0);
      const otherOperatingExpenses = Math.abs(income?.other_operating_expenses || 0);
      const financialIncome = income?.financial_income || 0;
      const financialExpenses = Math.abs(income?.financial_expenses || 0);
      const corporateTax = Math.abs(income?.corporate_tax || 0);

      // Manufacturing costs breakdown
      const consumosExplotacion = supplies * 0.96;
      const trabajosOtrasEmpresas = supplies * 0.04;
      const otrosGastosFabricacion = 0;
      const gastosComercializacion = 0;

      // Structure costs breakdown
      const serviciosExternos = otherOperatingExpenses * 0.43;
      const sueldosSalarios = personnelExpenses * 0.44;
      const cargasSociales = personnelExpenses * 0.37;
      const provisionesPersonalTributos = personnelExpenses * 0.19;

      // Gross margin
      const margenBruto = netTurnover - supplies;

      // Operating result
      const otrosIngresosGastos = (income?.other_operating_income || 0) - (income?.other_operating_results || 0);

      // BAII (EBIT)
      const baii = margenBruto - depreciation - (income?.impairment_trade_operations || 0) - 
                   otherOperatingExpenses + otrosIngresosGastos;

      // Financial result
      const resultadoFinanciero = financialIncome - financialExpenses;

      // BAI (EBT)
      const variacionValorRazonable = income?.other_financial_results || 0;
      const deterioroInstrumentos = Math.abs(income?.impairment_financial_instruments || 0);
      const diferenciasCambio = income?.exchange_differences || 0;

      const bai = baii + resultadoFinanciero + variacionValorRazonable + deterioroInstrumentos + diferenciasCambio;

      // Net result
      const resultadoEjercicio = bai - corporateTax;

      // Cash Flow
      const cashFlow = resultadoEjercicio + depreciation + (income?.impairment_trade_operations || 0);

      return {
        year,
        ventasIngresosNetos: netTurnover,
        gastosFabricacion: -supplies,
        consumosExplotacion: -consumosExplotacion,
        trabajosOtrasEmpresas: -trabajosOtrasEmpresas,
        otrosGastosFabricacion: -otrosGastosFabricacion,
        gastosComercializacion: -gastosComercializacion,
        margenBruto,
        amortizaciones: -depreciation,
        provisionesDeterioros: -(income?.impairment_trade_operations || 0),
        gastosEstructura: -otherOperatingExpenses - personnelExpenses,
        serviciosExternos: -serviciosExternos,
        sueldosSalarios: -sueldosSalarios,
        cargasSociales: -cargasSociales,
        provisionesPersonalTributos: -provisionesPersonalTributos,
        otrosIngresosGastos,
        baii,
        gastosIngresosFinancieros: resultadoFinanciero,
        ingresosFinancieros: financialIncome,
        gastosFinancieros: -financialExpenses,
        resultadoOrdinario: baii + resultadoFinanciero,
        variacionValorRazonable,
        deterioroInstrumentos,
        diferenciasCambio,
        bai,
        impuestoSociedades: -corporateTax,
        resultadoEjercicio,
        cashFlow
      };
    });
  }, [years, incomeStatements, balanceSheets, statements]);

  const formatValue = (value: number) => {
    if (value === 0) return '0,00';
    const divisor = showThousands ? 1000 : 1;
    const formatted = (value / divisor).toFixed(2).replace('.', ',');
    return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getValueClass = (value: number, isTotal: boolean = false) => {
    if (isTotal) return 'bg-yellow-400 text-black font-bold';
    if (value < 0) return 'text-red-600';
    if (value > 0) return 'text-green-700';
    return '';
  };

  // Chart data
  const chartData = useMemo(() => {
    return cashFlowData.map(data => ({
      year: data.year.toString(),
      ventas: data.ventasIngresosNetos / 1000,
      margen: data.margenBruto / 1000,
      baii: data.baii / 1000,
      resultado: data.resultadoEjercicio / 1000,
      cashFlow: data.cashFlow / 1000
    })).reverse();
  }, [cashFlowData]);

  const percentageChartData = useMemo(() => {
    return cashFlowData.map(data => ({
      year: data.year.toString(),
      margenPct: data.ventasIngresosNetos > 0 ? (data.margenBruto / data.ventasIngresosNetos) * 100 : 0,
      resultadoPct: data.ventasIngresosNetos > 0 ? (data.resultadoEjercicio / data.ventasIngresosNetos) * 100 : 0
    })).reverse();
  }, [cashFlowData]);

  const renderChart = (data: any[], dataKey: string, color: string, type: string) => {
    const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart;
    const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

    return (
      <ResponsiveContainer width="100%" height={150}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          {type === 'bar' && <Bar dataKey={dataKey} fill={color} />}
          {type === 'line' && <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />}
          {type === 'area' && <Area type="monotone" dataKey={dataKey} fill={color} stroke={color} />}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const TableRow = ({ 
    label, 
    values, 
    isTotal = false, 
    isSubItem = false,
    indent = 0 
  }: { 
    label: string; 
    values: number[]; 
    isTotal?: boolean;
    isSubItem?: boolean;
    indent?: number;
  }) => (
    <tr className={`${isTotal ? 'bg-yellow-400' : isSubItem ? 'bg-orange-100' : 'bg-orange-50'} border-b border-orange-200`}>
      <td className={`p-1 text-xs font-medium ${isTotal ? 'text-black font-bold' : ''}`} 
          style={{ paddingLeft: `${8 + indent * 12}px` }}>
        {label}
      </td>
      {values.map((value, index) => (
        <td key={index} className={`p-1 text-xs text-right ${getValueClass(value, isTotal)}`}>
          {formatValue(value)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="flex h-full bg-stone-700">
      {/* Left Sidebar */}
      <div className="w-64 bg-stone-800 p-3 flex flex-col gap-4">
        {/* Data View Options */}
        <Card className="bg-stone-700 border-stone-600">
          <CardHeader className="p-2">
            <CardTitle className="text-xs text-stone-200">Visió de dades</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <RadioGroup value={dataView} onValueChange={(v: any) => setDataView(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="values_percentages" id="vp" className="border-stone-400" />
                <Label htmlFor="vp" className="text-xs text-stone-300">Vista de valors i percentatges</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="values" id="v" className="border-stone-400" />
                <Label htmlFor="v" className="text-xs text-red-400">Vista de valors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="values_total" id="vt" className="border-stone-400" />
                <Label htmlFor="vt" className="text-xs text-stone-300">Vista de valors i % sobre total</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="values_deviation" id="vd" className="border-stone-400" />
                <Label htmlFor="vd" className="text-xs text-stone-300">Vista de valors i % de desviació</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Main Options Menu */}
        <Card className="bg-stone-700 border-stone-600 flex-1">
          <CardHeader className="p-2">
            <CardTitle className="text-xs text-stone-200">Opcions Principals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              <div className="text-xs">
                <div className="bg-stone-600 p-1 text-stone-200 font-bold">Financial System</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Pantalla principal</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">🏢 Pantalla d'empreses</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📝 Introducció Dades</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📋 Informes</div>
                
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Balanços</div>
                
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Financera</div>
                
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Grupo Analítica</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Anàlisis Masses Patrimonials</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📈 Quadre Analític P. i G.</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Quadre Analític (Resum i Porc.)</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📈 Neces.Operat.de Fons</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Tendències Anuals Mòbils (TAM)</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📈 Anàlisi del Capital Circulant</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Anàlisi Financera a llarg termini</div>
                <div className="pl-2 py-0.5 text-yellow-400 bg-stone-500 font-bold cursor-pointer">💰 Flux de Caixa</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Anàlisi EBIT y EBITDA</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📈 Anàlisi del Valor Afegit</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">💵 Moviments de Tresoreria</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Quadre de Finançament</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📈 Quadre de Mando Financer</div>
                <div className="pl-2 py-0.5 text-stone-300 hover:bg-stone-600 cursor-pointer">📊 Índex 'Z'</div>
                
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Ràtios</div>
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Rentabilitat</div>
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Auditoria</div>
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Valoracions</div>
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Comptes Anuals</div>
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Valor Accionarial</div>
                <div className="bg-stone-600 p-1 text-stone-200 font-bold mt-1">Informació</div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <h1 className="text-xl font-bold text-center text-stone-200 mb-4">
          ANÀLISI I CÀLCUL DEL FLUX DE CAIXA
        </h1>

        <Card className="bg-orange-100 border-orange-300">
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-orange-300">
                    <th className="p-2 text-left font-bold border border-orange-400">CONCEPTES</th>
                    {years.map(year => (
                      <th key={year} className="p-2 text-center font-bold border border-orange-400 min-w-[100px]">
                        Desembre-{year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableRow 
                    label="Vendes i Ingressos Nets" 
                    values={cashFlowData.map(d => d.ventasIngresosNetos)} 
                    isTotal 
                  />
                  <TableRow 
                    label="Costos Proporcionals de Fabricació" 
                    values={cashFlowData.map(d => d.gastosFabricacion)} 
                    isSubItem 
                  />
                  <TableRow 
                    label="a) Consums d'explotació" 
                    values={cashFlowData.map(d => d.consumosExplotacion)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="b) Treb.realitzats per Altres Emp." 
                    values={cashFlowData.map(d => d.trabajosOtrasEmpresas)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="c) Altres costos proporcionals de fabricació" 
                    values={cashFlowData.map(d => d.otrosGastosFabricacion)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="- Costos Proporcionals de Comercialització" 
                    values={cashFlowData.map(d => d.gastosComercializacion)} 
                    isSubItem 
                  />
                  <TableRow 
                    label="Marge Brut" 
                    values={cashFlowData.map(d => d.margenBruto)} 
                    isTotal 
                  />
                  <TableRow 
                    label="- Amortitzacions" 
                    values={cashFlowData.map(d => d.amortizaciones)} 
                  />
                  <TableRow 
                    label="- Provisions i Deterioraments" 
                    values={cashFlowData.map(d => d.provisionesDeterioros)} 
                  />
                  <TableRow 
                    label="- Costos d'Estructura" 
                    values={cashFlowData.map(d => d.gastosEstructura)} 
                    isSubItem 
                  />
                  <TableRow 
                    label="a) Serveis externs" 
                    values={cashFlowData.map(d => d.serviciosExternos)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="b) Sous i Salaris" 
                    values={cashFlowData.map(d => d.sueldosSalarios)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="c) Càrregues socials" 
                    values={cashFlowData.map(d => d.cargasSociales)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="d) Provisions Personal i Tributs" 
                    values={cashFlowData.map(d => d.provisionesPersonalTributos)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="+/- Altres ingressos i costos" 
                    values={cashFlowData.map(d => d.otrosIngresosGastos)} 
                  />
                  <TableRow 
                    label="Benefici abans d'interessos i impostos. BAII" 
                    values={cashFlowData.map(d => d.baii)} 
                    isTotal 
                  />
                  <TableRow 
                    label="+/- Costos i ingressos financers" 
                    values={cashFlowData.map(d => d.gastosIngresosFinancieros)} 
                    isSubItem 
                  />
                  <TableRow 
                    label="a) Ingressos financers" 
                    values={cashFlowData.map(d => d.ingresosFinancieros)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="b) Costos financers" 
                    values={cashFlowData.map(d => d.gastosFinancieros)} 
                    indent={1} 
                  />
                  <TableRow 
                    label="Benefici Ordinari abans d'Impostos" 
                    values={cashFlowData.map(d => d.resultadoOrdinario)} 
                    isTotal 
                  />
                  <TableRow 
                    label="+/- Variació de valor raonable en instrum. financers" 
                    values={cashFlowData.map(d => d.variacionValorRazonable)} 
                  />
                  <TableRow 
                    label="+/- Deteriorament i result.per enajenac.de instrum.financ." 
                    values={cashFlowData.map(d => d.deterioroInstrumentos)} 
                  />
                  <TableRow 
                    label="+/- Diferències de canvi" 
                    values={cashFlowData.map(d => d.diferenciasCambio)} 
                  />
                  <TableRow 
                    label="Benefici abans d'Impostos. (BAI)" 
                    values={cashFlowData.map(d => d.bai)} 
                    isTotal 
                  />
                  <TableRow 
                    label="- Impost Societats" 
                    values={cashFlowData.map(d => d.impuestoSociedades)} 
                  />
                  <TableRow 
                    label="Resultat Exercici (+ Benefici) (- Pèrdua)" 
                    values={cashFlowData.map(d => d.resultadoEjercicio)} 
                    isTotal 
                  />
                  <TableRow 
                    label="CASH FLOW (Benef. + Amortiz. + Provis.)" 
                    values={cashFlowData.map(d => d.cashFlow)} 
                    isTotal 
                  />
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar - Charts */}
      <div className="w-72 bg-stone-800 p-3 flex flex-col gap-4">
        <h3 className="text-sm font-bold text-stone-200 text-center">GRÀFICS DE CONTROL I EVOLUCIÓ</h3>
        
        {/* First Chart */}
        <Card className="bg-stone-100">
          <CardHeader className="p-2">
            <CardTitle className="text-xs text-center">Vendes netes</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {renderChart(chartData, 'ventas', '#3b82f6', chartType)}
            <div className="text-[10px] text-center text-muted-foreground mt-1">
              Valors en milers d'u.m. / Períodes anuals
            </div>
          </CardContent>
        </Card>

        {/* Chart Selection */}
        <Card className="bg-stone-700 border-stone-600">
          <CardContent className="p-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-300">~ Gràfic de Valors</span>
              <Select value={chartGroup} onValueChange={setChartGroup}>
                <SelectTrigger className="h-6 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flujo_economico">Valors del Flux Econòmic</SelectItem>
                  <SelectItem value="margen_bruto">Marge Brut</SelectItem>
                  <SelectItem value="baii">BAII</SelectItem>
                  <SelectItem value="cash_flow">Cash Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-300">~ Tipus de Gràfic</span>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="h-6 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barres</SelectItem>
                  <SelectItem value="line">Línies</SelectItem>
                  <SelectItem value="area">Àrea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Second Chart */}
        <Card className="bg-stone-100">
          <CardHeader className="p-2">
            <CardTitle className="text-xs text-center">Vendes netes %</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {renderChart(percentageChartData, 'margenPct', '#10b981', chartType2)}
            <div className="text-[10px] text-center text-muted-foreground mt-1">
              Valors en percentatges / Períodes anuals
            </div>
          </CardContent>
        </Card>

        {/* Second Chart Selection */}
        <Card className="bg-stone-700 border-stone-600">
          <CardContent className="p-2 space-y-2">
            <RadioGroup value={chartGroup2} onValueChange={setChartGroup2} className="flex gap-4">
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="porcentajes_totales" id="pt" className="border-stone-400 h-3 w-3" />
                <Label htmlFor="pt" className="text-[10px] text-stone-300">% Percentatges totals</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="porcentajes_desviacion" id="pd" className="border-stone-400 h-3 w-3" />
                <Label htmlFor="pd" className="text-[10px] text-stone-300">% Desviació</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-300">~ Tipus de Gràfic</span>
              <Select value={chartType2} onValueChange={setChartType2}>
                <SelectTrigger className="h-6 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barres</SelectItem>
                  <SelectItem value="line">Línies</SelectItem>
                  <SelectItem value="area">Àrea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-900 text-stone-300 text-xs px-4 py-1 flex justify-between items-center">
        <span>005 - {companyName}</span>
        <span>📊 ANÀLISI I CÀLCUL DEL FLUX DE CAIXA</span>
        <span>Anàlisi de períodes: ANUALS</span>
        <span>QUADRE DE BALANÇOS: OK</span>
        <span>🖩 Calculadora</span>
      </div>
    </div>
  );
};

export default CashFlowAnalysis;
